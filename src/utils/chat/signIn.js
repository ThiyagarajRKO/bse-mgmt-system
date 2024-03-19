import { GetResponse } from "../node-fetch";

export const ChatSignIn = (user, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      const chatURL = process.env.CHAT_URL + "api/v1/login";

      if (chatURL == "") {
        reject({ message: "Chat URL should NOT be empty" });
      }

      if (user == "" || password == "") {
        reject({ message: "Chat Email/Pass should NOT be empty" });
      }

      let { data } = await GetResponse(chatURL, "POST", null, {
        user,
        password,
      });

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};
