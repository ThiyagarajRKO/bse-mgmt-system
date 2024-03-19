import { DeviceTokens } from "../../../../controllers";

export const SignOut = ({ profile_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({ message: "User already logged out!" });
      }

      await DeviceTokens.DeleteByprofileId({ profile_id });
      // session.destroy();

      // await UsersSessions.DeleteSession({ sessionId: session.sessionId });

      resolve({ message: "User signed out successfully" });
    } catch (err) {
      reject(err);
    }
  });
};
