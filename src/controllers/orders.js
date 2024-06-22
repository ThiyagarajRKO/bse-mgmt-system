import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (profile_id, order_data, is_products_included) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_data) {
        return reject({
          statusCode: 420,
          message: "Orders data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!order_data.customer_master_id) {
        return reject({
          statusCode: 420,
          message: "Customer master id must not be empty!",
        });
      }

      let options = {};
      if (is_products_included) {
        options = {
          include: [
            {
              profile_id,
              model: models.OrderProducts,
            },
          ],
        };
      }

      const result = await models.Orders.create(order_data, {
        profile_id,
        ...options,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Orders order already exists!",
        });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, order_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!order_data) {
        return reject({
          statusCode: 420,
          message: "Orders data must not be empty!",
        });
      }

      const result = await models.Orders.update(order_data, {
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
          message: "Orders ID field must not be empty!",
        });
      }

      const species = await models.Orders.findOne({
        includes: [
          {
            models: models.ProductCategoryMaster,
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

      resolve(species);
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
          sequelize.where(
            sequelize.cast(sequelize.col("order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { "$CustomerMaster.customer_name$": { [Op.iLike]: `%${search}%` } },
          { "$ShippingMaster.shipping_source$": { [Op.iLike]: `%${search}%` } },
          {
            "$ShippingMaster.shipping_destination$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            "$OrderProducts.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const suppliers = await models.Orders.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_no",
          "created_at",
          "payment_terms",
          "payment_type",
          "shipping_date",
          "shipping_address",
          "shipping_method",
          "expected_delivery_date",
          "delivery_status",
          [
            sequelize.literal(
              `(SELECT SUM(total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`
            ),
            "total_products_price",
          ],
        ],
        include: [
          {
            attributes: [
              "id",
              "customer_name",
              "customer_country",
              "customer_email",
              "customer_phone",
            ],
            model: models.CustomerMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "shipping_source", "shipping_destination"],
            model: models.ShippingMaster,
            where: {
              is_active: true,
            },
            include: [
              {
                attributes: ["id", "carrier_name"],
                model: models.CarrierMaster,
                where: {
                  is_active: true,
                },
              },
            ],
          },
          {
            attributes: [
              "id",
              "unit",
              "price",
              "discount",
              "description",
              "delivery_status",
            ],
            model: models.OrderProducts,
            where: {
              is_active: true,
            },
            include: [
              {
                attributes: ["id"],
                model: models.Packing,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    attributes: ["id"],
                    as: "pd",
                    model: models.PeeledDispatches,
                    where: { is_active: true },
                    include: [
                      {
                        attributes: ["id"],
                        as: "pp",
                        model: models.PeelingProducts,
                        where: { is_active: true },
                        include: [
                          {
                            attributes: ["id", "product_name"],
                            model: models.ProductMaster,
                            where: { is_active: true },
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
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

export const GetOrderNumbers = ({
  customer_master_id,
  sales_payment_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!customer_master_id) {
        return reject({ message: "Customer master data must not be empty" });
      }

      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
        ];
      }

      const suppliers = await models.Orders.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_no",
          [
            sequelize.literal(
              `(SELECT SUM(op.total_price) FROM order_products op WHERE op.order_id = "Orders".id and op.is_active = true)`
            ),
            "total_amount",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(sp.total_paid) FROM sales_payments sp WHERE sp.order_id = "Orders".id AND sp.customer_master_id = '${customer_master_id}' 
              ${
                sales_payment_id != "null" &&
                sales_payment_id != undefined &&
                sales_payment_id != ""
                  ? "AND sp.id != '" + sales_payment_id + "'"
                  : ""
              } AND sp.is_active = true)`
            ),
            "total_paid",
          ],
        ],
        include: [
          {
            attributes: [],
            model: models.CustomerMaster,
            where: {
              is_active: true,
              id: customer_master_id,
            },
          },
        ],
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

export const Delete = ({ profile_id, id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Orders ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.Orders.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(species);
    } catch (err) {
      reject(err);
    }
  });
};
