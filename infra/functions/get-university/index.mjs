import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const UNIVERSITIES_TABLE = process.env.UNIVERSITIES_TABLE;

// Known university data (seeded on first request)
const KNOWN_UNIVERSITIES = {
  'umich.edu': {
    name: 'University of Michigan',
    brandingThemes: [
      { id: 'umich-maize-blue', name: 'Maize & Blue', primaryColor: '#FFCB05', accentColor: '#00274C', textColor: '#FFFFFF' },
      { id: 'umich-stadium', name: 'The Big House', primaryColor: '#FFCB05', accentColor: '#00274C', textColor: '#FFFFFF' },
    ],
  },
  'harvard.edu': {
    name: 'Harvard University',
    brandingThemes: [
      { id: 'harvard-crimson', name: 'Crimson', primaryColor: '#A51C30', accentColor: '#F5F0E1', textColor: '#FFFFFF' },
    ],
  },
  'stanford.edu': {
    name: 'Stanford University',
    brandingThemes: [
      { id: 'stanford-cardinal', name: 'Cardinal', primaryColor: '#8C1515', accentColor: '#D2C295', textColor: '#FFFFFF' },
    ],
  },
};

export const handler = async (event) => {
  try {
    const domain = event.pathParameters?.domain;
    if (!domain) return response(400, { error: 'domain required' });

    let result = await ddb.send(new GetCommand({
      TableName: UNIVERSITIES_TABLE,
      Key: { domain },
    }));

    if (result.Item) {
      return response(200, { university: result.Item });
    }

    // Auto-create university
    const known = KNOWN_UNIVERSITIES[domain];
    const uniName = known?.name || `${domain.replace('.edu', '').split('.').pop().replace(/^\w/, c => c.toUpperCase())} University`;

    const university = {
      domain,
      name: uniName,
      memberCount: 0,
      brandingThemes: known?.brandingThemes || [{
        id: 'default',
        name: 'Classic',
        primaryColor: '#6C5CE7',
        accentColor: '#00CEC9',
        textColor: '#FFFFFF',
      }],
      createdAt: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({
      TableName: UNIVERSITIES_TABLE,
      Item: university,
    }));

    return response(200, { university });
  } catch (err) {
    console.error('get-university error:', err);
    return response(500, { error: 'Failed to get university' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
