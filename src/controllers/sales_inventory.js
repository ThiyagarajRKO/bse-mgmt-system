import { Op } from "sequelize";
import models, { sequelize } from "../../models";

export const Get = ({ id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!id) {
        return reject({
          statusCode: 420,
          message: "Inventory ID field must not be empty!",
        });
      }

      const inventory = await models.SalesInventory.findOne({
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
          { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
        ];
      }

      const inventories = await models.SalesInventory.findAndCountAll({
        attributes: ["id", "quantity", "packing_id", "product_master_id"],
        include: [
          {
            attributes: ["id"],
            model: models.Packing,
            required: false,
          },
          {
            attributes: [
              "id",
              "product_name",
              "product_category_master_id",
              "size_master_id",
            ],
            model: models.ProductMaster,
            required: false,
          },
        ],
        where,
        offset: start,
        limit: length,
        order: [["created_at", "desc"]],
        raw: false,
        subQuery: false,
      });

      // Enrich with category and species data separately
      const enrichedRows = await Promise.all(
        inventories.rows.map(async (row) => {
          const plainRow = row.get ? row.get({ plain: true }) : row;

          if (plainRow.ProductMaster?.product_category_master_id) {
            try {
              const category = await models.ProductCategoryMaster.findOne({
                where: {
                  id: plainRow.ProductMaster.product_category_master_id,
                },
                attributes: ["id", "product_category", "species_master_id"],
                include: [
                  {
                    model: models.SpeciesMaster,
                    attributes: ["id", "species_name"],
                    required: false,
                  },
                ],
              });
              if (category) {
                plainRow.ProductMaster.ProductCategoryMaster = category.get
                  ? category.get({ plain: true })
                  : category;
              }
            } catch (err) {
              console.warn("Error fetching category:", err.message);
            }
          }

          if (plainRow.ProductMaster?.size_master_id) {
            try {
              const size = await models.SizeMaster.findOne({
                where: { id: plainRow.ProductMaster.size_master_id },
                attributes: ["id", "size"],
              });
              if (size) {
                plainRow.ProductMaster.SizeMaster = size.get
                  ? size.get({ plain: true })
                  : size;
              }
            } catch (err) {
              console.warn("Error fetching size:", err.message);
            }
          }

          return plainRow;
        })
      );

      resolve({
        rows: enrichedRows,
        count: inventories.count,
      });
    } catch (err) {
      reject(err);
    }
  });
};
