import { Op } from "sequelize";
import models from "../../models";

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Inventory ID field must not be empty!",
        });
      }

      const inventory = await models.PurchaseInventory.findOne({
        where: {
          id,
          is_active: true,
        },
      });

      resolve(inventory);
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

      if (search) {
        where[Op.or] = [
          sequelize.where(
            sequelize.cast(
              sequelize.col("procurement_product_type"),
              "varchar"
            ),
            {
              [Op.iLike]: `%${search}%`,
            }
          ),
          // {
          //   "$ProcurementProducts.ProcurementLots.procurement_lot$": {
          //     [Op.iLike]: `%${search}%`,
          //   },
          // },
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const inventories = await models.PurchaseInventory.findAndCountAll({
        attributes: ["id", "procurement_product_type", "quantity"],
        include: [
          {
            attributes: ["id"],
            model: models.ProcurementProducts,
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
            include: [
              {
                attributes: ["id", "product_category"],
                model: models.ProductCategoryMaster,
                where: {
                  is_active: true,
                },
                include: [
                  {
                    attributes: ["id", "species_name"],
                    model: models.SpeciesMaster,
                    where: {
                      is_active: true,
                    },
                  },
                ],
              },
              {
                required: false,
                attributes: ["id", "size"],
                model: models.SizeMaster,
                where: {
                  is_active: true,
                },
              },
            ],
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
      });

      resolve(inventories);
    } catch (err) {
      reject(err);
    }
  });
};
