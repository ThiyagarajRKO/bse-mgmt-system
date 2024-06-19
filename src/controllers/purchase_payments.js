import { Op } from "sequelize";
const sequelize = require("sequelize");
import models from "../../models";

export const Insert = async (profile_id, purchase_payment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!purchase_payment_data) {
        return reject({
          statusCode: 420,
          message: "Purchase Payment data must not be empty!",
        });
      }

      if (!purchase_payment_data?.supplier_master_id) {
        return reject({
          statusCode: 420,
          message: "Supplier data must not be empty!",
        });
      }

      if (!purchase_payment_data?.procurement_lot_id) {
        return reject({
          statusCode: 420,
          message: "Lot no must not be empty!",
        });
      }

      const result = await models.PurchasePayments.create(
        purchase_payment_data,
        {
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Purchase payment already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, purchase_payment_data) => {
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
          message: "User id must not be empty!",
        });
      }

      if (!purchase_payment_data) {
        return reject({
          statusCode: 420,
          message: "Payment data must not be empty!",
        });
      }

      const result = await models.PurchasePayments.update(
        purchase_payment_data,
        {
          where: {
            id,
            is_active: true,
          },
          individualHooks: true,
          profile_id,
        }
      );
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
          message: "Vehicle Master ID field must not be empty!",
        });
      }

      const vehicle = await models.PurchasePayments.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(vehicle);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          { transaction_id: { [Op.iLike]: `%${search}%` } },
          { "$SupplierMaster.supplier_name$": { [Op.iLike]: `%${search}%` } },
          {
            "$ProcurementLot.procurement_lot$": { [Op.iLike]: `%${search}%` },
          },
          {
            payment_method: { [Op.iLike]: `%${search}%` },
          },
          sequelize.where(
            sequelize.cast(sequelize.col("payment_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("total_paid"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("net_amount"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("discount"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("tax_amount"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
        ];
      }

      const payments = await models.PurchasePayments.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "transaction_id",
          "payment_date",
          "supplier_master_id",
          "procurement_lot_id",
          "payment_method",
          "discount",
          "total_paid",
          "net_amount",
          "penalty",
          "tax_percentage",
          "tax_amount",
          "due_amount",
          "created_at",
          [
            sequelize.literal(
              `(SELECT COUNT(pp.id) FROM procurement_products pp JOIN procurement_lots pl ON pl.id = pp.procurement_lot_id and pl.is_active = true WHERE pl.id = "PurchasePayments".procurement_lot_id and pp.supplier_master_id = "PurchasePayments".supplier_master_id and pp.is_active = true)`
            ),
            "total_products",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.procurement_totalamount) FROM procurement_products pp JOIN procurement_lots pl ON pl.id = pp.procurement_lot_id and pl.is_active = true WHERE pl.id = "PurchasePayments".procurement_lot_id and pp.supplier_master_id = "PurchasePayments".supplier_master_id and pp.is_active = true)`
            ),
            "total_amount",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.procurement_quantity) FROM procurement_products pp JOIN procurement_lots pl ON pl.id = pp.procurement_lot_id and pl.is_active = true WHERE pl.id = "PurchasePayments".procurement_lot_id and pp.supplier_master_id = "PurchasePayments".supplier_master_id and pp.is_active = true)`
            ),
            "total_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.adjusted_quantity) FROM procurement_products pp JOIN procurement_lots pl ON pl.id = pp.procurement_lot_id and pl.is_active = true WHERE pl.id = "PurchasePayments".procurement_lot_id and pp.supplier_master_id = "PurchasePayments".supplier_master_id and pp.is_active = true)`
            ),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.adjusted_price) FROM procurement_products pp JOIN procurement_lots pl ON pl.id = pp.procurement_lot_id and pl.is_active = true WHERE pl.id = "PurchasePayments".procurement_lot_id and pp.supplier_master_id = "PurchasePayments".supplier_master_id and pp.is_active = true)`
            ),
            "total_adjusted_price",
          ],
        ],
        include: [
          {
            attributes: [
              "id",
              "supplier_name",
              "phone",
              "email",
              "address",
              "representative",
            ],
            model: models.SupplierMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "procurement_lot", "created_at"],
            model: models.ProcurementLots,
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

      resolve(payments);
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

      const supplier = await models.PurchasePayments.destroy({
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
