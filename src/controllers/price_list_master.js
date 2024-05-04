import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, price_list_master_data) => {
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

      const result = await models.PriceListMaster.create(
        price_list_master_data,
        {
          profile_id,
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
          message: "Customer id must not be empty!",
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
          message: "Customer data must not be empty!",
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

      const customer = await models.PriceListMaster.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(customer);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length, customer_name, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (customer_name) {
        where.customer_name = { [Op.iLike]: `%${customer_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { price_list_name: { [Op.iLike]: `%${search}%` } },
          { currency: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("price_value"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
        ];
      }

      const customers = await models.PriceListMaster.findAndCountAll({
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(customers);
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
