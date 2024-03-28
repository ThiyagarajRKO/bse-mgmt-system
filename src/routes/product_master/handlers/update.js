import {
  ProductMaster,
  ProductCategoryMaster,
  SizeMaster,
} from "../../../controllers";

export const Update = (
  { profile_id, product_master_id, product_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (product_master_data?.product_category_aster_id) {
        const product_category_count = await ProductCategoryMaster.Count({
          id: product_master_data?.product_category_aster_id,
        });

        if (product_category_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid product category master id!",
          });
        }
      }

      if (product_master_data?.size_master_id) {
        const size_count = await SizeMaster.Count({
          id: product_master_data?.size_master_id,
        });

        if (size_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid size master master id!",
          });
        }
      }

      await ProductCategoryMaster.Update(
        profile_id,
        product_master_data?.product_category_id,
        {
          product_category: product_master_data?.product_category,
          species_master_id: product_master_data?.species_master_id,
        }
      );

      const updated_data = await ProductMaster.Update(
        profile_id,
        product_master_id,
        {
          size_master_id: product_master_data?.size_master_ids[0],
        }
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "Product master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "Product master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
