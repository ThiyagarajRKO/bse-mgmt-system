/**
 * ERP Business Rules Engine
 * Validates product compatibility based on species, grade, and size
 *
 * RULE 1: Species ↔ Product Form Compatibility
 * RULE 2: Grade ↔ Size Compatibility
 * RULE 3: SKU Uniqueness
 * RULE 4: HSN from SpeciesMaster (no override)
 */

// ─────────────────────────────────────────────────────────────
// CEPHALOPODS (Squid, Cuttlefish, Octopus)
// ─────────────────────────────────────────────────────────────
const CEPHALOPOD_FORMS = [
  "Whole Round",
  "Whole Cleaned",
  "Semi Cleaned",
  "Fillet",
  "Strips",
  "Slices",
  "Rings",
  "Tentacles",
  "Tubes",
  "Cooked",
  "Blanched",
  "Smoked",
  "Marinated",
  "Breaded",
];

// ─────────────────────────────────────────────────────────────
// SHRIMP / PRAWN
// ─────────────────────────────────────────────────────────────
const SHRIMP_FORMS = [
  "HOSO",
  "HLSO",
  "HL",
  "PUD",
  "PD",
  "PDTO",
  "PUDTO",
  "Shrimp Meat",
  "Nobashi",
  "Butterfly",
  "EZ Peel",
  "IQF",
  "Block Frozen",
  "Cooked",
  "Blanched",
  "Breaded",
  "Smoked",
];

// ─────────────────────────────────────────────────────────────
// CRABS
// ─────────────────────────────────────────────────────────────
const CRAB_FORMS = [
  "Whole Crab",
  "Half Cut Crab",
  "Claw Meat",
  "Knuckle Meat",
  "Leg Meat",
  "Body Meat",
  "Jumbo Lump",
  "Lump",
  "Special",
  "Flake",
  "Soft Shell Whole",
  "Soft Shell Cut",
  "Crab Clusters",
  "Cooked",
  "Smoked",
  "Marinated",
];

// ─────────────────────────────────────────────────────────────
// BIVALVES (Mussels, Clams, Scallops, Oysters)
// ─────────────────────────────────────────────────────────────
const BIVALVE_FORMS = [
  "Half Shell",
  "Whole Shell",
  "Meat Only",
  "Roe On",
  "Roe Off",
  "IQF Meat",
  "Cooked",
  "Blanched",
  "Grilled",
];

// ─────────────────────────────────────────────────────────────
// GASTROPODS (Whelk, Conch, Abalone)
// ─────────────────────────────────────────────────────────────
const GASTROPOD_FORMS = [
  "Whole Cleaned",
  "Meat Only",
  "Cooked Meat",
  "Sliced Meat",
  "Cooked",
  "Blanched",
];

// ─────────────────────────────────────────────────────────────
// RULE 1: Species → Product Form Mapping
// ─────────────────────────────────────────────────────────────
/**
 * Get allowed product forms for a given species
 * @param {string} speciesName - Name of the species
 * @returns {Array} Array of allowed forms
 */
function allowedFormsBySpecies(speciesName) {
  if (!speciesName) return [];

  const n = speciesName.toLowerCase();

  // Cephalopods
  if (
    n.includes("squid") ||
    n.includes("octopus") ||
    n.includes("cuttlefish")
  ) {
    return CEPHALOPOD_FORMS;
  }

  // Shrimp/Prawn
  if (n.includes("shrimp") || n.includes("prawn")) {
    return SHRIMP_FORMS;
  }

  // Crabs
  if (n.includes("crab")) {
    return CRAB_FORMS;
  }

  // Bivalves
  if (
    n.includes("clam") ||
    n.includes("mussel") ||
    n.includes("oyster") ||
    n.includes("scallop")
  ) {
    return BIVALVE_FORMS;
  }

  // Gastropods
  if (n.includes("abalone") || n.includes("whelk") || n.includes("conch")) {
    return GASTROPOD_FORMS;
  }

  // If species name is not explicitly mapped, we'll allow any form
  // This enables support for species like "Spiny Lobster" and other crustaceans
  // The actual validation happens at the database level via ProductCategoryMaster
  return null; // Signal that we should skip validation (DB will handle it)
}

// ─────────────────────────────────────────────────────────────
// RULE 2: Grade ↔ Size Compatibility
// ─────────────────────────────────────────────────────────────
/**
 * Get allowed sizes for a given grade
 * @param {string} grade - Product grade (Premium, A, B, C, Standard)
 * @returns {Array} Array of allowed size codes
 */
function allowedSizesByGrade(grade) {
  const sizeMap = {
    // Shrimp/Prawn grades
    Premium: ["SZ001", "SZ002", "SZ003", "SZ004", "SZ005"],
    A: ["SZ002", "SZ003", "SZ004", "SZ005", "SZ006"],
    B: ["SZ004", "SZ005", "SZ006", "SZ007", "SZ008"],
    C: ["SZ006", "SZ007", "SZ008", "SZ009", "SZ010"],
    Standard: [
      "SZ001",
      "SZ002",
      "SZ003",
      "SZ004",
      "SZ005",
      "SZ006",
      "SZ007",
      "SZ008",
      "SZ009",
      "SZ010",
    ],
  };

  // If grade is in our hardcoded map, use it; otherwise return null
  // to signal that we should skip validation (DB will handle it)
  return sizeMap[grade] ?? null;
}

// ─────────────────────────────────────────────────────────────
// RULE 3: SKU Uniqueness Validation
// ─────────────────────────────────────────────────────────────
/**
 * Generate unique SKU identifier from product components
 * @param {string} speciesId - Species ID
 * @param {string} form - Product form
 * @param {string} grade - Product grade
 * @param {string} sizeId - Size ID
 * @returns {string} Unique SKU
 */
function generateSKU(speciesId, form, grade, sizeId) {
  return `${speciesId}-${form}-${grade}-${sizeId}`.toUpperCase();
}

/**
 * Validate SKU uniqueness
 * @param {string} speciesId
 * @param {string} form
 * @param {string} grade
 * @param {string} sizeId
 * @param {Array} existingProducts - Products already in DB
 * @returns {boolean} True if SKU is unique
 */
function isSKUUnique(speciesId, form, grade, sizeId, existingProducts = []) {
  const newSKU = generateSKU(speciesId, form, grade, sizeId);

  return !existingProducts.some((product) => {
    return (
      product.species_id === speciesId &&
      product.product_form === form &&
      product.grade === grade &&
      product.size_id === sizeId
    );
  });
}

// ─────────────────────────────────────────────────────────────
// RULE 4: HSN from SpeciesMaster (No Override)
// ─────────────────────────────────────────────────────────────
/**
 * Get HSN code from SpeciesMaster (authoritative source)
 * @param {Object} species - SpeciesMaster object
 * @returns {string} HSN code
 */
function getHSNFromSpecies(species) {
  if (!species || !species.hsn_code) {
    return null;
  }
  return species.hsn_code;
}

// ─────────────────────────────────────────────────────────────
// VALIDATION HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────

/**
 * Validate product form against species
 * @param {string} speciesName - Species name
 * @param {string} form - Product form to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateFormForSpecies(speciesName, form) {
  const allowedForms = allowedFormsBySpecies(speciesName);

  // If allowedForms is null, species wasn't in hardcoded list
  // but it may be valid in the database. Skip validation here and let DB handle it.
  if (allowedForms === null) {
    return { valid: true }; // Allow to proceed - DB validation will catch errors
  }

  if (allowedForms.length === 0) {
    return {
      valid: false,
      error: `Unknown species: ${speciesName}`,
    };
  }

  if (!allowedForms.includes(form)) {
    return {
      valid: false,
      error: `Form "${form}" is not allowed for species "${speciesName}". Allowed forms: ${allowedForms.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Validate size for grade
 * @param {string} grade - Product grade
 * @param {string} sizeCode - Size code to validate
 * @returns {Object} { valid: boolean, error: string }
 */
function validateSizeForGrade(grade, sizeCode) {
  const allowedSizes = allowedSizesByGrade(grade);

  // If allowedSizes is null, grade wasn't in hardcoded list
  // but it may be valid in the database. Skip validation here and let DB handle it.
  if (allowedSizes === null) {
    return { valid: true }; // Allow to proceed - DB validation will catch errors
  }

  if (allowedSizes.length === 0) {
    return {
      valid: false,
      error: `Unknown grade: ${grade}`,
    };
  }

  if (!allowedSizes.includes(sizeCode)) {
    return {
      valid: false,
      error: `Size "${sizeCode}" is not allowed for grade "${grade}". Allowed sizes: ${allowedSizes.join(
        ", "
      )}`,
    };
  }

  return { valid: true };
}

/**
 * Complete product validation
 * @param {Object} productData - { speciesName, form, grade, sizeCode }
 * @returns {Object} { valid: boolean, errors: Array }
 */
function validateProductRules(productData) {
  const errors = [];

  const { speciesName, form, grade, sizeCode } = productData;

  // Validate form
  const formValidation = validateFormForSpecies(speciesName, form);
  if (!formValidation.valid) {
    errors.push(formValidation.error);
  }

  // Validate size
  const sizeValidation = validateSizeForGrade(grade, sizeCode);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.error);
  }

  return {
    valid: errors.length === 0,
    errors: errors,
  };
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  // Form constants
  CEPHALOPOD_FORMS,
  SHRIMP_FORMS,
  CRAB_FORMS,
  BIVALVE_FORMS,
  GASTROPOD_FORMS,

  // Rule functions
  allowedFormsBySpecies,
  allowedSizesByGrade,
  generateSKU,
  isSKUUnique,
  getHSNFromSpecies,

  // Validation functions
  validateFormForSpecies,
  validateSizeForGrade,
  validateProductRules,
};
