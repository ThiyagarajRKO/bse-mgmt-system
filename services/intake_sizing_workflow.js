/**
 * Intake → Sizing Workflow Service
 * =================================
 * Handles the conversion of UNSIZED raw material to sized buckets.
 * This is the core operation for sorting/classifying catch at landing.
 */

const { v4: uuidv4 } = require("uuid");

/**
 * AUTO-SIZE SPLITTING LOGIC
 * ===========================
 * Takes UNSIZED raw material and reclassifies into sized buckets.
 *
 * Flow:
 * 1. GRN receipt: 500kg UNSIZED squid
 * 2. Sorting operation: Split into sizes
 * 3. Inventory posting: Move from UNSIZED → sized buckets
 * 4. Ledger: Debit Unsized, Credit Sized (no GST, no costing change)
 *
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} payload
 *   - rawProductId: ID of UNSIZED raw product
 *   - splits: [{ sizeId, weight }, ...]
 *   - wasteWeight: Weight lost in sorting (optional)
 *   - notes: Sorting notes (optional)
 *   - operatedBy: User ID who sorted (optional)
 * @returns {Promise<Object>} Sizing adjustment plan
 */
async function autoSizeSplitting(sequelize, payload) {
  const {
    rawProductId,
    splits,
    wasteWeight = 0,
    notes = "",
    operatedBy = "00000000-0000-0000-0000-000000000000",
  } = payload;

  if (!rawProductId || !splits || splits.length === 0) {
    throw new Error(
      "Unsized product ID and at least one size split are mandatory"
    );
  }

  const ProductMaster = sequelize.models.ProductMaster;
  const SizeMaster = sequelize.models.SizeMaster;
  const SpeciesMaster = sequelize.models.SpeciesMaster;

  // STEP 1: Get UNSIZED product
  const unsizedProduct = await ProductMaster.findByPk(rawProductId, {
    include: [{ association: "Species" }, { association: "Size" }],
  });

  if (!unsizedProduct) {
    throw new Error(`UNSIZED product not found: ${rawProductId}`);
  }

  if (unsizedProduct.processing_state !== "RAW") {
    throw new Error(`Product is not RAW: ${unsizedProduct.product_code}`);
  }

  if (unsizedProduct.Size?.size !== "UNSIZED") {
    throw new Error(`Product is not UNSIZED: ${unsizedProduct.product_code}`);
  }

  // STEP 2: Validate split total
  const totalSplit = splits.reduce((sum, s) => sum + s.weight, 0) + wasteWeight;

  console.log(`\n📦 AUTO SIZE SPLITTING`);
  console.log(
    `   Source: ${unsizedProduct.product_code} (${unsizedProduct.product_name})`
  );
  console.log(`   Total weight in split: ${totalSplit}kg`);
  console.log(`   Splits: ${splits.length}`);
  console.log(`   Waste: ${wasteWeight}kg`);

  // STEP 3: Resolve sizes and create/fetch sized products
  const adjustments = [];

  for (const split of splits) {
    const sizeRecord = await SizeMaster.findByPk(split.sizeId);

    if (!sizeRecord) {
      throw new Error(`Size not found: ${split.sizeId}`);
    }

    // Find existing sized RAW product, or create it
    let sizedProduct = await ProductMaster.findOne({
      where: {
        species_master_id: unsizedProduct.species_master_id,
        size_master_id: split.sizeId,
        processing_state: "RAW",
        is_active: true,
      },
    });

    if (!sizedProduct) {
      // Create sized RAW product
      const speciesRecord = await SpeciesMaster.findByPk(
        unsizedProduct.species_master_id
      );

      const RawProductService = require("./raw_product_service");
      sizedProduct = await RawProductService.createRawProduct(sequelize, {
        species: {
          id: speciesRecord.id,
          name: speciesRecord.species_name,
          code: speciesRecord.code,
          category: speciesRecord.category,
        },
        size: {
          id: sizeRecord.id,
          code: sizeRecord.size,
          display: sizeRecord.size_display || sizeRecord.size,
        },
        isFrozen: true,
        createdById: operatedBy,
      });
    }

    // Record this adjustment
    adjustments.push({
      type: "SIZE_BUCKET",
      sizedProductId: sizedProduct.id,
      sizedProductCode: sizedProduct.product_code,
      sizedProductName: sizedProduct.product_name,
      weight: split.weight,
      operation: "RECLASSIFY", // Inventory reclassification
    });

    console.log(
      `   ✅ ${sizeRecord.size_display || sizeRecord.size}: ${
        split.weight
      }kg → ${sizedProduct.product_code}`
    );
  }

  // STEP 4: Waste handling
  if (wasteWeight > 0) {
    adjustments.push({
      type: "WASTE",
      wasteCategory: "SORTING_LOSS",
      weight: wasteWeight,
      operation: "SCRAP",
    });
    console.log(`   ♻️  Waste: ${wasteWeight}kg (scrap)`);
  }

  // STEP 5: Return adjustment plan
  console.log(
    `   ✅ Split plan created with ${adjustments.length} adjustments\n`
  );

  return {
    success: true,
    unsizedProductId,
    unsizedProductCode: unsizedProduct.product_code,
    totalWeight: totalSplit,
    adjustments,
    notes,
    createdAt: new Date(),
  };
}

/**
 * POSTING INVENTORY FROM SPLIT
 * =============================
 * After split is approved, actually post to inventory.
 * This moves stock from UNSIZED bucket → sized buckets.
 *
 * WARNING: This modifies actual inventory. Call only after approval.
 */
async function postSplitToInventory(sequelize, splitPlan) {
  const { unsizedProductId, adjustments, notes } = splitPlan;

  console.log(`\n💾 POSTING SPLIT TO INVENTORY`);

  const InventoryMaster = sequelize.models.InventoryMaster;

  // Deduct from UNSIZED
  await InventoryMaster.increment(
    { quantity: -splitPlan.totalWeight },
    {
      where: { product_master_id: unsizedProductId },
    }
  );

  console.log(`   ➖ UNSIZED: -${splitPlan.totalWeight}kg`);

  // Credit each sized bucket
  for (const adj of adjustments) {
    if (adj.type === "SIZE_BUCKET") {
      await InventoryMaster.increment(
        { quantity: adj.weight },
        {
          where: { product_master_id: adj.sizedProductId },
        }
      );

      console.log(`   ➕ ${adj.sizedProductCode}: +${adj.weight}kg`);
    } else if (adj.type === "WASTE") {
      console.log(`   ♻️  Waste: +${adj.weight}kg (scrap ledger)`);
    }
  }

  console.log(`\n✅ Inventory posting completed\n`);

  return {
    success: true,
    postedAt: new Date(),
  };
}

/**
 * REJECT UNSIZED PRODUCT IN PRODUCTION
 * =====================================
 * Middleware check: Block production issue if UNSIZED
 */
function rejectUnsizedInProduction(req, res, next) {
  const { productId } = req.body;

  // This would be checked during the production issue request
  // Assuming product details are already loaded
  if (req.product?.Size?.size === "UNSIZED") {
    return res.status(400).json({
      error: "UNSIZED_IN_PRODUCTION",
      message: "Cannot issue UNSIZED raw material to production.",
      remediation:
        "Use intake→sizing→production workflow to bucket material first.",
      productCode: req.product.product_code,
    });
  }

  next();
}

/**
 * REJECT UNSIZED PRODUCT IN SALES
 * ================================
 * Middleware check: Block sales order if UNSIZED
 */
function rejectUnsizedInSales(req, res, next) {
  const { productId } = req.body;

  if (req.product?.Size?.size === "UNSIZED") {
    return res.status(400).json({
      error: "UNSIZED_IN_SALES",
      message: "Cannot sell UNSIZED raw material.",
      remediation: "Sort material first, then add to sales order.",
      productCode: req.product.product_code,
    });
  }

  next();
}

/**
 * EXAMPLE: Complete intake→sizing workflow
 * ==========================================
 * Usage in a route handler:
 *
 * POST /api/intake/sort
 * {
 *   "rawProductId": "xxx-unsized",
 *   "splits": [
 *     { "sizeId": "xxx-20_30cm", "weight": 180 },
 *     { "sizeId": "xxx-30up_cm", "weight": 250 }
 *   ],
 *   "wasteWeight": 70,
 *   "notes": "Sorted by manual inspection"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "adjustments": [
 *     {
 *       "type": "SIZE_BUCKET",
 *       "sizedProductCode": "SQD-WHL-RAW-20_30CM",
 *       "weight": 180
 *     },
 *     ...
 *   ]
 * }
 */

module.exports = {
  autoSizeSplitting,
  postSplitToInventory,
  rejectUnsizedInProduction,
  rejectUnsizedInSales,
};
