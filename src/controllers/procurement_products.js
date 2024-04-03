import { Op } from "sequelize";
import models, { Sequelize, sequelize } from "../../models";

export const Insert = async (profile_id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data?.product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product master id must not be empty!",
        });
      }

      if (!procurement_data?.procurement_product_type) {
        return reject({
          statusCode: 420,
          message: "Purchase Type must not be empty!",
        });
      }

      if (!procurement_data?.procurement_quantity) {
        return reject({
          statusCode: 420,
          message: "Purchase Quantity must not be empty!",
        });
      }

      if (!procurement_data?.procurement_price) {
        return reject({
          statusCode: 420,
          message: "Purchase Price must not be empty!",
        });
      }

      if (!procurement_data?.procurement_purchaser) {
        return reject({
          statusCode: 420,
          message: "Purchaser must not be empty!",
        });
      }

      const result = await models.ProcurementProducts.create(procurement_data, {
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

      const result = await models.ProcurementProducts.update(procurement_data, {
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
          message: "Procurement product ID field must not be empty!",
        });
      }

      const unit = await models.ProcurementProducts.findOne({
        include: [
          {
            model: models.ProcurementLots,
            where: {
              is_active: true,
            },
          },
          {
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.Dispatches,
            include: [
              {
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
  product_master_name,
  procurement_product_type,
  procurement_quantity,
  procurement_price,
  procurement_totalamount,
  procurement_purchaser,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_product_type) {
        where.procurement_product_type = {
          [Op.iLike]: procurement_product_type,
        };
      }

      if (procurement_quantity) {
        where.procurement_quantity = { [Op.iLike]: procurement_quantity };
      }

      if (procurement_price) {
        where.procurement_price = { [Op.iLike]: procurement_price };
      }

      if (procurement_totalamount) {
        where.procurement_totalamount = { [Op.iLike]: procurement_totalamount };
      }

      if (procurement_purchaser) {
        where.procurement_purchaser = { [Op.iLike]: procurement_purchaser };
      }

      let productWhere = {
        is_active: true,
      };

      if (product_master_name) {
        productWhere.product_name = { [Op.iLike]: product_master_name };
      }

      const procurements = await models.ProcurementProducts.findAndCountAll({
        include: [
          {
            model: models.ProcurementLots,
            where: {
              is_active: true,
            },
          },
          {
            model: models.ProductMaster,
            where: productWhere,
          },
          {
            required: false,
            model: models.Dispatches,
            include: [
              {
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

export const GetLotStats = ({ procurement_lot, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_lot) {
        where.procurement_lot = { [Op.iLike]: procurement_lot };
      }

      const procurementsCount = await models.Procurements.count({
        where,
      });

      const procurements = await models.Procurements.findAll({
        subQuery: false,
        attributes: [
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT COUNT(product_master.id) FROM product_master WHERE product_master.id = "Procurements".product_master_id and product_master.is_active = true)`
            ),
            "total_product_count",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(dispatches.id) FROM dispatches WHERE dispatches.procurement_id = "Procurements".id and dispatches.is_active = true)`
            ),
            "total_dispatched_count",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("Dispatch.dispatch_quantity")),
            "total_dispatched_quantity",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("procurement_quantity")),
            "total_purchased_quantity",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("procurement_price")),
            "total_purchased_price",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("adjusted_quantity")),
            "total_adjusted_quantity",
          ],
          [
            Sequelize.fn("SUM", Sequelize.col("adjusted_price")),
            "total_adjusted_price",
          ],
        ],
        include: [
          {
            attributes: [],
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: [],
            required: false,
            model: models.Dispatches,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        // order: [["created_at", "desc"]],
        group: [
          "Procurements.id",
          "procurement_lot",
          "product_master_id",
          "procurement_date",
          // "ProductMaster.id",
          // "Dispatch.id",
        ],
      });

      const output = {
        count: procurementsCount,
        rows: procurements,
      };

      resolve(output);
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

      const unit = await models.ProcurementProducts.count({
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

      const procurement = await models.ProcurementProducts.destroy({
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