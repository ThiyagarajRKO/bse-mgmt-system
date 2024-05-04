import models from "../../models";

export const BulkUpsert = async (
  profile_id,
  price_list_product_master_data
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const result = await models.PriceListProductMaster.bulkCreate(
        price_list_product_master_data,
        {
          updateOnDuplicate: [
            "price_list_master_id",
            "product_master_id",
            "price_value",
          ],
          profile_id,
        }
      );
      resolve(result);
    } catch (err) {
      if (err?.name == "SequelizeUniqueConstraintError") {
        return reject({
          statusCode: 420,
          message: "Price list product data already exists!",
        });
      }
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
          message: "Price list product master id field must not be empty!",
        });
      }

      if (!profile_id) {
        return reject({
          statusCode: 420,
          message: "user id must not be empty!",
        });
      }

      const price_list = await models.PriceListProductMaster.destroy({
        where: {
          id,
          is_active: true,
          created_by: profile_id,
        },
        individualHooks: true,
        profile_id,
      });

      resolve(price_list);
    } catch (err) {
      reject(err);
    }
  });
};
