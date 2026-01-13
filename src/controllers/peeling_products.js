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
              `(SELECT COALESCE(SUM(peeled_dispatch_quantity), 0) FROM peeled_dispatches pd WHERE pd.peeled_product_id = "PeelingProducts".id AND ${
                peeled_dispatch_id != "null" && peeled_dispatch_id != undefined
                  ? `pd.id != '${peeled_dispatch_id}' AND`
                  : ""
              } pd.is_active = true)`
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
            filtered.push(peeling);
            console.log(
              "  ✓ Added:",
              peeling.id,
              "Product:",
              peeling.ProductMaster?.product_name
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
