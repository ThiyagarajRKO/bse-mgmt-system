import { ProductCategoryMaster, SpeciesMaster } from "../../../controllers";

export const Create = (
  { profile_id, species_master_id, product_category },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const species_count = await SpeciesMaster.Count({
        id: species_master_id,
      });

      if (species_count == 0) {
        return reject({
          statusCode: 420,
          message: "Invalid species master id!",
        });
      }

      const product_master = await ProductCategoryMaster.Insert(profile_id, {
        species_master_id,
        product_category,
        is_active: true,
      });

      resolve({
        message: "Product category master has been inserted successfully",
        data: {
          product_master_id: product_master?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
