import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Insert = async (profile_id, peeling_product_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      if (!peeling_product_data?.peeling_id) {
        return reject({
          statusCode: 420,
          message: "peeling data must not be empty!",
        });
      }

      const result = await models.PeelingProducts.create(peeling_product_data, {
        profile_id,
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

export const BulkUpsert = async (profile_id, peeling_product_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
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
          ],
          profile_id,
        }
      );
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

export const Update = async (profile_id, id, peeling_product_data) => {
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

      if (!peeling_product_data) {
        return reject({
          statusCode: 420,
          message: "Peeling product data must not be empty!",
        });
      }

      const result = await models.PeelingProducts.update(peeling_product_data, {
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
          message: "Peeling Product ID field must not be empty!",
        });
      }

      const peeling = await models.PeelingProducts.findOne({
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
            sequelize.cast(sequelize.col("yield_quantity"), "varchar"),
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
          { peeling_notes: { [Op.iLike]: `%${search}%` } },
          sequelize.where(
            sequelize.cast(sequelize.col("peeling_status"), "varchar"),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          sequelize.where(
            sequelize.cast(
              sequelize.col(
                "Dispatches.ProcurementProduct.ProductMaster.product_name"
              ),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
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

export const GetNames = ({
  procurement_lot_id,
  peeled_dispatch_id,
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

      const peelings = await models.PeelingProducts.findAll({
        attributes: [
          "id",
          "created_at",
          "yield_quantity",
          [
            sequelize.literal(
              `(SELECT CASE WHEN SUM(peeled_dispatch_quantity) IS NULL THEN 0 ELSE SUM(peeled_dispatch_quantity) END FROM peeled_dispatches pd WHERE pd.peeled_product_id = "PeelingProducts".id and ${
                peeled_dispatch_id != "null" && peeled_dispatch_id != undefined
                  ? "pd.id != '" + peeled_dispatch_id + "' and"
                  : ""
              } pd.is_active = true)`
            ),
            "peeled_quantity",
          ],
        ],
        include: [
          {
            attributes: [],
            model: models.Peeling,
            where: {
              is_active: true,
            },
            include: [
              {
                attributes: [],
                model: models.Dispatches,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    attributes: [],
                    model: models.ProcurementProducts,
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
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        group: ["PeelingProducts.id", "Peeling.id", "ProductMaster.id"],
      });

      resolve(peelings);
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
