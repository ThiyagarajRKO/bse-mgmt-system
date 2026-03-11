import { Op } from "sequelize";
import models, { Sequelize, sequelize } from "../../models";

export const Insert = async (profile_id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data?.procurement_date) {
        return reject({
          statusCode: 420,
          message: "Purchase date must not be empty!",
        });
      }

      if (!procurement_data?.unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Purchase unit id must not be empty!",
        });
      }

      const result = await models.ProcurementLots.create(procurement_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Purchase already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, procurement_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Purchase id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!procurement_data) {
        return reject({
          statusCode: 420,
          message: "Purchase data must not be empty!",
        });
      }

      const result = await models.ProcurementLots.update(procurement_data, {
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

export const Get = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_date) {
        where.procurement_date = new Date(procurement_date);
      }

      if (unit_master_id) {
        where.unit_master_id = unit_master_id;
      }

      const lot = await models.ProcurementLots.findOne({
        include: [
          {
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
          {
            required: false,
            model: models.ProcurementProducts,
            where: {
              is_active: true,
            },
          },
        ],
        where,
      });

      resolve(lot);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetAll = ({
  procurement_date,
  procurement_lot,
  unit_master_name,
  start,
  length,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_date) {
        where.procurement_date = { [Op.iLike]: procurement_date };
      }

      if (procurement_lot) {
        where.procurement_lot = { [Op.iLike]: procurement_lot };
      }

      let unitWhere = {
        is_active: true,
      };

      if (unit_master_name) {
        unitWhere.unit_name = { [Op.iLike]: unit_master_name };
      }

      const procurements = await models.ProcurementLots.findAndCountAll({
        include: [
          {
            model: models.UnitMaster,
            where: unitWhere,
          },
          {
            required: false,
            model: models.ProcurementProducts,
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

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const CountStats = ({ procurement_lot_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Build where clause for filtering
      let whereClause = `WHERE 1=1`;
      if (procurement_lot_id) {
        whereClause += ` AND procurement_lot_id = '${procurement_lot_id}'`;
      }

      // Use subqueries with DISTINCT d.id to avoid JOIN multiplication
      const statsQuery = `
        SELECT 
          COALESCE((SELECT SUM(procurement_quantity) FROM procurement_products pp ${whereClause} AND pp.is_active = true), 0) as total_purchased_weight,
          COALESCE((SELECT SUM(d.dispatch_quantity) FROM (SELECT DISTINCT d.id, d.dispatch_quantity FROM dispatches d JOIN procurement_products pp ON pp.id = d.procurement_product_id WHERE d.dispatch_quantity IS NOT NULL ${procurement_lot_id ? `AND pp.procurement_lot_id = '${procurement_lot_id}'` : ""} AND d.is_active = true) d), 0) as total_dispatched_weight,
          COALESCE((SELECT SUM(p.peeling_quantity) FROM (SELECT DISTINCT p.id, p.peeling_quantity FROM peeling p JOIN dispatches d ON p.dispatch_id = d.id JOIN procurement_products pp ON pp.id = d.procurement_product_id WHERE p.peeling_quantity IS NOT NULL ${procurement_lot_id ? `AND pp.procurement_lot_id = '${procurement_lot_id}'` : ""} AND p.is_active = true AND d.is_active = true) p), 0) as total_peeled_weight,
          COALESCE((SELECT SUM(pd.peeled_dispatch_quantity) FROM (SELECT DISTINCT pd.id, pd.peeled_dispatch_quantity FROM peeled_dispatches pd JOIN peeling_products pp2 ON pp2.id = pd.peeled_product_id JOIN peeling p ON p.id = pp2.peeling_id JOIN dispatches d ON d.id = p.dispatch_id JOIN procurement_products pp ON pp.id = d.procurement_product_id WHERE pd.peeled_dispatch_quantity IS NOT NULL ${procurement_lot_id ? `AND pp.procurement_lot_id = '${procurement_lot_id}'` : ""} AND pd.is_active = true AND pp2.is_active = true AND p.is_active = true AND d.is_active = true) pd), 0) as total_peeled_dispatched_weight,
          COALESCE((SELECT SUM(pkg.packing_quantity) FROM (SELECT DISTINCT pkg.id, pkg.packing_quantity FROM packing pkg JOIN peeled_dispatches pd ON pd.id = pkg.peeled_dispatch_id JOIN peeling_products pp2 ON pp2.id = pd.peeled_product_id JOIN peeling p ON p.id = pp2.peeling_id JOIN dispatches d ON d.id = p.dispatch_id JOIN procurement_products pp ON pp.id = d.procurement_product_id WHERE pkg.packing_quantity IS NOT NULL ${procurement_lot_id ? `AND pp.procurement_lot_id = '${procurement_lot_id}'` : ""} AND pkg.is_active = true AND pd.is_active = true AND pp2.is_active = true AND p.is_active = true AND d.is_active = true) pkg), 0) as total_packed_weight
      `;

      const stats = await sequelize.query(statsQuery, {
        type: sequelize.QueryTypes.SELECT,
      });

      const result =
        stats && stats.length > 0
          ? stats[0]
          : {
              total_purchased_weight: 0,
              total_dispatched_weight: 0,
              total_peeled_weight: 0,
              total_peeled_dispatched_weight: 0,
              total_packed_weight: 0,
            };

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

export const Count = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (id) {
        where.id = id;
      }

      if (procurement_date) {
        where.procurement_date = procurement_date;
      }

      if (unit_master_id) {
        where.unit_master_id = unit_master_id;
      }

      const lot = await models.ProcurementLots.count({
        where,
        raw: true,
      });

      resolve(lot);
    } catch (err) {
      reject(err);
    }
  });
};

export const CheckLot = ({ id, procurement_date, unit_master_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const lot = await models.ProcurementLots.count({
        where: {
          procurement_date: new Date(procurement_date),
          unit_master_id,
          id: {
            [Op.ne]: id,
          },
        },
        raw: true,
      });

      resolve(lot);
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
          message: "Purchase ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const procurement = await models.ProcurementLots.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(procurement);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetLots = ({ start = 0, length = 10 }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurements = await models.ProcurementLots.findAll({
        attributes: ["id", "procurement_lot"],
        where: {
          is_active: true,
        },
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPaymentLots = ({
  supplier_master_id,
  purchase_payment_id,
  start = 0,
  length = 10,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!supplier_master_id) {
        return reject({ message: "Supplier master data must not be empty" });
      }

      const procurements = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT SUM(pp.procurement_totalamount) FROM procurement_products pp WHERE pp.procurement_lot_id = "ProcurementLots".id AND pp.supplier_master_id = '${supplier_master_id}' AND pp.is_active = true)`,
            ),
            "total_amount",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pp.total_paid) FROM purchase_payments pp WHERE pp.procurement_lot_id = "ProcurementLots".id AND pp.supplier_master_id = '${supplier_master_id}' 
              ${
                purchase_payment_id != "null" &&
                purchase_payment_id != undefined &&
                purchase_payment_id != ""
                  ? "AND pp.id != '" + purchase_payment_id + "'"
                  : ""
              } AND pp.is_active = true)`,
            ),
            "total_paid",
          ],
        ],
        include: [
          {
            attributes: [],
            model: models.ProcurementProducts,
            where: {
              is_active: true,
              supplier_master_id,
            },
          },
        ],
        where: {
          is_active: true,
        },
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["ProcurementLots.id"],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetStats = ({
  procurement_lot_id,
  start = 0,
  length = 10,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("procurement_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementCount = await models.ProcurementLots.count({
        where,
        raw: true,
      });

      const procurementRows = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT COUNT(procurement_products.id) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`,
            ),
            "total_product_count",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(dispatches.id) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`,
            ),
            "total_dispatched_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`,
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`,
            ),
            "total_purchased_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_totalamount) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`,
            ),
            "total_purchased_price",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`,
            ),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_price) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`,
            ),
            "total_adjusted_price",
          ],
        ],
        where,
        offset: start,
        limit: length,
        order: [["procurement_date", "desc"]],
        group: ["ProcurementLots.id"],
      });

      const output = {
        count: procurementCount,
        rows: procurementRows,
      };

      resolve(output);
    } catch (err) {
      reject(err);
    }
  });
};

// --------------------------------------------------------------------------------
// ---------------------------------- Dispatch ------------------------------------
// --------------------------------------------------------------------------------

export const GetDispatchLots = ({ start = 0, length = 10 }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurements = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: ["id", "procurement_lot"],
        include: [
          {
            required: true,
            attributes: [],
            model: models.ProcurementProducts,
            include: [
              {
                required: true,
                attributes: [],
                model: models.Dispatches,
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
        where: {
          is_active: true,
        },
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetDispatchStats = ({
  procurement_lot_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {};

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("procurement_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementRows = await models.ProcurementLots.findAll({
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT COUNT(dispatches.id) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id)`,
            ),
            "total_dispatched_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id)`,
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id)`,
            ),
            "total_purchased_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id)`,
            ),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT ARRAY_AGG(DISTINCT sa.order_id) FROM sales_allocations sa WHERE sa.order_id IS NOT NULL AND sa.id IN (SELECT id FROM sales_allocations LIMIT 100))`,
            ),
            "order_ids",
          ],
        ],
        where,
        offset: parseInt(start) || 0,
        limit: parseInt(length) || 10,
        order: [["procurement_date", "desc"]],
        raw: true,
        subQuery: false,
      });

      console.log(
        "GetDispatchStats - procurementRows:",
        procurementRows?.length,
        "rows fetched",
      );
      if (procurementRows && procurementRows.length > 0) {
        console.log(
          "GetDispatchStats - First row sample:",
          JSON.stringify(procurementRows[0], null, 2),
        );
      }

      // Filter out rows where there are no dispatches
      const filteredRows = procurementRows.filter((row) => {
        const dispatchCount = row.total_dispatched_count || 0;
        return parseInt(dispatchCount) > 0;
      });

      console.log(
        "GetDispatchStats - filteredRows:",
        filteredRows?.length,
        "rows with dispatches",
      );

      const output = {
        count: filteredRows.length,
        rows: filteredRows,
      };

      console.log("GetDispatchStats - output:", output);
      resolve(output);
    } catch (err) {
      console.error("GetDispatchStats - error:", err);
      reject(err);
    }
  });
};

// --------------------------------------------------------------------------------
// ---------------------------------- Peeling -------------------------------------
// --------------------------------------------------------------------------------

export const GetPeeledLots = ({ start = 0, length = 10 }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurements = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: ["id", "procurement_lot"],
        include: [
          {
            attributes: ["id"],
            model: models.ProcurementProducts,
            include: [
              {
                attributes: ["id"],
                model: models.Dispatches,
                include: [
                  {
                    attributes: ["id"],
                    model: models.Peeling,
                    include: [
                      {
                        required: false,
                        attributes: [],
                        model: models.PeelingProducts,
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
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPeelingStats = ({
  procurement_lot_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("procurement_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementCount = await models.ProcurementLots.count({
        where: { is_active: true },
        // include: [
        //   {
        //     model: models.ProcurementProducts,
        //     where: {
        //       is_active: true,
        //     },
        //   },
        // ],
        raw: true,
      });

      const procurementRows = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`,
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(peeling.id) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`,
            ),
            "total_peeled_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(peeling_quantity) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`,
            ),
            "total_peeled_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(yield_quantity) FROM peeling_products peps JOIN peeling ON peps.peeling_id = peeling.id and peeling.is_active = true JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peps.is_active = true)`,
            ),
            "total_yield_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT ARRAY_AGG(DISTINCT sa.order_id) FROM sales_allocations sa WHERE sa.order_id IS NOT NULL AND sa.id IN (SELECT id FROM sales_allocations LIMIT 100))`,
            ),
            "order_ids",
          ],
        ],
        // include: [
        //   {
        //     attributes: ["id"],
        //     model: models.ProcurementProducts,
        //     where: {
        //       is_active: true,
        //     },
        //   },
        // ],
        where: {
          ...where,
          [Op.and]: [
            Sequelize.where(
              sequelize.literal(
                `(SELECT COUNT(peeling.id) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`,
              ),
              ">",
              0,
            ),
          ],
        },
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["ProcurementLots.id"],
      });

      const output = {
        count: procurementCount,
        rows: procurementRows,
      };

      resolve(output);
    } catch (err) {
      reject(err);
    }
  });
};
// ---------------------------------------------------------------------------------------
// ---------------------------------- Peeled Dispatch ------------------------------------
// ---------------------------------------------------------------------------------------

export const GetPeeledDispatchLots = ({ start = 0, length = 10 }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurements = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: ["id", "procurement_lot"],
        include: [
          {
            required: true,
            attributes: [],
            model: models.ProcurementProducts,
            include: [
              {
                required: true,
                attributes: [],
                model: models.Dispatches,
                include: [
                  {
                    required: true,
                    attributes: [],
                    model: models.Peeling,
                    include: [
                      {
                        required: true,
                        attributes: [],
                        model: models.PeelingProducts,
                        include: [
                          {
                            required: true,
                            attributes: [],
                            model: models.PeeledDispatches,
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
            where: {
              is_active: true,
            },
          },
        ],
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPeeledDispatchStats = ({
  procurement_lot_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: [
          Sequelize.where(
            sequelize.literal(
              `(SELECT
                  COUNT(pd.id) FROM peeled_dispatches pd
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            ">",
            0,
          ),
        ],
      };

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("peeled_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementCount = await models.ProcurementLots.count({
        where,
        raw: true,
      });

      const procurementRows = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT order_no FROM orders o WHERE id IN (
                SELECT DISTINCT order_id FROM order_products op 
                JOIN product_master pm ON pm.id = op.product_master_id
                WHERE pm.id IN (
                  SELECT DISTINCT product_master_id FROM procurement_products 
                  WHERE procurement_lot_id = "ProcurementLots".id
                )
              ) LIMIT 1)`,
            ),
            "order_no",
          ],
          [
            sequelize.literal(
              `(SELECT ARRAY_AGG(DISTINCT o.id) FROM orders o WHERE o.id IN (
                SELECT DISTINCT order_id FROM order_products op 
                JOIN product_master pm ON pm.id = op.product_master_id
                WHERE pm.id IN (
                  SELECT DISTINCT product_master_id FROM procurement_products 
                  WHERE procurement_lot_id = "ProcurementLots".id
                )
              ))`,
            ),
            "order_ids",
          ],
          [
            sequelize.literal(
              `(SELECT 
                  sum(p.peeling_quantity) FROM peeling p
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id=d.procurement_product_id and prp.is_active=true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_peeled_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT 
                  sum(pp.yield_quantity) FROM public.peeling_products pp
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_yield_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT
                  COUNT(pd.id) FROM peeled_dispatches pd
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_peeled_dispatch_count",
          ],
          [
            sequelize.literal(
              `(SELECT 
                  sum(pd.peeled_dispatch_quantity) FROM peeled_dispatches pd
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_peeled_dispatch_quantity",
          ],
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["ProcurementLots.id"],
      });

      const output = {
        count: procurementCount,
        rows: procurementRows,
      };

      resolve(output);
    } catch (err) {
      reject(err);
    }
  });
};

// ---------------------------------------------------------------------------------------
// ---------------------------------- Packing --------------------------------------------
// ---------------------------------------------------------------------------------------

export const GetPackingLots = ({ start = 0, length = 10 }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const procurements = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: ["id", "procurement_lot"],
        include: [
          {
            required: true,
            attributes: [],
            model: models.ProcurementProducts,
            include: [
              {
                required: true,
                attributes: [],
                model: models.Dispatches,
                include: [
                  {
                    required: true,
                    attributes: [],
                    model: models.Peeling,
                    include: [
                      {
                        required: true,
                        attributes: [],
                        model: models.PeelingProducts,
                        include: [
                          {
                            required: true,
                            attributes: [],
                            model: models.PeeledDispatches,

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
            where: {
              is_active: true,
            },
          },
        ],
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(procurements);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetPackingStats = ({
  procurement_lot_id,
  start,
  length,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
        [Op.and]: [
          Sequelize.where(
            sequelize.literal(
              `(SELECT
                  COUNT(pk.id) 
                FROM 
                  packing pk
                JOIN 
                  peeled_dispatches pd on pk.peeled_dispatch_id = pd.id and pd.is_active = true
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id and pp.is_active = true
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            ">",
            0,
          ),
        ],
      };

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("peeled_dispatched_date"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementCount = await models.ProcurementLots.count({
        where,
        raw: true,
      });

      const procurementRows = await models.ProcurementLots.findAll({
        subQuery: false,
        attributes: [
          "id",
          "procurement_date",
          "procurement_lot",
          [
            sequelize.literal(
              `(SELECT 
                  sum(p.peeling_quantity) 
                FROM 
                  peeling p
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id=d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_yield_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT 
                  sum(pp.yield_quantity) 
                FROM 
                  public.peeling_products pp
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_peeled_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT
                  COUNT(pd.id) 
                FROM
                  peeled_dispatches pd
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_packing_count",
          ],
          [
            sequelize.literal(
              `(SELECT 
                  sum(pd.peeled_dispatch_quantity) 
                FROM 
                  peeled_dispatches pd
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`,
            ),
            "total_packing_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT ARRAY_AGG(DISTINCT sa.order_id) FROM sales_allocations sa WHERE sa.order_id IS NOT NULL AND sa.id IN (SELECT id FROM sales_allocations LIMIT 100))`,
            ),
            "order_ids",
          ],
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["ProcurementLots.id"],
      });

      const output = {
        count: procurementCount,
        rows: procurementRows,
      };

      resolve(output);
    } catch (err) {
      reject(err);
    }
  });
};
