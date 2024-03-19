import { ChatSignIn } from "./signIn";
import { GetResponse } from "../node-fetch";
import { UserProfiles } from "../../controllers";

export const ChatSignUp = ({
  adminToken,
  adminUserId,
  name,
  email,
  username,
  password,
  profile_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!name || !email || !username || !password) {
        return resolve({
          message: "Name, Email, Username and Password should NOT be empty",
        });
      }

      const url = process.env.CHAT_URL + "api/v1/users.create";

      if (!adminToken || !adminUserId) {
        let authData = await ChatSignIn(
          process.env.CHAT_ADMIN_EMAIL,
          process.env.CHAT_ADMIN_PASS
        );
        adminUserId = authData?.data?.userId;
        adminToken = authData?.data?.authToken;
      }

      let headers = {
        "X-User-Id": adminUserId,
        "X-Auth-Token": adminToken,
        "Content-type": "application/json",
      };

      // let username = email.replaceAll("@","_").replaceAll(".","_").replaceAll("+","_");

      let payload = {
        username,
        email,
        password,
        name,
        customFields: {
          appUserId: profile_id,
        },
      };

      let { data } = await GetResponse(url, "POST", headers, payload);

      // User Token
      let authData = await ChatSignIn(username, password);

      if (authData?.data?.userId) {
        UserProfiles.Update(profile_id, {
          chat_user_id: authData?.data?.userId,
          chat_username: authData?.data?.me?.username,
        });
      }

      resolve({ ...data, ...authData });
    } catch (err) {
      reject(err);
    }
  });
};
