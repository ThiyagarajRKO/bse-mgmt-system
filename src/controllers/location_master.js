import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, location_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!location_data) {
        return reject({
          statusCode: 420,
          message: "Location data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!location_data?.location_name) {
        return reject({
          statusCode: 420,
          message: "Location name must not be empty!",
        });
      }

      const result = await models.LocationMaster.create(location_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Location already exists!" });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, location_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Location id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!location_data) {
        return reject({
          statusCode: 420,
          message: "Location data must not be empty!",
        });
      }

      const result = await models.LocationMaster.update(location_data, {
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
          message: "Location ID field must not be empty!",
        });
      }

      const location = await models.LocationMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(location);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ location_name, start = 0, length = 10, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (location_name) {
        where.location_name = { [Op.iLike]: `%${location_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { location_name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const suppliers = await models.LocationMaster.findAndCountAll({
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
          message: "Location ID field must not be empty!",
        });
      }

      const location = await models.LocationMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(location);
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
          message: "Location ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const supplier = await models.LocationMaster.destroy({
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
