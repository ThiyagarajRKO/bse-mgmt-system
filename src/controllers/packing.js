import models from "../../models";
import PackingCalculationsService from "../services/packing_calculations.js";

export const Insert = async (profile_id, packing_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      // ✅ For unprocessed products (dispatch → packing), dispatch_id is used
      // For processed products (peeling → packing), peeled_dispatch_id is used
      const hasDispatchSource =
        packing_data?.peeled_dispatch_id || packing_data?.dispatch_id;
      if (!hasDispatchSource) {
        return reject({
          statusCode: 420,
          message:
            "Either peeled_dispatch_id (processed) or dispatch_id (unprocessed) must be provided!",
        });
      }

      // copy order_id from peeled dispatch if available and not supplied
      if (!packing_data.order_id && packing_data.peeled_dispatch_id) {
        const pd = await models.PeeledDispatches.findOne({
          attributes: ["order_id"],
          where: { id: packing_data.peeled_dispatch_id, is_active: true },
          raw: true,
        });
        if (pd && pd.order_id) {
          packing_data.order_id = pd.order_id;
        }
      }

      // ✅ NEW: Copy order_id from dispatch for unprocessed products
      if (!packing_data.order_id && packing_data.dispatch_id) {
        const dispatch = await models.Dispatches.findOne({
          attributes: ["order_id"],
          where: { id: packing_data.dispatch_id, is_active: true },
          raw: true,
        });
        if (dispatch && dispatch.order_id) {
          packing_data.order_id = dispatch.order_id;
        }
      }

      const result = await models.Packing.create(packing_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Packed data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, packing_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Packing id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!packing_data) {
        return reject({
          statusCode: 420,
          message: "Packed product data must not be empty!",
        });
      }

      // If trying to mark as "Ready for Sales", validate that expiry_date is set
      if (packing_data?.packing_status === "Ready for Sales") {
        // Get current packing record to check expiry_date and get product info
        const currentPacking = await models.Packing.findOne({
          where: {
            id,
            is_active: true,
          },
          attributes: ["expiry_date", "packing_quantity", "packing_status"],
          include: [
            {
              as: "pd",
              model: models.PeeledDispatches,
              attributes: ["id"],
              include: [
                {
                  as: "pp",
                  model: models.PeelingProducts,
                  attributes: ["id"],
                  include: [
                    {
                      as: "pln",
                      model: models.Peeling,
                      attributes: ["id"],
                      include: [
                        {
                          as: "dis",
                          model: models.Dispatches,
                          attributes: ["id"],
                          include: [
                            {
                              as: "pp",
                              model: models.ProcurementProducts,
                              attributes: ["id"],
                              include: [
                                {
                                  as: "ProductMaster",
                                  model: models.ProductMaster,
                                  attributes: ["id"],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });

        const expiryDate =
          packing_data?.expiry_date || currentPacking?.expiry_date;

        if (!expiryDate) {
          return reject({
            statusCode: 420,
            message:
              "Cannot mark as 'Ready for Sales': Expiry date must be set first!",
          });
        }

        // If status is changing from "In Progress" to "Ready for Sales", create sales inventory record
        if (
          currentPacking?.packing_status !== "Ready for Sales" &&
          packing_data?.packing_status === "Ready for Sales"
        ) {
          try {
            // Get product master ID from packing data
            const packingDetail = await models.Packing.findOne({
              where: { id, is_active: true },
              attributes: ["id", "packing_quantity"],
              include: [
                {
                  as: "pd",
                  model: models.PeeledDispatches,
                  attributes: ["id"],
                  include: [
                    {
                      as: "pp",
                      model: models.PeelingProducts,
                      attributes: ["id"],
                      include: [
                        {
                          as: "pln",
                          model: models.Peeling,
                          attributes: ["id"],
                          include: [
                            {
                              as: "dis",
                              model: models.Dispatches,
                              attributes: ["id"],
                              include: [
                                {
                                  as: "pp",
                                  model: models.ProcurementProducts,
                                  attributes: ["product_master_id"],
                                },
                              ],
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            });

            if (packingDetail?.pd?.pp?.pln?.dis?.pp?.product_master_id) {
              const productMasterId =
                packingDetail.pd.pp.pln.dis.pp.product_master_id;

              // Create sales inventory record
              await models.SalesInventory.create(
                {
                  packing_id: id,
                  product_master_id: productMasterId,
                  quantity: packingDetail.packing_quantity || 0,
                  is_active: true,
                },
                { profile_id },
              );

              console.log(`✅ Sales inventory created for packing ${id}`);
            }
          } catch (err) {
            console.warn(
              "Warning: Could not create sales inventory record:",
              err.message,
            );
            // Don't reject - continue with status update even if sales inventory creation fails
          }
        }
      }

      const result = await models.Packing.update(packing_data, {
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
          message: "Packing Product ID field must not be empty!",
        });
      }

      const packing = await models.Packing.findOne({
        where: {
          id,
          is_active: true,
        },
        include: [
          {
            association: "pd",
            model: models.PeeledDispatches,
            attributes: [
              "id",
              "order_id",
              "peeled_product_id",
              "qa_checklist_id",
            ],
            include: [
              {
                association: "pp",
                model: models.PeelingProducts,
                attributes: ["id", "peeling_id", "yield_quantity"],
              },
              {
                model: models.Orders,
                attributes: ["id", "order_number", "customer_id"],
              },
              {
                association: "qaCheck",
                model: models.QAChecklist,
                attributes: ["id", "status", "lot_no"],
              },
            ],
          },
          {
            model: models.Orders,
            attributes: ["id", "order_number", "customer_id"],
          },
        ],
      });

      resolve(packing);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({ start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      const packing_count = await models.Packing.count({
        raw: true,
        subQuery: false,
        include: [
          {
            as: "pd",
            model: models.PeeledDispatches,
            attributes: [],
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pp",
                model: models.PeelingProducts,
                attributes: [],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "pln",
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        as: "dis",
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            as: "pp",
                            model: models.ProcurementProducts,
                            attributes: [],
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
                                as: "pl",
                                attributes: [],
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
                    as: "ProductMaster",
                    model: models.ProductMaster,
                    attributes: ["id", "product_name"],
                    where: {
                      is_active: true,
                    },
                  },
                ],
              },
            ],
          },
          {
            model: models.UnitMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.GradeMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.SizeMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.PackagingMaster,
            attributes: [],
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

      const packing_rows = await models.Packing.findAll({
        subQuery: false,
        attributes: [
          "id",
          "created_at",
          "packing_notes",
          "packing_status",
          "packing_quantity",
          "expiry_date",
          "order_no",
          "lot_no",
          "order_id",
        ],
        include: [
          {
            as: "pd",
            model: models.PeeledDispatches,
            attributes: ["id", "order_id", "peeled_dispatch_quantity"],
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
                    as: "pln",
                    model: models.Peeling,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        as: "dis",
                        model: models.Dispatches,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            as: "pp",
                            attributes: [],
                            model: models.ProcurementProducts,
                            where: {
                              is_active: true,
                            },
                            include: [
                              {
                                as: "pl",
                                model: models.ProcurementLots,
                                attributes: [],
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
                  {
                    as: "ProductMaster",
                    model: models.ProductMaster,
                    attributes: ["id", "product_name"],
                    where: {
                      is_active: true,
                    },
                  },
                ],
              },
            ],
          },
          {
            model: models.UnitMaster,
            attributes: ["id", "unit_code"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.GradeMaster,
            attributes: ["id", "grade_name"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.SizeMaster,
            attributes: ["id", "size"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.PackagingMaster,
            attributes: ["id", "packaging_code"],
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "Packing.id",
          "pd.id",
          "pd->pp.id",
          "pd->pp->ProductMaster.id",
          //"pd->pp->pln.id",
          "UnitMaster.id",
          "GradeMaster.id",
          "SizeMaster.id",
          "PackagingMaster.id",
        ],
      });

      let data = {
        count: packing_count,
        rows: packing_rows,
      };

      resolve(data);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetNames = ({ start, length }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Simplified query that doesn't require nested associations
      // Try to fetch packings with basic information
      const packings = await models.Packing.findAll({
        attributes: ["id", "packing_quantity", "created_at"],
        where: {
          is_active: true,
        },
        limit: length || 100,
        offset: start || 0,
        order: [["created_at", "desc"]],
        raw: true,
      });

      // If no packings found, return empty array instead of error
      if (!packings || packings.length === 0) {
        return resolve([]);
      }

      // Try to enrich with product names, but don't fail if associations don't exist
      try {
        const enrichedPackings = await Promise.all(
          packings.map(async (packing) => {
            try {
              // Try to get peeled dispatch and product name
              const packingWithAssoc = await models.Packing.findOne({
                where: { id: packing.id },
                attributes: ["id", "packing_quantity"],
                include: [
                  {
                    model: models.PeeledDispatches,
                    as: "pd",
                    attributes: ["id"],
                    required: false,
                    include: [
                      {
                        model: models.PeelingProducts,
                        as: "pp",
                        attributes: ["id"],
                        required: false,
                        include: [
                          {
                            as: "ProductMaster",
                            model: models.ProductMaster,
                            attributes: ["id", "product_name"],
                            required: false,
                          },
                        ],
                      },
                    ],
                  },
                ],
              });
              return packingWithAssoc || packing;
            } catch (err) {
              console.warn(
                `Error enriching packing ${packing.id}:`,
                err.message,
              );
              return packing;
            }
          }),
        );

        resolve(enrichedPackings);
      } catch (err) {
        console.warn(
          "Error enriching packings, returning base data:",
          err.message,
        );
        resolve(packings);
      }
    } catch (err) {
      console.error("Error in GetNames:", err);
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
          message: "Peeing ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const peeling = await models.PeelingProducts.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(peeling);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate complete packing workflow including carton and pallet calculations
 * @param {Object} params - { product_id, market, quantity }
 * @returns {Promise} - Complete packing calculation result
 */
export const CalculatePacking = ({ product_id, market, quantity }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      if (!market) {
        return reject({
          statusCode: 420,
          message: "Market must not be empty!",
        });
      }

      if (!quantity || quantity <= 0) {
        return reject({
          statusCode: 420,
          message: "Quantity must be a positive number!",
        });
      }

      const result = await PackingCalculationsService.calculateCompletePacking({
        product_id,
        market,
        quantity,
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Resolve master carton for given packaging parameters
 * @param {Object} params - { primary_packaging_type, quantity, market }
 * @returns {Promise} - Carton resolution result
 */
export const ResolveCarton = ({ primary_packaging_type, quantity, market }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!primary_packaging_type) {
        return reject({
          statusCode: 420,
          message: "Primary packaging type must not be empty!",
        });
      }

      if (!quantity || quantity <= 0) {
        return reject({
          statusCode: 420,
          message: "Quantity must be a positive number!",
        });
      }

      const result = await PackingCalculationsService.resolveMasterCarton({
        primary_packaging_type,
        quantity,
        market,
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate packing metrics (cartons, CBM, pallets)
 * @param {Object} params - { quantity, units_per_carton, carton_details, is_export }
 * @returns {Promise} - Packing metrics calculation result
 */
export const CalculatePackingMetrics = ({
  quantity,
  units_per_carton,
  carton_details,
  is_export,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!quantity || quantity <= 0) {
        return reject({
          statusCode: 420,
          message: "Quantity must be a positive number!",
        });
      }

      if (!units_per_carton || units_per_carton <= 0) {
        return reject({
          statusCode: 420,
          message: "Units per carton must be a positive number!",
        });
      }

      if (!carton_details) {
        return reject({
          statusCode: 420,
          message: "Carton details must not be empty!",
        });
      }

      const result = PackingCalculationsService.calculatePackingMetrics({
        quantity,
        units_per_carton,
        carton_details,
        is_export,
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Lock packing calculations for documentation
 * @param {Object} params - { packing_calculation_id }
 * @returns {Promise} - Lock result
 */
export const LockPackingCalculations = ({ packing_calculation_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!packing_calculation_id) {
        return reject({
          statusCode: 420,
          message: "Packing calculation ID must not be empty!",
        });
      }

      const result = await PackingCalculationsService.lockPackingCalculations(
        packing_calculation_id,
      );

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * AI-Based Packing Container Recommendation
 * Recommends optimal packaging containers based on product characteristics and quantity
 */
export const RecommendPackingContainers = ({
  product_id,
  quantity_kg,
  market,
  grade,
  size,
  product_category,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_id || !quantity_kg) {
        return reject({
          statusCode: 420,
          message: "Product ID and quantity are required",
        });
      }

      // Get available packaging options
      const packagingOptions = await models.PackagingMaster.findAll({
        attributes: [
          "id",
          "packaging_code",
          "packaging_type",
          "packaging_weight",
          "packaging_height",
          "packaging_width",
          "packaging_length",
        ],
        where: {
          is_active: true,
        },
        order: [["packaging_weight", "ASC"]],
      });

      if (!packagingOptions || packagingOptions.length === 0) {
        return reject({
          statusCode: 404,
          message: "No packaging options available",
        });
      }

      // AI Logic: Calculate optimal containers based on characteristics
      const recommendations = packagingOptions.map((pkg) => {
        // Get capacity - use packaging_weight as container capacity in kg
        const containerCapacity = pkg.packaging_weight || 1;

        // Calculate number of containers needed
        const containersNeeded = Math.ceil(quantity_kg / containerCapacity);

        // Calculate utilization factor
        const utilizationRate =
          (quantity_kg / (containersNeeded * containerCapacity)) * 100;

        // Score based on utilization (prefer 80-95% utilization)
        let score = 50;
        if (utilizationRate >= 80 && utilizationRate <= 95) {
          score = 100; // Ideal utilization
        } else if (utilizationRate >= 70 && utilizationRate < 80) {
          score = 85;
        } else if (utilizationRate > 95 && utilizationRate <= 100) {
          score = 90; // Nearly full
        } else if (utilizationRate >= 50 && utilizationRate < 70) {
          score = 60;
        } else if (utilizationRate < 50) {
          score = 30; // Too much waste
        }

        // Market-based adjustments
        if (market === "EXPORT" && pkg.packaging_type === "Master Carton") {
          score += 15; // Export markets prefer master cartons
        }
        if (market === "DOMESTIC" && pkg.packaging_type === "Pouch") {
          score += 10; // Domestic markets prefer pouches
        }

        // Premium products get better packaging (Master Carton preferred)
        if (grade === "PREMIUM") {
          if (
            pkg.packaging_type === "Master Carton" ||
            pkg.packaging_type === "Duplex Carton"
          ) {
            score += 20;
          }
        }

        // Small orders prefer smaller containers
        if (quantity_kg < 10 && containerCapacity <= 5) {
          score += 15;
        }

        // Large orders prefer larger containers
        if (quantity_kg > 100 && containerCapacity >= 10) {
          score += 10;
        }

        // Calculate cost estimate (assuming cost per kg of packaging)
        const costPerKgPackaging = 2; // Default cost per kg
        const totalEstimatedCost = (
          containersNeeded *
          containerCapacity *
          costPerKgPackaging
        ).toFixed(2);

        // Calculate volume in liters (assuming packaging dimensions)
        let volume = "N/A";
        if (
          pkg.packaging_height &&
          pkg.packaging_width &&
          pkg.packaging_length
        ) {
          volume = (
            (pkg.packaging_height *
              pkg.packaging_width *
              pkg.packaging_length) /
            1000
          ).toFixed(2);
        }

        return {
          packaging_id: pkg.id,
          packaging_code: pkg.packaging_code,
          packaging_type: pkg.packaging_type,
          capacity_kg: containerCapacity,
          volume_liters: volume,
          dimensions: {
            height_cm: pkg.packaging_height,
            width_cm: pkg.packaging_width,
            length_cm: pkg.packaging_length,
          },
          containers_needed: containersNeeded,
          total_weight_kg: (containersNeeded * containerCapacity).toFixed(2),
          utilization_rate: utilizationRate.toFixed(2),
          ai_score: score,
          estimated_cost: totalEstimatedCost,
          cost_per_unit: (totalEstimatedCost / containersNeeded).toFixed(2),
          efficiency_rating:
            score >= 90
              ? "OPTIMAL"
              : score >= 70
                ? "GOOD"
                : score >= 50
                  ? "ACCEPTABLE"
                  : "POOR",
        };
      });

      // Sort by AI score (descending) and then by cost (ascending)
      const sortedRecommendations = recommendations.sort((a, b) => {
        if (b.ai_score !== a.ai_score) {
          return b.ai_score - a.ai_score; // Higher score first
        }
        return parseFloat(a.estimated_cost) - parseFloat(b.estimated_cost); // Lower cost second
      });

      // Return top 3 recommendations
      const topRecommendations = sortedRecommendations.slice(0, 3);

      resolve({
        product_id,
        quantity_kg,
        market,
        grade,
        size,
        recommendation_summary: {
          total_options: sortedRecommendations.length,
          best_option_index: 0,
          total_containers_recommended:
            topRecommendations[0]?.containers_needed || 0,
          estimated_total_cost: topRecommendations[0]?.estimated_cost || 0,
          efficiency: topRecommendations[0]?.efficiency_rating || "N/A",
        },
        all_recommendations: sortedRecommendations,
        top_recommendations: topRecommendations,
        best_option: topRecommendations[0],
      });
    } catch (err) {
      console.error("Error in RecommendPackingContainers:", err);
      reject(err);
    }
  });
};

export const GetStats = ({ procurement_lot_id, search }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { Op, Sequelize, sequelize } = require("sequelize");

      // Build WHERE clause
      let where = {};
      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      // Query packing statistics with lot information
      const result = await models.sequelize.query(
        `
        SELECT
          pl.id as procurement_lot_id,
          pl.procurement_lot as procurement_lot,
          COUNT(DISTINCT pk.id) as total_packing_count,
          SUM(pk.packing_quantity) as total_packing_quantity,
          (
            SELECT SUM(p.peeling_quantity)
            FROM peeling p
            JOIN dispatches d ON d.id = p.dispatch_id AND d.is_active = true
            JOIN procurement_products prp ON prp.id = d.procurement_product_id AND prp.is_active = true
            WHERE prp.procurement_lot_id = pl.id AND p.is_active = true
          ) as total_yield_quantity,
          (
            SELECT SUM(pp.yield_quantity)
            FROM peeling_products pp
            JOIN peeling p ON p.id = pp.peeling_id AND p.is_active = true
            JOIN dispatches d ON d.id = p.dispatch_id AND d.is_active = true
            JOIN procurement_products prp ON prp.id = d.procurement_product_id AND prp.is_active = true
            WHERE prp.procurement_lot_id = pl.id AND pp.is_active = true
          ) as total_peeled_dispatched_quantity
        FROM
          procurement_lots pl
        LEFT JOIN
          procurement_products prp ON prp.procurement_lot_id = pl.id AND prp.is_active = true
        LEFT JOIN
          dispatches d ON d.procurement_product_id = prp.id AND d.is_active = true
        LEFT JOIN
          packing pk ON (pk.peeled_dispatch_id IS NOT NULL OR pk.dispatch_id = d.id) AND pk.is_active = true
        WHERE
          pl.is_active = true
          ${procurement_lot_id ? "AND pl.id = :procurement_lot_id" : ""}
          ${search ? "AND (pl.procurement_lot ILIKE :search)" : ""}
        GROUP BY
          pl.id, pl.procurement_lot
        ORDER BY
          pl.created_at DESC
        `,
        {
          replacements: {
            procurement_lot_id,
            search: search ? `%${search}%` : "%",
          },
          type: models.sequelize.QueryTypes.SELECT,
        },
      );

      resolve(result || []);
    } catch (err) {
      console.error("Error in GetStats:", err);
      reject(err);
    }
  });
};
