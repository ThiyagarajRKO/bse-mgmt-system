import { Op } from "sequelize";
import models from "../../models";

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Module Master ID field must not be empty!",
        });
      }

      const unit = await models.ModuleMaster.findOne({
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

export const GetAll = ({ module_name, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (module_name) {
        where.module_name = { [Op.iLike]: module_name };
      }

      if (search) {
        where[Op.or] = [{ module_name: { [Op.iLike]: `%${search}%` } }];
      }

      const units = await models.ModuleMaster.findAndCountAll({
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
