import { GetResponse } from "../node-fetch";

export const CreateChatGroup = ({
  userId,
  authToken,
  name,
  members,
  group_profile_url,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        resolve({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      if (!name) {
        resolve({
          message: "Group name should NOT be empty",
        });
      }

      const url = `${process.env.CHAT_URL}api/v1/groups.create`;

      const headers = {
        "X-User-Id": userId,
        "X-Auth-Token": authToken,
        "Content-type": "application/json",
      };

      let masked_group_name =
        name?.trim()?.replaceAll(" ", "_--_") + "-" + userId; //+ Date.now();
      let body = {
        name: masked_group_name,
        members,
        customFields: {
          masked_group_name,
          given_group_name: name,
          group_profile_url,
        },
      };

      let { data } = await GetResponse(url, "POST", headers, body);

      if (data?.group) {
        data.group.fname = name;
        data.group.name = name;
      }

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const ChatGetGroupInfo = ({ userId, authToken, group_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        resolve({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      if (!group_id) {
        resolve({
          message: "Group id should NOT be empty",
        });
      }

      const url = `${process.env.CHAT_URL}api/v1/groups.info?roomId=${group_id}`;

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

export const ChatGetGroupFiles = ({
  userId,
  authToken,
  group_id,
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

      if (!group_id) {
        resolve({
          message: "Group id should NOT be empty",
        });
      }

      const url = `${process.env.CHAT_URL}api/v1/groups.files?roomId=${group_id}&count=${count}&offset=${offset}&sort={ "uploadedAt": -1 }`;

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

export const ChatGetGroupMembers = ({ userId, authToken, group_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userId || !authToken) {
        resolve({
          message: "UserId, AuthToken should NOT be empty",
        });
      }

      if (!group_id) {
        resolve({
          message: "Group id should NOT be empty",
        });
      }

      const url = `${process.env.CHAT_URL}api/v1/groups.members?roomId=${group_id}`;

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
