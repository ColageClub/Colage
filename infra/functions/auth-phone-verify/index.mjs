// Phone verification — placeholder for Twilio Verify integration
// For now, stores phone and returns success (real SMS requires Twilio account)

export const handler = async (event) => {
  try {
    const { phone, email } = JSON.parse(event.body);

    if (!phone) {
      return response(400, { error: 'Phone number required' });
    }

    // TODO: Integrate Twilio Verify API
    // const verification = await twilioClient.verify.v2
    //   .services(TWILIO_SERVICE_SID)
    //   .verifications.create({ to: phone, channel: 'sms' });

    console.log(`Phone verify requested for ${phone} (email: ${email})`);

    return response(200, { message: 'SMS code sent', sid: 'dev-placeholder' });
  } catch (err) {
    console.error('auth-phone-verify error:', err);
    return response(500, { error: 'Failed to send SMS' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
