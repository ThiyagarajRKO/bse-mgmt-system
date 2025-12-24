import models from "../../models";
import CostCalculationService from "./cost_calculation.js";

const { PackagingMaster, ProductPackagingRules } = models;

/**
 * Packing Calculations Service
 * Handles carton/pallet calculations after packaging resolution
 */
export class PackingCalculationsService {
  /**
   * Resolve master carton based on packaging type and quantity
   * @param {Object} params - { primary_packaging_type, quantity, market }
   * @returns {Object} - { carton_id, carton_details, units_per_carton }
   */
  static async resolveMasterCarton({
    primary_packaging_type,
    quantity,
    market,
  }) {
    try {
      // Find appropriate master cartons for this packaging type
      const cartons = await PackagingMaster.findAll({
        where: {
          packaging_type: "MC", // Master Carton
          is_active: true,
        },
        order: [["packaging_length", "ASC"]], // Start with smallest
      });

      if (!cartons.length) {
        throw new Error("No master cartons available");
      }

      // For now, return the first carton (can be enhanced with optimization logic)
      const selectedCarton = cartons[0];

      // Calculate units per carton (simplified - can be enhanced)
      // This would typically consider dimensions and stacking
      const unitsPerCarton = Math.floor(selectedCarton.packaging_length / 10); // Rough estimate

      return {
        carton_id: selectedCarton.id,
        carton_details: {
          code: selectedCarton.packaging_code,
          dimensions: {
            length: selectedCarton.packaging_length,
            width: selectedCarton.packaging_width,
            height: selectedCarton.packaging_height,
          },
          weight: selectedCarton.packaging_weight,
        },
        units_per_carton: unitsPerCarton,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate packing metrics
   * @param {Object} params - { quantity, units_per_carton, carton_details, is_export }
   * @returns {Object} - { total_cartons, total_cbm, pallet_info }
   */
  static calculatePackingMetrics({
    quantity,
    units_per_carton,
    carton_details,
    is_export,
  }) {
    try {
      // Calculate total cartons needed
      const total_cartons = Math.ceil(quantity / units_per_carton);

      // Calculate total CBM (Cubic Meter)
      const carton_volume_cm3 =
        carton_details.dimensions.length *
        carton_details.dimensions.width *
        carton_details.dimensions.height;
      const carton_volume_m3 = carton_volume_cm3 / 1000000; // Convert cm³ to m³
      const total_cbm = total_cartons * carton_volume_m3;

      let pallet_info = null;

      // If export, calculate pallet information
      if (is_export) {
        pallet_info = this.calculatePalletInfo(total_cartons, carton_details);
      }

      return {
        units_per_carton,
        total_cartons,
        total_cbm: Math.round(total_cbm * 1000) / 1000, // Round to 3 decimal places
        pallet_info,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate pallet information for export
   * @param {number} total_cartons
   * @param {Object} carton_details
   * @returns {Object} - { cartons_per_pallet, total_pallets, pallet_dimensions }
   */
  static calculatePalletInfo(total_cartons, carton_details) {
    try {
      // Standard pallet calculations (can be enhanced with actual pallet data)
      const CARTONS_PER_LAYER = 5; // Rough estimate
      const LAYERS_PER_PALLET = 3; // Rough estimate
      const cartons_per_pallet = CARTONS_PER_LAYER * LAYERS_PER_PALLET;

      const total_pallets = Math.ceil(total_cartons / cartons_per_pallet);

      // Calculate pallet dimensions (rough estimate)
      const pallet_dimensions = {
        length: carton_details.dimensions.length * Math.sqrt(CARTONS_PER_LAYER),
        width: carton_details.dimensions.width * Math.sqrt(CARTONS_PER_LAYER),
        height: carton_details.dimensions.height * LAYERS_PER_PALLET,
      };

      return {
        cartons_per_pallet,
        total_pallets,
        pallet_dimensions,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Complete packing calculation workflow
   * @param {Object} params - { product_id, market, quantity }
   * @returns {Object} - Complete packing calculation result
   */
  static async calculateCompletePacking({ product_id, market, quantity }) {
    try {
      // Step 1: Get packaging suggestions
      const packagingSuggestions = await this.getPackagingSuggestions(
        product_id,
        market
      );

      if (!packagingSuggestions.length) {
        throw new Error("No packaging suggestions available");
      }

      // Use the highest priority suggestion
      const selectedPackaging = packagingSuggestions[0];

      // Step 2: Resolve master carton
      const cartonInfo = await this.resolveMasterCarton({
        primary_packaging_type: selectedPackaging.primary_packaging_type,
        quantity,
        market,
      });

      // Step 3: Calculate metrics
      const calculations = this.calculatePackingMetrics({
        quantity,
        units_per_carton: cartonInfo.units_per_carton,
        carton_details: cartonInfo.carton_details,
        is_export: market === "EXPORT",
      });

      // Step 4: Calculate costs (if packaging IDs are available)
      let costAnalysis = null;
      if (selectedPackaging.primary_packaging_id && cartonInfo.carton_id) {
        try {
          costAnalysis =
            await CostCalculationService.calculateCompletePackagingCost({
              primary_packaging_id: selectedPackaging.primary_packaging_id,
              secondary_packaging_id: selectedPackaging.secondary_packaging_id,
              carton_id: cartonInfo.carton_id,
              pallet_id:
                market === "EXPORT" ? selectedPackaging.pallet_id : null,
              units_per_carton: cartonInfo.units_per_carton,
              cartons_per_pallet: calculations.pallet_info
                ? calculations.pallet_info.cartons_per_pallet
                : 1,
              total_units: quantity,
              net_weight_kg: selectedPackaging.net_weight_kg || 1, // Placeholder - should come from product
              is_export: market === "EXPORT",
              strapping_cost: 5.0, // Default strapping cost
              label_cost: 2.0, // Default label cost
            });
        } catch (costError) {
          console.warn("Cost calculation failed:", costError.message);
          // Continue without cost analysis if it fails
        }
      }

      // Step 5: Return complete result
      return {
        product_id,
        market,
        quantity,
        packaging: selectedPackaging,
        carton: cartonInfo,
        calculations,
        costs: costAnalysis,
        locked: false, // Will be set to true when locked for invoice/shipping
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get packaging suggestions (wrapper for the controller function)
   * @param {string} product_id
   * @param {string} market
   * @returns {Array} - Packaging suggestions
   */
  static async getPackagingSuggestions(product_id, market) {
    const { PackingRules } = await import("../controllers/packing_rules.js");
    const result = await PackingRules.GetPackagingSuggestions({
      product_id,
      market,
      start: 0,
      length: 10,
    });
    return result.suggestions || [];
  }

  /**
   * Lock packing calculations for invoice/shipping documents
   * @param {string} packing_calculation_id
   * @returns {Object} - Locked calculation result
   */
  static async lockPackingCalculations(packing_calculation_id) {
    // This would typically update a database record to mark it as locked
    // For now, just return the calculation with locked: true
    return {
      packing_calculation_id,
      locked: true,
      locked_at: new Date(),
      locked_for: ["invoice", "packing_list", "shipping_bill"],
    };
  }
}

export default PackingCalculationsService;
