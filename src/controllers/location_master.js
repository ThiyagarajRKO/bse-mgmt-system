import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (location_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!location_data) {
        return reject({
          statusCode: 400,
          message: "Location data must not be empty!",
        });
      }

      const result = await models.LocationMaster.create(location_data);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, location_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 400,
          message: "Location id must not be empty!",
        });
      }

      if (!location_data) {
        return reject({
          statusCode: 400,
          message: "Location data must not be empty!",
        });
      }

      location_data.updated_at = new Date();
      location_data.updated_by = profile_id;
      const result = await models.LocationMaster.update(location_data, {
        where: {
          id,
          is_active: true,
        },
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
          statusCode: 400,
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

export const GetAll = ({ location_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (location_name) {
        where.location_name = { [Op.iLike]: location_name };
      }

      const vendors = await models.LocationMaster.findAndCountAll({
        where,
        order: [["created_at", "desc"]],
      });

      resolve(vendors);
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
          statusCode: 400,
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
          statusCode: 400,
          message: "Location ID field must not be empty!",
        });
      }

      const vendor = await models.LocationMaster.update(
        {
          is_active: false,
          deleted_by: profile_id,
          deleted_at: new Date(),
        },
        {
          where: {
            id,
            is_active: true,
            created_by: profile_id,
          },
        }
      );

      resolve(vendor);
    } catch (err) {
      reject(err);
    }
  });
};
