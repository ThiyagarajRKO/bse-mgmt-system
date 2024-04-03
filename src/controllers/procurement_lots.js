import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data?.procurement_date) {
        return reject({
          statusCode: 420,
          message: "Purchase date must not be empty!",
        });
      }

      if (!procurement_data?.unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Purchase unit id must not be empty!",
        });
      }

      if (!procurement_data?.vendor_master_id) {
        return reject({
          statusCode: 420,
          message: "Vendor master id must not be empty!",
        });
      }

      const result = await models.ProcurementLots.create(procurement_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Purchase already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Purchase id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data) {
        return reject({
          statusCode: 420,
          message: "Purchase data must not be empty!",
        });
      }

      const result = await models.ProcurementLots.update(procurement_data, {
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
          message: "Unit ID field must not be empty!",
        });
      }

      const unit = await models.ProcurementLots.findOne({
        include: [
          {
            model: models.UnitMaster,
            where: unitWhere,
          },
          {
            model: models.VendorMaster,
            where: vendorWhere,
          },
          {
            model: models.ProcurementProducts,
            where: {
              is_active: true,
            },
          },
        ],
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

export const GetAll = ({
  procurement_date,
  procurement_lot,
  vendor_master_name,
  unit_master_name,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_date) {
        where.procurement_date = { [Op.iLike]: procurement_date };
      }

      if (procurement_lot) {
        where.procurement_lot = { [Op.iLike]: procurement_lot };
      }

      let vendorWhere = {
        is_active: true,
      };

      if (vendor_master_name) {
        vendorWhere.vendor_name = { [Op.iLike]: vendor_master_name };
      }

      let unitWhere = {
        is_active: true,
      };

      if (unit_master_name) {
        unitWhere.unit_name = { [Op.iLike]: unit_master_name };
      }

      const procurements = await models.ProcurementLots.findAndCountAll({
        include: [
          {
            model: models.UnitMaster,
            where: unitWhere,
          },
          {
            model: models.VendorMaster,
            where: vendorWhere,
          },
          {
            model: models.ProcurementProducts,
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

      resolve(procurements);
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
          message: "Purchase ID field must not be empty!",
        });
      }

      const unit = await models.ProcurementLots.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(unit);
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
          message: "Purchase ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const procurement = await models.ProcurementLots.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(procurement);
    } catch (err) {
      reject(err);
    }
  });
};
