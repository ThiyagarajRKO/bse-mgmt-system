import { GetResponse } from "../node-fetch";

export const GetChatRooms = ({ userId, authToken, since }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        resolve({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/rooms.get`;

      if (since) {
        url += `?updatedSince=${new Date(since).toISOString()}`;
      }

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

export const GetChatRoom = ({ userId, authToken, roomId }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken || !roomId) {
        resolve({
          message: "UserId, AuthToken and roomId should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/rooms.info?roomId=${roomId}`;

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

export const MuteOrUnMuteChatRoom = ({
  userId,
  authToken,
  roomId,
  isMute = true,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken || !roomId) {
        resolve({
          message: "UserId, AuthToken and roomId should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/rooms.saveNotification`;

      let headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let body = {
        roomId: roomId,
        notifications: {
          disableNotifications: isMute ? "1" : "0",
        },
      };

      let { data } = await GetResponse(url, "POST", headers, body);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetChatRoomFiles = ({
  userId,
  authToken,
  room_id,
  count = 5,
  offset = 0,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        resolve({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      if (!room_id) {
        resolve({
          message: "Room id should NOT be empty",
        });
      }

      const url = `${process.env.CHAT_URL}api/v1/im.files?roomId=${room_id}&count=${count}&offset=${offset}&sort={ "uploadedAt": -1 }`;

      const headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      const { data } = await GetResponse(url, "GET", headers);

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};
