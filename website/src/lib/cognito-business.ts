import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession,
} from "amazon-cognito-identity-js";

const POOL_ID = process.env.NEXT_PUBLIC_BIZ_POOL_ID || "us-east-2_jeryfm6Xs";
const CLIENT_ID = process.env.NEXT_PUBLIC_BIZ_CLIENT_ID || "jffa9jhioo8adpvtq5bv2r9ks";

const userPool = new CognitoUserPool({
  UserPoolId: POOL_ID,
  ClientId: CLIENT_ID,
});

function getCognitoUser(email: string): CognitoUser {
  return new CognitoUser({ Username: email, Pool: userPool });
}

// ─── Sign Up ───────────────────────────────────────────────
export interface SignUpParams {
  email: string;
  password: string;
  businessName: string;
  address: string;
  category: string;
  phone: string;
}

export function signUp(params: SignUpParams): Promise<{ userSub: string }> {
  const attributes = [
    new CognitoUserAttribute({ Name: "email", Value: params.email }),
    new CognitoUserAttribute({ Name: "custom:biz_name", Value: params.businessName }),
    new CognitoUserAttribute({ Name: "custom:biz_addr", Value: params.address }),
    new CognitoUserAttribute({ Name: "custom:biz_cat", Value: params.category }),
    new CognitoUserAttribute({ Name: "custom:biz_phone", Value: params.phone }),
  ];

  return new Promise((resolve, reject) => {
    userPool.signUp(params.email, params.password, attributes, [], (err, result) => {
      if (err) return reject(err);
      resolve({ userSub: result!.userSub });
    });
  });
}

// ─── Confirm Sign Up (email verification code) ────────────
export function confirmSignUp(email: string, code: string): Promise<void> {
  const user = getCognitoUser(email);
  return new Promise((resolve, reject) => {
    user.confirmRegistration(code, true, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ─── Resend Confirmation Code ──────────────────────────────
export function resendCode(email: string): Promise<void> {
  const user = getCognitoUser(email);
  return new Promise((resolve, reject) => {
    user.resendConfirmationCode((err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

// ─── Sign In ───────────────────────────────────────────────
export interface AuthResult {
  idToken: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  businessName: string;
  sub: string;
}

export function signIn(email: string, password: string): Promise<AuthResult> {
  const user = getCognitoUser(email);
  const authDetails = new AuthenticationDetails({ Username: email, Password: password });

  return new Promise((resolve, reject) => {
    user.authenticateUser(authDetails, {
      onSuccess: (session: CognitoUserSession) => {
        const idToken = session.getIdToken();
        const payload = idToken.decodePayload();
        resolve({
          idToken: idToken.getJwtToken(),
          accessToken: session.getAccessToken().getJwtToken(),
          refreshToken: session.getRefreshToken().getToken(),
          email: payload["email"] as string,
          businessName: (payload["custom:biz_name"] as string) || "",
          sub: payload["sub"] as string,
        });
      },
      onFailure: (err) => reject(err),
    });
  });
}

// ─── Forgot Password ──────────────────────────────────────
export function forgotPassword(email: string): Promise<void> {
  const user = getCognitoUser(email);
  return new Promise((resolve, reject) => {
    user.forgotPassword({
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// ─── Confirm New Password ─────────────────────────────────
export function confirmNewPassword(email: string, code: string, newPassword: string): Promise<void> {
  const user = getCognitoUser(email);
  return new Promise((resolve, reject) => {
    user.confirmPassword(code, newPassword, {
      onSuccess: () => resolve(),
      onFailure: (err) => reject(err),
    });
  });
}

// ─── Get Current Session (if logged in) ───────────────────
export function getCurrentSession(): Promise<AuthResult | null> {
  const user = userPool.getCurrentUser();
  if (!user) return Promise.resolve(null);

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) return resolve(null);
      const idToken = session.getIdToken();
      const payload = idToken.decodePayload();
      resolve({
        idToken: idToken.getJwtToken(),
        accessToken: session.getAccessToken().getJwtToken(),
        refreshToken: session.getRefreshToken().getToken(),
        email: payload["email"] as string,
        businessName: (payload["custom:biz_name"] as string) || "",
        sub: payload["sub"] as string,
      });
    });
  });
}

// ─── Sign Out ─────────────────────────────────────────────
export function signOut(): void {
  const user = userPool.getCurrentUser();
  if (user) user.signOut();
}
