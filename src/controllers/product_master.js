import { Op } from "sequelize";
import models, { Sequelize, sequelize } from "../../models";

export const Insert = async (profile_id, product_master_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!product_master_data?.product_category_master_id) {
        return reject({
          statusCode: 420,
          message: "Product category master id must not be empty!",
        });
      }

      const result = await models.ProductMaster.create(product_master_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Product already exists!",
        });
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
          message: "Product master data must not be empty!",
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
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Product already exists!",
        });
      }
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

      let product;
      try {
        // Fetch product with ProductCategoryMaster association for species information
        product = await models.ProductMaster.findOne({
          where: {
            is_active: true,
            id,
          },
          attributes: [
            "id",
            "product_name",
            "hsn_code",
            "processing_state",
            "product_role",
            "is_raw",
            "is_producible",
            "is_sellable",
            "product_category_master_id",
            "size_master_id",
            "grade_master_id",
            "derivative_master_id",
            "species_derivative_size_grade_mapping_id",
            "is_active",
            "created_at",
            "updated_at",
          ],
          include: [
            {
              model: models.ProductCategoryMaster,
              attributes: ["id", "category_name", "species_master_id"],
              required: false,
            },
          ],
        });
      } catch (err) {
        console.error("Error fetching ProductMaster with associations:", err);
        // Fallback to simple fetch without associations if association fails
        try {
          product = await models.ProductMaster.findOne({
            where: {
              is_active: true,
              id,
            },
            attributes: [
              "id",
              "product_name",
              "hsn_code",
              "processing_state",
              "product_role",
              "is_raw",
              "is_producible",
              "is_sellable",
              "product_category_master_id",
              "size_master_id",
              "grade_master_id",
              "derivative_master_id",
              "species_derivative_size_grade_mapping_id",
              "is_active",
              "created_at",
              "updated_at",
            ],
          });
        } catch (fallbackErr) {
          console.error("Error in fallback fetch:", fallbackErr);
          throw fallbackErr;
        }
      }

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  product_category_master_id,
  species_id,
  product_name,
  species_master_name,
  product_category_name,
  product_size,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (product_name) {
        where.product_name = { [Op.iLike]: `%${product_name}%` };
      }

      let speciesWhere = {
        is_active: true,
      };

      if (species_master_name) {
        speciesWhere.species_name = { [Op.iLike]: `%${species_master_name}%` };
      }

      if (species_id) {
        speciesWhere.id = species_id;
      }

      let productCategoryWhere = {
        is_active: true,
      };

      if (product_category_name) {
        productCategoryWhere.product_category = {
          [Op.iLike]: `%${product_category_name}%`,
        };
      }

      if (product_category_master_id) {
        productCategoryWhere.id = product_category_master_id;
      }

      let sizeWhere = {
        is_active: true,
      };

      if (product_size) {
        sizeWhere.size = {
          [Op.iLike]: `%${product_size}%`,
        };
      }

      if (search) {
        where[Op.or] = [
          { product_name: { [Op.iLike]: `%${search}%` } },
          {
            "$SizeMaster.size$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            "$ProductCategoryMaster.product_category$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          {
            "$ProductCategoryMaster.SpeciesMaster.species_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const products = await models.ProductMaster.findAndCountAll({
        include: [
          {
            model: models.ProductCategoryMaster,
            required: species_id ? true : false,
            include: [
              {
                model: models.SpeciesMaster,
                required: species_id ? true : false,
                where: species_id ? speciesWhere : undefined,
              },
            ],
            where: product_category_master_id
              ? productCategoryWhere
              : undefined,
          },
          {
            required: false,
            model: models.GradeMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.SizeMaster,
            where: sizeWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["updated_at", "desc"]],
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

export const Count = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Location ID field must not be empty!",
        });
      }

      const product = await models.ProductMaster.count({
        where: {
          id,
          is_active: true,
        },
        raw: true,
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};
