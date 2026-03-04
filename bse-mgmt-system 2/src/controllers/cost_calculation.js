import CostCalculationService from "../services/cost_calculation.js";

/**
 * Cost Calculation Controller
 * Handles cost calculation API endpoints
 */

/**
 * Calculate carton cost
 * @param {Object} params - { primary_packaging_id, secondary_packaging_id, carton_id, units_per_carton, effective_date }
 * @returns {Promise} - Carton cost calculation result
 */
export const CalculateCartonCost = ({
  primary_packaging_id,
  secondary_packaging_id,
  carton_id,
  units_per_carton,
  effective_date,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!primary_packaging_id) {
        return reject({
          statusCode: 420,
          message: "Primary packaging ID must not be empty!",
        });
      }

      if (!carton_id) {
        return reject({
          statusCode: 420,
          message: "Carton ID must not be empty!",
        });
      }

      if (!units_per_carton || units_per_carton <= 0) {
        return reject({
          statusCode: 420,
          message: "Units per carton must be a positive number!",
        });
      }

      const result = await CostCalculationService.calculateCartonCost({
        primary_packaging_id,
        secondary_packaging_id,
        carton_id,
        units_per_carton,
        effective_date: effective_date ? new Date(effective_date) : new Date(),
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate pallet cost
 * @param {Object} params - { pallet_id, cartons_per_pallet, carton_cost_per_carton, strapping_cost, label_cost, effective_date }
 * @returns {Promise} - Pallet cost calculation result
 */
export const CalculatePalletCost = ({
  pallet_id,
  cartons_per_pallet,
  carton_cost_per_carton,
  strapping_cost,
  label_cost,
  effective_date,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!pallet_id) {
        return reject({
          statusCode: 420,
          message: "Pallet ID must not be empty!",
        });
      }

      if (!cartons_per_pallet || cartons_per_pallet <= 0) {
        return reject({
          statusCode: 420,
          message: "Cartons per pallet must be a positive number!",
        });
      }

      if (carton_cost_per_carton === undefined || carton_cost_per_carton < 0) {
        return reject({
          statusCode: 420,
          message: "Carton cost per carton must be a valid number!",
        });
      }

      const result = await CostCalculationService.calculatePalletCost({
        pallet_id,
        cartons_per_pallet,
        carton_cost_per_carton,
        strapping_cost: strapping_cost || 0,
        label_cost: label_cost || 0,
        effective_date: effective_date ? new Date(effective_date) : new Date(),
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Calculate complete packaging cost
 * @param {Object} params - Complete cost calculation parameters
 * @returns {Promise} - Complete cost analysis result
 */
export const CalculateCompletePackagingCost = ({
  primary_packaging_id,
  secondary_packaging_id,
  carton_id,
  pallet_id,
  units_per_carton,
  cartons_per_pallet,
  total_units,
  net_weight_kg,
  is_export,
  strapping_cost,
  label_cost,
  effective_date,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!primary_packaging_id) {
        return reject({
          statusCode: 420,
          message: "Primary packaging ID must not be empty!",
        });
      }

      if (!carton_id) {
        return reject({
          statusCode: 420,
          message: "Carton ID must not be empty!",
        });
      }

      if (!units_per_carton || units_per_carton <= 0) {
        return reject({
          statusCode: 420,
          message: "Units per carton must be a positive number!",
        });
      }

      if (!total_units || total_units <= 0) {
        return reject({
          statusCode: 420,
          message: "Total units must be a positive number!",
        });
      }

      if (!net_weight_kg || net_weight_kg <= 0) {
        return reject({
          statusCode: 420,
          message: "Net weight in kg must be a positive number!",
        });
      }

      const result =
        await CostCalculationService.calculateCompletePackagingCost({
          primary_packaging_id,
          secondary_packaging_id,
          carton_id,
          pallet_id,
          units_per_carton,
          cartons_per_pallet: cartons_per_pallet || 1,
          total_units,
          net_weight_kg,
          is_export: is_export || false,
          strapping_cost: strapping_cost || 0,
          label_cost: label_cost || 0,
          effective_date: effective_date
            ? new Date(effective_date)
            : new Date(),
        });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get product cost analysis
 * @param {Object} params - { product_id, market, quantity, net_weight_kg, packaging_config }
 * @returns {Promise} - Product cost analysis result
 */
export const GetProductCostAnalysis = ({
  product_id,
  market,
  quantity,
  net_weight_kg,
  packaging_config,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!product_id) {
        return reject({
          statusCode: 420,
          message: "Product ID must not be empty!",
        });
      }

      if (!market) {
        return reject({
          statusCode: 420,
          message: "Market must not be empty!",
        });
      }

      if (!quantity || quantity <= 0) {
        return reject({
          statusCode: 420,
          message: "Quantity must be a positive number!",
        });
      }

      if (!net_weight_kg || net_weight_kg <= 0) {
        return reject({
          statusCode: 420,
          message: "Net weight in kg must be a positive number!",
        });
      }

      const result = await CostCalculationService.getProductCostAnalysis({
        product_id,
        market,
        quantity,
        net_weight_kg,
        packaging_config,
      });

      resolve(result);
    } catch (err) {
      reject(err);
    }
  });
};
