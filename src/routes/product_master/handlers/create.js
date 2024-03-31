import { ProductMaster, ProductCategoryMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    species_master_id,
    product_category_master_id,
    product_category,
    size_master_ids,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let product_category_data = {};

      if (!product_category_master_id && !product_category) {
        return reject({
          statusCode: 420,
          message: "Invalid product category",
        });
      }

      if (!product_category_master_id) {
        if (!species_master_id) {
          return reject({
            statusCode: 420,
            message: "Species master id must not be empty",
          });
        }
        product_category_data = await ProductCategoryMaster.Insert(profile_id, {
          product_category,
          species_master_id,
          is_active: true,
        });
      }

      if (Array.isArray(size_master_ids) && size_master_ids.length > 0) {
        Promise.all(
          size_master_ids.forEach((size_master_id) => {
            ProductMaster.Insert(profile_id, {
              product_category_master_id:
                product_category_master_id || product_category_data?.id,
              size_master_id: size_master_id,
              is_active: true,
            }).catch(console.log);
          })
        );
      } else {
        await ProductMaster.Insert(profile_id, {
          product_category_master_id:
            product_category_master_id || product_category_data?.id,
          is_active: true,
        }).catch((err) => {
          resolve({
            message: err?.message,
          });
        });
      }

      resolve({
        message: "Products have been inserted successfully",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
