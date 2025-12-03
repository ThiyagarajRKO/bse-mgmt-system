import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, product_category_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!product_category_master_data?.species_master_id) {
        return reject({
          statusCode: 420,
          message: "Species master id must not be empty!",
        });
      }

      const result = await models.ProductCategoryMaster.create(
        product_category_master_data,
        {
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Product already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, product_category_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Product category master id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!product_category_master_data) {
        return reject({
          statusCode: 420,
          message: "Product data must not be empty!",
        });
      }

      const result = await models.ProductCategoryMaster.update(
        product_category_master_data,
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
          message: "Product ID field must not be empty!",
        });
      }

      const product = await models.ProductCategoryMaster.findOne({
        includes: [
          {
            models: models.SpeciesMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where: {
          is_active: true,
          id,
        },
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  product_category,
  species_master_name,
  parent_category_type,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (product_category) {
        where.product_category = { [Op.iLike]: `%${product_category}%` };
      }

      // Support filtering by parent_category_type from product_category_master directly
      if (parent_category_type) {
        where.parent_category_type = parent_category_type;
      }

      let speciesWhere = {
        is_active: true,
      };
      if (species_master_name) {
        speciesWhere.species_name = { [Op.iLike]: `%${species_master_name}%` };
      }

      // Set defaults if not provided
      const offset = start ? parseInt(start) : 0;
      const limit = length ? parseInt(length) : 1000; // Large default to get all results

      const products = await models.ProductCategoryMaster.findAndCountAll({
        include: [
          {
            model: models.SpeciesMaster,
            where: speciesWhere,
          },
        ],
        where,
        offset: offset,
        limit: limit,
        order: [["created_at", "desc"]],
      });

      resolve(products);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Product ID field must not be empty!",
        });
      }

      const product = await models.ProductCategoryMaster.count({
        where: {
          is_active: true,
          id,
        },
      });

      resolve(product);
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
          message: "Product ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const product = await models.ProductCategoryMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};
