import { Op } from "sequelize";
import models, { sequelize } from "../../models";
import { PeeledDispatches } from ".";

export const Insert = async (profile_id, peeled_dispatch_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeled_dispatch_data?.peeled_product_id) {
        return reject({
          statusCode: 420,
          message: "Peeled product data must not be empty!",
        });
      }

      // infer order_id from peeled product if caller did not provide one
      if (
        !peeled_dispatch_data.order_id &&
        peeled_dispatch_data.peeled_product_id
      ) {
        const pp = await models.PeelingProducts.findOne({
          attributes: ["order_id"],
          where: {
            id: peeled_dispatch_data.peeled_product_id,
            is_active: true,
          },
          raw: true,
        });
        if (pp && pp.order_id) {
          peeled_dispatch_data.order_id = pp.order_id;
        }
      }

      const result = await models.PeeledDispatches.create(
        peeled_dispatch_data,
        {
          profile_id,
        },
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Peeled dispatch data already exists!",
        });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, peeled_dispatch_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Peeled Dispatch id must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeled_dispatch_data) {
        return reject({
          statusCode: 420,
          message: "Peeled dispatch product data must not be empty!",
        });
      }

      const result = await models.PeeledDispatches.update(
        peeled_dispatch_data,
        {
          where: {
            id,
            is_active: true,
          },
          individualHooks: true,
          profile_id,
        },
      );
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
          message: "Peeled Dispatch Product ID field must not be empty!",
        });
      }

      const peeling = await models.PeeledDispatches.findOne({
        where: {
          id,
          is_active: true,
        },
        include: [
          {
            model: models.QAChecklist,
            as: "qaCheck",
            required: false,
            attributes: ["id", "status", "qa_record_no", "inspection_date"],
          },
        ],
      });

      resolve(peeling);
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
            sequelize.cast(
              sequelize.col("peeled_dispatch_quantity"),
              "varchar",
            ),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("temperature"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          { peeled_delivery_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("delivery_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            },
          ),
          {
            "$PeelingProducts->ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
          { "$VehicleMaster.vehicle_number$": { [Op.iLike]: `%${search}%` } },
          { "$DriverMaster.driver_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const peeled_dispatches_count = await models.PeeledDispatches.count({
        raw: true,
        subQuery: false,
        include: [
          {
            as: "pp",
            model: models.PeelingProducts,
            attributes: ["id"],
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
                            attributes: [],
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
                where: {
                  is_active: true,
                },
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
            model: models.VehicleMaster,
            attributes: [],
            where: {
              is_active: true,
            },
          },
          {
            model: models.DriverMaster,
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

      const peeled_dispatches_rows = await models.PeeledDispatches.findAll({
        subQuery: false,
        attributes: [
          "id",
          "order_id",
          "created_at",
          "peeled_dispatch_quantity",
          "temperature",
          "delivery_notes",
          "delivery_status",
          [
            sequelize.literal(
              `(SELECT procurement_lot FROM procurement_lots WHERE id = (SELECT procurement_lot_id FROM procurement_products WHERE id = (SELECT dispatch_id FROM "peeling" WHERE id = (SELECT peeling_id FROM peeling_products WHERE id = "PeeledDispatches"."peeled_product_id" AND is_active = true) AND is_active = true) AND is_active = true) AND is_active = true LIMIT 1)`,
            ),
            "procurement_lot",
          ],
          [
            sequelize.literal(
              `(SELECT SUM(yield_quantity) FROM peeling_products WHERE id = "PeeledDispatches"."peeled_product_id" AND is_active = true)`,
            ),
            "total_yield_quantity",
          ],
          // add latest QA status so front-end can color/link
          [
            sequelize.literal(`(
              SELECT qc.status
              FROM qa_checklist qc
              WHERE qc.id = "PeeledDispatches".qa_checklist_id
              ORDER BY qc.created_at DESC
              LIMIT 1
            )`),
            "qa_status",
          ],
        ],
        include: [
          {
            as: "pp",
            model: models.PeelingProducts,
            attributes: ["id", "yield_quantity"],
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
                            attributes: [],
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
                where: {
                  is_active: true,
                },
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
            model: models.VehicleMaster,
            attributes: ["id", "vehicle_number"],
            where: {
              is_active: true,
            },
          },
          {
            model: models.DriverMaster,
            attributes: ["id", "driver_name"],
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
          "PeeledDispatches.id",
          "pp.id",
          "pp->ProductMaster.id",
          "UnitMaster.id",
          "VehicleMaster.id",
          "DriverMaster.id",
        ],
      });

      let data = {
        count: peeled_dispatches_count,
        rows: peeled_dispatches_rows,
      };

      resolve(data);
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

      const dispatch = await models.PeeledDispatches.findOne({
        attributes: ["peeled_dispatch_quantity"],
        where: {
          id,
          is_active: true,
        },
      });

      resolve(dispatch);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetDestinations = ({
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

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }

      const peeled_dispatch = await models.PeeledDispatches.findAll({
        subQuery: false,
        attributes: [
          "id",
          "created_at",
          "peeled_dispatch_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(peeled_dispatch_quantity) IS NULL THEN 0 ELSE SUM(peeled_dispatch_quantity) END)`,
            ),
            "peeled_dispatch_quantity",
          ],
        ],
        include: [
          {
            as: "pp",
            model: models.PeelingProducts,
            attributes: ["id"],
            where: {
              is_active: true,
            },
            include: [
              {
                as: "pln",
                model: models.Peeling,
                attributes: ["id"],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    as: "dis",
                    model: models.Dispatches,
                    attributes: ["id"],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        as: "pp",
                        model: models.ProcurementProducts,
                        attributes: ["id"],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
                            model: models.UnitMaster,
                            attributes: ["id", "unit_code"],

                            where: {
                              is_active: true,
                              unit_type: "Peeling Center",
                            },
                          },
                        ],
                        include: [
                          {
                            model: models.ProcurementLots,
                            where: procurementLotsWhere,
                            attributes: ["id", "procurement_lot"],
                            where: {
                              is_active: true,
                            },
                          },
                          {
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
                ],
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "PeelingDispatch.id",
          "pp.id",
          "pln->dis.id",
          "pln->dis->pp.id",
          "pln->dis->pp->pl.id",
          "pln->dis->pp->ProductMaster.id",
          "pln.id",
          "UnitMaster.id",
        ],
      });

      resolve(peeled_dispatch);
    } catch (err) {
      reject(err);
    }
  });
};

export const GetProductNames = ({
  procurement_lot_id,
  packing_id,
  start = 0,
  length = 10,
  search,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let where = {
        is_active: true,
      };

      let procurementLotsWhere = {
        is_active: true,
      };

      if (procurement_lot_id) {
        procurementLotsWhere.id = procurement_lot_id;
      }
      const packings = await models.PeeledDispatches.findAll({
        subQuery: false,
        attributes: [
          "id",
          "created_at",
          "peeled_dispatch_quantity",
          [
            sequelize.literal(`
            (SELECT
              CASE
                WHEN SUM(packing_quantity) IS NULL THEN 0
                ELSE SUM(packing_quantity)
              END
            FROM "packing"
            WHERE
              peeled_dispatch_id = "PeeledDispatches"."id" AND
              ${
                packing_id != "null" && packing_id != undefined
                  ? "id != '" + packing_id + "' and"
                  : ""
              }
              is_active = true
          )
          `),
            "packed_quantity",
          ],
        ],
        include: [
          {
            attributes: ["id"],
            as: "pp",
            model: models.PeelingProducts,
            where: { is_active: true },
            include: [
              {
                attributes: [],
                as: "pln",
                model: models.Peeling,
                where: { is_active: true },
                include: [
                  {
                    as: "dis",
                    model: models.Dispatches,
                    attributes: [],
                    where: { is_active: true },
                    include: [
                      {
                        as: "pp",
                        model: models.ProcurementProducts,
                        attributes: [],
                        include: [
                          {
                            as: "pl",
                            model: models.ProcurementLots,
                            attributes: [],
                            where: procurementLotsWhere,
                          },
                        ],
                        where: {
                          is_active: true,
                        },
                      },
                    ],
                  },
                ],
              },
              {
                attributes: ["id", "product_name"],
                model: models.ProductMaster,
                where: { is_active: true },
              },
            ],
          },
        ],
        where,
        group: [
          "PeeledDispatches.id",
          "pp.id",
          "pp->pln.id",
          "pp->pln->dis.id",
          "pp->pln->dis->pp.id",
          "pp->ProductMaster.id",
        ],
      });

      resolve(packings);
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
