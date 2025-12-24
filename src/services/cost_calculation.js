import models from "../../models";

const {
  PackagingCostMaster,
  CartonCostMaster,
  PalletCostMaster,
  PackagingMaster,
} = models;

/**
 * Cost Calculation Service
 * Handles packaging cost calculations for true landed cost per kg/unit
 */
export class CostCalculationService {
  /**
   * Get current cost for packaging material
   * @param {string} packaging_id - Packaging master ID
   * @param {Date} effective_date - Date for cost lookup (defaults to today)
   * @returns {Object} - Cost information
   */
  static async getPackagingCost(packaging_id, effective_date = new Date()) {
    try {
      const costRecord = await PackagingCostMaster.findOne({
        where: {
          packaging_id,
          effective_from: { [models.Sequelize.Op.lte]: effective_date },
          [models.Sequelize.Op.or]: [
            { effective_to: null },
            { effective_to: { [models.Sequelize.Op.gte]: effective_date } },
          ],
          is_active: true,
        },
        order: [["effective_from", "DESC"]],
        include: [
          {
            model: PackagingMaster,
            as: "packaging",
            attributes: ["packaging_code", "packaging_type"],
          },
        ],
      });

      if (!costRecord) {
        throw new Error(
          `No active cost found for packaging ID: ${packaging_id}`
        );
      }

      return {
        packaging_id,
        cost_per_unit: parseFloat(costRecord.cost_per_unit),
        cost_uom: costRecord.cost_uom,
        packaging_code: costRecord.packaging?.packaging_code,
        packaging_type: costRecord.packaging?.packaging_type,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current cost for carton
   * @param {string} carton_id - Carton master ID
   * @param {Date} effective_date - Date for cost lookup (defaults to today)
   * @returns {Object} - Cost information
   */
  static async getCartonCost(carton_id, effective_date = new Date()) {
    try {
      const costRecord = await CartonCostMaster.findOne({
        where: {
          carton_id,
          effective_from: { [models.Sequelize.Op.lte]: effective_date },
          [models.Sequelize.Op.or]: [
            { effective_to: null },
            { effective_to: { [models.Sequelize.Op.gte]: effective_date } },
          ],
          is_active: true,
        },
        order: [["effective_from", "DESC"]],
        include: [
          {
            model: PackagingMaster,
            as: "carton",
            attributes: ["packaging_code", "packaging_type"],
          },
        ],
      });

      if (!costRecord) {
        throw new Error(`No active cost found for carton ID: ${carton_id}`);
      }

      return {
        carton_id,
        cost_per_carton: parseFloat(costRecord.cost_per_carton),
        carton_code: costRecord.carton?.packaging_code,
        carton_type: costRecord.carton?.packaging_type,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current cost for pallet
   * @param {string} pallet_id - Pallet master ID
   * @param {Date} effective_date - Date for cost lookup (defaults to today)
   * @returns {Object} - Cost information
   */
  static async getPalletCost(pallet_id, effective_date = new Date()) {
    try {
      const costRecord = await PalletCostMaster.findOne({
        where: {
          pallet_id,
          effective_from: { [models.Sequelize.Op.lte]: effective_date },
          [models.Sequelize.Op.or]: [
            { effective_to: null },
            { effective_to: { [models.Sequelize.Op.gte]: effective_date } },
          ],
          is_active: true,
        },
        order: [["effective_from", "DESC"]],
        include: [
          {
            model: PackagingMaster,
            as: "pallet",
            attributes: ["packaging_code", "packaging_type"],
          },
        ],
      });

      if (!costRecord) {
        throw new Error(`No active cost found for pallet ID: ${pallet_id}`);
      }

      return {
        pallet_id,
        cost_per_pallet: parseFloat(costRecord.cost_per_pallet),
        pallet_code: costRecord.pallet?.packaging_code,
        pallet_type: costRecord.pallet?.packaging_type,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate packaging cost per carton
   * @param {Object} params - Cost calculation parameters
   * @returns {Object} - Cost breakdown per carton
   */
  static calculateCartonCost({
    primary_packaging_id,
    secondary_packaging_id,
    carton_id,
    units_per_carton,
    effective_date = new Date(),
  }) {
    return new Promise(async (resolve, reject) => {
      try {
        // Get costs for all packaging components
        const [primaryCost, secondaryCost, cartonCost] = await Promise.all([
          this.getPackagingCost(primary_packaging_id, effective_date),
          secondary_packaging_id
            ? this.getPackagingCost(secondary_packaging_id, effective_date)
            : Promise.resolve({ cost_per_unit: 0 }),
          this.getCartonCost(carton_id, effective_date),
        ]);

        // Calculate cost per carton
        const primaryPackagingCost =
          primaryCost.cost_per_unit * units_per_carton;
        const secondaryPackagingCost = secondaryCost.cost_per_unit || 0;
        const cartonPackagingCost = cartonCost.cost_per_carton;

        const totalCostPerCarton =
          primaryPackagingCost + secondaryPackagingCost + cartonPackagingCost;

        resolve({
          units_per_carton,
          costs: {
            primary_packaging: {
              id: primary_packaging_id,
              code: primaryCost.packaging_code,
              cost_per_unit: primaryCost.cost_per_unit,
              total_cost: primaryPackagingCost,
            },
            secondary_packaging: secondary_packaging_id
              ? {
                  id: secondary_packaging_id,
                  code: secondaryCost.packaging_code,
                  cost_per_unit: secondaryCost.cost_per_unit,
                  total_cost: secondaryPackagingCost,
                }
              : null,
            carton: {
              id: carton_id,
              code: cartonCost.carton_code,
              cost_per_carton: cartonCost.cost_per_carton,
              total_cost: cartonPackagingCost,
            },
          },
          total_cost_per_carton: totalCostPerCarton,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate pallet cost (for export)
   * @param {Object} params - Pallet cost calculation parameters
   * @returns {Object} - Cost breakdown per pallet
   */
  static calculatePalletCost({
    pallet_id,
    cartons_per_pallet,
    carton_cost_per_carton,
    strapping_cost = 0,
    label_cost = 0,
    effective_date = new Date(),
  }) {
    return new Promise(async (resolve, reject) => {
      try {
        const palletCost = await this.getPalletCost(pallet_id, effective_date);

        const cartonsCost = cartons_per_pallet * carton_cost_per_carton;
        const palletPackagingCost = palletCost.cost_per_pallet;
        const additionalCosts = strapping_cost + label_cost;

        const totalCostPerPallet =
          cartonsCost + palletPackagingCost + additionalCosts;

        resolve({
          cartons_per_pallet,
          costs: {
            cartons: {
              quantity: cartons_per_pallet,
              cost_per_carton: carton_cost_per_carton,
              total_cost: cartonsCost,
            },
            pallet: {
              id: pallet_id,
              code: palletCost.pallet_code,
              cost_per_pallet: palletCost.cost_per_pallet,
              total_cost: palletPackagingCost,
            },
            additional: {
              strapping_cost,
              label_cost,
              total_additional: additionalCosts,
            },
          },
          total_cost_per_pallet: totalCostPerPallet,
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Calculate complete packaging cost with true landed cost per kg
   * @param {Object} params - Complete cost calculation parameters
   * @returns {Object} - Complete cost analysis
   */
  static async calculateCompletePackagingCost({
    primary_packaging_id,
    secondary_packaging_id,
    carton_id,
    pallet_id,
    units_per_carton,
    cartons_per_pallet,
    total_units,
    net_weight_kg,
    is_export = false,
    strapping_cost = 0,
    label_cost = 0,
    effective_date = new Date(),
  }) {
    try {
      // Calculate carton cost
      const cartonCostResult = await this.calculateCartonCost({
        primary_packaging_id,
        secondary_packaging_id,
        carton_id,
        units_per_carton,
        effective_date,
      });

      // Calculate total cartons needed
      const total_cartons = Math.ceil(total_units / units_per_carton);

      // Calculate carton-level costs
      const totalCartonCosts =
        total_cartons * cartonCostResult.total_cost_per_carton;

      let palletCostResult = null;
      let totalPalletCosts = 0;

      // Calculate pallet costs if export
      if (is_export && pallet_id) {
        palletCostResult = await this.calculatePalletCost({
          pallet_id,
          cartons_per_pallet,
          carton_cost_per_carton: cartonCostResult.total_cost_per_carton,
          strapping_cost,
          label_cost,
          effective_date,
        });

        const total_pallets = Math.ceil(total_cartons / cartons_per_pallet);
        totalPalletCosts =
          total_pallets * palletCostResult.total_cost_per_pallet;
      }

      // Calculate total packaging cost
      const totalPackagingCost = totalCartonCosts + totalPalletCosts;

      // Calculate cost per kg
      const costPerKg =
        net_weight_kg > 0 ? totalPackagingCost / net_weight_kg : 0;

      // Calculate cost per unit
      const costPerUnit =
        total_units > 0 ? totalPackagingCost / total_units : 0;

      return {
        summary: {
          total_units,
          net_weight_kg,
          total_cartons,
          total_packaging_cost: totalPackagingCost,
          cost_per_kg: Math.round(costPerKg * 100) / 100,
          cost_per_unit: Math.round(costPerUnit * 100) / 100,
          is_export,
        },
        carton_costs: cartonCostResult,
        pallet_costs: palletCostResult,
        breakdown: {
          carton_level_costs: totalCartonCosts,
          pallet_level_costs: totalPalletCosts,
          additional_costs: strapping_cost + label_cost,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get cost analysis for a specific product and packaging configuration
   * @param {Object} params - Product and packaging parameters
   * @returns {Object} - Cost analysis result
   */
  static async getProductCostAnalysis({
    product_id,
    market,
    quantity,
    net_weight_kg,
    packaging_config, // Should contain packaging IDs and configuration
  }) {
    try {
      // This would integrate with the existing packing calculations
      // For now, return a placeholder structure
      return {
        product_id,
        market,
        quantity,
        net_weight_kg,
        message:
          "Cost analysis integration pending - requires packaging_config parameter",
      };
    } catch (error) {
      throw error;
    }
  }
}

export default CostCalculationService;
