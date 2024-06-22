import { Op } from "sequelize";
const sequelize = require("sequelize");
import models from "../../models";

export const Insert = async (profile_id, sales_payment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!sales_payment_data) {
        return reject({
          statusCode: 420,
          message: "Sales Payment data must not be empty!",
        });
      }

      if (!sales_payment_data?.customer_master_id) {
        return reject({
          statusCode: 420,
          message: "Customer data must not be empty!",
        });
      }

      if (!sales_payment_data?.order_id) {
        return reject({
          statusCode: 420,
          message: "Lot no must not be empty!",
        });
      }

      const result = await models.SalesPayments.create(sales_payment_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Sales payment already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, sales_payment_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Sales payment id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "User id must not be empty!",
        });
      }

      if (!sales_payment_data) {
        return reject({
          statusCode: 420,
          message: "Payment data must not be empty!",
        });
      }

      const result = await models.SalesPayments.update(sales_payment_data, {
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
          message: "Sales Payment ID field must not be empty!",
        });
      }

      const sales_payment = await models.SalesPayments.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(sales_payment);
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
          { "$CustomerMaster.customer_name$": { [Op.iLike]: `%${search}%` } },
          {
            "$Orders.order_no$": { [Op.iLike]: `%${search}%` },
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

      const payments = await models.SalesPayments.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "transaction_id",
          "payment_date",
          "customer_master_id",
          "order_id",
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
              `(SELECT COUNT(op.id) FROM order_products op WHERE op.order_id = "SalesPayments".order_id and op.order_id = "SalesPayments".order_id and op.is_active = true)`
            ),
            "total_products",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(op.total_price) FROM order_products op WHERE op.order_id = "SalesPayments".order_id and op.order_id = "SalesPayments".order_id and op.is_active = true)`
            ),
            "total_amount",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.unit) FROM order_products pp WHERE pp.order_id = "SalesPayments".order_id and pp.order_id = "SalesPayments".order_id and pp.is_active = true)`
            ),
            "total_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT CASE WHEN sp.id = "SalesPayments".id THEN true ELSE false END FROM sales_payments sp WHERE sp.order_id = "SalesPayments".order_id and sp.order_id = "SalesPayments".order_id and sp.is_active = true order by sp.created_at DESC LIMIT 1)`
            ),
            "is_last_payment",
          ],
        ],
        include: [
          {
            attributes: [
              "id",
              "customer_name",
              "customer_phone",
              "customer_email",
              "customer_address",
            ],
            model: models.CustomerMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "order_no", "created_at"],
            model: models.Orders,
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
          message: "Sales Order ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const customer = await models.SalesPayments.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(customer);
    } catch (err) {
      reject(err);
    }
  });
};
