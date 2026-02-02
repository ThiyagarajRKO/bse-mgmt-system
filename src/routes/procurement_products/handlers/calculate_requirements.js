import { RawMaterialCalculator } from "../../../services/raw_material_calculator";

export const CalculateRequirements = (
  {
    productId,
    quantityRequired,
    speciesId,
    productCategoryId,
    productForm,
    processingType,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!productId) {
        return reject({
          statusCode: 420,
          message: "Product ID is required",
        });
      }

      if (!quantityRequired || quantityRequired <= 0) {
        return reject({
          statusCode: 420,
          message: "Valid quantity required (> 0)",
        });
      }

      const result =
        await RawMaterialCalculator.calculateRawMaterialRequirements({
          productId,
          quantityRequired: parseFloat(quantityRequired),
          speciesId,
          productCategoryId,
          productForm: productForm || "FRESH",
          processingType: processingType || "RAW",
        });

      if (result.success) {
        resolve({
          statusCode: 200,
          message: "Raw material requirements calculated successfully",
          data: result.data,
        });
      } else {
        resolve({
          statusCode: 200,
          message: "Calculation completed with defaults",
          data: result.data,
          warning: result.error,
        });
      }
    } catch (err) {
      fastify.log.error("CalculateRequirements Error:", err);
      reject({
        statusCode: 500,
        message: err.message || "Failed to calculate requirements",
      });
    }
  });
};

export const GetMultiCategoryRecommendations = (
  { productId, quantityRequired, speciesId },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!productId) {
        return reject({
          statusCode: 420,
          message: "Product ID is required",
        });
      }

      if (!quantityRequired || quantityRequired <= 0) {
        return reject({
          statusCode: 420,
          message: "Valid quantity required (> 0)",
        });
      }

      const result =
        await RawMaterialCalculator.getMultiCategoryRecommendations({
          productId,
          quantityRequired: parseFloat(quantityRequired),
          speciesId,
        });

      resolve({
        statusCode: 200,
        message: "Multi-category recommendations generated",
        data: result.data,
        total: result.data.length,
      });
    } catch (err) {
      fastify.log.error("GetMultiCategoryRecommendations Error:", err);
      reject({
        statusCode: 500,
        message: err.message || "Failed to get recommendations",
      });
    }
  });
};
