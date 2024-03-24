import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (driver_data) => {
  return new Promise(async (resolve, reject) => {
    try {
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

      const result = await models.DriverMaster.create(driver_data);
      resolve(result);
    } catch (err) {
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

      if (!driver_data) {
        return reject({
          statusCode: 420,
          message: "Driver data must not be empty!",
        });
      }

      driver_data.updated_at = new Date();
      driver_data.updated_by = profile_id;
      const result = await models.DriverMaster.update(driver_data, {
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
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (driver_name) {
        where.driver_name = { [Op.iLike]: driver_name };
      }

      if (address) {
        where.address = { [Op.iLike]: address };
      }

      if (phone) {
        where.phone = { [Op.iLike]: phone };
      }

      if (blood_group) {
        where.blood_group = { [Op.iLike]: blood_group };
      }

      if (health_history) {
        where.health_history = { [Op.iLike]: health_history };
      }

      const vendors = await models.DriverMaster.findAndCountAll({
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

export const Count = ({ id, driver_number }) => {
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

      const vendor = await models.DriverMaster.update(
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
