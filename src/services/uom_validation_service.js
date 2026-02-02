/**
 * UOM (Unit of Measure) Validation Service
 *
 * Enforces UOM rules for different seafood species and derivatives based on industry standards.
 * This service validates primary and secondary UOM combinations for each species type.
 */

class UOMValidationService {
  /**
   * UOM Rules by Species Type and Derivative
   * Based on industry standards and business requirements
   */
  static UOM_RULES = {
    // FISH DERIVATIVES
    FISH: {
      description: "Finfish - All types (Salmon, Tuna, Cod, Mackerel, etc.)",
      derivatives: {
        // Unprocessed
        UNP_WHOLE_ROUND: {
          primary: "kg",
          secondary: "pcs",
          notes: "Purchase basis",
        },

        // Processed Uncooked
        PRC_GUTTED: { primary: "kg", secondary: "pcs", notes: "Yield applies" },
        PRC_HEADED: { primary: "kg", secondary: "pcs", notes: "Yield applies" },
        PRC_FILLET_SKINON: {
          primary: "kg",
          secondary: null,
          notes: "Core yield output",
        },
        PRC_FILLET_SKINLESS: {
          primary: "kg",
          secondary: null,
          notes: "Core yield output",
        },
        PRC_STEAKS_SLICES: {
          primary: "kg",
          secondary: "pcs",
          notes: "Count optional",
        },
        PRC_LOIN: { primary: "kg", secondary: null, notes: "Tuna only" },
        PRC_SAKU_BLOCK: { primary: "kg", secondary: "pcs", notes: "Export" },
        PRC_MINCE: { primary: "kg", secondary: null, notes: "Residual" },

        // Cooked/Value-Added
        CKD_FISH_COOKED: {
          primary: "kg",
          secondary: null,
          notes: "Net cooked weight",
        },
        CKD_FILLETS_COOKED: {
          primary: "kg",
          secondary: null,
          notes: "Net cooked weight",
        },
      },
    },

    // CRUSTACEANS - SHRIMP/PRAWN
    CRUSTACEAN_SHRIMP: {
      description: "Crustacean - Shrimp/Prawn",
      derivatives: {
        UNP_WHOLE: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        PRC_HEADED: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        PRC_HEADLESS: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        PRC_PEELED: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        PRC_EZPEEL: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        PRC_TAILS: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
        CKD_PEELED_COOKED: {
          primary: "kg",
          secondary: "count/kg",
          notes: "Count/kg is mandatory metadata",
        },
      },
      blocked_derivatives: [
        "PRC_CLAWS_KNUCKLES",
        "PRC_DRESSED",
        "PRC_CRAB_MEAT",
        "CKD_CRAB_MEAT",
        "CKD_LOBSTER_MEAT",
      ],
    },

    // CRUSTACEANS - CRAB/LOBSTER
    CRUSTACEAN_CRAB: {
      description: "Crustacean - Crab/Lobster",
      derivatives: {
        UNP_WHOLE: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_CLAWS_KNUCKLES: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_TAILS: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_DRESSED: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_CRAB_MEAT: { primary: "kg", secondary: null, notes: "" },
        CKD_CRAB_MEAT: { primary: "kg", secondary: null, notes: "" },
      },
      blocked_derivatives: [
        "PRC_EZPEEL",
        "PRC_PEELED",
        "PRC_PEELED_DEVEINED",
        "PRC_HEADED",
        "PRC_HEADLESS",
      ],
    },

    // CEPHALOPODS (Squid, Cuttlefish, Octopus)
    CEPHALOPOD: {
      description: "Cephalopod - Squid, Cuttlefish, Octopus",
      derivatives: {
        UNP_WHOLE: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_TUBES: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_TENTACLES: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_RINGS: {
          primary: "pcs",
          secondary: "kg",
          notes: "Count-based but must store avg weight per ring",
        },
        PRC_STEAKS: { primary: "kg", secondary: "pcs", notes: "" },
        CKD_RINGS_COOKED: { primary: "pcs", secondary: "kg", notes: "" },
        CKD_TENTACLES_COOKED: { primary: "kg", secondary: null, notes: "" },
      },
    },

    // BIVALVES (Mussels, Oysters, Clams, Scallops)
    BIVALVE: {
      description: "Bivalve - Mussels, Oysters, Clams, Scallops",
      derivatives: {
        UNP_WHOLE_SHELLON: { primary: "kg", secondary: "count", notes: "" },
        PRC_HALF_SHELL: { primary: "pcs", secondary: "kg", notes: "" },
        PRC_SHUCKED_MEAT: { primary: "kg", secondary: null, notes: "" },
        PRC_SCALLOP_MEAT: {
          primary: "pcs",
          secondary: "kg",
          notes: "Scallops are ALWAYS count-based for sales",
        },
        CKD_MEAT_COOKED: { primary: "kg", secondary: null, notes: "" },
      },
    },

    // GASTROPODS (Abalone, Snails)
    GASTROPOD: {
      description: "Gastropod - Abalone, Snails",
      derivatives: {
        UNP_WHOLE: { primary: "kg", secondary: "pcs", notes: "" },
        PRC_CLEANED_MEAT: { primary: "kg", secondary: null, notes: "" },
        PRC_SLICED: { primary: "kg", secondary: "pcs", notes: "" },
        CKD_COOKED: { primary: "kg", secondary: null, notes: "" },
      },
    },
  };

  /**
   * Validate UOM combination for a species type and derivative
   *
   * @param {string} speciesType - Species type (FISH, CRUSTACEAN_SHRIMP, etc.)
   * @param {string} derivativeCode - Derivative code (UNP_WHOLE_ROUND, PRC_GUTTED, etc.)
   * @param {string} primaryUOM - Primary UOM being used
   * @param {string|null} secondaryUOM - Secondary UOM being used (can be null)
   * @returns {Object} - { isValid: boolean, errors: string[], warnings: string[] }
   */
  static validateUOMCombination(
    speciesType,
    derivativeCode,
    primaryUOM,
    secondaryUOM,
  ) {
    const errors = [];
    const warnings = [];

    // Check if species type exists
    if (!this.UOM_RULES[speciesType]) {
      errors.push(`Unknown species type: ${speciesType}`);
      return { isValid: false, errors, warnings };
    }

    const speciesRules = this.UOM_RULES[speciesType];

    // Check if derivative is blocked for this species
    if (speciesRules.blocked_derivatives?.includes(derivativeCode)) {
      errors.push(`${derivativeCode} is not allowed for ${speciesType}`);
      return { isValid: false, errors, warnings };
    }

    // Check if derivative exists in rules
    if (!speciesRules.derivatives[derivativeCode]) {
      // If derivative not explicitly defined, allow basic validation
      warnings.push(
        `No specific UOM rules defined for ${derivativeCode} in ${speciesType}, using basic validation`,
      );
      return this.basicUOMValidation(primaryUOM, secondaryUOM);
    }

    const derivativeRules = speciesRules.derivatives[derivativeCode];

    // Validate primary UOM
    if (primaryUOM !== derivativeRules.primary) {
      errors.push(
        `Invalid primary UOM for ${derivativeCode}: expected ${derivativeRules.primary}, got ${primaryUOM}`,
      );
    }

    // Validate secondary UOM
    if (derivativeRules.secondary === null) {
      // No secondary UOM allowed
      if (secondaryUOM !== null && secondaryUOM !== undefined) {
        errors.push(
          `${derivativeCode} does not allow secondary UOM, but ${secondaryUOM} was provided`,
        );
      }
    } else {
      // Secondary UOM required or optional
      if (!secondaryUOM) {
        warnings.push(
          `${derivativeCode} should have secondary UOM: ${derivativeRules.secondary}`,
        );
      } else if (secondaryUOM !== derivativeRules.secondary) {
        errors.push(
          `Invalid secondary UOM for ${derivativeCode}: expected ${derivativeRules.secondary}, got ${secondaryUOM}`,
        );
      }
    }

    // Special validations
    if (derivativeCode === "PRC_RINGS" && speciesType === "CEPHALOPOD") {
      if (!secondaryUOM || secondaryUOM !== "kg") {
        warnings.push(
          "Rings must store average weight per ring (secondary UOM should be kg)",
        );
      }
    }

    if (derivativeCode === "PRC_SCALLOP_MEAT" && speciesType === "BIVALVE") {
      if (primaryUOM !== "pcs") {
        errors.push("Scallop meat must ALWAYS be count-based (pcs) for sales");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      expected: {
        primary: derivativeRules.primary,
        secondary: derivativeRules.secondary,
        notes: derivativeRules.notes,
      },
    };
  }

  /**
   * Basic UOM validation when no specific rules exist
   */
  static basicUOMValidation(primaryUOM, secondaryUOM) {
    const errors = [];
    const warnings = [];

    // Basic validation - primary UOM should be kg or pcs
    if (!["kg", "pcs"].includes(primaryUOM)) {
      errors.push(`Primary UOM should be 'kg' or 'pcs', got '${primaryUOM}'`);
    }

    // Secondary UOM should be compatible
    if (secondaryUOM) {
      const validSecondary = ["pcs", "kg", "count", "count/kg"];
      if (!validSecondary.includes(secondaryUOM)) {
        warnings.push(`Secondary UOM '${secondaryUOM}' may not be standard`);
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Get allowed UOM combinations for a species type and derivative
   *
   * @param {string} speciesType - Species type
   * @param {string} derivativeCode - Derivative code
   * @returns {Object|null} - UOM rules or null if not found
   */
  static getUOMRules(speciesType, derivativeCode) {
    if (!this.UOM_RULES[speciesType]?.derivatives[derivativeCode]) {
      return null;
    }

    return this.UOM_RULES[speciesType].derivatives[derivativeCode];
  }

  /**
   * Get all species types
   */
  static getSpeciesTypes() {
    return Object.keys(this.UOM_RULES);
  }

  /**
   * Get all derivatives for a species type
   */
  static getDerivativesForSpecies(speciesType) {
    if (!this.UOM_RULES[speciesType]) {
      return [];
    }

    return Object.keys(this.UOM_RULES[speciesType].derivatives);
  }

  /**
   * Check if a derivative is blocked for a species type
   */
  static isDerivativeBlocked(speciesType, derivativeCode) {
    return (
      this.UOM_RULES[speciesType]?.blocked_derivatives?.includes(
        derivativeCode,
      ) || false
    );
  }
}

module.exports = UOMValidationService;
