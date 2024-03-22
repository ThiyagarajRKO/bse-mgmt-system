import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_data) {
        return reject({
          statusCode: 400,
          message: "User profile data must not be empty!",
        });
      }

      if (!profile_data?.created_by) {
        return reject({
          statusCode: 400,
          message: "User Id data must not be empty!",
        });
      }

      const result = await models.UserProfiles.create(profile_data);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Update = async (profile_id, profile_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 400,
          message: "Profile id must not be empty!",
        });
      }

      if (!profile_data) {
        return reject({
          statusCode: 400,
          message: "Profile data must not be empty!",
        });
      }

      if (profile_data?.first_name || profile_data?.last_name)
        profile_data.full_name = (
          profile_data?.first_name +
          " " +
          profile_data?.last_name
        )?.trim();

      const result = await models.UserProfiles.update(profile_data, {
        where: {
          id: profile_id,
          is_active: true,
          role_id: "e7daa45c-627d-455a-ac57-ec32aa57d009",
          is_banned: false,
        },
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const DeleteByUser = async ({ profile_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 400,
          message: "Profile id must not be empty!",
        });
      }

      const result = await models.UserProfiles.update(
        {
          is_active: false,
          updated_at: new Date(),
        },
        {
          where: {
            id: profile_id,
            is_active: true,
            [Op.or]: [
              { role_id: "e7daa45c-627d-455a-ac57-ec32aa57d009" },
              { role_id: "29e07c7e-8d9b-40e0-9fc4-1cdc466a89ee" },
            ],
          },
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, username, role_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !username && !role_id) {
        return reject({
          statusCode: 400,
          message: "Profile ID/username field must not be empty!",
        });
      }

      let where = {
        is_active: true,
        role_id,
        is_banned: false,
      };

      if (id) {
        where.id = id;
      }

      if (username) {
        where.username = username;
      }

      const user = await models.UserProfiles.findOne({
        include: [
          {
            model: models.Users,
            where: {
              is_active: true,
            },
          },
        ],
        where,
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAdminUserByProfileId = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 400,
          message: "Profile ID field must not be empty!",
        });
      }

      const user = await models.UserProfiles.findOne({
        include: [
          {
            model: models.Users,
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          id,
          is_active: true,
          role_id: "c4be6a50-1bda-4237-bbf5-b607c37cd9b0",
          is_banned: false,
        },
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const CheckAdminRole = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 400,
          message: "Profile ID field must not be empty!",
        });
      }

      const user = await models.UserProfiles.count({
        include: [
          {
            model: models.Users,
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          id,
          is_active: true,
          role_id: "c4be6a50-1bda-4237-bbf5-b607c37cd9b0",
          is_banned: false,
        },
        raw: true,
      });
      resolve(user > 0 ? true : false);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetUsedStars = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 400,
          message: "Profile ID field must not be empty!",
        });
      }

      const user = await models.UserProfiles.findOne({
        attributes: ["used_stars", "daily_stars"],
        include: [
          {
            model: models.Users,
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          id,
          is_active: true,
          is_banned: false,
        },
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const ResetDailyStars = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await models.UserProfiles.update(
        {
          used_stars: 0,
        },
        {
          where: {
            used_stars: { [Op.gt]: 0 },
            is_active: true,
            is_banned: false,
          },
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetUserTokensByUsername = async (userTags) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await models.UserProfiles.findAll({
        attributes: ["id"],
        where: {
          username: userTags,
          is_active: true,
          is_banned: false,
        },
        include: [
          {
            model: models.Users,
            attributes: ["id"],
            where: {
              is_active: true,
              user_status: "1",
            },
          },
          {
            required: false,
            model: models.DeviceTokens,
            attributes: ["device_token"],
            where: {
              is_active: true,
            },
            order: [["created_at", "DESC"]],
            limit: 1,
          },
        ],
      });

      const deviceTokens = result
        .map((userProfile) =>
          userProfile?.dataValues?.DeviceTokens.map(
            (deviceToken) => deviceToken?.dataValues?.device_token
          )
        )
        .flat();
      const profileIds = result.map((userProfile) => userProfile.id);

      resolve({ deviceTokens, profileIds });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetByChatId = ({ chat_user_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!chat_user_id) {
        return reject({
          statusCode: 400,
          message: "chat_user_id field must not be empty!",
        });
      }

      const users = await models.UserProfiles.findAll({
        attributes: [
          "id",
          "full_name",
          "first_name",
          "last_name",
          "username",
          "avatar_main_url",
          "avatar_small_url",
          "avatar_bg_color",
          "appearance_url",
          "is_active",
          "is_banned",
          "chat_user_id",
          "chat_username",
        ],
        include: [
          {
            attributes: [],
            model: models.Users,
            where: {
              is_active: true,
              user_status: "1",
            },
          },
        ],
        where: {
          is_active: true,
          is_banned: false,
          chat_user_id,
        },
      });
      resolve(users);
    } catch (err) {
      reject(err);
    }
  });
};

export const GenUsername = async (profile_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const usersWithoutUsername = await models.UserProfiles.findAll({
        where: {
          username: null,
        },
      });

      for (const user of usersWithoutUsername) {
        let username = `${user.first_name}#${generateRandomString()}`;

        let count = await models.UserProfiles.count({ where: { username } });
        while (count > 0) {
          username = `${user.first_name}#${generateRandomString()}`;
          count = await models.UserProfiles.count({ where: { username } });
        }

        await user.update({ username });
        console.log(`Username generated and assigned for user: ${user.id}`);
      }

      console.log("Username generation and assignment completed.");

      const customMessage =
        "Username generation and assignment completed successfully.";
      resolve(customMessage);
    } catch (err) {
      reject(err);
    }
  });
};

function generateRandomString() {
  const charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digitSet = "0123456789";

  let randomString = "";

  // add one random character from charSet
  const randomCharIndex = Math.floor(Math.random() * charSet.length);
  randomString += charSet[randomCharIndex];

  // add one random digit from digitSet
  const randomDigitIndex = Math.floor(Math.random() * digitSet.length);
  randomString += digitSet[randomDigitIndex];

  // add one random character from charSet
  const randomCharIndex2 = Math.floor(Math.random() * charSet.length);
  randomString += charSet[randomCharIndex2];

  // add one random digit from digitSet
  const randomDigitIndex2 = Math.floor(Math.random() * digitSet.length);
  randomString += digitSet[randomDigitIndex2];

  return randomString;
}
