import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, dispatch_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!dispatch_master_data?.procurement_id) {
        return reject({
          statusCode: 420,
          message: "Procurement data must not be empty!",
        });
      }

      if (!dispatch_master_data?.source_unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Source location must not be empty!",
        });
      }

      if (!dispatch_master_data?.destination_unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Destination location must not be empty!",
        });
      }

      if (!dispatch_master_data?.vehicle_master_id) {
        return reject({
          statusCode: 420,
          message: "Vehicle details must not be empty!",
        });
      }

      if (!dispatch_master_data?.driver_master_id) {
        return reject({
          statusCode: 420,
          message: "Driver details must not be empty!",
        });
      }

      const result = await models.Dispatches.create(dispatch_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Dispatch already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, dispatch_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Dispatch id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!dispatch_master_data) {
        return reject({
          statusCode: 420,
          message: "Dispatch data must not be empty!",
        });
      }

      const result = await models.Dispatches.update(dispatch_master_data, {
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      const dispatch = await models.Dispatches.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(dispatch);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ lot_no, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementWhere = {
        is_active: true,
      };

      if (lot_no) {
        procurementWhere.procurement_lot = {
          [Op.iLike]: `%${lot_no}%`,
        };
      }

      if (search) {
        where[Op.or] = [
          { dispatch_code: { [Op.iLike]: `%${search}%` } },
          { dispatch_name: { [Op.iLike]: `%${search}%` } },
          { "$Procurements.procurement_lot$": { [Op.iLike]: `%${search}%` } },
          { "$source_unit.unit_name$": { [Op.iLike]: `%${search}%` } },
          { "$destination_unit.unit_name$": { [Op.iLike]: `%${search}%` } },
          { "$VehicleMaster.vehicle_number$": { [Op.iLike]: `%${search}%` } },
          { "$DriverMaster.driver_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const dispatchs = await models.Dispatches.findAndCountAll({
        include: [
          {
            model: models.Procurements,
            where: procurementWhere,
          },
          {
            as: "source_unit",
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
          {
            as: "destination_unit",
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
          {
            model: models.VehicleMaster,
            where: {
              is_active: true,
            },
          },
          {
            model: models.DriverMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(dispatchs);
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const dispatch = await models.Dispatches.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(dispatch);
    } catch (err) {
      reject(err);
    }
  });
};
