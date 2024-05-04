import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, price_list_product_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!price_list_product_master_data) {
        return reject({
          statusCode: 420,
          message: "Price List data must not be empty!",
        });
      }

      if (!price_list_product_master_data?.price_list_master_id) {
        return reject({
          statusCode: 420,
          message: "Price list data must not be empty!",
        });
      }

      if (!price_list_product_master_data?.product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product master data must not be empty!",
        });
      }

      const result = await models.PriceListProductMaster.create(
        price_list_product_master_data,
        {
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Price List Product already exists!",
        });
      }
      reject(err);
    }
  });
};

export const BulkUpsert = async (
  profile_id,
  price_list_product_master_data
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const result = await models.PriceListProductMaster.bulkCreate(
        price_list_product_master_data,
        {
          updateOnDuplicate: [
            "price_list_master_id",
            "product_master_id",
            "price_value",
          ],
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Price list product data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (
  profile_id,
  id,
  price_list_product_master_data
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Price List id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!price_list_product_master_data) {
        return reject({
          statusCode: 420,
          message: "Price list data must not be empty!",
        });
      }

      const result = await models.PriceListProductMaster.update(
        price_list_product_master_data,
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
          message: "Price List Product Master ID field must not be empty!",
        });
      }

      const price_list = await models.PriceListProductMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(price_list);
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
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("price_value"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
        ];
      }

      const price_lists = await models.PriceListProductMaster.findAndCountAll({
        attributes: [
          "id",
          "price_list_master_id",
          "price_value",
          "product_master_id",
          "created_at",
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

      resolve(price_lists);
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
          message: "Price List ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const price_list = await models.PriceListProductMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(price_list);
    } catch (err) {
      reject(err);
    }
  });
};
