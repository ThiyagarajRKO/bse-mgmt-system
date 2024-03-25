import models from "../../models";
const Op = models.Sequelize.Op;

export const Insert = async (userData, modelName) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userData) {
        return reject({
          statusCode: 420,
          message: "User data must not be empty!",
        });
      }

      let options = {};
      if (modelName) {
        options = {
          include: [{ model: models[modelName] }],
        };
      }

      const result = await models.Users.create(userData, options);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Update = async (user_id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!user_id) {
        return reject({
          statusCode: 420,
          message: "User Id must not be empty!",
        });
      }

      if (!data) {
        return reject({
          statusCode: 420,
          message: "User data must not be empty!",
        });
      }

      const result = await models.Users.update(data, {
        where: {
          id: user_id,
          is_active: true,
        },
        individualHooks: true,
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, username, email, phone, role_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !email && !phone && !username) {
        return reject({
          statusCode: 420,
          message: "Identity field must not be empty!",
        });
      }

      if (!role_id) {
        return reject({
          statusCode: 420,
          message: "role master id must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (email) {
        where["email"] = email?.trim()?.toLowerCase();
      } else if (phone) {
        where["phone"] = phone;
      } else if (username) {
        where["username"] = username?.trim();
      } else if (id) {
        where["id"] = id;
      }

      const user = await models.Users.findOne({
        required: true,
        include: [
          {
            required: true,
            as: "creator",
            model: models.UserProfiles,
            include: [
              {
                model: models.RoleMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: {
              is_active: true,
              role_id,
              is_banned: false,
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

export const GetAll = ({ role_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await models.Users.findAll({
        include: [
          {
            required: true,
            as: "creator",
            model: models.UserProfiles,
            include: [
              {
                required: true,
                model: models.RoleMaster,
                where: {
                  is_active: true,
                },
              },
            ],
            where: {
              is_active: true,
              role_id,
              is_banned: false,
            },
          },
        ],
        where: { is_active: true, user_status: "1" },
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};
