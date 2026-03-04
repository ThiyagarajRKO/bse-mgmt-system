/**
 * BOM Explosion Handler
 *
 * Takes production order qty + BOM
 * Returns planned output quantities for all derivatives
 *
 * ENTRY: Production Order (1000 kg CUTTLEFISH)
 * EXIT: Planned outputs array (450 kg TUBES, 180 kg TENTACLES, etc)
 *
 * NO inventory movement yet - just calculation.
 */

import bomOutput from "../../../models/bom_output";
import derivativeGradeSizeRule from "../../../models/derivative_grade_size_rule";
import productMaster from "../../../models/product_master";

export async function explodeBOM(productionOrder) {
  const {
    input_species_id,
    planned_quantity_kg,
    initial_grade = "B",
    size_code = "MEDIUM",
  } = productionOrder;

  try {
    // Step 1: Get all outputs for this species BOM
    const bomOutputs = await bomOutput.findAll({
      where: {
        "$bom_master.species_id$": input_species_id,
        is_active: true,
      },
      include: [
        {
          model: bomMaster,
          required: true,
          attributes: ["id", "species_id"],
        },
        {
          model: derivativeMaster,
          required: true,
          attributes: ["id", "derivative_code", "derivative_name"],
        },
      ],
    });

    if (bomOutputs.length === 0) {
      throw new Error(`No BOM outputs found for species: ${input_species_id}`);
    }

    // Step 2: Apply grade × size multipliers to each derivative
    const plannedOutputs = await Promise.all(
      bomOutputs.map(async (output) => {
        // Get grade × size multiplier
        const yieldRule = await derivativeGradeSizeRule.findOne({
          where: {
            derivative_id: output.derivative_id,
            grade: initial_grade,
            size_code: size_code,
          },
        });

        const multiplier = yieldRule ? yieldRule.yield_multiplier : 1.0;
        const baseYield = output.base_yield_percent / 100;
        const effectiveYield = baseYield * multiplier;
        const plannedQty = planned_quantity_kg * effectiveYield;

        return {
          derivative_id: output.derivative_id,
          derivative_code: output.derivative_master.derivative_code,
          derivative_name: output.derivative_master.derivative_name,
          base_yield_percent: output.base_yield_percent,
          grade_multiplier: yieldRule?.grade_multiplier || 1.0,
          size_multiplier: yieldRule?.size_multiplier || 1.0,
          effective_yield_percent: effectiveYield * 100,
          planned_quantity_kg: plannedQty,
          cost_allocation_percent: null, // Set in costing step
        };
      })
    );

    // Step 3: Calculate total output vs input (waste check)
    const totalPlannedOutput = plannedOutputs.reduce(
      (sum, o) => sum + o.planned_quantity_kg,
      0
    );
    const totalWaste = planned_quantity_kg - totalPlannedOutput;

    // Validate: total should not exceed input
    if (totalWaste < 0) {
      throw new Error(
        `BOM yields exceed input: ${totalPlannedOutput} > ${planned_quantity_kg}`
      );
    }

    // Add waste to outputs
    plannedOutputs.push({
      derivative_id: null,
      derivative_code: "WASTE",
      derivative_name: "Process Waste",
      planned_quantity_kg: totalWaste,
      base_yield_percent: (totalWaste / planned_quantity_kg) * 100,
    });

    return {
      production_order_id: productionOrder.id,
      input_species_id,
      input_quantity_kg: planned_quantity_kg,
      initial_grade,
      size_code,
      total_planned_output_kg: totalPlannedOutput,
      total_waste_kg: totalWaste,
      waste_percent: (totalWaste / planned_quantity_kg) * 100,
      planned_outputs: plannedOutputs,
    };
  } catch (error) {
    console.error("BOM Explosion Error:", error);
    throw error;
  }
}

export default {
  explodeBOM,
};
