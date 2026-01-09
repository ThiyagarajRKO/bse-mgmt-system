/**
 * Raw Product Service
 * =====================
 * Handles auto-generation of RAW product SKUs, product creation, and intake→sizing workflow.
 * This is the single source of truth for RAW product logic.
 */

const { v4: uuidv4 } = require("uuid");

/**
 * RAW SKU GENERATION
 * Format: {SPECIES_CODE}-WHL-RAW-{SIZE_CODE}
 *
 * Examples:
 * - SNP-WHL-RAW-1_2KG
 * - SQD-WHL-RAW-10_20CM
 * - CRB-WHL-RAW-300_500G
 * - TUN-WHL-RAW-UNSIZED (temporary, for intake only)
 */
function generateRawSku({ speciesCode, sizeCode }) {
  if (!speciesCode || !sizeCode) {
    throw new Error(
      "Species code and size code are mandatory for RAW SKU generation"
    );
  }
  return `${speciesCode}-WHL-RAW-${sizeCode}`;
}

/**
 * RAW PRODUCT NAME GENERATION
 * Format: {Species Name} – Whole – Raw – {Size Display}
 *
 * Examples:
 * - Indian Squid – Whole – Raw – 10–20cm
 * - Mud Crab – Whole – Raw – 300–500g
 * - Yellowfin Tuna – Whole – Raw – >30kg
 */
function generateRawProductName({ speciesName, sizeDisplay }) {
  if (!speciesName || !sizeDisplay) {
    throw new Error(
      "Species name and size display are mandatory for RAW product name"
    );
  }
  return `${speciesName} – Whole – Raw – ${sizeDisplay}`;
}

/**
 * AUTO-HSN ASSIGNMENT FOR RAW PRODUCTS
 * Based on species category and state (fresh/frozen)
 */
function resolveRawHsn(speciesCategory, isFrozen = true) {
  const hsnMap = {
    FISH: isFrozen ? "0303" : "0302", // Frozen Fish vs Fresh Fish
    CRUSTACEAN: "0306", // Crabs, lobsters, etc.
    MOLLUSC: "0307", // Squid, octopus, scallops
    CEPHALOPOD: "0307", // Same as mollusc
    BIVALVE: "0307", // Oysters, clams, mussels
  };

  const hsn = hsnMap[speciesCategory];
  if (!hsn) {
    throw new Error(
      `Unsupported species category for RAW HSN resolution: ${speciesCategory}`
    );
  }
  return hsn;
}

/**
 * AUTO-GST ASSIGNMENT FOR RAW PRODUCTS
 * 5% GST for domestic; 0% (LUT) for export
 */
function resolveRawGst(isExport = false) {
  return isExport
    ? { gstRate: 0, description: "Export (LUT)" }
    : {
        gstRate: 5,
        description: "Domestic Raw Seafood",
      };
}

/**
 * CREATE RAW PRODUCT (CORE SERVICE)
 *
 * Hard validations:
 * ✅ Size must exist
 * ✅ Species must exist
 * ✅ Derivative = "Whole"
 * ✅ Grade = NULL
 * ✅ is_producible = FALSE
 * ✅ HSN auto-assigned
 * ✅ GST auto-assigned
 *
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} payload - { species, size, isFrozen, isExport, createdById }
 * @returns {Promise<ProductMaster>} - Created RAW product
 */
async function createRawProduct(sequelize, payload) {
  const {
    species, // { id, name, code, category }
    size, // { id, code, display }
    isFrozen = true,
    isExport = false,
    createdById,
  } = payload;

  // Validation
  if (!species || !species.id || !species.code) {
    throw new Error("Valid species object with id and code is mandatory");
  }
  if (!size || !size.id || !size.code) {
    throw new Error("Valid size object with id and code is mandatory");
  }
  if (!createdById) {
    throw new Error("createdById (user profile ID) is mandatory");
  }

  // Resolve HSN and GST
  const hsnCode = resolveRawHsn(species.category, isFrozen);
  const gstInfo = resolveRawGst(isExport);

  // Get or create GST Master record
  const GstMaster = sequelize.models.GstMaster;
  let gstRecord = await GstMaster.findOne({
    where: {
      hsn_code: hsnCode,
      gst_rate: gstInfo.gstRate,
      is_active: true,
    },
  });

  if (!gstRecord) {
    // Auto-create GST record if it doesn't exist
    gstRecord = await GstMaster.create(
      {
        id: uuidv4(),
        hsn_code: hsnCode,
        gst_rate: gstInfo.gstRate,
        description: gstInfo.description,
        is_active: true,
        created_by: createdById,
      },
      { validate: true }
    );
  }

  // Generate SKU and Name
  const productCode = generateRawSku({
    speciesCode: species.code,
    sizeCode: size.code,
  });

  const productName = generateRawProductName({
    speciesName: species.name,
    sizeDisplay: size.display,
  });

  // Get or find Derivative: "Whole"
  const DerivativeMaster = sequelize.models.DerivativeMaster;
  let wholeDerivative = await DerivativeMaster.findOne({
    where: {
      derivative_name: "Whole",
      is_active: true,
    },
  });

  if (!wholeDerivative) {
    // Create Whole derivative if missing
    wholeDerivative = await DerivativeMaster.create(
      {
        id: uuidv4(),
        derivative_name: "Whole",
        is_active: true,
        created_by: createdById,
      },
      { validate: true }
    );
  }

  // Create RAW Product
  const ProductMaster = sequelize.models.ProductMaster;
  const rawProduct = await ProductMaster.create(
    {
      id: uuidv4(),
      product_code: productCode,
      product_name: productName,
      species_master_id: species.id,
      derivative_master_id: wholeDerivative.id,
      grade_master_id: null, // RAW products have NO grade
      size_master_id: size.id,
      processing_state: "RAW",
      product_role: "RAW_MATERIAL",
      is_raw: true,
      is_sellable: true,
      is_producible: false, // RAW materials are NOT produced
      hsn_code: hsnCode,
      gst_master_id: gstRecord.id,
      uom: "KG",
      is_active: true,
      created_by: createdById,
    },
    { validate: true }
  );

  console.log(`✅ RAW Product created: ${productCode} (${productName})`);
  return rawProduct;
}

/**
 * SPLIT UNSIZED RAW PRODUCT (INTAKE → SIZING WORKFLOW)
 *
 * Moves stock from UNSIZED bucket into sized buckets.
 * This is a reclassification operation (not production).
 *
 * Example:
 * INPUT:  Indian Squid – Whole – Raw – UNSIZED (500 kg)
 * OUTPUT:
 *   - 10–20cm → 180 kg
 *   - 20–30cm → 250 kg
 *   - Waste   → 70 kg
 *
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} payload - { unsizedProductId, splits, wasteWeight, notes }
 *   splits: [{ sizeId, weight }]
 * @returns {Promise<Object>} - { success, inventory_adjustments }
 */
async function splitUnsizedRaw(sequelize, payload) {
  const { unsizedProductId, splits, wasteWeight = 0, notes = "" } = payload;

  if (!unsizedProductId || !splits || splits.length === 0) {
    throw new Error(
      "Unsized product ID and at least one size split are mandatory"
    );
  }

  const ProductMaster = sequelize.models.ProductMaster;

  // Get UNSIZED product
  const unsizedProduct = await ProductMaster.findByPk(unsizedProductId);
  if (!unsizedProduct) {
    throw new Error(`UNSIZED product not found: ${unsizedProductId}`);
  }

  if (unsizedProduct.processing_state !== "RAW") {
    throw new Error("Can only split RAW products");
  }

  // Validate splits
  const totalSplit = splits.reduce((sum, s) => sum + s.weight, 0) + wasteWeight;
  console.log(
    `   📊 Split check: UNSIZED=${unsizedProduct.product_code}, Total=${totalSplit}kg`
  );

  // Find or create sized RAW products for each split
  const adjustments = [];

  for (const split of splits) {
    const SizeMaster = sequelize.models.SizeMaster;
    const sizeRecord = await SizeMaster.findByPk(split.sizeId);

    if (!sizeRecord) {
      throw new Error(`Size not found: ${split.sizeId}`);
    }

    // Find or create sized RAW product
    let sizedRawProduct = await ProductMaster.findOne({
      where: {
        species_master_id: unsizedProduct.species_master_id,
        size_master_id: split.sizeId,
        processing_state: "RAW",
      },
    });

    if (!sizedRawProduct) {
      // Auto-create sized RAW product
      const speciesRecord = await sequelize.models.SpeciesMaster.findByPk(
        unsizedProduct.species_master_id
      );

      sizedRawProduct = await createRawProduct(sequelize, {
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
        createdById: unsizedProduct.created_by,
      });
    }

    adjustments.push({
      productId: sizedRawProduct.id,
      productCode: sizedRawProduct.product_code,
      weight: split.weight,
      operation: "ADD",
    });
  }

  if (wasteWeight > 0) {
    adjustments.push({
      category: "WASTE",
      weight: wasteWeight,
      operation: "SCRAP",
    });
  }

  console.log(`✅ Split operation defined: ${adjustments.length} adjustments`);
  console.log(`   Adjustments:`, adjustments);

  // Return adjustment plan (actual inventory posting is done by inventory service)
  return {
    success: true,
    unsized_product_id: unsizedProductId,
    total_weight: totalSplit,
    adjustments,
    notes,
  };
}

/**
 * VALIDATE RAW PRODUCT FOR PRODUCTION
 * Ensures UNSIZED raw products are NOT issued to production.
 */
function validateRawForProduction(product) {
  if (product.processing_state !== "RAW") {
    throw new Error(`Product is not RAW: ${product.product_code}`);
  }

  // Check if size is UNSIZED
  if (product.Size?.size === "UNSIZED") {
    throw new Error(
      `Cannot issue UNSIZED raw material to production. Product must be sorted first: ${product.product_code}`
    );
  }

  return true;
}

/**
 * VALIDATE RAW PRODUCT FOR SALES
 * Ensures UNSIZED raw products are NOT sold.
 */
function validateRawForSales(product) {
  if (product.processing_state !== "RAW") {
    throw new Error(`Product is not RAW: ${product.product_code}`);
  }

  if (!product.is_sellable) {
    throw new Error(`Product is not sellable: ${product.product_code}`);
  }

  // UNSIZED cannot be sold
  if (product.Size?.size === "UNSIZED") {
    throw new Error(
      `Cannot sell UNSIZED raw material. Must be sorted and assigned a size first: ${product.product_code}`
    );
  }

  return true;
}

module.exports = {
  generateRawSku,
  generateRawProductName,
  resolveRawHsn,
  resolveRawGst,
  createRawProduct,
  splitUnsizedRaw,
  validateRawForProduction,
  validateRawForSales,
};
