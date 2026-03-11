import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const BulkUpsert = async (profile_id, peeling_product_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      // before inserting/updating records, try to populate order_id if it's
      // missing on any item by looking up the related peeling record and
      // following the dispatch->procurement_product->procurement_lot chain.
      if (Array.isArray(peeling_product_data)) {
        for (const item of peeling_product_data) {
          if (!item.order_id && item.peeling_id) {
            const [[{ order_id }]] = await sequelize.query(
              `SELECT pl.order_id
               FROM procurement_lots pl
               JOIN procurement_products prp ON prp.procurement_lot_id = pl.id AND prp.is_active = true
               JOIN dispatches d ON d.procurement_product_id = prp.id AND d.is_active = true
               JOIN peeling p ON p.dispatch_id = d.id AND p.is_active = true
               WHERE p.id = :peelingId
               LIMIT 1`,
              {
                replacements: { peelingId: item.peeling_id },
                type: sequelize.QueryTypes.SELECT,
              },
            );
            if (order_id) {
              item.order_id = order_id;
            }
          }
        }
      }

      const result = await models.PeelingProducts.bulkCreate(
        peeling_product_data,
        {
          updateOnDuplicate: [
            "peeling_id",
            "product_master_id",
            "yield_quantity",
            "peeling_status",
            "peeling_notes",
            "product_master_id",
            "order_id", // ensure order link is kept up-to-date on upsert
          ],
          profile_id,
        },
      );
      resolve(result);
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

      let procurementLotsWhere = {
        is_active: true,
      };

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("yield_quantity"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_method"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { peeling_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatches.ProcurementProduct.ProductMaster.product_name",
              ),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          {
            "$ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const peeling_products = await models.PeelingProducts.findAndCountAll({
        include: [
          {
            attributes: ["id"],
            as: "pln",
            model: models.Peeling,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "product_name"],
            model: models.ProductMaster,
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

      resolve(peeling_products);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetQuantity = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Peeling product ID field must not be empty!",
        });
      }

      const product = await models.PeelingProducts.findOne({
        attributes: ["yield_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(product);
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
          message: "Peeling product ID field must not be empty!",
        });
      }

      const product = await models.PeelingProducts.findOne({
        attributes: ["id", "peeling_id", "product_master_id", "yield_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(product);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetNames = ({
  procurement_lot_id,
  peeled_dispatch_id,
  start = 0,
  length = 10,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("GetNames called with:", {
        procurement_lot_id,
        peeled_dispatch_id,
      });

      // Simple approach: Get peeling products with ProductMaster
      const peelings = await models.PeelingProducts.findAll({
        attributes: [
          "id",
          "product_master_id",
          "peeling_id",
          "yield_quantity",
          [
            sequelize.literal(
              `COALESCE("PeelingProducts"."yield_quantity", 0) - COALESCE((SELECT SUM(peeled_dispatch_quantity) FROM peeled_dispatches pd WHERE pd.peeled_product_id = "PeelingProducts".id AND ${
                peeled_dispatch_id != "null" && peeled_dispatch_id != undefined
                  ? `pd.id != '${peeled_dispatch_id}' AND`
                  : ""
              } pd.is_active = true), 0)`,
            ),
            "peeled_quantity",
          ],
        ],
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
            required: true,
          },
        ],
        where: {
          is_active: true,
        },
        order: [["created_at", "desc"]],
        subQuery: false,
        distinct: true,
      });

      console.log("Found peeling products:", peelings.length);

      // If no procurement lot filter, return all with their peeling info
      if (!procurement_lot_id) {
        console.log("No lot filter - returning all products");
        return resolve(peelings);
      }

      // Filter by procurement lot via peeling → dispatch → procurement_product
      console.log("Filtering by procurement_lot_id:", procurement_lot_id);

      const filtered = [];
      for (const peeling of peelings) {
        try {
          // Get the peeling record to find dispatch
          const peelingRecord = await models.Peeling.findOne({
            where: { id: peeling.peeling_id, is_active: true },
            attributes: ["dispatch_id"],
            raw: true,
          });

          if (!peelingRecord) continue;

          // Get the dispatch to find procurement_product
          const dispatch = await models.Dispatches.findOne({
            where: { id: peelingRecord.dispatch_id, is_active: true },
            attributes: ["procurement_product_id"],
            raw: true,
          });

          if (!dispatch) continue;

          // Get the procurement product to check the lot
          const procProduct = await models.ProcurementProducts.findOne({
            where: { id: dispatch.procurement_product_id, is_active: true },
            attributes: ["procurement_lot_id"],
            raw: true,
          });

          if (procProduct?.procurement_lot_id === procurement_lot_id) {
            // Get QA status for this peeling product
            // Note: QA records are linked to peeling_id (header), not peeled_product_id
            const qaRecord = await models.QAChecklist.findOne({
              where: { peeling_id: peeling.peeling_id },
              attributes: ["status"],
              order: [["created_at", "DESC"]],
              raw: true,
            });

            // Add QA status to peeling object
            peeling.dataValues.qa_status = qaRecord?.status || "PENDING";

            filtered.push(peeling);
            console.log(
              "  ✓ Added:",
              peeling.id,
              "Product:",
              peeling.ProductMaster?.product_name,
              "QA Status:",
              peeling.dataValues.qa_status,
            );
          }
        } catch (e) {
          console.log("  Error checking peeling:", peeling.id, e.message);
        }
      }

      console.log("Filtered results:", filtered.length, "products");
      resolve(filtered);
    } catch (err) {
      console.error("GetNames error:", err.message || err);
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

export const GetQAMetrics = ({ procurement_lot_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!procurement_lot_id) {
        return reject({
          statusCode: 420,
          message: "Procurement lot ID is required!",
        });
      }

      // Get QA metrics for peeling products in this lot
      const metrics = await sequelize.query(
        `
        SELECT 
          COUNT(DISTINCT pp.id) as total_peeling_products,
          COALESCE(SUM(pp.yield_quantity), 0) as total_quantity_qa,
          COUNT(DISTINCT CASE WHEN qa.status = 'PASS' THEN qa.id END) as passed_qa,
          COUNT(DISTINCT CASE WHEN qa.status = 'FAIL' THEN qa.id END) as failed_qa,
          COUNT(DISTINCT CASE WHEN qa.status = 'PENDING' THEN qa.id END) as pending_qa,
          COUNT(DISTINCT CASE WHEN qa.status = 'ON_HOLD' THEN qa.id END) as on_hold_qa,
          CASE 
            WHEN COUNT(DISTINCT qa.id) > 0 
            THEN ROUND(
              (COUNT(DISTINCT CASE WHEN qa.status = 'PASS' THEN qa.id END)::FLOAT / COUNT(DISTINCT qa.id)) * 100, 
              2
            )
            ELSE 0 
          END as pass_rate_percent
        FROM peeling_products pp
        LEFT JOIN peeling p ON p.id = pp.peeling_id
        LEFT JOIN dispatches d ON d.id = p.dispatch_id
        LEFT JOIN procurement_products pprod ON pprod.id = d.procurement_product_id
        LEFT JOIN qa_checklist qa ON qa.peeling_id = p.id
        WHERE pprod.procurement_lot_id = :procurement_lot_id
        AND pp.is_active = true;
      `,
        {
          replacements: { procurement_lot_id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!metrics || metrics.length === 0) {
        return resolve({
          total_peeling_products: 0,
          total_quantity_qa: 0,
          passed_qa: 0,
          failed_qa: 0,
          pending_qa: 0,
          on_hold_qa: 0,
          pass_rate_percent: 0,
        });
      }

      resolve(metrics[0]);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetDispatchQAMetrics = ({ peeled_dispatch_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!peeled_dispatch_id) {
        return reject({
          statusCode: 420,
          message: "Peeled dispatch ID is required!",
        });
      }

      // Get comprehensive QA metrics tracking quantity passed across peeling and dispatch
      const metrics = await sequelize.query(
        `
        SELECT 
          pd.id as peeled_dispatch_id,
          pd.peeled_dispatch_quantity as dispatch_quantity,
          pp.yield_quantity as peeling_product_quantity,
          COALESCE(qa_peeling.status, 'UNKNOWN') as peeling_qa_status,
          COALESCE(qa_peeling.quantity, 0) as peeling_qa_quantity,
          COALESCE(qa_peeling.id, NULL) as peeling_qa_checklist_id,
          COALESCE(qa_dispatch.status, 'UNKNOWN') as dispatch_qa_status,
          COALESCE(qa_dispatch.id, NULL) as dispatch_qa_checklist_id,
          -- Calculate total quantity that passed QA (from peeling stage)
          CASE 
            WHEN qa_peeling.status = 'PASS' 
            THEN COALESCE(qa_peeling.quantity, pp.yield_quantity)
            ELSE 0
          END as quantity_passed_peeling,
          -- Calculate total quantity to dispatch (before packing)
          pd.peeled_dispatch_quantity as quantity_to_dispatch,
          -- Calculate pass rate from peeling QA
          CASE 
            WHEN COALESCE(qa_peeling.quantity, 0) > 0 
            THEN ROUND(
              (CASE WHEN qa_peeling.status = 'PASS' THEN 1 ELSE 0 END::FLOAT) * 100, 
              2
            )
            ELSE 0 
          END as peeling_pass_rate_percent
        FROM peeled_dispatches pd
        LEFT JOIN peeling_products pp ON pp.id = pd.peeled_product_id
        LEFT JOIN qa_checklist qa_peeling ON qa_peeling.peeled_product_id = pp.id
        LEFT JOIN qa_checklist qa_dispatch ON qa_dispatch.peeled_dispatch_id = pd.id
        WHERE pd.id = :peeled_dispatch_id
        AND pd.is_active = true
        LIMIT 1;
      `,
        {
          replacements: { peeled_dispatch_id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!metrics || metrics.length === 0) {
        return reject({
          statusCode: 404,
          message: "Peeled dispatch not found",
        });
      }

      resolve(metrics[0]);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get aggregate QA metrics between Peeling and Dispatch stages
 * Tracks total quantity passed from peeling through to dispatch
 * Useful for yield analysis and quality tracking across production stages
 */
export const GetPeelingToDispatchQAMetrics = ({ procurement_lot_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!procurement_lot_id) {
        return reject({
          statusCode: 420,
          message: "Procurement lot ID is required!",
        });
      }

      // Aggregate QA metrics from peeling through dispatch
      const metrics = await sequelize.query(
        `
        SELECT 
          :procurement_lot_id as procurement_lot_id,
          -- Peeling stage metrics
          COUNT(DISTINCT pp.id) as total_peeling_products,
          COALESCE(SUM(pp.yield_quantity), 0) as total_yield_quantity,
          COUNT(DISTINCT CASE WHEN qa_p.status = 'PASS' THEN qa_p.id END) as peeling_passed_count,
          COALESCE(
            SUM(CASE WHEN qa_p.status = 'PASS' THEN qa_p.quantity ELSE 0 END),
            0
          ) as total_quantity_passed_peeling,
          -- Total quantity passed at dispatch stage
          COALESCE(SUM(CASE WHEN qa_d.status = 'PASS' THEN qa_d.quantity ELSE 0 END), 0) as total_quantity_passed_dispatch,
          COUNT(DISTINCT CASE WHEN qa_p.status = 'FAIL' THEN qa_p.id END) as peeling_failed_count,
          COUNT(DISTINCT CASE WHEN qa_p.status = 'PENDING' THEN qa_p.id END) as peeling_pending_count,
          COUNT(DISTINCT CASE WHEN qa_p.status = 'ON_HOLD' THEN qa_p.id END) as peeling_on_hold_count,
          -- Dispatch stage metrics
          COUNT(DISTINCT pd.id) as total_peeled_dispatches,
          COALESCE(SUM(pd.peeled_dispatch_quantity), 0) as total_dispatch_quantity,
          COUNT(DISTINCT CASE WHEN qa_d.status = 'PASS' THEN qa_d.id END) as dispatch_passed_count,
          COUNT(DISTINCT CASE WHEN qa_d.status = 'FAIL' THEN qa_d.id END) as dispatch_failed_count,
          -- Pass rates
          CASE 
            WHEN COUNT(DISTINCT qa_p.id) > 0 
            THEN ROUND(CAST((COUNT(DISTINCT CASE WHEN qa_p.status = 'PASS' THEN qa_p.id END)::FLOAT / COUNT(DISTINCT qa_p.id)) * 100 AS NUMERIC), 2)
            ELSE 0 
          END as peeling_pass_rate_percent,
          CASE 
            WHEN COUNT(DISTINCT qa_d.id) > 0 
            THEN ROUND(CAST((COUNT(DISTINCT CASE WHEN qa_d.status = 'PASS' THEN qa_d.id END)::FLOAT / COUNT(DISTINCT qa_d.id)) * 100 AS NUMERIC), 2)
            ELSE 0 
          END as dispatch_pass_rate_percent,
          -- Overall yield from peeling to dispatch
          CASE 
            WHEN COALESCE(SUM(pp.yield_quantity), 0) > 0
            THEN ROUND(CAST((COALESCE(SUM(pd.peeled_dispatch_quantity), 0)::FLOAT / COALESCE(SUM(pp.yield_quantity), 1)) * 100 AS NUMERIC), 2)
            ELSE 0
          END as peeling_to_dispatch_yield_percent
        FROM peeling_products pp
        LEFT JOIN peeling p ON p.id = pp.peeling_id
        LEFT JOIN dispatches d ON d.id = p.dispatch_id
        LEFT JOIN procurement_products pprod ON pprod.id = d.procurement_product_id
        LEFT JOIN qa_checklist qa_p ON qa_p.peeling_id = p.id
        LEFT JOIN peeled_dispatches pd ON pd.peeled_product_id = pp.id
        LEFT JOIN qa_checklist qa_d ON qa_d.peeled_dispatch_id = pd.id
        WHERE pprod.procurement_lot_id = :procurement_lot_id
        AND pp.is_active = true
        GROUP BY pprod.procurement_lot_id;
      `,
        {
          replacements: { procurement_lot_id },
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!metrics || metrics.length === 0) {
        return resolve({
          procurement_lot_id,
          total_peeling_products: 0,
          total_yield_quantity: 0,
          peeling_passed_count: 0,
          total_quantity_passed_peeling: 0,
          total_quantity_passed_dispatch: 0,
          peeling_failed_count: 0,
          peeling_pending_count: 0,
          peeling_on_hold_count: 0,
          total_peeled_dispatches: 0,
          total_dispatch_quantity: 0,
          dispatch_passed_count: 0,
          dispatch_failed_count: 0,
          peeling_pass_rate_percent: 0,
          dispatch_pass_rate_percent: 0,
          peeling_to_dispatch_yield_percent: 0,
        });
      }

      // Convert all numeric fields to actual numbers
      const result = metrics[0];
      return resolve({
        procurement_lot_id: result.procurement_lot_id,
        total_peeling_products: Number(result.total_peeling_products || 0),
        total_yield_quantity: Number(result.total_yield_quantity || 0),
        peeling_passed_count: Number(result.peeling_passed_count || 0),
        total_quantity_passed_peeling: Number(
          result.total_quantity_passed_peeling || 0,
        ),
        total_quantity_passed_dispatch: Number(
          result.total_quantity_passed_dispatch || 0,
        ),
        peeling_failed_count: Number(result.peeling_failed_count || 0),
        peeling_pending_count: Number(result.peeling_pending_count || 0),
        peeling_on_hold_count: Number(result.peeling_on_hold_count || 0),
        total_peeled_dispatches: Number(result.total_peeled_dispatches || 0),
        total_dispatch_quantity: Number(result.total_dispatch_quantity || 0),
        dispatch_passed_count: Number(result.dispatch_passed_count || 0),
        dispatch_failed_count: Number(result.dispatch_failed_count || 0),
        peeling_pass_rate_percent: Number(
          result.peeling_pass_rate_percent || 0,
        ),
        dispatch_pass_rate_percent: Number(
          result.dispatch_pass_rate_percent || 0,
        ),
        peeling_to_dispatch_yield_percent: Number(
          result.peeling_to_dispatch_yield_percent || 0,
        ),
      });
    } catch (err) {
      reject(err);
    }
  });
};

// Get aggregated QA metrics across all procurement lots
export const GetAllQAMetrics = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // Get aggregated QA metrics from all procurement lots
      // Calculate percentage as: (QA Passed Quantity) / (Total Peeled Quantity from all peeling_products) * 100
      const metrics = await sequelize.query(
        `
        SELECT 
          COUNT(DISTINCT CASE WHEN qa.status = 'PASS' THEN qa.id END) as total_passed_count,
          COALESCE(
            SUM(CASE WHEN qa.status = 'PASS' THEN qa.quantity ELSE 0 END),
            0
          ) as total_quantity_passed,
          COUNT(DISTINCT CASE WHEN qa.status = 'FAIL' THEN qa.id END) as total_failed_count,
          COUNT(DISTINCT CASE WHEN qa.status = 'PENDING' THEN qa.id END) as total_pending_count,
          COUNT(DISTINCT qa.id) as total_qa_records,
          COALESCE((SELECT SUM(yield_quantity) FROM peeling_products WHERE is_active = true), 0) as total_yield_quantity,
          CASE 
            WHEN COALESCE((SELECT SUM(yield_quantity) FROM peeling_products WHERE is_active = true), 0) > 0
            THEN ROUND(CAST((COALESCE(SUM(CASE WHEN qa.status = 'PASS' THEN qa.quantity ELSE 0 END), 0)::FLOAT / COALESCE((SELECT SUM(yield_quantity) FROM peeling_products WHERE is_active = true), 1)) * 100 AS NUMERIC), 2)
            ELSE 0 
          END as overall_pass_rate_percent
        FROM qa_checklist qa
      `,
        {
          type: sequelize.QueryTypes.SELECT,
        },
      );

      if (!metrics || metrics.length === 0) {
        return resolve({
          total_passed_count: 0,
          total_quantity_passed: 0,
          total_failed_count: 0,
          total_pending_count: 0,
          total_qa_records: 0,
          total_yield_quantity: 0,
          overall_pass_rate_percent: 0,
        });
      }

      const result = metrics[0];
      return resolve({
        total_passed_count: Number(result.total_passed_count || 0),
        total_quantity_passed: Number(result.total_quantity_passed || 0),
        total_failed_count: Number(result.total_failed_count || 0),
        total_pending_count: Number(result.total_pending_count || 0),
        total_qa_records: Number(result.total_qa_records || 0),
        total_yield_quantity: Number(result.total_yield_quantity || 0),
        overall_pass_rate_percent: Number(
          result.overall_pass_rate_percent || 0,
        ),
      });
    } catch (err) {
      reject(err);
    }
  });
};
