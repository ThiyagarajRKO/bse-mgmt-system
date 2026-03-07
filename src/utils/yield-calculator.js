/**
 * Yield Calculator Utility
 *
 * Calculates raw material requirements based on:
 * 1. Ordered finished products and quantities
 * 2. Derivative type (peeling/processing yields different amounts)
 * 3. Bill of Materials (BOM) - conversion ratios
 * 4. Historical yield percentages from production data
 *
 * Formula: Raw Material Needed = (Finished Product Qty × BOM Ratio) / (Yield %)
 */

const models = require('../models');

/**
 * Get historical yield percentage for a product derivative combination
 * @param {string} species_id - Species master ID
 * @param {string} derivative_id - Derivative master ID
 * @returns {Promise<number>} - Yield percentage (e.g., 70.5)
 */
export const getHistoricalYieldPercentage = async (
  species_id,
  derivative_id
) => {
  try {
    // Get average yield from recent production records
    const { sequelize } = require('../models');
    const { QueryTypes, Sequelize: SeqLize } = require('sequelize');

    const result = await sequelize.query(
      `
      SELECT 
        AVG(CAST(pp.yield_quantity AS DECIMAL) / CAST(p.peeling_quantity AS DECIMAL) * 100) as avg_yield_percent
      FROM peeling_products pp
      JOIN peeling p ON p.id = pp.peeling_id AND p.is_active = true
      JOIN product_master pm ON pm.id = pp.product_master_id
      JOIN species_master sm ON sm.id = pm.species_master_id
      JOIN derivative_master dm ON dm.id = pm.derivative_master_id
      WHERE sm.id = :species_id
        AND dm.id = :derivative_id
        AND p.created_at >= NOW() - INTERVAL '90 days'
        AND pp.is_active = true
      `,
      {
        replacements: { species_id, derivative_id },
        type: QueryTypes.SELECT,
      }
    );

    // Default to 85% if no historical data
    const yieldPercent = result?.[0]?.avg_yield_percent || 85;
    return Math.max(50, Math.min(99.9, yieldPercent)); // Clamp between 50% and 99.9%
  } catch (err) {
    console.error('Error fetching historical yield:', err);
    return 85; // Default yield percentage
  }
};

/**
 * Get Bill of Materials for a product
 * @param {string} product_id - Product Master ID
 * @returns {Promise<Array>} - Array of {raw_product_id, quantity_required, unit}
 */
export const getBillOfMaterials = async (product_id) => {
  try {
    const bom = await models.BillOfMaterials.findAll({
      attributes: [
        'id',
        'procurement_product_id',
        'quantity_required',
        'unit_of_measure',
      ],
      where: {
        product_master_id: product_id,
        is_active: true,
      },
      include: [
        {
          model: models.ProcurementProducts,
          as: 'ProcurementProduct',
          attributes: [
            'id',
            'product_master_id',
            'supplier_master_id',
            'procurement_product_type',
          ],
          include: [
            {
              model: models.ProductMaster,
              attributes: ['id', 'product_name', 'species_master_id'],
            },
          ],
        },
      ],
      raw: false,
    });

    return bom;
  } catch (err) {
    console.error('Error fetching BOM:', err);
    return [];
  }
};

/**
 * Calculate raw material requirements for an order
 * @param {Object} orderProducts - Array of {product_id, quantity} from order
 * @param {Object} options - {includeYield: true, yieldPercentage: 85}
 * @returns {Promise<Object>} - {raw_materials: [...], total_estimated_cost: 0}
 */
export const calculateRawMaterialRequirements = async (
  orderProducts,
  options = {}
) => {
  try {
    const { includeYield = true, defaultYieldPercent = 85 } = options;
    const rawMaterialMap = new Map(); // Track aggregated requirements

    // Process each ordered product
    for (const orderProduct of orderProducts) {
      const { product_id, quantity } = orderProduct;

      // Get product details including derivative info
      const product = await models.ProductMaster.findByPk(product_id, {
        include: [
          {
            model: models.DerivativeMaster,
            as: 'Derivative',
            attributes: ['id', 'derivative_name', 'processing_yield_percent'],
          },
          {
            model: models.SpeciesMaster,
            attributes: ['id', 'species_name'],
          },
        ],
      });

      if (!product) {
        console.warn(`Product ${product_id} not found`);
        continue;
      }

      // Get Bill of Materials for this product
      const bom = await getBillOfMaterials(product_id);

      // Process each raw material in the BOM
      for (const bomItem of bom) {
        const rawProduct = bomItem.ProcurementProduct;
        const bomQuantity = parseFloat(bomItem.quantity_required);

        // Calculate base requirement: ordered_qty × bom_qty
        let rawMaterialQty = quantity * bomQuantity;

        // Apply yield adjustment if enabled
        if (includeYield && product.Derivative) {
          // Get yield percentage (from derivative config or historical data)
          let yieldPercent = product.Derivative.processing_yield_percent;

          if (!yieldPercent) {
            yieldPercent = await getHistoricalYieldPercentage(
              product.species_master_id,
              product.derivative_master_id
            );
          }

          // Adjust raw material needed by yield: raw_qty = raw_qty / (yield_percent / 100)
          rawMaterialQty = rawMaterialQty / (yieldPercent / 100);
        }

        // Aggregate if same raw material already exists
        const key = rawProduct.id;
        if (rawMaterialMap.has(key)) {
          const existing = rawMaterialMap.get(key);
          existing.quantity_required += rawMaterialQty;
        } else {
          rawMaterialMap.set(key, {
            procurement_product_id: rawProduct.id,
            product_master_id: rawProduct.product_master_id,
            supplier_master_id: rawProduct.supplier_master_id,
            product_type: rawProduct.procurement_product_type,
            quantity_required: rawMaterialQty,
            quantity_required_rounded: Math.ceil(rawMaterialQty * 100) / 100, // Round up to 2 decimals
            unit_of_measure: bomItem.unit_of_measure || 'KG',
            yield_applied: includeYield,
          });
        }
      }
    }

    // Fetch prices for cost calculation
    const rawMaterials = [];
    let totalEstimatedCost = 0;

    for (const [, rawMaterial] of rawMaterialMap) {
      // Get latest price
      const priceList = await models.PriceListMaster.findOne({
        where: {
          product_master_id: rawMaterial.product_master_id,
          is_active: true,
        },
        order: [['created_at', 'DESC']],
        limit: 1,
      });

      rawMaterial.unit_price = priceList?.price_per_unit || 0;
      rawMaterial.estimated_cost =
        rawMaterial.quantity_required_rounded * rawMaterial.unit_price;
      totalEstimatedCost += rawMaterial.estimated_cost;

      rawMaterials.push(rawMaterial);
    }

    return {
      raw_materials: rawMaterials,
      total_estimated_cost: Math.round(totalEstimatedCost * 100) / 100,
      calculation_timestamp: new Date(),
      yield_applied: includeYield,
    };
  } catch (err) {
    console.error('Error calculating raw material requirements:', err);
    throw err;
  }
};

/**
 * Validate if sufficient inventory exists for raw materials
 * @param {Array} rawMaterials - Array of raw material requirements
 * @returns {Promise<Object>} - {sufficient: bool, gaps: [{material_id, required, available, shortfall}]}
 */
export const validateInventoryAvailability = async (rawMaterials) => {
  try {
    const gaps = [];
    let allSufficient = true;

    for (const material of rawMaterials) {
      const inventory = await models.PurchaseInventory.findOne({
        where: {
          product_master_id: material.product_master_id,
        },
        attributes: ['available_stock', 'reserved_stock'],
      });

      const availableQty = (inventory?.available_stock || 0) - (inventory?.reserved_stock || 0);
      const shortfall = Math.max(
        0,
        material.quantity_required_rounded - availableQty
      );

      if (shortfall > 0) {
        allSufficient = false;
        gaps.push({
          procurement_product_id: material.procurement_product_id,
          required_qty: material.quantity_required_rounded,
          available_qty: availableQty,
          shortfall_qty: shortfall,
          unit: material.unit_of_measure,
        });
      }
    }

    return {
      sufficient: allSufficient,
      gaps,
      total_shortfall_units: gaps.reduce((sum, g) => sum + g.shortfall_qty, 0),
    };
  } catch (err) {
    console.error('Error validating inventory:', err);
    throw err;
  }
};

/**
 * Generate procurement requests from calculated requirements
 * @param {Object} requirements - Result from calculateRawMaterialRequirements
 * @param {Object} context - {order_id, profile_id, supplier_selection_strategy}
 * @returns {Promise<Array>} - Array of procurement requests ready to be created
 */
export const generateProcurementRequests = async (
  requirements,
  context = {}
) => {
  try {
    const { order_id, profile_id, supplier_selection_strategy = 'default' } =
      context;
    const procurementRequests = [];

    for (const material of requirements.raw_materials) {
      // Determine supplier based on strategy
      let supplierId = material.supplier_master_id;

      if (supplier_selection_strategy === 'lowest_cost') {
        // Get supplier with lowest price
        const lowestPriceSupplier =
          await models.PriceListMaster.findOne({
            where: {
              product_master_id: material.product_master_id,
              is_active: true,
            },
            order: [['price_per_unit', 'ASC']],
            include: [
              {
                model: models.ProductMaster,
                attributes: ['product_master_id'],
              },
            ],
          });

        if (lowestPriceSupplier) {
          supplierId = lowestPriceSupplier.supplier_master_id;
        }
      }

      procurementRequests.push({
        order_id,
        product_id: material.product_master_id,
        supplier_id: supplierId,
        quantity: material.quantity_required_rounded,
        unit: material.unit_of_measure,
        estimated_cost: material.estimated_cost,
        yield_adjustment_applied: material.yield_applied,
        remarks: `Auto-calculated from order requirements with ${material.yield_applied ? 'yield' : 'no yield'} adjustment`,
        created_by: profile_id,
      });
    }

    return procurementRequests;
  } catch (err) {
    console.error('Error generating procurement requests:', err);
    throw err;
  }
};
