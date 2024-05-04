import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (
  profile_id,
  price_list_master_data,
  is_product_included
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!price_list_master_data) {
        return reject({
          statusCode: 420,
          message: "Price List data must not be empty!",
        });
      }

      if (!price_list_master_data?.price_list_name) {
        return reject({
          statusCode: 420,
          message: "Price list name must not be empty!",
        });
      }

      let options = {};
      if (is_product_included) {
        options = {
          include: [
            {
              profile_id,
              model: models.PriceListProductMaster,
            },
          ],
        };
      }

      const result = await models.PriceListMaster.create(
        price_list_master_data,
        {
          profile_id,
          ...options,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Price List already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, price_list_master_data) => {
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

      if (!price_list_master_data) {
        return reject({
          statusCode: 420,
          message: "Price list data must not be empty!",
        });
      }

      const result = await models.PriceListMaster.update(
        price_list_master_data,
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
          message: "Price List Master ID field must not be empty!",
        });
      }

      const price_list = await models.PriceListMaster.findOne({
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

export const GetAll = ({ start, length, price_list_name, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (price_list_name) {
        where.price_list_name = { [Op.iLike]: `%${price_list_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { price_list_name: { [Op.iLike]: `%${search}%` } },
          { currency: { [Op.iLike]: `%${search}%` } },
          {
            "$PriceListProductMasters.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const price_lists = await models.PriceListMaster.findAndCountAll({
        attributes: ["id", "price_list_name", "currency", "created_at"],
        include: [
          {
            required: false,
            attributes: ["id", "price_value", "created_at"],
            model: models.PriceListProductMaster,
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

      const price_list = await models.PriceListMaster.destroy({
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

export const CheckName = ({ price_list_name }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!price_list_name) {
        return reject({
          statusCode: 420,
          message: "Price List Master name field must not be empty!",
        });
      }

      const price_list = await models.PriceListMaster.findOne({
        attributes: ["id"],
        where: {
          is_active: true,
          [Op.and]: [
            sequelize.where(
              sequelize.fn("LOWER", sequelize.col("price_list_name")),
              {
                [Op.eq]: price_list_name.toLowerCase(),
              }
            ),
          ],
        },
      });

      resolve(price_list);
    } catch (err) {
      reject(err);
    }
  });
};
