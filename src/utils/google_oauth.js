const { google } = require("googleapis");

export const validateGoogleOAuthToken = (token, type) => {
  return new Promise(async (resolve, reject) => {
    const client = new google.auth.OAuth2();

    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience:
          type == "IOS"
            ? process.env.IOS_GOOGLE_OAUTH_CLIENT_ID
            : process.env.GOOGLE_WEB_OAUTH_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      resolve({
        userId: payload.sub,
        userEmail: payload.email,
        full_name: payload.name,
        first_name: payload.given_name,
        last_name: payload.family_name,
      });
    } catch (error) {
      reject(error?.message || error);
    }
  });
};
