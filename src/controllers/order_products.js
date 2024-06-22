import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const BulkUpsert = async (profile_id, order_products_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const result = await models.OrderProducts.bulkCreate(
        order_products_data,
        {
          updateOnDuplicate: [
            "product_master_id",
            "unit",
            "price",
            "discount",
            "description",
            "delivery_status",
          ],
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ order_id, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (order_id) {
        where.order_id = order_id;
      }

      if (search) {
        where[Op.or] = [
          {
            "$Packing.pd.pp.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const suppliers = await models.OrderProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_id",
          "unit",
          "price",
          "total_price",
          "discount",
          "description",
          "delivery_status",
        ],
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

export const GetPaymentItems = ({
  sales_payment_id,
  customer_master_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentWhere = {
        is_active: true,
      };

      if (sales_payment_id) {
        paymentWhere.id = sales_payment_id;
      }

      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("Order.order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$Packing.pd.pp.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const procurements = await models.OrderProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "unit",
          "discount",
          "price",
          "total_price",
          "description",
          "created_at",
        ],
        include: [
          {
            attributes: ["id"],
            model: models.Orders,
            include: [
              {
                attributes: ["id"],
                model: models.SalesPayments,
                where: paymentWhere,
              },
            ],
            where: {
              is_active: true,
              customer_master_id,
            },
          },
          {
            attributes: ["id"],
            model: models.Packing,
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pd",
                attributes: ["id"],
                model: models.PeeledDispatches,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "pp",
                    attributes: ["id"],
                    model: models.PeelingProducts,
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
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [[sequelize.col(`"OrderProducts".created_at`), "desc"]],
      });

      resolve(procurements);
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
          message: "Order Product ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.OrderProducts.destroy({
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

export const DeleteByOrderId = ({ profile_id, order_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        return reject({
          statusCode: 420,
          message: "Order Id field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.OrderProducts.destroy({
        where: {
          order_id,
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
