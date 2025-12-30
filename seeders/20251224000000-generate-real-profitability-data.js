"use strict";

const models = require("../models");
const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");

const {
  ProfitabilityFact,
  ProfitabilityCostBreakup,
  ProcurementProducts,
  ProcurementLots,
  PurchaseInventory,
  Dispatches,
  ProductMaster,
  SpeciesMaster,
  PriceListProductMaster,
  CustomerMaster,
} = models;

/**
 * Generate real profitability data from procurement, inventory, and sales data
 * Replaces test data with actual business data
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log("🔄 Starting real profitability data generation...");

    try {
      // Clear existing test data
      console.log("🧹 Clearing existing profitability data...");
      await queryInterface.bulkDelete("profitability_cost_breakup", null, {});
      await queryInterface.bulkDelete("profitability_fact", null, {});

      // Get all procurement products with related data
      const procurementData = await ProcurementProducts.findAll({
        include: [
          {
            model: models.ProcurementLots,
            as: "pl",
            attributes: ["procurement_date", "procurement_lot"],
          },
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
            include: [
              {
                model: models.ProductCategoryMaster,
                as: "ProductCategoryMaster",
                attributes: ["id"],
                include: [
                  {
                    model: models.SpeciesMaster,
                    as: "SpeciesMaster",
                    attributes: ["id", "species_name"],
                  },
                ],
              },
            ],
          },
          {
            model: models.SupplierMaster,
            as: "SupplierMaster",
            attributes: ["id", "supplier_name"],
          },
        ],
        where: { is_active: true },
        raw: true,
        nest: true,
      });

      console.log(`📦 Found ${procurementData.length} procurement records`);

      // Get inventory data
      const inventoryData = await PurchaseInventory.findAll({
        include: [
          {
            model: ProcurementProducts,
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
                attributes: ["id", "product_name"],
                include: [
                  {
                    model: models.ProductCategoryMaster,
                    as: "ProductCategoryMaster",
                    attributes: ["id"],
                    include: [
                      {
                        model: models.SpeciesMaster,
                        as: "SpeciesMaster",
                        attributes: ["id", "species_name"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where: { is_active: true },
        raw: true,
        nest: true,
      });

      console.log(`📦 Found ${inventoryData.length} inventory records`);

      // Get dispatch/sales data
      const dispatchData = await Dispatches.findAll({
        include: [
          {
            model: ProcurementProducts,
            as: "pp",
            include: [
              {
                model: models.ProductMaster,
                as: "ProductMaster",
                attributes: ["id", "product_name"],
                include: [
                  {
                    model: models.ProductCategoryMaster,
                    as: "ProductCategoryMaster",
                    attributes: ["id"],
                    include: [
                      {
                        model: models.SpeciesMaster,
                        as: "SpeciesMaster",
                        attributes: ["id", "species_name"],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        where: { is_active: true },
        raw: true,
        nest: true,
      });

      console.log(`🚚 Found ${dispatchData.length} dispatch records`);

      // Get current market prices
      const priceData = await PriceListProductMaster.findAll({
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
            attributes: ["id", "product_name"],
            include: [
              {
                model: models.ProductCategoryMaster,
                as: "ProductCategoryMaster",
                attributes: ["id"],
                include: [
                  {
                    model: models.SpeciesMaster,
                    as: "SpeciesMaster",
                    attributes: ["id", "species_name"],
                  },
                ],
              },
            ],
          },
        ],
        where: { is_active: true },
        raw: true,
        nest: true,
      });

      console.log(`💰 Found ${priceData.length} price records`);

      // Generate profitability facts from procurement data
      const profitabilityFacts = [];
      const costBreakups = [];

      // Process procurement data to create profitability facts
      for (const procurement of procurementData) {
        const product = procurement.ProductMaster;
        if (!product) continue;

        const species = product.ProductCategoryMaster?.SpeciesMaster;
        if (!species) continue;

        // Find current market price for this product
        const currentPrice = priceData.find(
          (p) => p.product_master?.id === product.id
        );

        // Calculate basic profitability metrics
        const procurementCost =
          procurement.adjusted_price || procurement.procurement_price || 0;
        const quantity =
          procurement.adjusted_quantity ||
          procurement.procurement_quantity ||
          0;
        const totalCost = procurementCost * quantity;

        // Estimate selling price (use market price if available, otherwise estimate)
        const sellingPricePerKg =
          currentPrice?.price_per_kg || procurementCost * 1.5; // 50% markup if no price
        const estimatedRevenue = sellingPricePerKg * quantity;

        // Calculate costs (rough estimates based on industry standards)
        const packagingCost = totalCost * 0.05; // 5% of procurement cost
        const logisticsCost = totalCost * 0.08; // 8% of procurement cost
        const yieldLossCost = totalCost * 0.03; // 3% yield loss
        const discountAmount = 0; // No discounts for procurement

        const cogs = procurementCost * quantity;
        const grossMargin =
          estimatedRevenue -
          cogs -
          packagingCost -
          logisticsCost -
          yieldLossCost;
        const grossMarginPct =
          estimatedRevenue > 0 ? (grossMargin / estimatedRevenue) * 100 : 0;

        // Create profitability fact
        const factId = uuidv4();
        profitabilityFacts.push({
          id: factId,
          invoice_id: null, // No invoice for procurement-only data
          product_id: product.id,
          species_id: species.id,
          batch_id: procurement.procurement_lot_id, // Use procurement lot ID as batch
          sku_code: `${product.product_name}-${species.species_name}`
            .toUpperCase()
            .replace(/\s+/g, "-"),
          net_revenue: estimatedRevenue,
          cogs: cogs,
          packaging_cost: packagingCost,
          logistics_cost: logisticsCost,
          yield_loss_cost: yieldLossCost,
          discount_amount: discountAmount,
          gross_margin: grossMargin,
          gross_margin_pct: grossMarginPct,
          market: "DOMESTIC", // Default to domestic
          posting_date: procurement.pl?.procurement_date || new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Create cost breakup
        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "COGS",
          amount: cogs,
          description: `Procurement from ${
            procurement.SupplierMaster?.supplier_name || "Unknown"
          } - Price: ${procurementCost}, Qty: ${quantity}`,
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "PACKAGING",
          amount: packagingCost,
          description: "Estimated packaging cost (5% of procurement cost)",
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "LOGISTICS",
          amount: logisticsCost,
          description: "Estimated logistics cost (8% of procurement cost)",
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "YIELD_LOSS",
          amount: yieldLossCost,
          description: "Estimated yield loss (3% of procurement cost)",
        });
      }

      // Process actual dispatch/sales data if available
      for (const dispatch of dispatchData) {
        const procurement = dispatch.pp;
        if (!procurement) continue;

        const product = procurement.ProductMaster;
        if (!product) continue;

        const species = product.ProductCategoryMaster?.SpeciesMaster;
        if (!species) continue;

        // Find current market price
        const currentPrice = priceData.find(
          (p) => p.product_master?.id === product.id
        );

        // For dispatches, we have actual sales data
        const sellingPricePerKg =
          currentPrice?.price_per_kg || procurement.adjusted_price * 1.5;
        const actualRevenue = sellingPricePerKg * dispatch.dispatch_quantity;

        // Calculate actual costs
        const procurementCost =
          procurement.adjusted_price || procurement.procurement_price || 0;
        const cogs = procurementCost * dispatch.dispatch_quantity;
        const packagingCost = cogs * 0.05;
        const logisticsCost = cogs * 0.08;
        const yieldLossCost = cogs * 0.03;
        const discountAmount = 0;

        const grossMargin =
          actualRevenue - cogs - packagingCost - logisticsCost - yieldLossCost;
        const grossMarginPct =
          actualRevenue > 0 ? (grossMargin / actualRevenue) * 100 : 0;

        // Create profitability fact for actual sales
        const factId = uuidv4();
        profitabilityFacts.push({
          id: factId,
          invoice_id: null, // Could link to invoice if available
          product_id: product.id,
          species_id: species.id,
          batch_id: procurement.procurement_lot_id, // Use procurement lot ID as batch
          sku_code: `${product.product_name}-${species.species_name}`
            .toUpperCase()
            .replace(/\s+/g, "-"),
          net_revenue: actualRevenue,
          cogs: cogs,
          packaging_cost: packagingCost,
          logistics_cost: logisticsCost,
          yield_loss_cost: yieldLossCost,
          discount_amount: discountAmount,
          gross_margin: grossMargin,
          gross_margin_pct: grossMarginPct,
          market: "DOMESTIC", // Could be determined from customer/delivery location
          posting_date: dispatch.created_at || new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        });

        // Create cost breakup for actual sales
        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "COGS",
          amount: cogs,
          description: `Actual sale from ${
            procurement.SupplierMaster?.supplier_name || "Unknown"
          } - Price: ${procurementCost}, Qty: ${dispatch.dispatch_quantity}`,
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "PACKAGING",
          amount: packagingCost,
          description:
            "Estimated packaging cost (5% of procurement cost) - Actual sale",
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "LOGISTICS",
          amount: logisticsCost,
          description:
            "Estimated logistics cost (8% of procurement cost) - Actual sale",
        });

        costBreakups.push({
          id: uuidv4(),
          profitability_id: factId,
          cost_type: "YIELD_LOSS",
          amount: yieldLossCost,
          description:
            "Estimated yield loss (3% of procurement cost) - Actual sale",
        });
      }

      // Insert profitability facts
      if (profitabilityFacts.length > 0) {
        console.log(
          `💾 Inserting ${profitabilityFacts.length} profitability facts...`
        );
        await queryInterface.bulkInsert(
          "profitability_fact",
          profitabilityFacts
        );
      }

      // Insert cost breakups
      if (costBreakups.length > 0) {
        console.log(`💾 Inserting ${costBreakups.length} cost breakups...`);
        await queryInterface.bulkInsert(
          "profitability_cost_breakup",
          costBreakups
        );
      }

      console.log("✅ Real profitability data generation completed!");
      console.log(
        `📊 Generated ${profitabilityFacts.length} profitability records`
      );
      console.log(`📊 Generated ${costBreakups.length} cost breakup records`);
    } catch (error) {
      console.error("❌ Error generating real profitability data:", error);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Rolling back real profitability data...");

    // Clear the real data (will be replaced by test data if needed)
    await queryInterface.bulkDelete("profitability_cost_breakup", null, {});
    await queryInterface.bulkDelete("profitability_fact", null, {});

    console.log("✅ Real profitability data cleared!");
  },
};
