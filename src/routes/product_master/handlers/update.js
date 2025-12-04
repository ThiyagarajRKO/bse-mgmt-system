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
      if (!product_master_id) {
        return reject({
          statusCode: 420,
          message: "Product ID is required for update",
        });
      }

      if (!product_master_data) {
        return reject({
          statusCode: 420,
          message: "Product data is required for update",
        });
      }

      // Build update object with only the fields from product_master_data
      const updateData = {};

      if (product_master_data.product_category_master_id) {
        updateData.product_category_master_id =
          product_master_data.product_category_master_id;
      }

      if (product_master_data.species_master_id) {
        updateData.species_master_id = product_master_data.species_master_id;
      }

      if (product_master_data.grade_master_id) {
        updateData.grade_master_id = product_master_data.grade_master_id;
      }

      if (product_master_data.size_master_id) {
        updateData.size_master_id = product_master_data.size_master_id;
      }

      const updated_data = await ProductMaster.Update(
        profile_id,
        product_master_id,
        updateData
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
      reject({
        statusCode: 500,
        message: err?.message || "Failed to update product",
        error: err,
      });
    }
  });
};
