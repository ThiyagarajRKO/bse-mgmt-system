import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, sales_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!sales_data) {
        return reject({
          statusCode: 420,
          message: "Sales data must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!sales_data.customer_master_id) {
        return reject({
          statusCode: 420,
          message: "Customer master id must not be empty!",
        });
      }

      const result = await models.Sales.create(sales_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Sales order already exists!",
        });
      }

      reject(err);
    }
  });
};

export const Update = async (profile_id, id, sales_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Sales id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!sales_data) {
        return reject({
          statusCode: 420,
          message: "Sales data must not be empty!",
        });
      }

      const result = await models.Sales.update(sales_data, {
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
          message: "Sales ID field must not be empty!",
        });
      }

      const species = await models.Sales.findOne({
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

      // if (search) {
      //   where[Op.or] = [
      //     { species_name: { [Op.iLike]: `%${search}%` } },
      //     { species_code: { [Op.iLike]: `%${search}%` } },
      //     { scientific_name: { [Op.iLike]: `%${search}%` } },
      //     { "$DivisionMaster.division_name$": { [Op.iLike]: `%${search}%` } },
      //   ];
      // }

      const vendors = await models.Sales.findAndCountAll({
        include: [
          {
            attributes: ["id", "customer_name"],
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
          message: "Sales ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.Sales.destroy({
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
