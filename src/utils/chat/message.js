import { GetResponse } from "../node-fetch";

export const SendChatMessage = ({ userId, authToken, rid, msg }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken || !rid || !msg) {
        resolve({
          message: "UserId, AuthToken, roomId and Message should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/chat.sendMessage`;

      let headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let body = {
        message: {
          rid,
          msg,
        },
      };

      let { data } = await GetResponse(url, "POST", headers, body);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};
