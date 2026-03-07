// @ts-nocheck
// the file is plain JavaScript but our editor's TypeScript language service
// sometimes emits bogus errors (e.g. "'try' expected" around complex
// blocks).  We disable checking for the whole module since it isn't written in
// TypeScript and the runtime has already proven the syntax is valid.
import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (profile_id, peeling_data, is_product_included) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("=== Peeling.Insert called ===");
      console.log("is_product_included:", is_product_included);
      console.log("peeling_data:", JSON.stringify(peeling_data, null, 2));

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeling_data?.dispatch_id) {
        return reject({
          statusCode: 420,
          message: "Unit data must not be empty!",
        });
      }

      // Separate PeelingProducts from peeling_data
      const { PeelingProducts, ...peelingDataOnly } = peeling_data;
      console.log(
        "PeelingProducts array:",
        JSON.stringify(PeelingProducts, null, 2),
      );
      console.log("peelingDataOnly:", JSON.stringify(peelingDataOnly, null, 2));

      // Create the Peeling record
      // if order_id not provided, try to infer from dispatch
      if (!peelingDataOnly.order_id && peelingDataOnly.dispatch_id) {
        const dispatch = await models.Dispatches.findOne({
          attributes: ["order_id"],
          where: { id: peelingDataOnly.dispatch_id },
          raw: true,
        });
        if (dispatch) peelingDataOnly.order_id = dispatch.order_id;
      }

      const peeling = await models.Peeling.create(peelingDataOnly, {
        profile_id,
      });

      console.log("Peeling created with ID:", peeling?.id);

      // Create PeelingProducts if provided
      if (
        is_product_included &&
        Array.isArray(PeelingProducts) &&
        PeelingProducts.length > 0
      ) {
        console.log(
          "Creating PeelingProducts:",
          PeelingProducts.length,
          "products",
        );
        // derive a default order id from the freshly created peeling or its dispatch
        let defaultOrderId = peeling.order_id || null;
        if (!defaultOrderId && peeling.dispatch_id) {
          const dispatch2 = await models.Dispatches.findOne({
            attributes: ["order_id"],
            where: { id: peeling.dispatch_id },
            raw: true,
          });
          defaultOrderId = dispatch2?.order_id || null;
        }

        for (const product of PeelingProducts) {
          try {
            const peelingProduct = await models.PeelingProducts.create(
              {
                peeling_id: peeling.id,
                product_master_id: product.product_master_id,
                yield_quantity: product.yield_quantity,
                peeling_notes: product.peeling_notes,
                is_active: true,
                order_id: product.order_id || defaultOrderId,
              },
              { profile_id },
            );
            console.log(
              "  ✓ Created PeelingProduct:",
              peelingProduct.id,
              "Product:",
              product.product_master_id,
            );
          } catch (err) {
            console.log("  ✗ Error creating PeelingProduct:", err.message);
            throw err;
          }
        }
      } else {
        console.log(
          "Skipping PeelingProducts creation - is_product_included:",
          is_product_included,
          "PeelingProducts.length:",
          PeelingProducts?.length,
        );
      }

      resolve(peeling);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Peeling data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, peeling_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Peeling id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeling_data) {
        return reject({
          statusCode: 420,
          message: "Peeling data must not be empty!",
        });
      }

      const result = await models.Peeling.update(peeling_data, {
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
          message: "Peeling ID field must not be empty!",
        });
      }

      const peeling = await models.Peeling.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(peeling);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  procurement_lot_id,
  procurement_product_id,
  order_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_product_id) {
        where.id = procurement_product_id;
      }

      let procurementLotsWhere = {
        is_active: true,
      };
      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }
      // filter by order id if requested: we apply to both the dispatch and
      // procurement lot so that records where the order lives on the dispatch
      // (but not on the lot) are still returned.
      let dispatchWhere = { is_active: true };
      if (order_id) {
        dispatchWhere.order_id = order_id;
        procurementLotsWhere.order_id = order_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_quantity"), "varchar"),
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
          // {
          //   "$PeelingProducts.peeling_notes$": {
          //     [Op.iLike]: `%${search}%`,
          //   },
          // },
          // sequelize.where(
          //   sequelize.cast(
          //     sequelize.col("PeelingProducts.peeling_status"),
          //     "varchar"
          //   ),
          //   {
          //     [Op.iLike]: `%${search}%`,
          //   }
          // ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatch.ProcurementProduct.ProductMaster.product_name",
              ),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatch.ProcurementProduct.procurement_product_type",
              ),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatch.ProcurementProduct.SupplierMaster.supplier_name",
              ),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const peeling_count = await models.Peeling.count({
        subQuery: false,
        include: [
          {
            attributes: [],
            as: "dis",
            model: models.Dispatches,
            where: dispatchWhere,
            include: [
              {
                attributes: [],
                as: "pp",
                model: models.ProcurementProducts,
                include: [
                  {
                    attributes: [],
                    as: "pl",
                    model: models.ProcurementLots,
                    where: procurementLotsWhere,
                  },
                  {
                    attributes: [],
                    as: "ProductMaster",
                    model: models.ProductMaster,
                    where: {
                      is_active: true,
                    },
                  },
                  {
                    attributes: [],
                    model: models.SupplierMaster,
                    where: {
                      is_active: true,
                    },
                  },
                ],
                where: {
                  is_active: true,
                },
              },
            ],
          },
          {
            attributes: [],
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
      });

      const peelings = await models.Peeling.findAll({
        subQuery: false,
        attributes: [
          "id",
          "order_id",
          "peeling_quantity",
          "peeling_method",
          "created_at",
          [
            sequelize.literal(
              `(SELECT SUM(yield_quantity) FROM peeling_products peps WHERE peps.peeling_id = "Peeling".id and peps.is_active = true)`,
            ),
            "total_yield_quantity",
          ],
        ],
        include: [
          {
            attributes: ["id", "dispatch_quantity"],
            as: "dis",
            model: models.Dispatches,
            include: [
              {
                attributes: [
                  "id",
                  "procurement_product_type",
                  "procurement_quantity",
                ],
                as: "pp",
                model: models.ProcurementProducts,
                include: [
                  {
                    // we need order information for QA dropdowns; include order_id
                    // as well as join the Orders table to get a human-readable order_no
                    attributes: ["id", "procurement_lot", "order_id"],
                    as: "pl",
                    model: models.ProcurementLots,
                    include: [
                      {
                        // join orders so that client can display order_no instead
                        model: models.Orders,
                        attributes: ["order_no"],
                        required: false,
                      },
                    ],
                    where: procurementLotsWhere,
                  },
                  {
                    attributes: ["product_name"],
                    as: "ProductMaster",
                    model: models.ProductMaster,
                    where: {
                      is_active: true,
                    },
                  },
                  {
                    attributes: ["supplier_name"],
                    model: models.SupplierMaster,
                    where: {
                      is_active: true,
                    },
                  },
                ],
                where: {
                  is_active: true,
                },
              },
              {
                model: models.Orders,
                attributes: ["order_no", "id"],
                required: false,
              },
            ],
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            attributes: [
              "id",
              "yield_quantity",
              "peeling_notes",
              "peeling_status",
            ],
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
          {
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        // group: [
        //   "Peeling.id",
        //   "PeelingProducts.id",
        //   "UnitMaster.id",
        //   "Dispatch.id",
        //   "Dispatch->ProcurementProduct.id",
        //   "Dispatch->ProcurementProduct->ProcurementLot.id",
        //   "Dispatch->ProcurementProduct->ProductMaster.id",
        //   "Dispatch->ProcurementProduct->SupplierMaster.id",
        // ],
      });

      // Convert Sequelize instances to plain objects so we can safely
      // attach computed fields, then copy the procurement lot's order
      // information onto each PeelingProducts item so the client can
      // see the order id (and order_no) at the product level.
      const peelingsPlain = peelings.map((p) =>
        typeof p.get === "function" ? p.get({ plain: true }) : p,
      );

      for (const p of peelingsPlain) {
        const procurementLot = p?.dis?.pp?.pl;
        // determine order information in priority: procurement lot, dispatch,
        // peeling record itself.  this mirrors the filtering logic above and
        // ensures the dropdown has something even if the lot lacks the FK.
        const dispatchOrderId = p?.dis?.order_id || p?.dis?.order?.id || null;
        const dispatchOrderNo = p?.dis?.order?.order_no || null;
        let orderInfo = null;
        if (procurementLot) {
          orderInfo = procurementLot.order || null;
        }
        const orderIdFromLot =
          (procurementLot && procurementLot.order_id) ||
          (orderInfo && orderInfo.id) ||
          dispatchOrderId ||
          p.order_id ||
          null;

        if (Array.isArray(p.PeelingProducts)) {
          for (const prod of p.PeelingProducts) {
            // attach order info to each product for easier client consumption
            prod.order_id = prod.order_id || orderIdFromLot;
            if (!prod.order) prod.order = {};
            prod.order.order_no =
              (orderInfo && orderInfo.order_no) || dispatchOrderNo || null;
            // also expose procurement lot id/name if the client wants it
            if (procurementLot) {
              prod.procurement_lot =
                procurementLot.procurement_lot || procurementLot.id || null;
            }
          }
        }
      }

      let peeling_output = {
        count: peeling_count,
        rows: peelingsPlain,
      };

      resolve(peeling_output);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetSumQuantityByDispatchId = ({ id, dispatch_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!dispatch_id) {
        return reject({
          statusCode: 420,
          message: "Dispatch ID field must not be empty!",
        });
      }

      let where = {
        dispatch_id,
        is_active: true,
      };

      if (id) {
        where.id = {
          [Op.ne]: id,
        };
      }

      const peeling = await models.Peeling.findOne({
        attributes: [
          [
            sequelize.fn("sum", sequelize.col("peeling_quantity")),
            "old_peeling_quantity",
          ],
        ],
        where,
        raw: true,
      });

      resolve(peeling);
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
          message: "Peeing ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const peeling = await models.Peeling.destroy({
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
