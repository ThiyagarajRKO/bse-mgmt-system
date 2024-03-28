import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, size_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!size_master_data?.size) {
        return reject({
          statusCode: 420,
          message: "Size must not be empty!",
        });
      }

      const result = await models.SizeMaster.create(size_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Size already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, size_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Size master id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!size_master_data) {
        return reject({
          statusCode: 420,
          message: "Size data must not be empty!",
        });
      }

      const result = await models.SizeMaster.update(size_master_data, {
        where: {
          id,
          is_active: true,
        },
        individualHooks: true,
        profile_id,
      });
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Size ID field must not be empty!",
        });
      }

      const unit = await models.SizeMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ size, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (size) {
        where.size = { [Op.iLike]: `%${size}%` };
      }

      if (search) {
        where[Op.or] = [
          { size: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const units = await models.SizeMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(units);
    } catch (err) {
      reject(err);
    }
  });
};

export const Delete = ({ profile_id, id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Size master id field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const unit = await models.SizeMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};
