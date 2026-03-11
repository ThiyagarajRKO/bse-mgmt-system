/**
 * Shared Query Builders for Product/Dispatch/Peeling workflows
 * Consolidates duplicate Sequelize include patterns
 */

import { Op } from "sequelize";

/**
 * Build the product-dispatch chain include for queries
 * Used in: peeled_dispatches, dispatches, peeling_products for product listings
 * @returns {Array} Sequelize include array
 */
export const buildProductDispatchChain = () => {
  return [
    {
      as: "pp",
      model: null, // Will be injected by caller
      attributes: ["id"],
      where: { is_active: true },
      include: [
        {
          as: "pln",
          model: null, // Will be injected
          attributes: ["id"],
          where: { is_active: true },
          include: [
            {
              as: "dis",
              model: null, // Will be injected
              attributes: ["id"],
              where: { is_active: true },
              include: [
                {
                  as: "pp",
                  model: null, // Will be injected
                  attributes: ["id"],
                  where: { is_active: true },
                  include: [
                    {
                      as: "pl",
                      model: null, // Will be injected
                      attributes: ["id"],
                      where: { is_active: true },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          model: null, // ProductMaster
          attributes: ["id", "product_name"],
          where: { is_active: true },
        },
      ],
    },
  ];
};

/**
 * Build product names query with pagination and search
 * Consolidates GetProductNames logic from multiple controllers
 * @param {Object} models - Sequelize models
 * @param {String} modelType - 'peeledDispatches', 'peeling_products', or 'dispatches'
 * @param {Object} options - { procurement_lot_id, packing_id, peeling_id, unit_master_id, start, length, search }
 * @returns {Promise} Query result with product listings
 */
export const getProductNamesQuery = async (models, modelType, options = {}) => {
  const {
    start = 0,
    length = 10,
    search,
    procurement_lot_id,
    packing_id,
  } = options;

  // Ensure pagination values are numeric (clients sometimes send them as strings)
  const startNum = Number.isFinite(Number(start)) ? Number(start) : 0;
  const lengthNum = Number.isFinite(Number(length)) ? Number(length) : 10;

  let where = { is_active: true };
  let procurementLotsWhere = { is_active: true };

  if (procurement_lot_id) {
    procurementLotsWhere.id = procurement_lot_id;
  }

  if (search) {
    where[Op.or] = [
      { "$pp->ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
      { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
    ];
  }

  const queryOptions = {
    subQuery: false,
    attributes: ["id", "created_at"],
    where,
    offset: startNum,
    limit: lengthNum,
    order: [["created_at", "desc"]],
  };

  // Model-specific configurations
  const modelConfigs = {
    peeledDispatches: {
      model: models.PeeledDispatches,
      attributes: ["id", "created_at", "peeled_dispatch_quantity"],
      quantityField: "peeled_dispatch_quantity",
      packingQuantitySQL: `
        (SELECT
          CASE
            WHEN SUM(packing_quantity) IS NULL THEN 0
            ELSE SUM(packing_quantity)
          END
        FROM "packing"
        WHERE
          peeled_dispatch_id = "PeeledDispatches"."id" AND
          ${packing_id != "null" && packing_id != undefined ? `id != '${packing_id}' AND` : ""}
          is_active = true
        )
      `,
    },
    peeling_products: {
      model: models.PeelingProducts,
      attributes: ["id", "created_at", "yield_quantity"],
      quantityField: "yield_quantity",
      packingQuantitySQL: `
        (SELECT CASE WHEN SUM(peeled_dispatch_quantity) IS NULL THEN 0 ELSE SUM(peeled_dispatch_quantity) END
         FROM peeled_dispatches pd 
         WHERE pd.peeled_product_id = "PeelingProducts".id 
         ${packing_id != "null" && packing_id != undefined ? `AND pd.id != '${packing_id}'` : ""}
         AND pd.is_active = true)
      `,
    },
    dispatches: {
      model: models.Dispatches,
      attributes: ["id", "created_at", "dispatch_quantity"],
      quantityField: "dispatch_quantity",
      packingQuantitySQL: `
        (SELECT CASE WHEN SUM(peeling_quantity) IS NULL THEN 0 ELSE SUM(peeling_quantity) END
         FROM peeling WHERE dispatch_id = "Dispatches".id AND is_active = true)
      `,
    },
  };

  const config = modelConfigs[modelType];
  if (!config) {
    throw new Error(`Invalid modelType: ${modelType}`);
  }

  const sequelize = models.sequelize;
  const { literal } = sequelize;

  queryOptions.model = config.model;
  queryOptions.attributes = [
    ...config.attributes,
    [
      literal(config.packingQuantitySQL),
      config.quantityField === "peeled_dispatch_quantity"
        ? "packed_quantity"
        : config.quantityField === "yield_quantity"
          ? "peeled_quantity"
          : "peeling_quantity",
    ],
  ];

  // Build include chain based on model type
  const buildIncludes = () => {
    switch (modelType) {
      case "peeledDispatches":
        return [
          {
            attributes: ["id"],
            as: "pp",
            model: models.PeelingProducts,
            where: { is_active: true },
            include: [
              {
                attributes: ["id"],
                as: "pln",
                model: models.Peeling,
                where: { is_active: true },
                include: [
                  {
                    as: "dis",
                    model: models.Dispatches,
                    attributes: ["id"],
                    where: { is_active: true },
                    include: [
                      {
                        as: "pp",
                        model: models.ProcurementProducts,
                        attributes: ["id"],
                        where: { is_active: true },
                        include: [
                          {
                            as: "pl",
                            model: models.ProcurementLots,
                            attributes: ["id"],
                            where: procurementLotsWhere,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
              {
                model: models.ProductMaster,
                attributes: ["id", "product_name"],
                where: { is_active: true },
              },
            ],
          },
          {
            model: models.UnitMaster,
            attributes: ["id", "unit_code"],
            where: { is_active: true },
          },
        ];

      case "peeling_products":
        return [
          {
            attributes: ["id"],
            as: "pln",
            model: models.Peeling,
            where: { is_active: true },
            include: [
              {
                attributes: ["id"],
                as: "dis",
                model: models.Dispatches,
                where: { is_active: true },
                include: [
                  {
                    attributes: ["id"],
                    as: "pp",
                    model: models.ProcurementProducts,
                    where: { is_active: true },
                    include: [
                      {
                        attributes: ["id"],
                        as: "pl",
                        model: models.ProcurementLots,
                        where: procurementLotsWhere,
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            model: models.ProductMaster,
            attributes: ["id", "product_name"],
            where: { is_active: true },
          },
        ];

      case "dispatches":
        return [
          {
            attributes: ["id"],
            as: "pp",
            model: models.ProcurementProducts,
            where: { is_active: true },
            include: [
              {
                attributes: ["id"],
                as: "pl",
                model: models.ProcurementLots,
                where: procurementLotsWhere,
              },
              {
                attributes: ["product_name"],
                model: models.ProductMaster,
                where: { is_active: true },
              },
              {
                attributes: ["supplier_name"],
                model: models.SupplierMaster,
                where: { is_active: true },
              },
            ],
          },
          {
            attributes: ["id", "unit_code"],
            model: models.UnitMaster,
            where: { is_active: true },
          },
        ];

      default:
        throw new Error(`Unsupported modelType: ${modelType}`);
    }
  };

  queryOptions.include = buildIncludes();

  // Add grouping if needed - must include ALL nested associations for PostgreSQL
  if (modelType === "peeledDispatches") {
    queryOptions.group = [
      "PeeledDispatches.id",
      "pp.id",
      "pp->pln.id",
      "pp->pln->dis.id",
      "pp->pln->dis->pp.id",
      "pp->pln->dis->pp->pl.id",
      "pp->ProductMaster.id",
      "UnitMaster.id",
    ];
  } else if (modelType === "peeling_products") {
    queryOptions.group = [
      "PeelingProducts.id",
      "pln.id",
      "pln->dis.id",
      "pln->dis->pp.id",
      "pln->dis->pp->pl.id",
      "ProductMaster.id",
    ];
  }

  return queryOptions;
};

/**
 * Get quantity for any model type
 * Consolidates GetQuantity from multiple controllers
 * @param {Object} models - Sequelize models
 * @param {String} modelType - 'peeledDispatches', 'peeling_products', or 'dispatches'
 * @param {String} id - Entity ID
 * @returns {Promise} Quantity data
 */
export const getQuantityQuery = async (models, modelType, id) => {
  if (!id) {
    throw {
      statusCode: 420,
      message: `${modelType} ID field must not be empty!`,
    };
  }

  const quantityConfigs = {
    peeledDispatches: {
      model: models.PeeledDispatches,
      field: "peeled_dispatch_quantity",
    },
    peeling_products: {
      model: models.PeelingProducts,
      field: "yield_quantity",
    },
    dispatches: {
      model: models.Dispatches,
      field: "dispatch_quantity",
    },
  };

  const config = quantityConfigs[modelType];
  if (!config) {
    throw new Error(`Invalid modelType: ${modelType}`);
  }

  const result = await config.model.findOne({
    attributes: [config.field],
    where: { id, is_active: true },
  });

  return result;
};
