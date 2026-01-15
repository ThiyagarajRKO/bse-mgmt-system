import { Op } from "sequelize";
import models, { sequelize } from "../../models";

// UUID regex pattern for validation
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validate UUID format using regex pattern
 */
const isValidUuid = (id) => {
  return typeof id === "string" && UUID_PATTERN.test(id);
};

export const BulkUpsert = async (profile_id, order_products_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const result = await models.OrderProducts.bulkCreate(
        order_products_data,
        {
          updateOnDuplicate: [
            "product_master_id",
            "quantity",
            "price",
            "discount",
            "description",
            "delivery_status",
          ],
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ order_id, start, length, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (order_id) {
        // Validate order_id is a valid UUID
        if (!isValidUuid(order_id)) {
          return reject({
            statusCode: 422,
            message: "Invalid Order ID format. Expected valid UUID.",
          });
        }
        where.order_id = order_id;
      }

      // Query order products with product details
      const suppliers = await models.OrderProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "order_id",
          "product_master_id",
          "packing_id",
          "quantity",
          "price",
          "total_price",
          "discount",
          "description",
          "delivery_status",
        ],
        include: [
          {
            attributes: ["id", "product_name", "product_category_master_id"],
            as: "ProductMaster",
            model: models.ProductMaster,
            required: false,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      // Add species_id to each order product by joining with ProductCategoryMaster
      if (suppliers.rows && suppliers.rows.length > 0) {
        for (let i = 0; i < suppliers.rows.length; i++) {
          let row = suppliers.rows[i];
          // Convert Sequelize instance to plain object to allow property assignment
          const rowData = row.toJSON ? row.toJSON() : row;

          if (
            rowData.ProductMaster &&
            rowData.ProductMaster.product_category_master_id
          ) {
            const category = await models.ProductCategoryMaster.findOne({
              attributes: ["species_master_id"],
              where: { id: rowData.ProductMaster.product_category_master_id },
            });
            if (category) {
              // Add species_id to the response
              rowData.species_id = category.species_master_id;
              suppliers.rows[i] = rowData;
            }
          }
        }
      }

      resolve(suppliers);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get matching raw materials for an ordered product based on species_id
 * This helps fulfill orders with raw materials of the same species
 */
export const GetMatchingRawMaterials = ({
  order_product_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Validate order_product_id is provided
      if (!order_product_id) {
        return reject({
          statusCode: 422,
          message: "Order Product ID is required",
        });
      }

      // First, get the order product and its species_id
      const orderProduct = await models.OrderProducts.findOne({
        where: { id: order_product_id, is_active: true },
        attributes: [
          "id",
          "order_id",
          "product_master_id",
          "quantity",
          "price",
          "total_price",
        ],
        include: [
          {
            attributes: ["id", "product_name", "product_category_master_id"],
            model: models.ProductMaster,
            required: false,
          },
        ],
      });

      if (!orderProduct) {
        return reject({
          statusCode: 404,
          message: "Order product not found",
        });
      }

      // Get the species_id from ProductCategoryMaster
      let species_id = null;
      if (
        orderProduct.ProductMaster &&
        orderProduct.ProductMaster.product_category_master_id
      ) {
        const category = await models.ProductCategoryMaster.findOne({
          attributes: ["species_master_id"],
          where: { id: orderProduct.ProductMaster.product_category_master_id },
        });
        if (category) {
          species_id = category.species_master_id;
        }
      }

      if (!species_id) {
        return reject({
          statusCode: 422,
          message: "Unable to determine species for this ordered product",
        });
      }

      console.log(
        `[GetMatchingRawMaterials] Order Product Species ID: ${species_id}`
      );

      // Now fetch all raw materials and filter by species
      let where = {
        is_active: true,
      };

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

      // Query all raw materials (without pagination) to filter by species first
      const purchaseInventories =
        await models.PurchaseInventory.findAndCountAll({
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
          // NO PAGINATION HERE - will apply after filtering by species
          order: [["created_at", "desc"]],
          raw: false,
          subQuery: false,
        });

      // Enrich rows with category and species data
      const enrichedRows = await Promise.all(
        purchaseInventories.rows.map(async (row) => {
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
                plainRow.species_id = category.species_master_id;
                console.log(
                  `[GetMatchingRawMaterials] Raw Material: ${plainRow.ProductMaster?.product_name}, Species ID: ${plainRow.species_id}`
                );
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
        })
      );

      // Filter to only include raw materials with matching species_id
      const matchingRawMaterials = enrichedRows.filter(
        (row) => row.species_id === species_id
      );

      console.log(
        `[GetMatchingRawMaterials] Total raw materials: ${enrichedRows.length}, Matching species: ${matchingRawMaterials.length}`
      );

      // Apply pagination AFTER filtering by species
      const paginatedResults = matchingRawMaterials.slice(
        start || 0,
        (start || 0) + (length || 10)
      );

      resolve({
        orderProduct: {
          id: orderProduct.id,
          product_name: orderProduct.ProductMaster?.product_name,
          species_id: species_id,
        },
        rawMaterials: paginatedResults,
        count: matchingRawMaterials.length,
        totalAvailable: purchaseInventories.count,
        filteredCount: matchingRawMaterials.length,
        message: `Found ${
          matchingRawMaterials.length
        } matching raw materials for this ordered product (${matchingRawMaterials.reduce(
          (sum, r) => sum + (r.quantity || 0),
          0
        )} units total)`,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPaymentItems = ({
  sales_payment_id,
  customer_master_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let paymentWhere = {
        is_active: true,
      };

      if (sales_payment_id) {
        paymentWhere.id = sales_payment_id;
      }

      let where = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("Order.order_no"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$Packing.pd.pp.ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
        ];
      }

      const procurements = await models.OrderProducts.findAndCountAll({
        subQuery: false,
        attributes: [
          "id",
          "quantity",
          "discount",
          "price",
          "total_price",
          "description",
          "created_at",
        ],
        include: [
          {
            attributes: ["id"],
            model: models.Orders,
            include: [
              {
                attributes: ["id"],
                model: models.SalesPayments,
                where: paymentWhere,
              },
            ],
            where: {
              is_active: true,
              customer_master_id,
            },
          },
          {
            attributes: ["id"],
            model: models.Packing,
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pd",
                attributes: ["id"],
                model: models.PeeledDispatches,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "pp",
                    attributes: ["id"],
                    model: models.PeelingProducts,
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
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [[sequelize.col(`"OrderProducts".created_at`), "desc"]],
      });

      resolve(procurements);
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
          message: "Order Product ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.OrderProducts.destroy({
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

export const DeleteByOrderId = ({ profile_id, order_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!order_id) {
        return reject({
          statusCode: 420,
          message: "Order Id field must not be empty!",
        });
      }

      // Validate order_id is a valid UUID
      if (!isValidUuid(order_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Order ID format. Expected valid UUID.",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const species = await models.OrderProducts.destroy({
        where: {
          order_id,
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
