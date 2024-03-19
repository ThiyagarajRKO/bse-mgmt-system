import models from "../../models";
const Op = models.Sequelize.Op;
import bcrypt from "bcrypt";

export const Insert = async (userData, modelName) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!userData) {
        return reject({
          statusCode: 400,
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
          statusCode: 400,
          message: "User Id must not be empty!",
        });
      }

      if (!data) {
        return reject({
          statusCode: 400,
          message: "User data must not be empty!",
        });
      }

      data["updated_at"] = new Date();
      const result = await models.Users.update(data, {
        where: {
          id: user_id,
          is_active: true,
        },
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const DeleteByUser = async ({ user_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!user_id) {
        return reject({
          statusCode: 400,
          message: "User Id must not be empty!",
        });
      }

      const result = await models.Users.update(
        {
          is_active: false,
          updated_at: new Date(),
        },
        {
          where: {
            id: user_id,
            is_active: true,
          },
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const UpdatePassword = async (user_id, password) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!user_id) {
        return reject({
          statusCode: 400,
          message: "UserId must not be empty!",
        });
      }

      if (!password) {
        return reject({
          statusCode: 400,
          message: "Password must not be empty!",
        });
      }

      password = bcrypt.hashSync(password, bcrypt.genSaltSync(10));

      const result = await models.Users.update(
        { password, updated_at: new Date() },
        {
          where: {
            id: user_id,
            is_active: true,
          },
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id, userType = "User" }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 400,
          message: "User ID field must not be empty!",
        });
      }

      let role_id = "e7daa45c-627d-455a-ac57-ec32aa57d009";

      if (userType == "Admin") {
        role_id = "c4be6a50-1bda-4237-bbf5-b607c37cd9b0";
      } else if (userType == "Character") {
        role_id = "29e07c7e-8d9b-40e0-9fc4-1cdc466a89ee";
      }

      const user = await models.Users.findOne({
        include: [
          {
            attributes: [],
            model: models.UserProfiles,
            where: {
              is_active: true,
              role_id,
              is_banned: false,
            },
          },
        ],
        where: { id, is_active: true },
        raw: true,
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ userType = "User" }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let role_id = "e7daa45c-627d-455a-ac57-ec32aa57d009";

      if (userType == "Admin") {
        role_id = "c4be6a50-1bda-4237-bbf5-b607c37cd9b0";
      } else if (userType == "Character") {
        role_id = "29e07c7e-8d9b-40e0-9fc4-1cdc466a89ee";
      }

      const user = await models.Users.findAll({
        include: [
          {
            model: models.UserProfiles,
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

export const GetUserAndProfileByIdentifier = async ({
  email,
  phone,
  role_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!email && !phone) {
        return reject({
          statusCode: 400,
          message: "Identity field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (email && phone) {
        where[Op.or] = {
          email: email?.trim()?.toLowerCase(),
          phone,
        };
      } else if (email) {
        where["email"] = email?.trim()?.toLowerCase();
      } else if (phone) {
        where["phone"] = phone;
      }

      const user_data = await models.Users.findOne({
        include: [
          {
            model: models.UserProfiles,
            where: {
              is_active: true,
              role_id,
              is_banned: false,
            },
          },
        ],
        where,
      });

      resolve(user_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetUserAndProfileById = async ({ id, userType = "User" }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let role_id = "e7daa45c-627d-455a-ac57-ec32aa57d009";

      if (userType == "Admin") {
        role_id = "c4be6a50-1bda-4237-bbf5-b607c37cd9b0";
      } else if (userType == "Character") {
        role_id = "29e07c7e-8d9b-40e0-9fc4-1cdc466a89ee";
      }

      const user_data = await models.Users.findOne({
        include: [
          {
            model: models.UserProfiles,
            where: {
              is_active: true,
              role_id,
              is_banned: false,
            },
          },
        ],
        where: {
          is_active: true,
          id,
        },
      });

      resolve(user_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const DeleteUser = async () => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await models.Users.update(
        {
          is_active: false,
        },
        {
          where: {
            user_status: 3,
            is_reactive_request_raised: false,
            is_active: true,
            [Op.and]: [
              models.Sequelize.literal(
                `CURRENT_DATE :: date - deleted_at :: date > 30`
              ),
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

export const GetByEmail = ({ email }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!email) {
        return reject({
          statusCode: 400,
          message: "Email address field must not be empty!",
        });
      }

      const user = await models.Users.findOne({
        where: { email, is_active: true },
        raw: true,
      });
      resolve(user);
    } catch (err) {
      reject(err);
    }
  });
};
