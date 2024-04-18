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

      const result = await models.PeeledDispatches.create(
        peeled_dispatch_data,
        {
          profile_id,
        }
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
        }
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
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("temperature"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { peeled_delivery_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("delivery_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
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
            model: models.PeelingProducts,
            attributes: ["id"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.Peeling,
                attributes: [],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Dispatches,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        model: models.ProcurementProducts,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
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
          "created_at",
          "peeled_dispatch_quantity",
          "temperature",
          "delivery_notes",
          "delivery_status",
          // [
          //   sequelize.literal(
          //     `(SELECT CASE WHEN SUM(yield_quantity) IS NULL THEN 0 ELSE SUM(yield_quantity) END FROM peeling_products WHERE id = "PeeledDispatches".peeled_product_id and is_active = true)`
          //   ),
          //   "total_yield_quantity",
          // ],
        ],
        include: [
          {
            model: models.PeelingProducts,
            attributes: ["id", "yield_quantity"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.Peeling,
                attributes: [],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Dispatches,
                    attributes: [],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
                        model: models.ProcurementProducts,
                        attributes: [],
                        where: {
                          is_active: true,
                        },
                        include: [
                          {
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
          "PeelingProduct.id",
          "PeelingProduct.ProductMaster.id",
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
              `(SELECT CASE WHEN SUM(peeled_dispatch_quantity) IS NULL THEN 0 ELSE SUM(peeled_dispatch_quantity) END)`
            ),
            "peeled_dispatch_quantity",
          ],
        ],
        include: [
          {
            model: models.PeelingProducts,
            attributes: ["id"],
            where: {
              is_active: true,
            },
            include: [
              {
                model: models.Peeling,
                attributes: ["id"],
                where: {
                  is_active: true,
                },
                include: [
                  {
                    model: models.Dispatches,
                    attributes: ["id"],
                    where: {
                      is_active: true,
                    },
                    include: [
                      {
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
          "PeelingProducts.id",
          "Peeling->Dispatch.id",
          "Peeling->Dispatch->ProcurementProduct.id",
          "Peeling->Dispatch->ProcurementProduct->ProcurementLot.id",
          "Peeling->Dispatch->ProcurementProduct->ProductMaster.id",
          "Peeling.id",
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
        procurementLotsWhere.procurement_lot_id = procurement_lot_id;
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
              is_active = true
          )
          `),
            "packed_quantity",
          ],
        ],
        include: [
          {
            attributes: ["id"],
            model: models.PeelingProducts,
            where: { is_active: true },
            include: [
              {
                attributes: [],
                model: models.Peeling,
                where: { is_active: true },
                include: [
                  {
                    model: models.Dispatches,
                    attributes: [],
                    where: { is_active: true },
                    include: [
                      {
                        model: models.ProcurementProducts,
                        attributes: [],
                        where: procurementLotsWhere,
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
          "PeelingProduct.id",
          "PeelingProduct->Peeling.id",
          "PeelingProduct->Peeling->Dispatch.id",
          "PeelingProduct->Peeling->Dispatch->ProcurementProduct.id",
          "PeelingProduct->ProductMaster.id",
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
