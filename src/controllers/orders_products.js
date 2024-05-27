import { Op } from "sequelize";
import models from "../../models";

export const BulkUpsert = async (profile_id, order_products_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const result = await models.OrdersProducts.bulkCreate(
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
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const vendors = await models.OrdersProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "unit",
          "price",
          "discount",
          "description",
          "delivery_status",
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
          message: "Order Product ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.OrdersProducts.destroy({
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
