import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (unit_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!unit_master_data?.unit_name) {
        return reject({
          statusCode: 420,
          message: "Unit name must not be empty!",
        });
      }

      if (!unit_master_data?.unit_type) {
        return reject({
          statusCode: 420,
          message: "Unit type must not be empty!",
        });
      }

      if (!unit_master_data?.unit_code) {
        return reject({
          statusCode: 420,
          message: "Unit code must not be empty!",
        });
      }

      if (!unit_master_data?.location_master_id) {
        return reject({
          statusCode: 420,
          message: "Location master id must not be empty!",
        });
      }

      const result = await models.UnitMaster.create(unit_master_data);
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, unit_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Unit id must not be empty!",
        });
      }

      if (!unit_master_data) {
        return reject({
          statusCode: 420,
          message: "Unit data must not be empty!",
        });
      }

      unit_master_data.updated_at = new Date();
      unit_master_data.updated_by = profile_id;

      const result = await models.UnitMaster.update(unit_master_data, {
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

export const Get = ({ id, unit_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id && !unit_name) {
        return reject({
          statusCode: 420,
          message: "Unit ID field must not be empty!",
        });
      }

      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      } else if (unit_name) {
        where.unit_name = unit_name;
      }

      const unit = await models.UnitMaster.findOne({
        where,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  unit_code,
  unit_name,
  unit_type,
  location_master_name,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (unit_code) {
        where.unit_code = { [Op.iLike]: unit_code };
      }

      if (unit_name) {
        where.unit_name = { [Op.iLike]: unit_name };
      }

      if (unit_type) {
        where.unit_type = { [Op.iLike]: unit_type };
      }

      let locationWhere = {
        is_active: true,
      };

      if (location_master_name) {
        where.location_name = { [Op.iLike]: location_master_name };
      }

      const units = await models.UnitMaster.findAndCountAll({
        include: [
          {
            model: models.LocationMaster,
            where: locationWhere,
          },
        ],
        where,
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
          message: "Unit ID field must not be empty!",
        });
      }

      const unit = await models.UnitMaster.update(
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

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};
