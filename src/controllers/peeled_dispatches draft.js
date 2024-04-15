import { Op } from "sequelize";
import models, { sequelize } from "../../models";

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
          message: "Peeled data must not be empty!",
        });
      }

      if (!peeled_dispatch_data?.unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Unit data must not be empty!",
        });
      }

      if (!peeled_dispatch_data?.vehicle_master_id) {
        return reject({
          statusCode: 420,
          message: "Vehicle details must not be empty!",
        });
      }

      if (!peeled_dispatch_data?.driver_master_id) {
        return reject({
          statusCode: 420,
          message: "Driver details must not be empty!",
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
        return reject({ statusCode: 420, message: "Dispatch already exists!" });
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
          message: "Dispatch id must not be empty!",
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
          message: "Dispatch data must not be empty!",
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      const dispatch = await models.PeeledDispatches.findOne({
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

export const GetQuantity = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Dispatch ID field must not be empty!",
        });
      }

      const product = await models.PeeledDispatches.findOne({
        attributes: ["peeled_dispatch_quantity"],
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

export const GetAll = ({ procurement_lot_id, start, length, search }) => {
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
            sequelize.cast(
              sequelize.col("peeled_dispatch_temperature"),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { delivery_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("delivery_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$PeelingProduct->Peeling->Dispatches->ProcurementProduct->ProductMaster.product_name$":
              {
                [Op.iLike]: `%${search}%`,
              },
          },
          {
            "$PeelingProduct->Peeling->Dispatches->$ProcurementProduct->UnitMaster.unit_code$":
              {
                [Op.iLike]: `%${search}%`,
              },
          },
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
          { "$VehicleMaster.vehicle_number$": { [Op.iLike]: `%${search}%` } },
          { "$DriverMaster.driver_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }
      const dispatchs = await models.PeeledDispatches.findAndCountAll({
        where,
        include,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(dispatchs);
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
        attributes: ["id"],
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
          "PeeledDispatches.id",
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

// Retrive Dispatched Products names, along with quantity
export const GetProductNames = ({
  procurement_lot_id,
  peeling_id,
  unit_master_id,
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

      let unitWhere = {
        is_active: true,
      };

      if (unit_master_id) {
        unitWhere.id = unit_master_id;
      }

      const peeled = await models.PeeledProducts.findAll({
        subQuery: false,
        attributes: [
          "id",
          "peeled_dispatch_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(peeled_dispatch_quantity) IS NULL THEN 0 ELSE SUM(peeled_dispatch_quantity) END FROM peeled_dispatch WHERE ${
                peeling_id != "null" ? "id != '" + peeling_id + "' and" : ""
              } peeled_dispatch_id = "PeeledProducts".id and peeled_dispatch.is_active = true)`
            ),
            "total_peeled_dispatch_quantity",
          ],
        ],
        include: [
          {
            required: true,
            attributes: [],
            model: models.UnitMaster,
            where: unitWhere,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: [
          "Peeling.id",
          "PeeledProducts.id",
          "PeeledProducts->ProductMaster.id",
          "PeeledProducts->ProductMaster->ProductCategoryMaster.id",
          // "ProcurementProduct->ProductMaster->ProductCategoryMaster->SpeciesMaster.id",
        ],
      });

      resolve(peeled);
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const dispatch = await models.PeeledDispatches.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(dispatch);
    } catch (err) {
      reject(err);
    }
  });
};
