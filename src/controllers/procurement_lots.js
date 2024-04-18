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
      let where = {
        is_active: true,
      };

      if (procurement_lot_id) {
        where.id = procurement_lot_id;
      }

      const procurement = await models.ProcurementLots.findOne({
        subQuery: false,
        attributes: [
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.is_active = true)`
            ),
            "total_purchased_weight",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id=procurement_product_id and pp.is_active = true WHERE dispatches.is_active = true)`
            ),
            "total_dispatched_weight",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(peeling_quantity) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = procurement_product_id and pp.is_active = true WHERE peeling.is_active = true)`
            ),
            "total_peeled_weight",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(pd.peeled_dispatch_quantity)
                FROM peeled_dispatches pd
	              JOIN peeling_products pp on pp.id=pd.peeled_product_id and pp.is_active=true
	              JOIN peeling p on p.id=pp.peeling_id and p.is_active=true
	              JOIN dispatches d on d.id=p.dispatch_id and d.is_active=true
	              JOIN procurement_products prp on prp.id=d.procurement_product_id and prp.is_active=true
                )`
            ),
            "total_peeled_dispatched_weight",
          ],
        ],
        where,
      });

      resolve(procurement);
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
            }
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
              `(SELECT COUNT(procurement_products.id) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_product_count",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(dispatches.id) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
            ),
            "total_dispatched_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_purchased_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_price) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_purchased_price",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_adjusted_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_price) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
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
            }
          ),
          { procurement_lot: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const procurementCount = await models.ProcurementLots.count({
        where: {
          is_active: true,
          [Op.and]: [
            Sequelize.where(
              sequelize.literal(
                `(SELECT COUNT(dispatches.id) as total_dispatched_count FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
              ),
              ">",
              0
            ),
          ],
        },
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
              `(SELECT COUNT(dispatches.id) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
            ),
            "total_dispatched_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.procurement_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_purchased_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(procurement_products.adjusted_quantity) FROM procurement_products WHERE procurement_products.procurement_lot_id = "ProcurementLots".id and procurement_products.is_active = true)`
            ),
            "total_adjusted_quantity",
          ],
        ],
        where: {
          ...where,
          [Op.and]: [
            Sequelize.where(
              sequelize.literal(
                `(SELECT COUNT(dispatches.id) as total_dispatched_count FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
              ),
              ">",
              0
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
            }
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
              `(SELECT SUM(dispatches.dispatch_quantity) FROM dispatches JOIN procurement_products pp ON pp.id = dispatches.procurement_product_id WHERE pp.procurement_lot_id = "ProcurementLots".id and dispatches.is_active = true)`
            ),
            "total_dispatched_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT COUNT(peeling.id) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`
            ),
            "total_peeled_count",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(peeling_quantity) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`
            ),
            "total_peeled_quantity",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(yield_quantity) FROM peeling_products peps JOIN peeling ON peps.peeling_id = peeling.id and peeling.is_active = true JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peps.is_active = true)`
            ),
            "total_yield_quantity",
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
                `(SELECT COUNT(peeling.id) FROM peeling JOIN dispatches dp ON dp.id = peeling.dispatch_id and dp.is_active = true JOIN procurement_products pp ON pp.id = dp.procurement_product_id and pp.is_active = true WHERE pp.procurement_lot_id = "ProcurementLots".id and peeling.is_active = true)`
              ),
              ">",
              0
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            ">",
            0
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
            }
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
                  sum(p.peeling_quantity) FROM peeling p
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id=d.procurement_product_id and prp.is_active=true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
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
                  COUNT(pk.id) FROM packing pk
                  JOIN peeled_dispatches pd on pk.peeled_dispatch_id=pd.id
                JOIN
                  peeling_products pp ON pp.id = pd.peeled_product_id
	              JOIN 
                  peeling p on p.id = pp.peeling_id and p.is_active = true
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id = d.procurement_product_id and prp.is_active = true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            ">",
            0
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
            }
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
                  sum(p.peeling_quantity) FROM peeling p
	              JOIN 
                  dispatches d on d.id = p.dispatch_id and d.is_active = true
	              JOIN 
                  procurement_products prp on prp.id=d.procurement_product_id and prp.is_active=true
	              WHERE 
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            "total_yield_quantity",
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            "total_peeled_dispatched_quantity",
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            "total_packing_count",
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
                  prp.procurement_lot_id = "ProcurementLots".id and prp.is_active = true)`
            ),
            "total_packing_quantity",
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
