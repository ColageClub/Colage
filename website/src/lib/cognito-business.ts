// Cognito auth for Ad Manager business accounts
// Pool: us-east-2_z3RVfulvb | Client: 42knpqjno290e2feqb0r729129

const REGION = "us-east-2";
const USER_POOL_ID = "us-east-2_z3RVfulvb";
const CLIENT_ID = "42knpqjno290e2feqb0r729129";

const COGNITO_URL = `https://cognito-idp.${REGION}.amazonaws.com/`;

// ─── Helpers ──────────────────────────────────────────────

async function cognitoRequest(action: string, payload: Record<string, unknown>) {
  const res = await fetch(COGNITO_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": `AWSCognitoIdentityProviderService.${action}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    const code = data.__type?.split("#").pop() || "UnknownError";
    const message = data.message || data.Message || "Something went wrong";
    throw { code, message };
  }
  return data;
}

// ─── Sign Up ──────────────────────────────────────────────

export interface SignUpInput {
  email: string;
  password: string;
  businessName: string;
  businessAddress?: string;
  businessCategory?: string;
  phone?: string;
}

export async function signUp(input: SignUpInput) {
  const attributes = [
    { Name: "email", Value: input.email },
    { Name: "custom:biz_name", Value: input.businessName },
  ];
  if (input.businessAddress) attributes.push({ Name: "custom:biz_addr", Value: input.businessAddress });
  if (input.businessCategory) attributes.push({ Name: "custom:biz_cat", Value: input.businessCategory });
  if (input.phone) attributes.push({ Name: "custom:biz_phone", Value: input.phone });

  return cognitoRequest("SignUp", {
    ClientId: CLIENT_ID,
    Username: input.email,
    Password: input.password,
    UserAttributes: attributes,
  });
}

// ─── Confirm Sign Up (email verification code) ───────────

export async function confirmSignUp(email: string, code: string) {
  return cognitoRequest("ConfirmSignUp", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
}

// ─── Resend Verification Code ─────────────────────────────

export async function resendConfirmation(email: string) {
  return cognitoRequest("ResendConfirmationCode", {
    ClientId: CLIENT_ID,
    Username: email,
  });
}

// ─── Sign In ──────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  idToken: string;
  refreshToken: string;
}

export async function signIn(email: string, password: string): Promise<AuthTokens> {
  const data = await cognitoRequest("InitiateAuth", {
    ClientId: CLIENT_ID,
    AuthFlow: "USER_PASSWORD_AUTH",
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password,
    },
  });

  return {
    accessToken: data.AuthenticationResult.AccessToken,
    idToken: data.AuthenticationResult.IdToken,
    refreshToken: data.AuthenticationResult.RefreshToken,
  };
}

// ─── Refresh Token ────────────────────────────────────────

export async function refreshSession(refreshToken: string): Promise<{ accessToken: string; idToken: string }> {
  const data = await cognitoRequest("InitiateAuth", {
    ClientId: CLIENT_ID,
    AuthFlow: "REFRESH_TOKEN_AUTH",
    AuthParameters: {
      REFRESH_TOKEN: refreshToken,
    },
  });

  return {
    accessToken: data.AuthenticationResult.AccessToken,
    idToken: data.AuthenticationResult.IdToken,
  };
}

// ─── Get User (from access token) ─────────────────────────

export interface CognitoUser {
  email: string;
  sub: string;
  businessName: string;
  businessAddress: string;
  businessCategory: string;
  phone: string;
}

export async function getUser(accessToken: string): Promise<CognitoUser> {
  const data = await cognitoRequest("GetUser", {
    AccessToken: accessToken,
  });

  const attrs: Record<string, string> = {};
  for (const a of data.UserAttributes) {
    attrs[a.Name] = a.Value;
  }

  return {
    email: attrs.email || "",
    sub: attrs.sub || "",
    businessName: attrs["custom:biz_name"] || "",
    businessAddress: attrs["custom:biz_addr"] || "",
    businessCategory: attrs["custom:biz_cat"] || "",
    phone: attrs["custom:biz_phone"] || "",
  };
}

// ─── Forgot Password ─────────────────────────────────────

export async function forgotPassword(email: string) {
  return cognitoRequest("ForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email,
  });
}

export async function confirmForgotPassword(email: string, code: string, newPassword: string) {
  return cognitoRequest("ConfirmForgotPassword", {
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
    Password: newPassword,
  });
}

// ─── Change Password ──────────────────────────────────────

export async function changePassword(accessToken: string, oldPassword: string, newPassword: string) {
  return cognitoRequest("ChangePassword", {
    AccessToken: accessToken,
    PreviousPassword: oldPassword,
    ProposedPassword: newPassword,
  });
}

// ─── Token helpers for cookies ────────────────────────────

export function parseIdToken(idToken: string): Record<string, string> {
  try {
    const payload = idToken.split(".")[1];
    return JSON.parse(atob(payload));
  } catch {
    return {};
  }
}
