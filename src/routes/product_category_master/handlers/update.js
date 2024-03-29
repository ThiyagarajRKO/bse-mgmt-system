import { ProductCategoryMaster, LocationMaster } from "../../../controllers";

export const Update = (
  { profile_id, product_category_master_id, product_category_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (product_category_master_data?.species_master_id) {
        const species_count = await SpeciesMaster.Count({
          id: product_category_master_data?.species_master_id,
        });

        if (species_count == 0) {
          return reject({
            statusCode: 420,
            message: "Invalid species master id!",
          });
        }
      }

      const updated_data = await ProductCategoryMaster.Update(
        profile_id,
        product_category_master_id,
        product_category_master_data
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
