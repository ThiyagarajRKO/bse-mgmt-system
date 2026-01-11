"use strict";

/**
 * Generate Bill of Materials (BOM) for all species and their derivatives
 *
 * This script creates BOMs for:
 * - Fish: Raw Fillet, Cooked Boiled, RTC Breaded, RTE Canned, Stock Base
 * - Crustacean: Raw Tail, Semi-PD, Cooked Boiled, RTC Breaded, RTE Canned, Stock Base
 * - Cephalopod: Raw Tube, Cooked Boiled, RTC Breaded, RTE Canned, Stock Base
 * - Bivalve: Semi-Minced, Cooked Boiled, RTE Canned, Stock Base
 * - Gastropod: Cooked Boiled, RTE Canned, Stock Base
 *
 * Run with: node scripts/generate-bom-for-all-species.js
 */

const { v4: uuidv4 } = require("uuid");

// BOM structure: Maps species type → derivative outputs with base yields
const BOM_STRUCTURE = {
  Fish: {
    bom_code_prefix: "BOM_FISH",
    bom_name_template: "{speciesName} Standard Processing",
    raw_input: "Whole",
    derivatives: [
      {
        code: "RAW_FILLET",
        name_keywords: ["Fillet", "Fillets"],
        base_yield: 40,
      },
      {
        code: "COOKED_BOILED",
        name_keywords: ["Cooked", "Boiled"],
        base_yield: 30,
      },
      { code: "RTC_BREADED", name_keywords: ["Breaded"], base_yield: 25 },
      { code: "RTE_CANNED", name_keywords: ["Canned"], base_yield: 20 },
      { code: "STOCK_BASE", name_keywords: ["Stock"], base_yield: 15 },
    ],
    waste_percent: 5, // 100 - sum of yields = waste
  },
  Crustacean: {
    bom_code_prefix: "BOM_CRUST",
    bom_name_template: "{speciesName} Standard Processing",
    raw_input: "Whole",
    derivatives: [
      { code: "RAW_TAIL", name_keywords: ["Tail"], base_yield: 35 },
      { code: "SEMI_PD", name_keywords: ["Peeled", "PD"], base_yield: 30 },
      {
        code: "COOKED_BOILED",
        name_keywords: ["Cooked", "Boiled"],
        base_yield: 25,
      },
      { code: "RTC_BREADED", name_keywords: ["Breaded"], base_yield: 20 },
      { code: "RTE_CANNED", name_keywords: ["Canned"], base_yield: 18 },
      { code: "STOCK_BASE", name_keywords: ["Stock"], base_yield: 15 },
    ],
    waste_percent: 7, // 100 - sum of yields = waste
  },
  Cephalopod: {
    bom_code_prefix: "BOM_CEPH",
    bom_name_template: "{speciesName} Standard Processing",
    raw_input: "Whole",
    derivatives: [
      { code: "RAW_TUBE", name_keywords: ["Tube"], base_yield: 45 },
      {
        code: "COOKED_BOILED",
        name_keywords: ["Cooked", "Boiled"],
        base_yield: 35,
      },
      { code: "RTC_BREADED", name_keywords: ["Breaded"], base_yield: 30 },
      { code: "RTE_CANNED", name_keywords: ["Canned"], base_yield: 25 },
      { code: "STOCK_BASE", name_keywords: ["Stock"], base_yield: 20 },
    ],
    waste_percent: 10, // 100 - sum of yields = waste
  },
  Bivalve: {
    bom_code_prefix: "BOM_BIV",
    bom_name_template: "{speciesName} Standard Processing",
    raw_input: "Whole",
    derivatives: [
      { code: "SEMI_MINCED", name_keywords: ["Minced"], base_yield: 40 },
      {
        code: "COOKED_BOILED",
        name_keywords: ["Cooked", "Boiled"],
        base_yield: 35,
      },
      { code: "RTE_CANNED", name_keywords: ["Canned"], base_yield: 30 },
      { code: "STOCK_BASE", name_keywords: ["Stock"], base_yield: 20 },
    ],
    waste_percent: 8,
  },
  Gastropod: {
    bom_code_prefix: "BOM_GAST",
    bom_name_template: "{speciesName} Standard Processing",
    raw_input: "Whole",
    derivatives: [
      {
        code: "COOKED_BOILED",
        name_keywords: ["Cooked", "Boiled"],
        base_yield: 50,
      },
      { code: "RTE_CANNED", name_keywords: ["Canned"], base_yield: 35 },
      { code: "STOCK_BASE", name_keywords: ["Stock"], base_yield: 25 },
    ],
    waste_percent: 10,
  },
};

// Grade/Size yield multipliers
const GRADE_SIZE_RULES = {
  grades: {
    A: 1.1, // 10% better yield
    B: 1.0, // standard
    C: 0.95, // 5% worse yield
    D: 0.85, // 15% worse yield
  },
  size_ranges: {
    small: { min: 0, max: 200, multiplier: 0.95 },
    medium: { min: 200, max: 500, multiplier: 1.0 },
    large: { min: 500, max: 1000, multiplier: 1.05 },
    extra_large: { min: 1000, max: 9999, multiplier: 1.02 },
  },
};

module.exports = {
  BOM_STRUCTURE,
  GRADE_SIZE_RULES,

  /**
   * Generate SQL to create BOMs for all species
   * @param {Array} species - Array of species from database
   * @param {Array} products - Array of products from database
   * @param {Array} derivatives - Array of derivatives from database
   * @returns {String} SQL statements
   */
  generateBomSQL(species, products, derivatives) {
    const bomMasterRecords = [];
    const bomInputRecords = [];
    const bomOutputRecords = [];
    const ruleRecords = [];

    // Create derivative map for quick lookup
    const derivativeMap = {};
    derivatives.forEach((d) => {
      derivativeMap[d.derivative_code] = d;
    });

    // Process each species
    species.forEach((sp) => {
      const speciesType = this.getSpeciesTypeFromCode(sp.species_code);
      const bomConfig = BOM_STRUCTURE[speciesType];

      if (!bomConfig) {
        console.warn(`⚠️  No BOM config for species type: ${speciesType}`);
        return;
      }

      // Generate unique BOM code and name
      const bomCode = `${
        bomConfig.bom_code_prefix
      }_${sp.species_code.toUpperCase()}_STD`;
      const bomName = bomConfig.bom_name_template.replace(
        "{speciesName}",
        sp.species_name
      );
      const bomId = uuidv4();

      // Add BOM master record
      bomMasterRecords.push({
        id: bomId,
        species_id: sp.id,
        bom_code: bomCode,
        bom_name: bomName,
        input_uom: "KG",
        output_uom: "KG",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Find raw input product (Whole product for this species)
      const rawProduct = products.find(
        (p) =>
          p.species_id === sp.id &&
          p.product_category === bomConfig.raw_input &&
          p.is_active
      );

      if (rawProduct) {
        bomInputRecords.push({
          id: uuidv4(),
          bom_id: bomId,
          raw_product_id: rawProduct.id,
          quantity: 1, // 1 KG input per BOM unit
          uom: "KG",
          created_at: new Date(),
          updated_at: new Date(),
        });
      } else {
        console.warn(
          `⚠️  No raw product found for ${sp.species_name} (${bomConfig.raw_input})`
        );
      }

      // Add derivative outputs
      let cumulativeYield = 0;
      bomConfig.derivatives.forEach((derivConfig) => {
        const derivative = derivativeMap[derivConfig.code];

        if (!derivative) {
          console.warn(
            `⚠️  Derivative not found: ${derivConfig.code} for ${sp.species_name}`
          );
          return;
        }

        // Find product for this derivative
        const product = products.find(
          (p) =>
            p.species_id === sp.id &&
            derivConfig.name_keywords.some(
              (kw) =>
                p.product_name.includes(kw) || p.product_category.includes(kw)
            ) &&
            p.is_active
        );

        bomOutputRecords.push({
          id: uuidv4(),
          bom_id: bomId,
          derivative_code: derivConfig.code,
          product_id: product ? product.id : null,
          base_yield_percent: derivConfig.base_yield,
          loss_type: "WASTE",
          created_at: new Date(),
          updated_at: new Date(),
        });

        cumulativeYield += derivConfig.base_yield;
      });

      // Add waste output (remaining percentage)
      const wastePercent = 100 - cumulativeYield;
      if (wastePercent > 0) {
        bomOutputRecords.push({
          id: uuidv4(),
          bom_id: bomId,
          derivative_code: "WASTE",
          product_id: null,
          base_yield_percent: wastePercent,
          loss_type: "WASTE",
          created_at: new Date(),
          updated_at: new Date(),
        });
      }

      // Add grade/size rules for this species
      bomConfig.derivatives.forEach((derivConfig) => {
        Object.entries(GRADE_SIZE_RULES.grades).forEach(
          ([grade, gradeMult]) => {
            Object.entries(GRADE_SIZE_RULES.size_ranges).forEach(
              ([sizeRange, sizeConfig]) => {
                ruleRecords.push({
                  id: uuidv4(),
                  species_id: sp.id,
                  derivative_code: derivConfig.code,
                  size_min_grams: sizeConfig.min,
                  size_max_grams: sizeConfig.max,
                  allowed_grades: JSON.stringify([grade]),
                  yield_multiplier: (gradeMult * sizeConfig.multiplier).toFixed(
                    3
                  ),
                  created_at: new Date(),
                  updated_at: new Date(),
                });
              }
            );
          }
        );
      });
    });

    return {
      bom_master: bomMasterRecords,
      bom_input: bomInputRecords,
      bom_output: bomOutputRecords,
      derivative_grade_size_rule: ruleRecords,
    };
  },

  /**
   * Determine species type from species code
   * Handles many code formats: FISH, TUN, SAL, LOB, C, SQD, COD, etc.
   */
  getSpeciesTypeFromCode(speciesCode) {
    if (!speciesCode) return null;

    const code = speciesCode.toUpperCase().trim();

    // Fish codes: FISH, TUN, SAL, COD, REG, F, T, F0xx, T0xx
    if (
      code.includes("FISH") ||
      code.startsWith("F") ||
      code === "F001" ||
      code === "F002" ||
      code === "F003" ||
      code === "F004" ||
      code === "F005" ||
      code.startsWith("TUN") ||
      code.startsWith("T") ||
      (code.startsWith("T0") && code.length <= 4) ||
      code.startsWith("SAL") ||
      code.startsWith("COD") ||
      code.startsWith("REG") ||
      code.startsWith("SH")
    ) {
      return "Fish";
    }

    // Crustacean codes: LOB, C, CRUST, S (shrimp), CRB (Crab)
    if (
      code.includes("CRUST") ||
      code.startsWith("LOB") ||
      code === "C" ||
      code.match(/^C\d+/) || // C001, C002, etc.
      code.startsWith("S0") || // S001, S002, S003 (Shrimp)
      code.startsWith("CRB") || // CRB001, CRB006, etc. (Crab codes)
      code.includes("CRAB")
    ) {
      return "Crustacean";
    }

    // Cephalopod codes: SQD, CEPH, SQ, 5xxx (squid/cuttlefish codes in database)
    if (
      code.includes("CEPH") ||
      code.includes("SQD") ||
      code === "SQ" ||
      code.startsWith("SQ") ||
      code.match(/^5\d+/) || // 5000-series codes for squid/cuttlefish
      code === "O" ||
      code.match(/^O\d+/) // Octopus
    ) {
      return "Cephalopod";
    }

    // Bivalve codes: BIV, SCP, CLM, MUS, OYS
    if (
      code.includes("BIV") ||
      code.includes("SCALLOP") ||
      code.includes("OYSTER") ||
      code.startsWith("SCP") ||
      code.startsWith("CLM") ||
      code.startsWith("MUS") ||
      code.startsWith("OYS")
    ) {
      return "Bivalve";
    }

    // Gastropod codes: GAST, CONCH, 4xxx, RY, RAY
    if (
      code.includes("GAST") ||
      code.includes("CONCH") ||
      code.match(/^4\d+/) || // 4000-series codes for gastropods/shells
      code.startsWith("RY") || // Ray
      code.includes("RAY") ||
      code.includes("SHELL") ||
      code.includes("SNAIL") ||
      code.includes("TURBAN")
    ) {
      return "Gastropod";
    }

    return null;
  },

  /**
   * Generate SQL INSERT statements for BOM data
   */
  generateInsertSQL(bomData) {
    const sqlStatements = [];

    // BOM Master
    bomData.bom_master.forEach((bom) => {
      sqlStatements.push(
        `INSERT INTO bom_master (id, species_id, bom_code, bom_name, input_uom, output_uom, is_active, created_at, updated_at) 
        VALUES ('${bom.id}', '${bom.species_id}', '${
          bom.bom_code
        }', '${bom.bom_name.replace(/'/g, "''")}', '${bom.input_uom}', '${
          bom.output_uom
        }', ${bom.is_active}, NOW(), NOW());`
      );
    });

    // BOM Input
    bomData.bom_input.forEach((input) => {
      sqlStatements.push(
        `INSERT INTO bom_input (id, bom_id, raw_product_id, quantity, uom, created_at, updated_at)
        VALUES ('${input.id}', '${input.bom_id}', '${input.raw_product_id}', ${input.quantity}, '${input.uom}', NOW(), NOW());`
      );
    });

    // BOM Output
    bomData.bom_output.forEach((output) => {
      const productId = output.product_id ? `'${output.product_id}'` : "NULL";
      sqlStatements.push(
        `INSERT INTO bom_output (id, bom_id, derivative_code, product_id, base_yield_percent, loss_type, created_at, updated_at)
        VALUES ('${output.id}', '${output.bom_id}', '${output.derivative_code}', ${productId}, ${output.base_yield_percent}, '${output.loss_type}', NOW(), NOW());`
      );
    });

    // Derivative Grade Size Rules
    bomData.derivative_grade_size_rule.forEach((rule) => {
      sqlStatements.push(
        `INSERT INTO derivative_grade_size_rule (id, species_id, derivative_code, size_min_grams, size_max_grams, allowed_grades, yield_multiplier, created_at, updated_at)
        VALUES ('${rule.id}', '${rule.species_id}', '${rule.derivative_code}', ${rule.size_min_grams}, ${rule.size_max_grams}, '${rule.allowed_grades}', ${rule.yield_multiplier}, NOW(), NOW());`
      );
    });

    return sqlStatements;
  },
};
