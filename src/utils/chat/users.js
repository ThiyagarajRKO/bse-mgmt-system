import { GetResponse } from "../node-fetch";

export const GetChatUsers = ({
  userId,
  authToken,
  userIds,
  limit = 10,
  offset = 0,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (
        !userId ||
        !authToken ||
        !Array.isArray(userIds) ||
        userIds.length == 0
      ) {
        resolve({
          message: "UserId, AuthToken and UserIds should NOT be empty",
        });
      }

      const url = `${
        process.env.CHAT_URL
      }api/v1/users.list?count=${limit}&offset=${offset}&query={ "_id": { "$in": ["${userIds
        .join(",")
        .replaceAll(",", `","`)}"] } }&sort={ "_updatedAt" : -1}`;

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

export const GetChatUser = ({
  userId,
  authToken,
  userIds,
  isRoomsRequired = false,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken || !userIds) {
        resolve({
          message: "UserId, AuthToken and UserIds should NOT be empty",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/users.info?userId=${userIds}`;

      if (isRoomsRequired) {
        url += `&fields={"userRooms": 1}`;
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

export const GetChatPresence = ({ userId, authToken, userIds }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        return reject({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      if (userIds && !Array.isArray(userIds)) {
        return reject({
          message: "userIds should be an array",
        });
      }

      let url = `${process.env.CHAT_URL}api/v1/users.presence`;

      if (userIds) {
        userIds.map((id, ind) => {
          if (ind === 0) {
            url += `?ids[]=${id}`;
          } else {
            url += `&ids[]=${id}`;
          }
        });
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
