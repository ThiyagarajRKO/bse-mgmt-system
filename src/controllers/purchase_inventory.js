import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Inventory ID field must not be empty!",
        });
      }

      const inventory = await models.PurchaseInventory.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(inventory);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  start,
  length,
  search,
  procurement_product_id,
  procurement_product_type,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      // Add procurement_product_type filter if provided
      if (procurement_product_type) {
        where.procurement_product_type = procurement_product_type;
      }

      let targetSpeciesId = null;

      // If procurement_product_id is provided, get its species for filtering
      if (procurement_product_id) {
        try {
          const procProduct = await models.ProcurementProducts.findOne({
            where: { id: procurement_product_id },
            attributes: ["id", "product_master_id"],
          });

          if (procProduct?.product_master_id) {
            // Fetch the product master
            const productMaster = await models.ProductMaster.findOne({
              where: { id: procProduct.product_master_id },
              attributes: ["id", "product_category_master_id"],
            });

            if (productMaster?.product_category_master_id) {
              // Fetch the category to get species_master_id
              const category = await models.ProductCategoryMaster.findOne({
                where: { id: productMaster.product_category_master_id },
                attributes: ["id", "species_master_id"],
              });

              if (category?.species_master_id) {
                targetSpeciesId = category.species_master_id;
              }
            }
          }
        } catch (err) {
          console.warn(
            "Error fetching procurement product species:",
            err.message,
          );
        }
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(
              sequelize.col("PurchaseInventory.procurement_product_type"),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      // Query ALL raw materials WITHOUT pagination initially (will paginate AFTER filtering by species)
      const inventories = await models.PurchaseInventory.findAndCountAll({
        attributes: [
          "id",
          "procurement_product_id",
          "procurement_product_type",
          "quantity",
        ],
        include: [
          {
            attributes: ["id"],
            model: models.ProcurementProducts,
            required: false,
          },
          {
            attributes: [
              "id",
              "product_name",
              "product_category_master_id",
              "size_master_id",
            ],
            as: "ProductMaster",
            model: models.ProductMaster,
            required: false,
          },
        ],
        where,
        order: [["created_at", "desc"]],
        raw: false,
        subQuery: false,
        // NO offset/limit here - will apply after filtering by species
      });

      // Fetch category and species data separately to avoid association issues
      const enrichedRows = await Promise.all(
        inventories.rows.map(async (row) => {
          const plainRow = row.get ? row.get({ plain: true }) : row;

          if (plainRow.ProductMaster?.product_category_master_id) {
            try {
              const category = await models.ProductCategoryMaster.findOne({
                where: {
                  id: plainRow.ProductMaster.product_category_master_id,
                },
                attributes: ["id", "product_category", "species_master_id"],
                include: [
                  {
                    model: models.SpeciesMaster,
                    attributes: ["id", "species_name"],
                    required: false,
                  },
                ],
              });
              if (category) {
                plainRow.ProductMaster.ProductCategoryMaster = category.get
                  ? category.get({ plain: true })
                  : category;
                // Store species_id for filtering
                plainRow.species_id = category.species_master_id;
              }
            } catch (err) {
              console.warn("Error fetching category:", err.message);
            }
          }

          if (plainRow.ProductMaster?.size_master_id) {
            try {
              const size = await models.SizeMaster.findOne({
                where: { id: plainRow.ProductMaster.size_master_id },
                attributes: ["id", "size"],
              });
              if (size) {
                plainRow.ProductMaster.SizeMaster = size.get
                  ? size.get({ plain: true })
                  : size;
              }
            } catch (err) {
              console.warn("Error fetching size:", err.message);
            }
          }

          return plainRow;
        }),
      );

      // Filter by species if a target species was identified
      let filteredRows = enrichedRows;
      if (targetSpeciesId) {
        filteredRows = enrichedRows.filter(
          (row) => row.species_id === targetSpeciesId,
        );
      }

      // Apply pagination AFTER filtering by species
      const paginatedResults = filteredRows.slice(
        start || 0,
        (start || 0) + (length || 10),
      );

      resolve({
        rows: paginatedResults,
        count: filteredRows.length,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get raw materials (purchase inventory) filtered by species_id of ordered product
 * This ensures raw materials match the species of ordered/processed products
 */
export const GetBySpecies = ({ species_id, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate species_id is provided
      if (!species_id) {
        return reject({
          statusCode: 422,
          message: "Species ID is required to filter raw materials",
        });
      }

      let where = {
        is_active: true,
        // Only show UNPROCESSED raw materials, exclude processed products
        procurement_product_type: "UNPROCESSED",
      };

      // Optional search filter
      if (search) {
        where[Op.or] = [
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
          {
            "$ProductMaster.ProductCategoryMaster.product_category$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      // Query raw materials and filter by species in the ProductCategoryMaster
      const inventories = await models.PurchaseInventory.findAndCountAll({
        attributes: [
          "id",
          "procurement_product_id",
          "procurement_product_type",
          "quantity",
        ],
        include: [
          {
            attributes: ["id"],
            model: models.ProcurementProducts,
            required: false,
          },
          {
            attributes: [
              "id",
              "product_name",
              "product_category_master_id",
              "size_master_id",
            ],
            as: "ProductMaster",
            model: models.ProductMaster,
            required: false,
          },
        ],
        where,
        offset: start || 0,
        limit: length || 10,
        order: [["created_at", "desc"]],
        raw: false,
        subQuery: false,
      });

      // Enrich rows with category and species data, filtering by matching species_id
      const enrichedRows = await Promise.all(
        inventories.rows.map(async (row) => {
          const plainRow = row.get ? row.get({ plain: true }) : row;

          if (plainRow.ProductMaster?.product_category_master_id) {
            try {
              const category = await models.ProductCategoryMaster.findOne({
                where: {
                  id: plainRow.ProductMaster.product_category_master_id,
                },
                attributes: ["id", "product_category", "species_master_id"],
                include: [
                  {
                    model: models.SpeciesMaster,
                    attributes: ["id", "species_name"],
                    required: false,
                  },
                ],
              });
              if (category) {
                plainRow.ProductMaster.ProductCategoryMaster = category.get
                  ? category.get({ plain: true })
                  : category;
                // Add species_id at top level for easier access
                plainRow.species_id = category.species_master_id;
              }
            } catch (err) {
              console.warn("Error fetching category:", err.message);
            }
          }

          if (plainRow.ProductMaster?.size_master_id) {
            try {
              const size = await models.SizeMaster.findOne({
                where: { id: plainRow.ProductMaster.size_master_id },
                attributes: ["id", "size"],
              });
              if (size) {
                plainRow.ProductMaster.SizeMaster = size.get
                  ? size.get({ plain: true })
                  : size;
              }
            } catch (err) {
              console.warn("Error fetching size:", err.message);
            }
          }

          return plainRow;
        }),
      );

      // Filter results to only include materials matching the specified species_id
      // Removed the "raw" name requirement since procurement_product_type: "UNPROCESSED" already identifies raw materials
      const filteredRows = enrichedRows.filter((row) => {
        // Check species match
        const speciesMatch = row.species_id === species_id;

        return speciesMatch;
      });

      resolve({
        rows: filteredRows,
        count: filteredRows.length,
        species_id: species_id,
        message: `Found ${filteredRows.length} unprocessed raw materials matching species ${species_id}`,
      });
    } catch (err) {
      reject(err);
    }
  });
};
