import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (profile_id, peeling_data, is_product_included) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeling_data?.dispatch_id) {
        return reject({
          statusCode: 420,
          message: "Dispatch id must not be empty!",
        });
      }

      if (!peeling_data?.unit_master_id) {
        return reject({
          statusCode: 420,
          message: "Unit data must not be empty!",
        });
      }

      let options = {};
      if (is_product_included) {
        options = {
          include: [
            {
              profile_id,
              model: models.PeelingProducts,
            },
          ],
        };
      }

      const result = await models.Peeling.create(peeling_data, {
        profile_id,
        ...options,
      });
      resolve(result);
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

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_quantity"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_method"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
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
                "Dispatch.ProcurementProduct.ProductMaster.product_name"
              ),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatch.ProcurementProduct.procurement_product_type"
              ),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatch.ProcurementProduct.VendorMaster.vendor_name"
              ),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          { "$UnitMaster.unit_code$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const peeling_count = await models.Peeling.count({
        subQuery: false,
        include: [
          {
            attributes: [],
            model: models.Dispatches,
            include: [
              {
                attributes: [],
                model: models.ProcurementProducts,
                include: [
                  {
                    attributes: [],
                    model: models.ProcurementLots,
                    where: procurementLotsWhere,
                  },
                  {
                    attributes: [],
                    model: models.ProductMaster,
                    where: {
                      is_active: true,
                    },
                  },
                  {
                    attributes: [],
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
            ],
            where: {
              is_active: true,
            },
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
          "peeling_quantity",
          "peeling_method",
          "created_at",
          [
            sequelize.literal(
              `(SELECT SUM(yield_quantity) FROM peeling_products peps WHERE peps.peeling_id = "Peeling".id and peps.is_active = true)`
            ),
            "total_yield_quantity",
          ],
        ],
        include: [
          {
            attributes: ["id", "dispatch_quantity"],
            model: models.Dispatches,
            include: [
              {
                attributes: ["id", "procurement_product_type"],
                model: models.ProcurementProducts,
                include: [
                  {
                    attributes: ["id", "procurement_lot"],
                    model: models.ProcurementLots,
                    where: procurementLotsWhere,
                  },
                  {
                    attributes: ["product_name"],
                    model: models.ProductMaster,
                    where: {
                      is_active: true,
                    },
                  },
                  {
                    attributes: ["vendor_name"],
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
        //   "Dispatch->ProcurementProduct->VendorMaster.id",
        // ],
      });

      let peeling_output = {
        count: peeling_count,
        rows: peelings,
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
