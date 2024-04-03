import { Op } from "sequelize";
import models, { sequelize } from "../../models";

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

export const Get = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_date) {
        where.procurement_date = new Date(procurement_date);
      }

      if (unit_master_id) {
        where.unit_master_id = unit_master_id;
      }

      const lot = await models.ProcurementLots.findOne({
        include: [
          {
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.ProcurementProducts,
            where: {
              is_active: true,
            },
          },
        ],
        where,
      });

      resolve(lot);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  procurement_date,
  procurement_lot,
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
            required: false,
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

export const GetStats = ({
  procurement_date,
  procurement_lot,
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

      const procurementCount = await models.ProcurementLots.count({
        where: { is_active: true },
        raw: true,
      });

      const procurementRows = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT COUNT(procurement_products.id) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_product_count",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(dispatches.id) FROM dispatches JOIN procurement_products pp ON pp.id = "ProcurementLots".id WHERE dispatches.procurement_product_id = pp.id and dispatches.is_active = true)`
            ),
            "total_dispatched_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = "ProcurementLots".id WHERE dispatches.procurement_product_id = pp.id and dispatches.is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_purchased_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_price) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_purchased_price",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_price) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_adjusted_price",
          ],
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["ProcurementLots.id"],
      });

      const output = {
        count: procurementCount,
        rows: procurementRows,
      };

      resolve(output);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_date) {
        where.procurement_date = procurement_date;
      }

      if (unit_master_id) {
        where.unit_master_id = unit_master_id;
      }

      const lot = await models.ProcurementLots.count({
        where,
        raw: true,
      });

      resolve(lot);
    } catch (err) {
      reject(err);
    }
  });
};

export const CheckLot = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lot = await models.ProcurementLots.count({
        where: {
          procurement_date: new Date(procurement_date),
          unit_master_id,
          id: {
            [Op.ne]: id,
          },
        },
        raw: true,
      });

      resolve(lot);
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
