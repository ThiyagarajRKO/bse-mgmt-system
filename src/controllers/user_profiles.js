import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_data) {
        return reject({
          statusCode: 420,
          message: "User profile data must not be empty!",
        });
      }

      if (!profile_data?.created_by) {
        return reject({
          statusCode: 420,
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
          statusCode: 420,
          message: "Profile id must not be empty!",
        });
      }

      if (!profile_data) {
        return reject({
          statusCode: 420,
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
          statusCode: 420,
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
          statusCode: 420,
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
