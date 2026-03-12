import models, { sequelize } from "../../../models";

/**
 * Calculate Production Costing for a Procurement Lot
 * Formula: Cost per kg = Total Production Cost / Output Quantity
 */
export const CalculateProductionCosting = (
  { profile_id, procurement_lot_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    const transaction = await sequelize.transaction();
    try {
      // Get procurement lot
      const lot = await models.procurement_lots.findByPk(procurement_lot_id, {
        transaction,
      });
      if (!lot) throw new Error("Procurement lot not found");

      // Get input quantity and cost from procurement products
      const procurementQuery = `
        SELECT 
          SUM(pp.procurement_quantity) as total_input_qty,
          SUM(pp.procurement_quantity * pp.unit_price) as total_input_cost
        FROM procurement_products pp
        WHERE pp.procurement_lot_id = $1 AND pp.is_active = true
      `;

      const procurementResult = await sequelize.query(procurementQuery, {
        bind: [procurement_lot_id],
        type: sequelize.QueryTypes.SELECT,
        transaction,
      });

      const inputQuantity =
        parseFloat(procurementResult[0]?.total_input_qty) || 0;
      const inputCost = parseFloat(procurementResult[0]?.total_input_cost) || 0;

      // Get output quantity from peeling products
      const outputQuery = `
        SELECT SUM(pp.yield_quantity) as total_output_qty
        FROM peeling_products pp
        JOIN peeling p ON p.id = pp.peeling_id
        JOIN dispatches d ON d.id = p.dispatch_id
        JOIN procurement_products pp2 ON pp2.id = d.procurement_product_id
        WHERE pp2.procurement_lot_id = $1 AND pp.is_active = true
      `;

      const outputResult = await sequelize.query(outputQuery, {
        bind: [procurement_lot_id],
        type: sequelize.QueryTypes.SELECT,
        transaction,
      });

      const outputQuantity = parseFloat(outputResult[0]?.total_output_qty) || 1;

      if (outputQuantity === 0)
        throw new Error("No output quantity found for this lot");

      // Calculate cost per kg
      const costPerKg = (inputCost / outputQuantity).toFixed(2);

      // Get total production cost (input + all processing costs)
      const totalProductionCost = inputCost; // Can be extended to include labour, storage, etc.

      // Check if costing already exists
      let costing = await models.production_costing.findOne({
        where: { procurement_lot_id },
        transaction,
      });

      if (costing) {
        // Update existing costing
        costing.input_quantity = inputQuantity;
        costing.input_cost = inputCost;
        costing.output_quantity = outputQuantity;
        costing.cost_per_kg = costPerKg;
        costing.total_production_cost = totalProductionCost;
        costing.costing_date = new Date();
        await costing.save({ transaction });
      } else {
        // Create new costing
        costing = await models.production_costing.create(
          {
            procurement_lot_id,
            input_quantity: inputQuantity,
            input_cost: inputCost,
            output_quantity: outputQuantity,
            cost_per_kg: costPerKg,
            total_production_cost: totalProductionCost,
            processing_labour_cost: 0,
            packaging_cost: 0,
            cold_storage_cost: 0,
            freight_cost: 0,
            byproduct_value: 0,
            costing_date: new Date(),
          },
          { profile_id, transaction },
        );
      }

      await transaction.commit();

      resolve({
        statusCode: 200,
        message: "Production costing calculated successfully",
        data: {
          costing_id: costing.id,
          procurement_lot_id,
          input_quantity: inputQuantity,
          input_cost: inputCost,
          output_quantity: outputQuantity,
          cost_per_kg: costPerKg,
          total_production_cost: totalProductionCost,
        },
      });
    } catch (err) {
      await transaction.rollback();
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Get Production Costing for a Lot
 */
export const GetProductionCosting = (
  { procurement_lot_id },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const costing = await models.production_costing.findOne({
        where: { procurement_lot_id, is_active: true },
        include: [
          {
            as: "procurement_lot",
            association: "procurement_lot",
            attributes: ["id", "lot_no", "lot_date"],
          },
        ],
      });

      if (!costing)
        throw new Error("Production costing not found for this lot");

      resolve({
        statusCode: 200,
        message: "Production costing retrieved successfully",
        data: costing,
      });
    } catch (err) {
      reject({ statusCode: 400, message: err.message });
    }
  });
};

/**
 * Get all Production Costings with pagination
 */
export const GetAllProductionCostings = (
  { page = 1, limit = 50 },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { count, rows } = await models.production_costing.findAndCountAll({
        where: { is_active: true },
        include: [
          {
            as: "procurement_lot",
            association: "procurement_lot",
            attributes: ["id", "lot_no", "lot_date"],
          },
        ],
        limit,
        offset: (page - 1) * limit,
        order: [["costing_date", "DESC"]],
      });

      resolve({
        statusCode: 200,
        message: "Production costings retrieved successfully",
        data: {
          costings: rows,
          total: count,
          pages: Math.ceil(count / limit),
          current_page: page,
        },
      });
    } catch (err) {
      reject({ statusCode: 400, message: err.message });
    }
  });
};

export default {
  CalculateProductionCosting,
  GetProductionCosting,
  GetAllProductionCostings,
};
