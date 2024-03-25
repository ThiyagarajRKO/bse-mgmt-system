import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, vehicle_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!vehicle_data) {
        return reject({
          statusCode: 420,
          message: "Vehicle data must not be empty!",
        });
      }

      if (!vehicle_data?.vehicle_number) {
        return reject({
          statusCode: 420,
          message: "Vehicle number must not be empty!",
        });
      }

      if (!vehicle_data?.vehicle_brand) {
        return reject({
          statusCode: 420,
          message: "Vehicle brand must not be empty!",
        });
      }

      if (!vehicle_data?.model_number) {
        return reject({
          statusCode: 420,
          message: "Model number must not be empty!",
        });
      }

      const result = await models.VehicleMaster.create(vehicle_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Vehicle already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, vehicle_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Vehicle master id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!vehicle_data) {
        return reject({
          statusCode: 420,
          message: "Vehicle data must not be empty!",
        });
      }

      const result = await models.VehicleMaster.update(vehicle_data, {
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

export const Get = ({ id, vehicle_number }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Vehicle Master ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (vehicle_number) {
        where.vehicle_number = vehicle_number;
      }

      const vehicle = await models.VehicleMaster.findOne({
        where,
      });

      resolve(vehicle);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  vehicle_number,
  vehicle_brand,
  model_number,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (vehicle_number) {
        where.vehicle_number = { [Op.iLike]: vehicle_number };
      }

      if (vehicle_brand) {
        where.vehicle_brand = { [Op.iLike]: vehicle_brand };
      }

      if (model_number) {
        where.model_number = { [Op.iLike]: model_number };
      }

      const vendors = await models.VehicleMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(vendors);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id, vehicle_number }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Vehicle Master ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where[id] = id;
      } else if (vehicle_number) {
        where[vehicle_number] = vehicle_number;
      }

      const vehicle = await models.VehicleMaster.count({
        where,
        raw: true,
      });

      resolve(vehicle);
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
          message: "Vehicle ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const vendor = await models.VehicleMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(vendor);
    } catch (err) {
      reject(err);
    }
  });
};
