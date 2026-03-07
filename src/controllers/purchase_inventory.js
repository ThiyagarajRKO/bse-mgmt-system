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
  finished_product_id,
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
      let bomRawMaterialIds = null;

      // If finished_product_id is provided, get BOM raw materials for filtering
      if (finished_product_id) {
        try {
          const bomEntries = await models.BillOfMaterials.findAll({
            where: { product_master_id: finished_product_id, is_active: true },
            include: [
              {
                model: models.ProcurementProducts,
                as: "ProcurementProduct",
                attributes: ["product_master_id"],
                required: false,
              },
            ],
          });

          // Extract unique raw material product IDs from BOM
          const rawMaterialIds = [
            ...new Set(
              bomEntries
                .map((entry) => entry.ProcurementProduct?.product_master_id)
                .filter((id) => id), // Remove null/undefined
            ),
          ];

          if (rawMaterialIds.length > 0) {
            bomRawMaterialIds = rawMaterialIds;
            console.log(
              `📋 Filtering purchase inventory by BOM raw materials for product ${finished_product_id}:`,
              rawMaterialIds,
            );
          } else {
            console.log(
              `⚠️ No BOM entries found for product ${finished_product_id}, falling back to species filtering`,
            );

            // Fall back to species filtering when BOM is not available
            const finishedProduct = await models.ProductMaster.findOne({
              where: { id: finished_product_id },
              attributes: [
                "id",
                "product_category_master_id",
                "species_master_id",
              ],
            });

            // Try direct species_master_id first
            if (finishedProduct?.species_master_id) {
              targetSpeciesId = finishedProduct.species_master_id;
              console.log(
                `📋 Falling back to species filtering for species ${targetSpeciesId} (from ProductMaster.species_master_id)`,
              );
            }
            // Otherwise, try to get it from product category
            else if (finishedProduct?.product_category_master_id) {
              const category = await models.ProductCategoryMaster.findOne({
                where: { id: finishedProduct.product_category_master_id },
                attributes: ["id", "species_master_id"],
              });

              if (category?.species_master_id) {
                targetSpeciesId = category.species_master_id;
                console.log(
                  `📋 Falling back to species filtering for species ${targetSpeciesId} (from ProductCategoryMaster.species_master_id)`,
                );
              }
            }
          }
        } catch (err) {
          console.warn("Error fetching BOM for finished product:", err.message);
        }
      }

      // If procurement_product_id is provided, get its species for filtering
      if (procurement_product_id) {
        try {
          const procProduct = await models.ProcurementProducts.findOne({
            where: { id: procurement_product_id },
            attributes: ["id", "product_master_id"],
          });

          if (procProduct?.product_master_id) {
            // Fetch the product master with species info
            const productMaster = await models.ProductMaster.findOne({
              where: { id: procProduct.product_master_id },
              attributes: [
                "id",
                "product_category_master_id",
                "species_master_id",
              ],
            });

            // Try direct species_master_id first
            if (productMaster?.species_master_id) {
              targetSpeciesId = productMaster.species_master_id;
            }
            // Otherwise try product category
            else if (productMaster?.product_category_master_id) {
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
          "available_stock",
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
              "species_master_id",
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

          // First, try to get species_id directly from ProductMaster
          if (plainRow.ProductMaster?.species_master_id) {
            plainRow.species_id = plainRow.ProductMaster.species_master_id;
          }

          // If not found on ProductMaster, try ProductCategoryMaster
          if (
            !plainRow.species_id &&
            plainRow.ProductMaster?.product_category_master_id
          ) {
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

      // Filter results based on available criteria
      let filteredRows = enrichedRows;

      // Priority 1: Filter by BOM raw materials if available
      if (bomRawMaterialIds && bomRawMaterialIds.length > 0) {
        filteredRows = enrichedRows.filter(
          (row) =>
            row.ProductMaster?.id &&
            bomRawMaterialIds.includes(row.ProductMaster.id),
        );
        console.log(
          `📋 Filtered ${filteredRows.length} raw materials from BOM out of ${enrichedRows.length} total`,
        );
      }
      // Priority 2: Filter by species if BOM filtering not applied and species is available
      else if (targetSpeciesId) {
        filteredRows = enrichedRows.filter(
          (row) => row.species_id === targetSpeciesId,
        );
        console.log(
          `📋 Filtered ${filteredRows.length} raw materials by species ${targetSpeciesId} out of ${enrichedRows.length} total`,
        );
      }
      // Priority 3: If finished_product_id was provided but no BOM or species filtering worked, show empty
      else if (finished_product_id) {
        console.warn(
          `⚠️  Could not filter raw materials for product ${finished_product_id} - no BOM entries and species not found. Returning empty list.`,
        );
        filteredRows = [];
      }
      // If NO filtering criteria provided at all, return all materials (this maintains backward compatibility)
      else {
        console.log(
          `📋 No filtering criteria provided - returning all ${enrichedRows.length} raw materials`,
        );
        // filteredRows already set to enrichedRows
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
          "available_stock",
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
