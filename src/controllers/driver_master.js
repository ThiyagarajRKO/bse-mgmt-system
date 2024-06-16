import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, driver_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!driver_data) {
        return reject({
          statusCode: 420,
          message: "Driver data must not be empty!",
        });
      }

      if (!driver_data?.driver_name) {
        return reject({
          statusCode: 420,
          message: "Driver name must not be empty!",
        });
      }

      if (!driver_data?.license_number) {
        return reject({
          statusCode: 420,
          message: "License number must not be empty!",
        });
      }

      if (!driver_data?.phone) {
        return reject({
          statusCode: 420,
          message: "Driver number must not be empty!",
        });
      }

      if (!driver_data?.emergency_contact) {
        return reject({
          statusCode: 420,
          message: "Emergency contact number must not be empty!",
        });
      }

      if (!driver_data?.blood_group) {
        return reject({
          statusCode: 420,
          message: "Blood group must not be empty!",
        });
      }

      const result = await models.DriverMaster.create(driver_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Driver already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, driver_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Driver master id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!driver_data) {
        return reject({
          statusCode: 420,
          message: "Driver data must not be empty!",
        });
      }

      const result = await models.DriverMaster.update(driver_data, {
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
          message: "Driver Master ID field must not be empty!",
        });
      }

      const driver = await models.DriverMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(driver);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  driver_name,
  address,
  phone,
  blood_group,
  health_history,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (driver_name) {
        where.driver_name = { [Op.iLike]: `%${driver_name}%` };
      }

      if (address) {
        where.address = { [Op.iLike]: `%${address}%` };
      }

      if (phone) {
        where.phone = { [Op.iLike]: `%${phone}%` };
      }

      if (blood_group) {
        where.blood_group = { [Op.iLike]: `%${blood_group}%` };
      }

      if (health_history) {
        where.health_history = { [Op.iLike]: `%${health_history}%` };
      }

      if (search) {
        where[Op.or] = [
          { driver_name: { [Op.iLike]: `%${search}%` } },
          { address: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } },
          { health_history: { [Op.iLike]: `%${search}%` } },
          { license_number: { [Op.iLike]: `%${search}%` } },
          { aadhar_number: { [Op.iLike]: `%${search}%` } },
          { emergency_contact: { [Op.iLike]: `%${search}%` } },
          { blood_group: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const suppliers = await models.DriverMaster.findAndCountAll({
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
          message: "Driver Master ID field must not be empty!",
        });
      }

      const driver = await models.DriverMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(driver);
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
          message: "Driver ID field must not be empty!",
        });
      }

      const supplier = await models.DriverMaster.destroy({
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
