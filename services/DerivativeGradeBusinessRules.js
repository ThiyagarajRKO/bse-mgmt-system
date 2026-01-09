"use strict";

/**
 * DERIVATIVE-GRADE BUSINESS RULES ENGINE
 *
 * Implements comprehensive seafood processing rules based on:
 * - Species type (round fish, flat fish, tuna, shrimp, crab, etc.)
 * - Derivative form (WHOLE, FILLET, STEAK, etc.)
 * - Grade quality (A, B, C, D)
 * - Size/Weight thresholds
 * - Market destination (export, domestic, processing)
 *
 * Rules are buyer-aligned and industry-standard.
 */

class DerivativeGradeBusinessRules {
  /**
   * GLOBAL RULE: Grade D restrictions
   * Grade D = industrial/processing only
   */
  static validateGradeD(grade, derivative) {
    if (grade !== "D") return { valid: true };

    const GRADE_D_ALLOWED = ["MINCE", "PASTE", "VALUE_ADDED"];

    if (!GRADE_D_ALLOWED.includes(derivative)) {
      return {
        valid: false,
        error: `Grade D is only allowed for derivatives: ${GRADE_D_ALLOWED.join(
          ", "
        )}`,
        rule: "GLOBAL_GRADE_D_RESTRICTION",
        blocked: true,
      };
    }

    return { valid: true };
  }

  /**
   * ROUND FISH RULES (Mackerel, Arabian Cuttlefish, Kingfish, etc.)
   * - WHOLE: All grades OK
   * - FILLET: All grades, but weight rules apply
   * - STEAK: All grades, but weight rules apply
   */
  static validateRoundFish(derivative, grade, weight) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B", "C", "D"],
        description: "Whole fish - all grades acceptable",
      },
      FILLET: {
        allowed: ["A", "B", "C", "D"],
        description: "Fillets - weight-dependent",
        weight_rules: {
          max_default: 500,
          over_500g: "Must convert to PORTION derivative",
        },
      },
      STEAK: {
        allowed: ["A", "B", "C", "D"],
        description: "Cross-section steaks",
      },
      PORTION: {
        allowed: ["A", "B", "C"],
        weight_range: "< 500g",
        description: "Small portions for retail",
      },
      MINCE: {
        allowed: ["B", "C", "D"],
        description: "Minced/ground",
      },
      PASTE: {
        allowed: ["C", "D"],
        description: "Paste/surimi",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "ROUND_FISH_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Fillet weight rule
    if (derivative === "FILLET" && weight > 500) {
      return {
        valid: false,
        error: `Fillets > 500g must use PORTION derivative (prevents uneven cooking, buyer rejection)`,
        rule: "FILLET_WEIGHT_THRESHOLD",
        weight: weight,
        threshold: 500,
        recommendation: "Convert to PORTION derivative",
      };
    }

    return { valid: true, rule };
  }

  /**
   * FILLET-SPECIFIC RULES
   * Round fish fillets > 500g → must be portioned
   */
  static validateFilletWeight(derivative, weight) {
    if (derivative !== "FILLET") return { valid: true };

    if (weight > 500) {
      return {
        valid: false,
        error: "Fillets > 500g require portion cutting",
        reason: [
          "• Uneven cooking in retail preparation",
          "• Buyer rejection due to inconsistency",
          "• Pricing ambiguity in bulk sales",
        ],
        rule: "FILLET_WEIGHT_MANDATORY_PORTION",
        action: "Force derivative to PORTION",
      };
    }

    return { valid: true };
  }

  /**
   * WING FILLET RULES
   * Wing fillets degrade faster - stricter grade limits
   */
  static validateWingFillet(derivative, grade, speciesType) {
    if (derivative !== "WING_FILLET") return { valid: true };

    // Grade C not allowed for wing fillets (degrades faster)
    const BLOCKED_GRADES = ["D"];
    const ALLOWED_GRADES = ["A", "B"];

    if (BLOCKED_GRADES.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for wing fillets`,
        reason:
          "Wing fillets degrade faster than center cuts - quality constraints",
        rule: "WING_FILLET_GRADE_RESTRICTION",
        allowed_grades: ALLOWED_GRADES,
        blocked_grades: BLOCKED_GRADES,
      };
    }

    return { valid: true };
  }

  /**
   * FLAT FISH RULES (Flounder, Sole, Halibut, etc.)
   * Grade C allowed only as trim/mince, never as fillet
   */
  static validateFlatFish(derivative, grade) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B", "C", "D"],
        description: "Whole flat fish",
      },
      FILLET: {
        allowed: ["A", "B"], // NOT C or D
        description: "Fillets - premium only",
        restriction: "Grade C/D only as trim or mince",
      },
      TRIM: {
        allowed: ["B", "C", "D"],
        description: "Trim pieces",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Grade C/D minced",
      },
      PASTE: {
        allowed: ["D"],
        description: "Processing grade only",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_FLAT_FISH_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for flat fish ${derivative}`,
        rule: "FLAT_FISH_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
        note: rule.restriction || "",
      };
    }

    return { valid: true, rule };
  }

  /**
   * TUNA RULES
   * LOIN: All grades
   * SAKU: Premium only, storage temperature critical
   */
  static validateTuna(derivative, grade, storageTemp) {
    const rules = {
      LOIN: {
        allowed: ["A", "B", "C"],
        description: "Tuna loin",
      },
      SAKU: {
        allowed: ["A"], // Premium only
        description: "Saku (sashimi-grade)",
        temperature_requirement: {
          grade_A: "<= -60°C (sashimi protocol)",
          reason:
            "Sashimi buyers expect frozen storage at -60°C or chilled sashimi protocol",
        },
      },
      STEAK: {
        allowed: ["A", "B", "C"],
        description: "Cross-section steaks",
      },
      MINCE: {
        allowed: ["B", "C"],
        description: "Minced tuna",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_TUNA_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for tuna ${derivative}`,
        rule: "TUNA_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Temperature rule for sashimi-grade saku
    if (derivative === "SAKU" && grade === "A" && storageTemp) {
      if (storageTemp > -60) {
        return {
          valid: false,
          error:
            "Grade A SAKU requires storage at -60°C or sashimi chilled protocol",
          rule: "SAKU_TEMPERATURE_REQUIREMENT",
          current_temp: storageTemp,
          required_temp: "<= -60°C",
          reason: "Sashimi market expectation",
        };
      }
    }

    return { valid: true, rule };
  }

  /**
   * SHRIMP/PRAWN RULES
   * Count-based sizing (8/12, 16/20, 21/25, etc.)
   * Note: Some A grades split into A+ (head-on) and A (headless) - future extension
   */
  static validateShrimp(derivative, grade, countSize) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B"],
        description: "Head-on whole shrimp",
        count_sizes: ["8/12", "13/15", "16/20", "21/25", "26/30"],
      },
      HEADLESS: {
        allowed: ["A", "B"],
        description: "Peeled headless",
        count_sizes: ["13/15", "16/20", "21/25", "26/30", "31/40"],
      },
      TAIL: {
        allowed: ["A", "B", "C"],
        description: "Tails only (cooked or raw)",
        count_sizes: ["16/20", "21/25", "26/30"],
      },
      MINCE: {
        allowed: ["B", "C"],
        description: "Minced shrimp",
      },
      PASTE: {
        allowed: ["C", "D"],
        description: "Paste/surimi",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_SHRIMP_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "SHRIMP_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    return { valid: true, rule };
  }

  /**
   * CRAB RULES
   * Whole crabs vs. meat packs
   * Edge case: Claw-only packs can allow Grade B even at 250g+
   */
  static validateCrab(derivative, grade, weight) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B"],
        min_weight: 250,
        description: "Whole crabs",
      },
      MEAT_PACK: {
        allowed: ["A", "B"],
        min_weight: 200,
        description: "Picked meat packs",
      },
      CLAW_ONLY: {
        allowed: ["A", "B"], // Grade B allowed even at smaller sizes
        description: "Claw-only packs (flexible grading)",
        special_rule: "Grade B allowed even < 250g",
      },
      LEG_MEAT: {
        allowed: ["A", "B"],
        description: "Leg meat packs",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Minced crab",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_CRAB_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "CRAB_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Weight rules (except claw-only which is flexible)
    if (weight && rule.min_weight && derivative !== "CLAW_ONLY") {
      if (weight < rule.min_weight) {
        return {
          valid: false,
          error: `${derivative} requires minimum ${rule.min_weight}g, got ${weight}g`,
          rule: "CRAB_WEIGHT_MINIMUM",
          min_weight: rule.min_weight,
          current_weight: weight,
        };
      }
    }

    return { valid: true, rule };
  }

  /**
   * LOBSTER RULES
   * Tail meat thresholds are critical for export
   */
  static validateLobster(derivative, grade, weight) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B"],
        min_weight: 400,
        description: "Whole lobster",
      },
      TAIL: {
        allowed: ["A", "B"],
        min_weight: 120,
        description: "Lobster tails",
        export_note: "Tail meat weight thresholds critical",
      },
      MEAT_PACK: {
        allowed: ["A", "B"],
        min_weight: 100,
        description: "Picked meat",
      },
      KNUCKLE: {
        allowed: ["B", "C"],
        description: "Knuckle meat",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Processing grade",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_LOBSTER_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "LOBSTER_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Weight thresholds
    if (weight && rule.min_weight) {
      if (weight < rule.min_weight) {
        return {
          valid: false,
          error: `${derivative} requires minimum ${rule.min_weight}g (export requirement), got ${weight}g`,
          rule: "LOBSTER_WEIGHT_THRESHOLD",
          min_weight: rule.min_weight,
          current_weight: weight,
          note: "Tail meat thresholds critical for buyer acceptance",
        };
      }
    }

    return { valid: true, rule };
  }

  /**
   * SQUID/CUTTLEFISH RULES
   * Length-based grading (10-20cm, 20-30cm, 30+cm)
   * Future extension: Add tube diameter for premium markets
   */
  static validateSquidCuttlefish(derivative, grade, lengthCm) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B", "C"],
        length_range: "10-30cm",
        description: "Whole squid/cuttlefish",
      },
      TUBE: {
        allowed: ["A", "B", "C"],
        description: "Cleaned tube (body only)",
      },
      RING: {
        allowed: ["B", "C"],
        description: "Rings (sliced body)",
      },
      TENTACLE: {
        allowed: ["A", "B", "C"],
        description: "Tentacle pieces",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Minced squid",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_SQUID_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "SQUID_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    return { valid: true, rule };
  }

  /**
   * OCTOPUS RULES
   * Small = processing only
   * Large = premium export
   */
  static validateOctopus(derivative, grade, weight) {
    const rules = {
      WHOLE_SMALL: {
        allowed: ["B", "C"],
        max_weight: 500,
        description: "Small octopus (processing)",
        use_case: "Internal processing, cooking reduction",
      },
      WHOLE_LARGE: {
        allowed: ["A", "B"],
        min_weight: 500,
        description: "Large octopus (premium)",
        use_case: "Export, retail, foodservice",
      },
      ARM: {
        allowed: ["A", "B", "C"],
        description: "Arm pieces",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Minced octopus",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_OCTOPUS_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "OCTOPUS_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Weight-based derivative check
    if (weight) {
      if (derivative === "WHOLE_SMALL" && weight > 500) {
        return {
          valid: false,
          error: "Small octopus must be ≤ 500g",
          rule: "OCTOPUS_SMALL_WEIGHT_LIMIT",
          max_weight: 500,
          current_weight: weight,
        };
      }
      if (derivative === "WHOLE_LARGE" && weight < 500) {
        return {
          valid: false,
          error: "Large octopus must be > 500g",
          rule: "OCTOPUS_LARGE_WEIGHT_MIN",
          min_weight: 500,
          current_weight: weight,
        };
      }
    }

    return { valid: true, rule };
  }

  /**
   * BIVALVE RULES (Clams, Mussels, Oysters, Scallops)
   * Count/kg grading matches export specs
   * Note: Live vs frozen can diverge (future extension)
   */
  static validateBivalve(derivative, grade, countSize, bivalveType) {
    const rules = {
      LIVE: {
        allowed: ["A", "B"],
        description: "Live shellfish",
        note: "Requires cold chain - can diverge from frozen",
      },
      FROZEN: {
        allowed: ["A", "B", "C"],
        description: "Frozen bivalves",
        count_sizes: ["10/kg", "20/kg", "30/kg", "40/kg", "50/kg"],
      },
      SHUCKED: {
        allowed: ["A", "B", "C"],
        description: "Shucked meat",
        count_sizes: ["Per liter weight"],
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Minced bivalve",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_BIVALVE_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "BIVALVE_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    return { valid: true, rule };
  }

  /**
   * GASTROPOD RULES (Abalone)
   * Conservative and safe - block <100g
   */
  static validateGastropod(derivative, grade, weight) {
    const rules = {
      WHOLE: {
        allowed: ["A", "B"],
        min_weight: 100,
        description: "Whole abalone",
        reason: "Quality and processing requirements",
      },
      MEAT: {
        allowed: ["A", "B", "C"],
        min_weight: 80,
        description: "Shucked meat",
      },
      MINCE: {
        allowed: ["C", "D"],
        description: "Minced gastropod",
      },
    };

    if (!rules[derivative]) {
      return {
        valid: false,
        error: `Unknown derivative: ${derivative}`,
        rule: "INVALID_GASTROPOD_DERIVATIVE",
      };
    }

    const rule = rules[derivative];
    if (!rule.allowed.includes(grade)) {
      return {
        valid: false,
        error: `Grade ${grade} not allowed for ${derivative}`,
        rule: "GASTROPOD_GRADE_RESTRICTION",
        allowed_grades: rule.allowed,
      };
    }

    // Minimum weight - CRITICAL for abalone
    if (weight && weight < rule.min_weight) {
      return {
        valid: false,
        error: `${derivative} must be >= ${rule.min_weight}g (conservation rule)`,
        rule: "GASTROPOD_MINIMUM_WEIGHT",
        min_weight: rule.min_weight,
        current_weight: weight,
        note: "Blocking < 100g is absolutely required",
      };
    }

    return { valid: true, rule };
  }

  /**
   * GRADE C + WHOLE → BLOCK (except where explicitly allowed)
   * Grade C is for processing/secondary cuts, not whole products (with few exceptions)
   */
  static validateGradeCWhole(derivative, grade, speciesType) {
    // Grade C is allowed for WHOLE in certain species
    const ALLOWED_WHOLE_C = [
      "ROUND_FISH",
      "FLAT_FISH",
      "SQUID",
      "OCTOPUS_SMALL",
    ];

    if (grade === "C" && derivative === "WHOLE") {
      if (!ALLOWED_WHOLE_C.includes(speciesType)) {
        return {
          valid: false,
          error: "Grade C WHOLE not allowed for this species",
          rule: "GRADE_C_WHOLE_RESTRICTION",
          allowed_for: ALLOWED_WHOLE_C,
          recommendation: "Use Grade C for secondary cuts (trim, mince, paste)",
        };
      }
    }

    return { valid: true };
  }

  /**
   * MASTER VALIDATION
   * Comprehensive check across all rules
   */
  static validate(config) {
    const {
      speciesType,
      derivative,
      grade,
      weight,
      countSize,
      storageTemp,
      lengthCm,
      bivalveType,
    } = config;

    // Step 1: Global Grade D rule
    const gradeD = this.validateGradeD(grade, derivative);
    if (!gradeD.valid) return gradeD;

    // Step 2: Species-specific validation
    switch (speciesType) {
      case "ROUND_FISH":
        return this.validateRoundFish(derivative, grade, weight);

      case "WING_FILLET":
        return this.validateWingFillet(derivative, grade, speciesType);

      case "FLAT_FISH":
        return this.validateFlatFish(derivative, grade);

      case "TUNA":
        return this.validateTuna(derivative, grade, storageTemp);

      case "SHRIMP":
        return this.validateShrimp(derivative, grade, countSize);

      case "CRAB":
        return this.validateCrab(derivative, grade, weight);

      case "LOBSTER":
        return this.validateLobster(derivative, grade, weight);

      case "SQUID_CUTTLEFISH":
        return this.validateSquidCuttlefish(derivative, grade, lengthCm);

      case "OCTOPUS":
        return this.validateOctopus(derivative, grade, weight);

      case "BIVALVE":
        return this.validateBivalve(derivative, grade, countSize, bivalveType);

      case "GASTROPOD":
        return this.validateGastropod(derivative, grade, weight);

      default:
        return {
          valid: false,
          error: `Unknown species type: ${speciesType}`,
          rule: "UNKNOWN_SPECIES",
        };
    }
  }

  /**
   * Get all allowed derivatives for a species-grade combination
   */
  static getAllowedDerivatives(speciesType, grade) {
    const config = {
      speciesType,
      derivative: "UNKNOWN",
      grade,
    };

    // This would require expanding the rules object
    // For now, return generic guidance
    return {
      note: "See specific validate methods for complete derivative lists",
      grade: grade,
      species: speciesType,
    };
  }
}

module.exports = DerivativeGradeBusinessRules;
