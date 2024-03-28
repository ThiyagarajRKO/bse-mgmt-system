import { Op } from "sequelize";
import models from "../../models";

export const Insert = async (profile_id, product_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!product_master_data?.species_master_id) {
        return reject({
          statusCode: 420,
          message: "Species master id must not be empty!",
        });
      }

      if (!product_master_data?.product_name) {
        return reject({
          statusCode: 420,
          message: "Product name must not be empty!",
        });
      }

      if (product_master_data?.size_master_ids?.length <= 0) {
        return reject({
          statusCode: 420,
          message: "Product size master ids must not be empty!",
        });
      }

      const result = await models.ProductMaster.create(product_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Product already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, product_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Product id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!product_master_data) {
        return reject({
          statusCode: 420,
          message: "Product data must not be empty!",
        });
      }

      const result = await models.ProductMaster.update(product_master_data, {
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
          message: "Product ID field must not be empty!",
        });
      }

      const product = await models.ProductMaster.findOne({
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
  product_short_code,
  product_name,
  species_master_name,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (product_short_code) {
        where.product_code = { [Op.iLike]: `%${product_code}%` };
      }

      if (product_name) {
        where.product_name = { [Op.iLike]: `%${product_name}%` };
      }

      let speciesWhere = {
        is_active: true,
      };

      if (species_master_name) {
        speciesWhere.species_name = { [Op.iLike]: `%${species_master_name}%` };
      }

      if (search) {
        where[Op.or] = [
          { product_name: { [Op.iLike]: `%${search}%` } },
          { product_short_code: { [Op.iLike]: `%${search}%` } },
          { product_code: { [Op.iLike]: `%${search}%` } },
          { size_master_sizes: { [Op.iLike]: `%${search}%` } },
        ];

        // speciesWhere.species_name = { [Op.iLike]: `%${search}%` };
      }

      const products = await models.ProductMaster.findAndCountAll({
        include: [
          {
            model: models.SpeciesMaster,
            where: speciesWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(products);
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

      const product = await models.ProductMaster.destroy({
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
