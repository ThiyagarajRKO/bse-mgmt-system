import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (profile_id, dispatch_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!dispatch_data?.procurement_product_id) {
        return reject({
          statusCode: 420,
          message: "Procurement data must not be empty!",
        });
      }

      if (!dispatch_data?.unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Unit data must not be empty!",
        });
      }

      if (!dispatch_data?.vehicle_master_id) {
        return reject({
          statusCode: 420,
          message: "Vehicle details must not be empty!",
        });
      }

      if (!dispatch_data?.driver_master_id) {
        return reject({
          statusCode: 420,
          message: "Driver details must not be empty!",
        });
      }

      const result = await models.Dispatches.create(dispatch_data, {
        profile_id,
      });
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({ statusCode: 420, message: "Dispatch already exists!" });
      }
      reject(err);
    }
  });
};

export const Update = async (profile_id, id, dispatch_data) => {
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

      if (!dispatch_data) {
        return reject({
          statusCode: 420,
          message: "Dispatch data must not be empty!",
        });
      }

      const result = await models.Dispatches.update(dispatch_data, {
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      const dispatch = await models.Dispatches.findOne({
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

      const product = await models.Dispatches.findOne({
        attributes: ["dispatch_quantity"],
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
            sequelize.cast(sequelize.col("dispatch_quantity"), "varchar"),
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
          { delivery_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("delivery_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$ProcurementProduct->ProductMaster.product_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          sequelize.where(
            sequelize.cast(
              sequelize.col("ProcurementProduct.procurement_product_type"),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          {
            "$ProcurementProduct->VendorMaster.vendor_name$": {
              [Op.iLike]: `%${search}%`,
            },
          },
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
          { "$VehicleMaster.vehicle_number$": { [Op.iLike]: `%${search}%` } },
          { "$DriverMaster.driver_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const dispatchs = await models.Dispatches.findAndCountAll({
        include: [
          {
            attributes: [
              "id",
              "procurement_quantity",
              "adjusted_quantity",
              "procurement_product_type",
            ],
            model: models.ProcurementProducts,
            include: [
              {
                attributes: ["id", "procurement_lot"],
                model: models.ProcurementLots,
                where: procurementLotsWhere,
              },
              {
                attributes: ["id", "product_name"],
                model: models.ProductMaster,
                where: {
                  is_active: true,
                },
              },
              {
                attributes: ["id", "vendor_name"],
                model: models.VendorMaster,
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
            attributes: ["id", "unit_code"],
            model: models.UnitMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "vehicle_number"],
            model: models.VehicleMaster,
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "driver_name"],
            model: models.DriverMaster,
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

      const dispatchs = await models.Dispatches.findAll({
        subQuery: false,
        attributes: ["id"],
        include: [
          {
            required: true,
            attributes: [],
            model: models.ProcurementProducts,
            include: [
              {
                required: true,
                attributes: [],
                model: models.ProcurementLots,
                where: procurementLotsWhere,
              },
            ],
            where: {
              is_active: true,
            },
          },
          {
            attributes: ["id", "unit_code"],
            model: models.UnitMaster,
            where: {
              is_active: true,
              unit_type: "Peeling Center",
            },
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["Dispatches.id", "UnitMaster.id"],
      });

      resolve(dispatchs);
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

      const procurements = await models.Dispatches.findAll({
        subQuery: false,
        attributes: [
          "id",
          "dispatch_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(peeling_quantity) IS NULL THEN 0 ELSE SUM(peeling_quantity) END FROM peeling WHERE ${
                peeling_id != "null" && peeling_id != undefined
                  ? "id != '" + peeling_id + "' and"
                  : ""
              } dispatch_id = "Dispatches".id and peeling.is_active = true)`
            ),
            "peeling_quantity",
          ],
        ],
        include: [
          {
            required: true,
            attributes: ["procurement_product_type"],
            model: models.ProcurementProducts,
            include: [
              {
                required: true,
                attributes: [],
                model: models.ProcurementLots,
                where: procurementLotsWhere,
              },
              {
                requried: true,
                attributes: ["id", "product_name"],
                model: models.ProductMaster,
                include: [
                  {
                    required: true,
                    // attributes: ["id", "species_master_id"],
                    model: models.ProductCategoryMaster,
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
                attributes: ["id", "vendor_name"],
                model: models.VendorMaster,
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
          "Dispatches.id",
          "ProcurementProduct.id",
          "ProcurementProduct->ProductMaster.id",
          "ProcurementProduct->ProductMaster->ProductCategoryMaster.id",
          // "ProcurementProduct->ProductMaster->ProductCategoryMaster->SpeciesMaster.id",
          "ProcurementProduct->VendorMaster.id",
        ],
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
          message: "Dispatch ID field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const dispatch = await models.Dispatches.destroy({
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
