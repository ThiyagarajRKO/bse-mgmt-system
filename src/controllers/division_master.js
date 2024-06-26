import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, division_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!division_data) {
        return reject({
          statusCode: 420,
          message: "Division data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!division_data?.division_name) {
        return reject({
          statusCode: 420,
          message: "Division name must not be empty!",
        });
      }

      const result = await models.DivisionMaster.create(division_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Division already exists!" });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, division_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Division id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!division_data) {
        return reject({
          statusCode: 420,
          message: "Division data must not be empty!",
        });
      }

      const result = await models.DivisionMaster.update(division_data, {
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
          message: "Division ID field must not be empty!",
        });
      }

      const division = await models.DivisionMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(division);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ division_name, start = 0, length = 10, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (division_name) {
        where.division_name = { [Op.iLike]: `%${division_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { division_name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const suppliers = await models.DivisionMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(suppliers);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Division ID field must not be empty!",
        });
      }

      const division = await models.DivisionMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(division);
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
          message: "Division ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const supplier = await models.DivisionMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(supplier);
    } catch (err) {
      reject(err);
    }
  });
};
