import { Op } from "sequelize";
import models from "../../models";

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
              model: models.OrdersProducts,
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
          { order_no: { [Op.iLike]: `%${search}%` } },
          { "$CustomerMaster.customer_name$": { [Op.iLike]: `%${search}%` } },
          { "$ShippingMaster.shipping_source$": { [Op.iLike]: `%${search}%` } },
          {
            "$ShippingMaster.shipping_destination$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            "$OrdersProducts.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const vendors = await models.Orders.findAndCountAll({
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
            required: false,
            attributes: [
              "id",
              "unit",
              "price",
              "discount",
              "description",
              "delivery_status",
            ],
            model: models.OrdersProducts,
            where: {
              is_active: true,
            },
            include: [
              {
                attributes: ["id", "product_name"],
                model: models.ProductMaster,
                where: {
                  is_active: true,
                },
              },
            ],
          },
        ],
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
