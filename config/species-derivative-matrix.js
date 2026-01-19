/**
 * Species-Derivative Mapping Matrix
 *
 * Defines which derivatives are allowed for each species type.
 * This matrix controls the valid processing paths for each seafood species.
 *
 * Format:
 * SPECIES_TYPE: {
 *   description: "Species description",
 *   allowed_derivatives: ["DERIVATIVE_CODE_1", "DERIVATIVE_CODE_2", ...]
 * }
 */

module.exports = {
  // ============================================================
  // FINFISH (Fish: Salmon, Tuna, Cod, Mackerel, Snapper, etc.)
  // ============================================================
  FINFISH: {
    description: "Finfish - All types",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",

      // Processed Uncooked - Common finfish cuts
      "PRC_GUTTED",
      "PRC_GG",
      "PRC_HEADED",
      "PRC_HG",
      "PRC_DRESSED",
      "PRC_FILLET_SKINON",
      "PRC_FILLET_SKINLESS",
      "PRC_LOIN",
      "PRC_PORTION",
      "PRC_STEAKS_SLICES",

      // Cooked/Value-Added
      "CKD_FISH_COOKED",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
  },

  // ============================================================
  // CRUSTACEAN - SHRIMP/PRAWN
  // ============================================================
  CRUSTACEAN_SHRIMP: {
    description: "Crustacean - Shrimp/Prawn",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",
      "UNP_HEADON_SHELLON",

      // Processed Uncooked - Shrimp-specific cuts
      "PRC_HEADLESS",
      "PRC_TAILS",
      "PRC_PUD", // Peeled Undeveined
      "PRC_PD", // Peeled Deveined
      "PRC_PTO", // Peeled Tail-on
      "PRC_EZPEEL",

      // Cooked/Value-Added
      "CKD_SHRIMP_BOILED",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
    blocked_derivatives: [
      "PRC_CLAWS_KNUCKLES", // ❌ Claws/Knuckles only for crabs/lobsters
      "CKD_CRAB_MEAT", // ❌ Crab meat only for crabs
      "CKD_LOBSTER_MEAT", // ❌ Lobster meat only for lobsters
    ],
  },

  // ============================================================
  // CRUSTACEAN - CRAB
  // ============================================================
  CRUSTACEAN_CRAB: {
    description: "Crustacean - Crab",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",
      "UNP_HEADON_SHELLON",

      // Processed Uncooked - Crab-specific cuts
      "PRC_DRESSED",
      "PRC_CLAWS_KNUCKLES",

      // Cooked/Value-Added
      "CKD_CRAB_MEAT",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
    blocked_derivatives: [
      "PRC_EZPEEL", // ❌ EZ Peel is for shrimp only
      "PRC_PUD", // ❌ PUD is for shrimp only
      "PRC_PD", // ❌ PD is for shrimp only
      "PRC_PTO", // ❌ PTO is for shrimp only
      "PRC_TAILS", // ❌ Tails are for shrimp/lobster (not crab)
      "CKD_SHRIMP_BOILED", // ❌ Shrimp-specific
      "CKD_LOBSTER_MEAT", // ❌ Lobster-specific
    ],
  },

  // ============================================================
  // CRUSTACEAN - LOBSTER
  // ============================================================
  CRUSTACEAN_LOBSTER: {
    description: "Crustacean - Lobster",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",
      "UNP_HEADON_SHELLON",

      // Processed Uncooked - Lobster-specific cuts
      "PRC_TAILS",
      "PRC_CLAWS_KNUCKLES",
      "PRC_PORTION", // Lobster portions/cuts

      // Cooked/Value-Added
      "CKD_LOBSTER_MEAT",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
    blocked_derivatives: [
      "PRC_EZPEEL", // ❌ EZ Peel is for shrimp only
      "PRC_PUD", // ❌ PUD is for shrimp only
      "PRC_PD", // ❌ PD is for shrimp only
      "PRC_PTO", // ❌ PTO is for shrimp only
      "CKD_SHRIMP_BOILED", // ❌ Shrimp-specific
      "CKD_CRAB_MEAT", // ❌ Crab-specific
    ],
  },

  // ============================================================
  // CEPHALOPOD (Squid, Cuttlefish, Octopus)
  // ============================================================
  CEPHALOPOD: {
    description: "Cephalopod - Squid/Cuttlefish/Octopus",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",

      // Processed Uncooked - Cephalopod-specific cuts
      "PRC_TUBES",
      "PRC_TENTACLES",
      "PRC_RINGS",

      // Cooked/Value-Added
      "CKD_SQUID_COOKED",
      "CKD_OCTOPUS_COOKED",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
  },

  // ============================================================
  // BIVALVE (Clams, Mussels, Scallops, Oysters)
  // ============================================================
  BIVALVE: {
    description: "Bivalve - Clams/Mussels/Scallops/Oysters",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",
      "UNP_INSHELL",

      // Processed Uncooked - Bivalve-specific forms
      "PRC_HALF_SHELL",
      "PRC_SHUCKED_MEAT",

      // Cooked/Value-Added
      "CKD_BIVALVE_MEAT",
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
  },

  // ============================================================
  // GASTROPOD (Conch, Whelk, Snail)
  // ============================================================
  GASTROPOD: {
    description: "Gastropod - Conch/Whelk/Snail",
    allowed_derivatives: [
      // Unprocessed
      "UNP_WHOLE_ROUND",
      "UNP_INSHELL",

      // Processed Uncooked - Limited options for gastropods
      "PRC_SHUCKED_MEAT",

      // Cooked/Value-Added
      "CKD_BREADED_BATTERED",
      "CKD_MARINATED_RTE",
      "CKD_CANNED_RETORT",
    ],
  },
};

/**
 * Helper function to validate if a derivative is allowed for a species
 * @param {string} speciesType - Species type key (e.g., "CRUSTACEAN_SHRIMP")
 * @param {string} derivativeCode - Derivative code to validate
 * @returns {object} - { allowed: boolean, reason: string }
 */
function isDerivativeAllowedForSpecies(speciesType, derivativeCode) {
  const speciesConfig = module.exports[speciesType];

  if (!speciesConfig) {
    return {
      allowed: false,
      reason: `Unknown species type: ${speciesType}`,
    };
  }

  // Check if it's in blocked list
  if (speciesConfig.blocked_derivatives?.includes(derivativeCode)) {
    return {
      allowed: false,
      reason: `Derivative ${derivativeCode} is blocked for ${speciesConfig.description}`,
    };
  }

  // Check if it's in allowed list
  if (speciesConfig.allowed_derivatives.includes(derivativeCode)) {
    return {
      allowed: true,
      reason: `Derivative ${derivativeCode} is allowed for ${speciesConfig.description}`,
    };
  }

  return {
    allowed: false,
    reason: `Derivative ${derivativeCode} is not in the allowed list for ${speciesConfig.description}`,
  };
}

module.exports.isDerivativeAllowedForSpecies = isDerivativeAllowedForSpecies;
