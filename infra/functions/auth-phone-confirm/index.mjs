// Phone OTP confirmation — placeholder for Twilio Verify check

export const handler = async (event) => {
  try {
    const { phone, code } = JSON.parse(event.body);

    if (!phone || !code) {
      return response(400, { error: 'Phone and code required' });
    }

    // TODO: Integrate Twilio Verify check
    // const check = await twilioClient.verify.v2
    //   .services(TWILIO_SERVICE_SID)
    //   .verificationChecks.create({ to: phone, code });
    // if (check.status !== 'approved') return response(400, { error: 'Invalid code' });

    // For now, accept any 6-digit code in dev
    if (code.length !== 6) {
      return response(400, { error: 'Invalid code format' });
    }

    return response(200, { message: 'Phone verified', verified: true });
  } catch (err) {
    console.error('auth-phone-confirm error:', err);
    return response(500, { error: 'Verification failed' });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
