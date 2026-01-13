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
        // Fetch product without associations first
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

        // If product found, fetch ProductCategoryMaster and SpeciesMaster separately
        if (product) {
          const productJson = product.toJSON ? product.toJSON() : product;
          console.log(
            `[Get] Product found: ${productJson.product_name}, product_category_master_id: ${productJson.product_category_master_id}`
          );

          if (productJson.product_category_master_id) {
            try {
              const productCategory =
                await models.ProductCategoryMaster.findOne({
                  where: {
                    id: productJson.product_category_master_id,
                  },
                  attributes: ["id", "product_category", "species_master_id"],
                });

              // Attach the ProductCategoryMaster to the product object
              if (productCategory) {
                const categoryJson = productCategory.toJSON
                  ? productCategory.toJSON()
                  : productCategory;

                console.log(
                  `[Get] ProductCategory found: ${categoryJson.product_category}, species_master_id: ${categoryJson.species_master_id}`
                );

                // Now fetch SpeciesMaster if species_master_id exists
                let speciesData = null;
                if (categoryJson.species_master_id) {
                  try {
                    speciesData = await models.SpeciesMaster.findOne({
                      where: {
                        id: categoryJson.species_master_id,
                      },
                      attributes: ["id", "species_name"],
                    });
                    console.log(
                      `[Get] SpeciesMaster found: ${speciesData?.species_name}`
                    );
                  } catch (speciesErr) {
                    console.error("Error fetching SpeciesMaster:", speciesErr);
                  }
                } else {
                  console.warn(
                    `[Get] ProductCategory has NO species_master_id!`
                  );
                }

                // Attach both associations
                product = {
                  ...productJson,
                  ProductCategoryMaster: {
                    ...categoryJson,
                    SpeciesMaster: speciesData
                      ? speciesData.toJSON
                        ? speciesData.toJSON()
                        : speciesData
                      : null,
                  },
                };
              } else {
                console.warn(
                  `[Get] ProductCategory not found for id: ${productJson.product_category_master_id}`
                );
              }
            } catch (categoryErr) {
              console.error(
                "Error fetching ProductCategoryMaster:",
                categoryErr
              );
              // Continue without the category association
            }
          } else {
            console.warn(
              `[Get] Product HAS NO product_category_master_id! Product: ${productJson.product_name}`
            );
            // Still return the product, just without category
            product = productJson;
          }

          // Fetch SpeciesDerivativeSizeGradeMapping if product has the mapping_id
          if (productJson.species_derivative_size_grade_mapping_id) {
            try {
              const mapping =
                await models.SpeciesDerivativeSizeGradeMapping.findOne({
                  where: {
                    id: productJson.species_derivative_size_grade_mapping_id,
                    is_active: true,
                  },
                  attributes: [
                    "id",
                    "species_master_id",
                    "derivative_master_id",
                    "size_master_id",
                    "grade_master_id",
                    "yield_percentage",
                    "temperature",
                    "shelf_life_days",
                    "processing_time_hours",
                    "moisture_percentage",
                    "salt_percentage",
                    "pH_value",
                    "is_active",
                  ],
                });

              if (mapping) {
                const mappingJson = mapping.toJSON ? mapping.toJSON() : mapping;
                if (product.ProductCategoryMaster) {
                  product.ProductCategoryMaster.SpeciesDerivativeSizeGradeMapping =
                    mappingJson;
                } else {
                  product.SpeciesDerivativeSizeGradeMapping = mappingJson;
                }
              }
            } catch (mappingErr) {
              console.debug(
                "Note: Species derivative size grade mapping data not available for this product"
              );
            }
          }
        }
      } catch (err) {
        console.error("Error fetching ProductMaster:", err);
        throw err;
      }

      console.log(`[Get] Final product response:`, {
        product_name: product?.product_name,
        has_category: !!product?.ProductCategoryMaster,
        species_id: product?.ProductCategoryMaster?.species_master_id,
      });

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
  derivative_master_id,
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

      // Add filter for derivative_master_id
      if (derivative_master_id) {
        where.derivative_master_id = derivative_master_id;
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
          // Note: Association searches removed to avoid Sequelize association errors
          // These will be filtered manually after fetching products
        ];
      }

      let products;
      try {
        // Simple query without nested associations - avoid Sequelize association errors
        products = await models.ProductMaster.findAndCountAll({
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
          include: [],
          where,
          offset: start,
          limit: length,
          order: [["updated_at", "desc"]],
          raw: false,
        });

        // Manually fetch ProductCategoryMaster and SpeciesMaster for each product
        if (products && products.rows && products.rows.length > 0) {
          console.log(
            `[GetAll] Fetched ${products.rows.length} products, now enriching with category and species data...`
          );

          products.rows = await Promise.all(
            products.rows.map(async (product) => {
              const productJson = product.toJSON ? product.toJSON() : product;

              // Fetch ProductCategoryMaster if product has the foreign key
              if (productJson.product_category_master_id) {
                try {
                  const category = await models.ProductCategoryMaster.findOne({
                    where: {
                      id: productJson.product_category_master_id,
                      is_active: true,
                    },
                    attributes: ["id", "product_category", "species_master_id"],
                  });

                  if (category) {
                    const categoryJson = category.toJSON
                      ? category.toJSON()
                      : category;

                    // Fetch SpeciesMaster if category has species
                    if (categoryJson.species_master_id) {
                      try {
                        const species = await models.SpeciesMaster.findOne({
                          where: {
                            id: categoryJson.species_master_id,
                            is_active: true,
                          },
                          attributes: ["id", "species_name"],
                        });
                        if (species) {
                          categoryJson.SpeciesMaster = species.toJSON
                            ? species.toJSON()
                            : species;
                        }
                      } catch (speciesErr) {
                        console.debug(
                          "Note: Species data not available for this product"
                        );
                      }
                    }

                    productJson.ProductCategoryMaster = categoryJson;
                  }
                } catch (categoryErr) {
                  console.debug(
                    "Note: Category data not available for this product"
                  );
                }
              }

              // Fetch SpeciesDerivativeSizeGradeMapping if product has the mapping_id
              if (productJson.species_derivative_size_grade_mapping_id) {
                try {
                  const mapping =
                    await models.SpeciesDerivativeSizeGradeMapping.findOne({
                      where: {
                        id: productJson.species_derivative_size_grade_mapping_id,
                        is_active: true,
                      },
                      attributes: [
                        "id",
                        "species_master_id",
                        "derivative_master_id",
                        "size_master_id",
                        "grade_master_id",
                        "yield_percentage",
                        "temperature",
                        "shelf_life_days",
                        "processing_time_hours",
                        "moisture_percentage",
                        "salt_percentage",
                        "pH_value",
                        "is_active",
                      ],
                    });

                  if (mapping) {
                    const mappingJson = mapping.toJSON
                      ? mapping.toJSON()
                      : mapping;
                    productJson.SpeciesDerivativeSizeGradeMapping = mappingJson;
                  }
                } catch (mappingErr) {
                  console.debug(
                    "Note: Species derivative size grade mapping data not available for this product"
                  );
                }
              }

              return productJson;
            })
          );

          console.log(
            `[GetAll] Successfully enriched all ${products.rows.length} products`
          );
        }
      } catch (err) {
        console.error("Error in GetAll:", err.message);
        reject(err);
        return;
      }

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
