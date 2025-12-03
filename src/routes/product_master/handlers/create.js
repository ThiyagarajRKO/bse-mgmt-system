import { ProductMaster, ProductCategoryMaster } from "../../../controllers";

export const Create = (
  {
    profile_id,
    species_master_id,
    product_category_master_id,
    product_category,
    grade_master_id,
    size_master_id,
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

      // Support both singular and plural formats
      const sizeMasterIds =
        size_master_ids || (size_master_id ? [size_master_id] : []);

      if (Array.isArray(sizeMasterIds) && sizeMasterIds.length > 0) {
        await Promise.all(
          sizeMasterIds.map((sizeId) => {
            return ProductMaster.Insert(profile_id, {
              product_category_master_id:
                product_category_master_id || product_category_data?.id,
              grade_master_id,
              size_master_id: sizeId,
              is_active: true,
            });
          })
        );
      } else {
        await ProductMaster.Insert(profile_id, {
          product_category_master_id:
            product_category_master_id || product_category_data?.id,
          grade_master_id,
          is_active: true,
        });
      }

      resolve({
        statusCode: 200,
        message: "Products have been inserted successfully",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
