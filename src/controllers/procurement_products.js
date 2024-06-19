import { Op, QueryTypes } from "sequelize";
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

      if (!procurement_data?.supplier_master_id) {
        return reject({
          statusCode: 420,
          message: "Supplier master id must not be empty!",
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
            as: "pl",
            model: models.ProcurementLots,
            where: {
              is_active: true,
            },
          },
          {
            model: models.SupplierMaster,
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

export const GetQuantity = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Procurement product ID field must not be empty!",
        });
      }

      const product = await models.ProcurementProducts.findOne({
        attributes: ["procurement_quantity", "adjusted_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  procurement_lot_id,
  procurement_lot,
  product_master_name,
  procurement_product_type,
  procurement_quantity,
  procurement_price,
  procurement_totalamount,
  procurement_purchaser,
  supplier_id,
  purchase_payment_id,
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

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }

      if (procurement_lot) {
        procurementLotsWhere.procurement_lot = procurement_lot;
      }

      let supplierWhere = {
        is_active: true,
      };

      if (supplier_id) {
        supplierWhere.id = supplier_id;
      }

      let paymentWhere = {
        is_active: true,
      };

      if (purchase_payment_id) {
        paymentWhere.id = purchase_payment_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("pl.procurement_lot"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(
              sequelize.col("procurement_product_type"),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { procurement_purchaser: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurements = await models.ProcurementProducts.findAndCountAll({
        subQuery: false,
        include: [
          {
            as: "pl",
            attributes: [
              "id",
              "procurement_lot",
              "procurement_date",
              "created_at",
            ],
            model: models.ProcurementLots,
            include: [
              {
                attributes: ["id", "unit_name"],
                model: models.UnitMaster,
                where: {
                  is_active: true,
                },
              },
              {
                required: false,
                attributes: ["id"],
                model: models.PurchasePayments,
                where: {
                  is_active: true,
                },
              },
            ],
            where: procurementLotsWhere,
          },
          {
            attributes: ["id", "supplier_name"],
            model: models.SupplierMaster,
            where: supplierWhere,
          },
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
            where: productWhere,
          },
          {
            required: false,
            model: models.Dispatches,
            include: [
              {
                attributes: ["id", "unit_name"],
                model: models.UnitMaster,
                where: {
                  is_active: true,
                },
              },
              {
                attributes: ["id", "vehicle_number"],
                model: models.VehicleMaster,
                where: {
                  is_active: true,
                },
              },
              {
                attributes: ["id", "driver_name"],
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
        order: [[sequelize.col(`"pl".procurement_date`), "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPaymentItems = ({
  purchase_payment_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentWhere = {
        is_active: true,
      };

      if (purchase_payment_id) {
        paymentWhere.id = purchase_payment_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("pl.procurement_lot"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(
              sequelize.col("procurement_product_type"),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { procurement_purchaser: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurements = await models.ProcurementProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_product_type",
          "procurement_quantity",
          "procurement_quantity",
          "adjusted_quantity",
          "procurement_price",
          "adjusted_price",
          "adjusted_reason",
          "adjusted_surveyor",
          "procurement_purchaser",
          "procurement_totalamount",
          "created_at",
        ],
        include: [
          {
            as: "pl",
            attributes: ["id"],
            model: models.ProcurementLots,
            include: [
              {
                attributes: ["id"],
                model: models.PurchasePayments,
                where: paymentWhere,
              },
            ],
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          is_active: true,
        },
        offset: start,
        limit: length,
        order: [[sequelize.col(`"pl".procurement_date`), "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

// Retrive Procured Products names, along with quantity
export const GetNames = ({
  procurement_lot_id,
  dispatch_id,
  start = 0,
  length = 10,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }

      const procurements = await models.ProcurementProducts.findAll({
        attributes: [
          "id",
          "procurement_product_type",
          "procurement_quantity",
          "adjusted_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(dispatches.dispatch_quantity) IS NULL THEN 0 ELSE SUM(dispatches.dispatch_quantity) END FROM dispatches WHERE "ProcurementProducts".id = procurement_product_id and ${
                dispatch_id != "null" && dispatch_id != undefined
                  ? "dispatches.id != '" + dispatch_id + "' and"
                  : ""
              } dispatches.is_active = true)`
            ),
            "dispatched_quantity",
          ],
        ],
        include: [
          {
            required: true,
            attributes: [],
            as: "pl",
            model: models.ProcurementLots,
            where: procurementLotsWhere,
          },
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "supplier_name"],
            model: models.SupplierMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "ProcurementProducts.id",
          "ProductMaster.id",
          "SupplierMaster.id",
        ],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({
  id,
  procurement_lot_id,
  product_master_id,
  supplier_master_id,
  procurement_product_type,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_lot_id) {
        where.procurement_lot_id = procurement_lot_id;
      }

      if (supplier_master_id) {
        where.supplier_master_id = supplier_master_id;
      }

      if (product_master_id) {
        where.product_master_id = product_master_id;
      }

      if (procurement_product_type) {
        where.procurement_product_type = procurement_product_type;
      }

      const unit = await models.ProcurementProducts.count({
        where,
        raw: true,
      });

      resolve(unit);
    } catch (err) {
      reject(err);
    }
  });
};

export const CheckLot = ({
  id,
  procurement_lot_id,
  product_master_id,
  procurement_product_type,
  supplier_master_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lot = await models.ProcurementProducts.count({
        where: {
          product_master_id,
          procurement_product_type,
          supplier_master_id,
          procurement_lot_id,
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

export const Delete = ({
  profile_id,
  id,
  procurement_lot_id,
  supplier_master_id,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if ((!id && !procurement_lot_id) || !supplier_master_id) {
        return reject({
          statusCode: 420,
          message:
            "Purchase Lot, Product ID, or Supplier ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const paidStatus = await PaidStatus({ id, supplier_master_id });

      if (paidStatus > 0) {
        return reject({
          statusCode: 420,
          message: "Unable to delete the paid products.",
        });
      }

      let where = {
        is_active: true,
        created_by: profile_id,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_lot_id) {
        where.procurement_lot_id = procurement_lot_id;
      }

      const procurement = await models.ProcurementProducts.destroy({
        where,
        individualHooks: true,
        profile_id,
      });

      resolve(procurement);
    } catch (err) {
      reject(err);
    }
  });
};

export const PaidStatus = ({ id, supplier_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lot = await models.ProcurementProducts.count({
        include: [
          {
            as: "pl",
            model: models.ProcurementLots,
            include: [
              {
                model: models.PurchasePayments,
                where: {
                  is_active: true,
                  supplier_master_id,
                },
              },
            ],
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          is_active: true,
          id,
        },
      });

      resolve(lot);
    } catch (err) {
      reject(err);
    }
  });
};

// --------------------------------------------------------------------------------
// ----------------------------------- Charts -------------------------------------
// --------------------------------------------------------------------------------

export const GetProcurementSpendBySuppliersData = ({ from_date, to_date }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: Sequelize.where(
          Sequelize.fn("date", Sequelize.col("ProcurementProducts.created_at")),
          {
            [Op.between]: [
              new Date(from_date || null),
              new Date(to_date || null),
            ],
          }
        ),
      };

      const output_data = await models.ProcurementProducts.findAll({
        subQuery: false,
        attributes: [
          "supplier_master_id",
          [
            sequelize.fn("sum", sequelize.col("procurement_totalamount")),
            "total_amount",
          ],
        ],
        include: [
          {
            attributes: ["id", "supplier_name"],
            model: models.SupplierMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        order: [["total_amount", "asc"]],
        group: ["supplier_master_id", "SupplierMaster.id"],
      });

      resolve(output_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetProcurementSpendByProductsData = ({ from_date, to_date }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: Sequelize.where(
          Sequelize.fn("date", Sequelize.col("ProcurementProducts.created_at")),
          {
            [Op.between]: [
              new Date(from_date || null),
              new Date(to_date || null),
            ],
          }
        ),
      };

      const output_data = await models.ProcurementProducts.findAll({
        subQuery: false,
        attributes: [
          "product_master_id",
          [
            sequelize.fn("sum", sequelize.col("procurement_totalamount")),
            "total_amount",
          ],
        ],
        include: [
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        order: [["total_amount", "asc"]],
        group: ["product_master_id", "ProductMaster.id"],
      });

      resolve(output_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetProcurementSpendByDateData = ({ from_date, to_date }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: Sequelize.where(
          Sequelize.literal(`CAST("pl".procurement_date AS DATE)`),
          {
            [Op.between]: [
              new Date(from_date || null),
              new Date(to_date || null),
            ],
          }
        ),
      };

      const output_data = await models.ProcurementProducts.findAll({
        subQuery: false,
        attributes: [
          [
            Sequelize.literal(`CAST("pl".procurement_date AS DATE)`),
            "procurement_date",
          ],
          [
            sequelize.fn("sum", sequelize.col("procurement_totalamount")),
            "total_amount",
          ],
          [
            sequelize.fn("sum", sequelize.col("procurement_quantity")),
            "total_procurement_quantity",
          ],
          [
            sequelize.fn("sum", sequelize.col("adjusted_quantity")),
            "total_adjusted_quantity",
          ],
        ],
        include: [
          {
            attributes: [],
            as: "pl",
            model: models.ProcurementLots,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        order: [["procurement_date", "asc"]],
        group: ["procurement_date"],
      });

      resolve(output_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetProcurementPerformanceBySuppliersData = ({
  from_date,
  to_date,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: Sequelize.where(
          Sequelize.fn("date", Sequelize.col("ProcurementProducts.created_at")),
          {
            [Op.between]: [
              new Date(from_date || null),
              new Date(to_date || null),
            ],
          }
        ),
      };

      const output_data = await models.ProcurementProducts.findAll({
        subQuery: false,
        attributes: [
          // "supplier_master_id",
          [
            sequelize.fn("sum", sequelize.col("procurement_quantity")),
            "total_procurement_quantity",
          ],
          [
            sequelize.fn("sum", sequelize.col("adjusted_quantity")),
            "total_adjusted_quantity",
          ],
          [
            sequelize.fn("sum", sequelize.col("procurement_price")),
            "total_procurement_price",
          ],
          [
            sequelize.fn("sum", sequelize.col("adjusted_price")),
            "total_adjusted_price",
          ],
        ],
        include: [
          {
            attributes: ["supplier_name"],
            model: models.SupplierMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        order: [
          [
            sequelize.literal(
              `CASE 
                WHEN 
                  sum(procurement_price) > sum(adjusted_price) 
                THEN 
                  sum(procurement_price)
                ELSE 
                  sum(adjusted_price) 
              END`
            ),
            "desc",
          ],
        ],
        group: ["SupplierMaster.id"],
      });

      resolve(output_data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetProcurementAgebyProductsData = ({ from_date, to_date }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn(
              "date",
              Sequelize.col("ProcurementProducts.created_at")
            ),
            {
              [Op.between]: [
                new Date(from_date || null),
                new Date(to_date || null),
              ],
            }
          ),
        ],
      };

      const output_data = await sequelize.query(
        `SELECT 
          SUM(
            EXTRACT(
              DAY 
              FROM 
                AGE(
                  now(), "ProcurementLot".procurement_date
                )
            )
          ) AS "days_old", 
          (
            CASE WHEN SUM(adjusted_quantity) IS NOT NULL THEN SUM(adjusted_quantity) ELSE SUM(procurement_quantity) END - SUM(dispatch_quantity)
          ) AS "quantity", 
          "ProductMaster"."product_name" AS "product_name" 
        FROM 
          "procurement_products" AS "ProcurementProducts" 
          INNER JOIN "procurement_lots" AS "ProcurementLot" ON "ProcurementProducts"."procurement_lot_id" = "ProcurementLot"."id" 
          AND (
            "ProcurementLot"."deleted_at" IS NULL 
            AND "ProcurementLot"."is_active" = true
          ) 
          INNER JOIN "dispatches" AS "Dispatches" ON "ProcurementProducts"."id" = "Dispatches"."procurement_product_id" 
          AND (
            "Dispatches"."deleted_at" IS NULL 
            AND "Dispatches"."is_active" = true
          ) 
          INNER JOIN "product_master" AS "ProductMaster" ON "ProcurementProducts"."product_master_id" = "ProductMaster"."id" 
          AND (
            "ProductMaster"."deleted_at" IS NULL 
            AND "ProductMaster"."is_active" = true
          ) 
        WHERE 
          (
            "ProcurementProducts"."deleted_at" IS NULL 
            AND (
              (
                date(
                  "ProcurementProducts"."created_at"
                ) BETWEEN '${from_date} 00:00:00.000 +00:00' 
                AND '${to_date} 00:00:00.000 +00:00'
              ) 
              AND "ProcurementProducts"."is_active" = true
            )
          ) 
        GROUP BY  
          "ProductMaster"."id" 
        HAVING 
          (
            (
              CASE WHEN SUM(adjusted_quantity) IS NOT NULL THEN SUM(adjusted_quantity) ELSE SUM(procurement_quantity) END
            ) - SUM(dispatch_quantity)
          ) > '0' 
        ORDER BY 
          "ProductMaster"."product_name" ASC;
      `,
        {
          type: QueryTypes.SELECT,
        }
      );

      resolve(output_data);
    } catch (err) {
      reject(err);
    }
  });
};
