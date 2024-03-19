import { GetResponse } from "../node-fetch";
import { ChatSignIn } from "./signIn";

export const GetSubscriptions = ({ userId, authToken }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        return reject({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/subscriptions.get`;

      let headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let { data } = await GetResponse(url, "GET", headers);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetSubscription = ({ roomId, userId, authToken }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken || !roomId) {
        return reject({
          message: "UserId, AuthToken and roomId should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/subscriptions.getOne?roomId=${roomId}`;

      let headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let { data } = await GetResponse(url, "GET", headers);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetReceiverRoomSubscription = ({
  roomId,
  chat_username,
  userId,
  authToken,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!roomId) {
        return reject({
          message: "roomId should NOT be empty",
        });
      }

      if (!chat_username && !userId && !authToken) {
        return reject({
          message: "chat_username, userId and authToken should NOT be empty",
        });
      }

      let chatData = {}
      if (!userId || !authToken) {
        chatData = await ChatSignIn(
          chat_username,
          process.env.CHAT_USER_PASS
        );

        if (chatData?.error == "Unauthorized") {
          return reject({message:"Unauthorized chat user!"})
        }

        authToken = chatData?.data?.authToken;
        userId = chatData?.data?.userId;
      }

      let url = `${process.env.CHAT_URL}api/v1/subscriptions.getOne?roomId=${roomId}`;

      let headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let { data } = await GetResponse(url, "GET", headers);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};
