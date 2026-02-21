#!/usr/bin/env node

/**
 * Species-Derivative Matrix Validator
 *
 * Tests the species-derivative mapping matrix to ensure
 * crustacean rules are correctly enforced.
 */

const matrix = require("../config/species-derivative-matrix");

console.log("\n" + "=".repeat(80));
console.log("SPECIES-DERIVATIVE MATRIX VALIDATION TEST");
console.log("=".repeat(80) + "\n");

// Test cases for crustaceans
const testCases = [
  // SHRIMP tests
  {
    species: "CRUSTACEAN_SHRIMP",
    derivative: "PRC_PD",
    expectedAllowed: true,
    description: "Shrimp + Peeled Deveined",
  },
  {
    species: "CRUSTACEAN_SHRIMP",
    derivative: "PRC_CLAWS_KNUCKLES",
    expectedAllowed: false,
    description: "Shrimp + Claws (should be blocked)",
  },
  {
    species: "CRUSTACEAN_SHRIMP",
    derivative: "CKD_CRAB_MEAT",
    expectedAllowed: false,
    description: "Shrimp + Crab Meat (should be blocked)",
  },

  // CRAB tests
  {
    species: "CRUSTACEAN_CRAB",
    derivative: "PRC_CLAWS_KNUCKLES",
    expectedAllowed: true,
    description: "Crab + Claws/Knuckles",
  },
  {
    species: "CRUSTACEAN_CRAB",
    derivative: "CKD_CRAB_MEAT",
    expectedAllowed: true,
    description: "Crab + Crab Meat",
  },
  {
    species: "CRUSTACEAN_CRAB",
    derivative: "PRC_EZPEEL",
    expectedAllowed: false,
    description: "Crab + EZ Peel (should be blocked)",
  },
  {
    species: "CRUSTACEAN_CRAB",
    derivative: "PRC_TAILS",
    expectedAllowed: false,
    description: "Crab + Tails (should be blocked)",
  },

  // LOBSTER tests
  {
    species: "CRUSTACEAN_LOBSTER",
    derivative: "PRC_TAILS",
    expectedAllowed: true,
    description: "Lobster + Tails",
  },
  {
    species: "CRUSTACEAN_LOBSTER",
    derivative: "PRC_CLAWS_KNUCKLES",
    expectedAllowed: true,
    description: "Lobster + Claws/Knuckles",
  },
  {
    species: "CRUSTACEAN_LOBSTER",
    derivative: "CKD_LOBSTER_MEAT",
    expectedAllowed: true,
    description: "Lobster + Lobster Meat",
  },
  {
    species: "CRUSTACEAN_LOBSTER",
    derivative: "PRC_PD",
    expectedAllowed: false,
    description: "Lobster + Peeled Deveined (shrimp only - should be blocked)",
  },
  {
    species: "CRUSTACEAN_LOBSTER",
    derivative: "CKD_SHRIMP_BOILED",
    expectedAllowed: false,
    description: "Lobster + Shrimp Boiled (should be blocked)",
  },

  // FINFISH tests
  {
    species: "FINFISH",
    derivative: "PRC_FILLET_SKINON",
    expectedAllowed: true,
    description: "Finfish + Fillet Skin-on",
  },

  // CEPHALOPOD tests
  {
    species: "CEPHALOPOD",
    derivative: "PRC_TUBES",
    expectedAllowed: true,
    description: "Cephalopod + Tubes",
  },

  // BIVALVE tests
  {
    species: "BIVALVE",
    derivative: "PRC_SHUCKED_MEAT",
    expectedAllowed: true,
    description: "Bivalve + Shucked Meat",
  },
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = matrix.isDerivativeAllowedForSpecies(
    testCase.species,
    testCase.derivative,
  );
  const testPassed = result.allowed === testCase.expectedAllowed;

  if (testPassed) {
    passed++;
    console.log(`✅ PASS: ${testCase.description}\n   → ${result.reason}\n`);
  } else {
    failed++;
    console.log(
      `❌ FAIL: ${testCase.description}\n   Expected: ${testCase.expectedAllowed}, Got: ${result.allowed}\n   → ${result.reason}\n`,
    );
  }
});

console.log("=".repeat(80));
console.log(
  `RESULTS: ${passed} passed, ${failed} failed out of ${testCases.length} tests`,
);
console.log("=".repeat(80) + "\n");

// Display the full matrix
console.log("SPECIES-DERIVATIVE MATRIX OVERVIEW:\n");
Object.entries(matrix).forEach(([speciesType, config]) => {
  if (typeof config === "object" && config.description) {
    console.log(`\n${speciesType.padEnd(25)} - ${config.description}`);
    console.log(
      `Allowed derivatives: ${config.allowed_derivatives?.length || 0}`,
    );
    if (config.allowed_derivatives) {
      console.log(`  ${config.allowed_derivatives.join(", ")}`);
    }
    if (config.blocked_derivatives && config.blocked_derivatives.length > 0) {
      console.log(`Blocked derivatives: ${config.blocked_derivatives.length}`);
      console.log(`  ${config.blocked_derivatives.join(", ")}`);
    }
  }
});

console.log("\n" + "=".repeat(80) + "\n");

process.exit(failed > 0 ? 1 : 0);
