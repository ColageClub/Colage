// Nightly Billing Lambda
// Runs at midnight (per school timezone, simplified to midnight ET for now)
// Tallies each active ad's impressions for the day, calculates cost via CPM, deducts from business balance
// Pauses ads if balance = $0, sends warning if balance < $10

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import Stripe from 'stripe';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const ssm = new SSMClient({});

const ADS_TABLE = process.env.ADS_TABLE;
const BUSINESSES_TABLE = process.env.BUSINESSES_TABLE;
const DAILY_SPEND_TABLE = process.env.DAILY_SPEND_TABLE;
const IMPRESSIONS_TABLE = process.env.IMPRESSIONS_TABLE;
const RATE_LIMIT_TABLE = process.env.RATE_LIMIT_TABLE;

// Cache Stripe client across cold starts (loaded from SSM)
let stripeClient = null;

async function getStripeClient() {
  if (stripeClient) return stripeClient;
  const stage = process.env.STAGE || 'dev';
  const result = await ssm.send(new GetParameterCommand({
    Name: `/colage/${stage}/stripe-secret-key`,
    WithDecryption: true,
  }));
  stripeClient = new Stripe(result.Parameter.Value);
  return stripeClient;
}

// CPM scales with demand per school
function getCPM(advertiserCount) {
  if (advertiserCount <= 10) return 2;
  if (advertiserCount <= 30) return 3;
  if (advertiserCount <= 60) return 4;
  if (advertiserCount <= 100) return 5;
  return 6;
}

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function yesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function handler(event) {
  console.log('Nightly billing started', { event });
  const billingDate = yesterdayString(); // Bill for yesterday's activity
  const results = { processed: 0, charged: 0, paused: 0, warnings: 0, errors: [] };

  try {
    // Idempotency: check if billing already completed for this date
    const runKey = `billing-run#${billingDate}`;
    try {
      await ddb.send(new PutCommand({
        TableName: RATE_LIMIT_TABLE,
        Item: {
          pk: runKey,
          status: 'running',
          startedAt: new Date().toISOString(),
          ttl: Math.floor(Date.now() / 1000) + 7 * 86400, // Expire after 7 days
        },
        ConditionExpression: 'attribute_not_exists(pk) OR #s <> :completed',
        ExpressionAttributeNames: { '#s': 'status' },
        ExpressionAttributeValues: { ':completed': 'completed' },
      }));
    } catch (condErr) {
      if (condErr.name === 'ConditionalCheckFailedException') {
        console.log(`Billing for ${billingDate} already completed, skipping`);
        return { skipped: true, reason: 'already_completed', billingDate };
      }
      throw condErr;
    }

    const stripe = await getStripeClient();

    // 1. Get all active ads
    const adsResult = await ddb.send(new ScanCommand({
      TableName: ADS_TABLE,
      FilterExpression: '#status = :active',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':active': 'active' },
    }));
    const activeAds = adsResult.Items || [];
    console.log(`Found ${activeAds.length} active ads`);

    // 2. Count advertisers per school (for CPM calculation)
    const schoolAdCounts = {};
    for (const ad of activeAds) {
      schoolAdCounts[ad.school] = (schoolAdCounts[ad.school] || 0) + 1;
    }

    // 3. Group ads by business
    const businessAds = {};
    for (const ad of activeAds) {
      if (!businessAds[ad.businessId]) businessAds[ad.businessId] = [];
      businessAds[ad.businessId].push(ad);
    }

    // 4. Process each business
    for (const [businessId, ads] of Object.entries(businessAds)) {
      try {
        // Get business record
        const bizResult = await ddb.send(new GetCommand({
          TableName: BUSINESSES_TABLE,
          Key: { id: businessId },
        }));
        const business = bizResult.Item;
        if (!business) {
          results.errors.push(`Business ${businessId} not found`);
          continue;
        }

        let totalCharge = 0;

        // Process each ad for this business
        for (const ad of ads) {
          // Get daily spend for this ad
          const spendResult = await ddb.send(new GetCommand({
            TableName: DAILY_SPEND_TABLE,
            Key: { ad_id: ad.id, date: billingDate },
          }));
          const spend = spendResult.Item;

          if (!spend || spend.impressionCount === 0) {
            console.log(`Ad ${ad.id}: no impressions on ${billingDate}`);
            continue;
          }

          // Idempotency: skip if already billed (spend field already set)
          if (spend.spend && spend.spend > 0) {
            console.log(`Ad ${ad.id}: already billed $${spend.spend} for ${billingDate}, skipping`);
            results.processed++;
            continue;
          }

          // Calculate cost: impressions × CPM / 1000
          const cpm = getCPM(schoolAdCounts[ad.school] || 1);
          let cost = (spend.impressionCount * cpm) / 1000;

          // Cap at daily budget
          cost = Math.min(cost, ad.dailyBudget);

          // Round to 2 decimal places
          cost = Math.round(cost * 100) / 100;

          if (cost > 0) {
            totalCharge += cost;

            // Update the ad's totalSpend
            await ddb.send(new UpdateCommand({
              TableName: ADS_TABLE,
              Key: { id: ad.id },
              UpdateExpression: 'SET totalSpend = if_not_exists(totalSpend, :zero) + :cost',
              ExpressionAttributeValues: { ':cost': cost, ':zero': 0 },
            }));

            // Update daily_spend with the actual charge amount
            await ddb.send(new UpdateCommand({
              TableName: DAILY_SPEND_TABLE,
              Key: { ad_id: ad.id, date: billingDate },
              UpdateExpression: 'SET spend = :cost',
              ExpressionAttributeValues: { ':cost': cost },
            }));

            console.log(`Ad ${ad.id}: ${spend.impressionCount} impressions × $${cpm} CPM = $${cost}`);
            results.charged++;
          }

          results.processed++;
        }

        // 5. Deduct total from business balance
        if (totalCharge > 0 && business.stripeCustomerId) {
          try {
            // Create a negative balance transaction on Stripe Customer Balance
            await stripe.customers.createBalanceTransaction(business.stripeCustomerId, {
              amount: Math.round(totalCharge * 100), // Stripe uses cents, positive = debit
              currency: 'usd',
              description: `Ad charges for ${billingDate}`,
            });
            console.log(`Business ${businessId}: charged $${totalCharge} via Stripe`);
          } catch (stripeErr) {
            console.error(`Stripe error for business ${businessId}:`, stripeErr.message);
            results.errors.push(`Stripe error for ${businessId}: ${stripeErr.message}`);
          }

          // Update cached balance in DynamoDB
          const newBalance = Math.max(0, (business.balance || 0) - totalCharge);
          await ddb.send(new UpdateCommand({
            TableName: BUSINESSES_TABLE,
            Key: { id: businessId },
            UpdateExpression: 'SET balance = :bal',
            ExpressionAttributeValues: { ':bal': newBalance },
          }));

          // 6. Check if balance is low or zero
          if (newBalance <= 0) {
            // Pause all ads for this business
            for (const ad of ads) {
              await ddb.send(new UpdateCommand({
                TableName: ADS_TABLE,
                Key: { id: ad.id },
                UpdateExpression: 'SET #status = :paused',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: { ':paused': 'paused' },
              }));
            }
            console.log(`Business ${businessId}: balance $0 — paused ${ads.length} ads`);
            results.paused += ads.length;
          } else if (newBalance < 10) {
            // TODO: Send low balance email via SES
            console.log(`Business ${businessId}: low balance warning ($${newBalance.toFixed(2)})`);
            results.warnings++;
          }
        }
      } catch (bizErr) {
        console.error(`Error processing business ${businessId}:`, bizErr);
        results.errors.push(`Error for ${businessId}: ${bizErr.message}`);
      }
    }

    // Mark billing run as completed
    await ddb.send(new UpdateCommand({
      TableName: RATE_LIMIT_TABLE,
      Key: { pk: runKey },
      UpdateExpression: 'SET #s = :completed, completedAt = :now',
      ExpressionAttributeNames: { '#s': 'status' },
      ExpressionAttributeValues: {
        ':completed': 'completed',
        ':now': new Date().toISOString(),
      },
    }));
  } catch (err) {
    console.error('Nightly billing failed:', err);
    results.errors.push(`Fatal: ${err.message}`);
  }

  console.log('Nightly billing complete:', results);
  return results;
}
