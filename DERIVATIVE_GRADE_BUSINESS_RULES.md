# DERIVATIVE-GRADE BUSINESS RULES DOCUMENTATION

**Date:** January 9, 2026  
**Version:** 1.0 - Comprehensive Industry Rules  
**Status:** ✅ Implemented

---

## 📋 Overview

Complete implementation of seafood processing business rules across all species types. These rules ensure:

- ✅ Product quality standards
- ✅ Market-appropriate processing
- ✅ Grade-derivative alignment
- ✅ Weight/size thresholds
- ✅ Temperature requirements (sashimi)
- ✅ Export compliance

---

## 🔒 GLOBAL RULES (Apply Everywhere)

### Rule 1: Grade D Restrictions (CRITICAL)

```
IF grade = D
  THEN allowed_derivatives = [MINCE, PASTE, VALUE_ADDED]
  THEN block WHOLE, FILLET, STEAK, LOIN, TAIL
  REASON: Grade D is industrial/processing only
```

**Implementation:**

```javascript
IF grade = 'D'
  ALLOWED: MINCE, PASTE, VALUE_ADDED
  BLOCKED: WHOLE, FILLET, STEAK, LOIN, TAIL
```

**Impact:** Prevents misuse of lowest-grade materials in premium products

---

## 🐟 ROUND FISH (Mackerel, Kingfish, Grouper, etc.)

### Allowed Derivatives by Grade

| Derivative | Grade A | Grade B | Grade C | Grade D | Notes                  |
| ---------- | ------- | ------- | ------- | ------- | ---------------------- |
| WHOLE      | ✅      | ✅      | ✅      | ✅      | All grades acceptable  |
| FILLET     | ✅      | ✅      | ✅      | ✅      | Weight rule applies    |
| STEAK      | ✅      | ✅      | ✅      | ✅      | Cross-section steaks   |
| PORTION    | ✅      | ✅      | ✅      | ❌      | < 500g retail portions |
| MINCE      | ❌      | ✅      | ✅      | ✅      | Ground/minced          |
| PASTE      | ❌      | ❌      | ✅      | ✅      | Surimi/paste           |

### Rule: Fillet Weight Threshold

```
IF derivative = FILLET AND weight > 500g
  THEN must convert to PORTION
  REASON:
    • Uneven cooking in retail preparation
    • Buyer rejection due to inconsistency
    • Pricing ambiguity in bulk sales
```

**Example:**

- 450g fillet → OK as FILLET
- 600g fillet → MUST be PORTION derivative

---

## 🪨 WING FILLET (Premium Center Cuts)

### Rule: No Grade C Wing Fillets

```
IF derivative = WING_FILLET
  THEN allowed_grades = [A, B]
  THEN block_grades = [C, D]
  REASON: Wing fillets degrade faster than center cuts
```

| Grade | Allowed | Reason            |
| ----- | ------- | ----------------- |
| A     | ✅      | Premium           |
| B     | ✅      | Standard          |
| C     | ❌      | Degrades too fast |
| D     | ❌      | Not suitable      |

---

## 🐠 FLAT FISH (Flounder, Sole, Halibut, etc.)

### Rule: Grade C Only as Trim/Mince

```
IF species = FLAT_FISH AND grade = C
  THEN allowed_derivatives = [TRIM, MINCE, PASTE]
  THEN block = [WHOLE, FILLET]
  REASON: Retain quality for premium cuts
```

### Allowed Derivatives by Grade

| Derivative | Grade A | Grade B | Grade C | Grade D | Notes               |
| ---------- | ------- | ------- | ------- | ------- | ------------------- |
| WHOLE      | ✅      | ✅      | ❌      | ❌      | Premium only        |
| FILLET     | ✅      | ✅      | ❌      | ❌      | Premium center cuts |
| TRIM       | ✅      | ✅      | ✅      | ✅      | Edge/waste pieces   |
| MINCE      | ❌      | ✅      | ✅      | ✅      | Grade C/D minced    |
| PASTE      | ❌      | ❌      | ✅      | ✅      | Processing only     |

---

## 🍣 TUNA (Sashimi-Grade Premium)

### LOIN Rules

```
IF derivative = LOIN
  THEN allowed_grades = [A, B, C]
  THEN standard sashimi handling
```

### SAKU Rules (Critical)

```
IF derivative = SAKU AND grade = A
  THEN storage_temp MUST be <= -60°C
  OR chilled sashimi protocol
  REASON: Sashimi buyers expect premium frozen storage
```

**Temperature Requirements:**

- Grade A SAKU: ≤ -60°C (sashimi protocol required)
- Grade B LOIN: Standard freezing (-18°C)

| Derivative | Grade A | Grade B | Grade C | Notes                    |
| ---------- | ------- | ------- | ------- | ------------------------ |
| LOIN       | ✅      | ✅      | ✅      | Standard tuna            |
| SAKU       | ✅\*    | ❌      | ❌      | \*Requires -60°C storage |
| STEAK      | ✅      | ✅      | ✅      | Cross-section            |
| MINCE      | ❌      | ✅      | ✅      | Lower grades             |

---

## 🦐 SHRIMP/PRAWN (Count/Kg Sizing)

### Count Sizes Supported

- 8/12, 13/15, 16/20, 21/25, 26/30, 31/40

### Rule: A Grade Split (Future Extension)

```
Note: A grades can split into:
  A+ = Head-on (premium)
  A = Headless (standard)
  → Not required now, but expandable
```

### Allowed Derivatives by Grade

| Derivative | Grade A | Grade B | Grade C | Grade D | Count Sizes         |
| ---------- | ------- | ------- | ------- | ------- | ------------------- |
| WHOLE      | ✅      | ✅      | ❌      | ❌      | 8/12, 13/15, 16/20  |
| HEADLESS   | ✅      | ✅      | ❌      | ❌      | 16/20, 21/25, 26/30 |
| TAIL       | ✅      | ✅      | ✅      | ❌      | 16/20, 21/25, 26/30 |
| MINCE      | ❌      | ✅      | ✅      | ✅      | N/A                 |
| PASTE      | ❌      | ❌      | ✅      | ✅      | N/A                 |

---

## 🦀 CRAB (Whole vs. Meat Packs)

### Weight Requirements

| Derivative | Min Weight | Grade A | Grade B | Grade C | Notes           |
| ---------- | ---------- | ------- | ------- | ------- | --------------- |
| WHOLE      | 250g       | ✅      | ✅      | ❌      | Full crabs      |
| MEAT_PACK  | 200g       | ✅      | ✅      | ❌      | Picked meat     |
| CLAW_ONLY  | N/A        | ✅      | ✅      | ❌      | Flexible sizing |
| LEG_MEAT   | N/A        | ✅      | ✅      | ❌      | Premium pieces  |
| MINCE      | N/A        | ❌      | ❌      | ✅      | Processing      |

### Rule: Claw-Only Flexibility

```
IF derivative = CLAW_ONLY
  THEN Grade B allowed even < 250g
  REASON: Claws have consistent quality at smaller sizes
```

---

## 🦞 LOBSTER (Export Quality)

### Tail Meat Thresholds (Critical for Export)

| Derivative | Min Weight | Grade A | Grade B | Grade C | Notes            |
| ---------- | ---------- | ------- | ------- | ------- | ---------------- |
| WHOLE      | 400g       | ✅      | ✅      | ❌      | Live lobster     |
| TAIL       | 120g       | ✅      | ✅      | ❌      | Tail meat export |
| MEAT_PACK  | 100g       | ✅      | ✅      | ❌      | Picked meat      |
| KNUCKLE    | N/A        | ❌      | ✅      | ✅      | Secondary cuts   |
| MINCE      | N/A        | ❌      | ❌      | ✅      | Processing       |

**Important:** Tail meat weight thresholds critical for buyer acceptance in export markets.

---

## 🦑 SQUID/CUTTLEFISH (Length-Based Grading)

### Length Ranges

- 10-20cm: Grade C/B
- 20-30cm: Grade A/B/C
- 30+cm: Grade A/B (premium only)

### Allowed Derivatives by Grade

| Derivative | Grade A | Grade B | Grade C | Grade D | Notes           |
| ---------- | ------- | ------- | ------- | ------- | --------------- |
| WHOLE      | ✅      | ✅      | ✅      | ❌      | 10-30cm         |
| TUBE       | ✅      | ✅      | ✅      | ❌      | Body only       |
| RING       | ❌      | ✅      | ✅      | ❌      | Sliced body     |
| TENTACLE   | ✅      | ✅      | ✅      | ❌      | Tentacle pieces |
| MINCE      | ❌      | ❌      | ✅      | ✅      | Ground          |

### Future Extension

```
Tube diameter for premium markets (not required now)
→ Can add later for ultra-premium sashimi squid
```

---

## 🐙 OCTOPUS (Size-Based Processing)

### Rule: Small vs. Large

| Derivative  | Weight | Grade A | Grade B | Grade C | Use Case              |
| ----------- | ------ | ------- | ------- | ------- | --------------------- |
| WHOLE_SMALL | ≤ 500g | ❌      | ✅      | ✅      | Processing/cooking    |
| WHOLE_LARGE | > 500g | ✅      | ✅      | ❌      | Export/retail/premium |
| ARM         | Any    | ✅      | ✅      | ✅      | Arm pieces            |
| MINCE       | Any    | ❌      | ❌      | ✅      | Ground/processing     |

**Logic:**

- Small octopus (< 500g) → Grade B/C only (processing use)
- Large octopus (> 500g) → Grade A/B (premium market)

---

## 🦪 BIVALVES (Clams, Mussels, Oysters, Scallops)

### Count/Kg Grading

- Export-compliant count sizing: 10/kg, 20/kg, 30/kg, 40/kg, 50/kg

### Allowed Derivatives by Grade

| Derivative | Grade A | Grade B | Grade C | Grade D | Notes               |
| ---------- | ------- | ------- | ------- | ------- | ------------------- |
| LIVE       | ✅      | ✅      | ❌      | ❌      | Requires cold chain |
| FROZEN     | ✅      | ✅      | ✅      | ❌      | Standard exports    |
| SHUCKED    | ✅      | ✅      | ✅      | ❌      | Meat only           |
| MINCE      | ❌      | ❌      | ✅      | ✅      | Processing          |

### Rule: Live vs. Frozen Divergence

```
Note: Live and frozen can have different quality specs
  → Future extension for separate grading systems
  → Not required now
```

---

## 🐚 GASTROPOD (Abalone - Conservation)

### Rule: Minimum Weight Blocking

```
IF derivative = WHOLE OR MEAT
  THEN weight MUST be >= 100g (WHOLE) or 80g (MEAT)
  REASON: Conservation and processing viability
  NOTE: Blocking < 100g is absolutely required
```

### Allowed Derivatives by Grade

| Derivative | Min Weight | Grade A | Grade B | Grade C | Notes             |
| ---------- | ---------- | ------- | ------- | ------- | ----------------- |
| WHOLE      | 100g       | ✅      | ✅      | ❌      | Conservation rule |
| MEAT       | 80g        | ✅      | ✅      | ✅      | Shucked meat      |
| MINCE      | N/A        | ❌      | ❌      | ✅      | Processing        |

---

## ⚠️ SPECIAL RULES

### Rule: Grade C WHOLE (Limited Exception)

```
IF grade = C AND derivative = WHOLE
  THEN allowed_for = [ROUND_FISH, FLAT_FISH, SQUID, OCTOPUS_SMALL]
  THEN blocked_for = all other species
  REASON: Grade C for secondary cuts, not whole products
```

### Rule: Fillet Size Portion Conversion

```
IF species = ROUND_FISH
  AND derivative = FILLET
  AND weight > 500g
  THEN force derivative = PORTION
  REASON:
    • Uneven cooking retail
    • Buyer rejection
    • Pricing ambiguity
```

---

## 🔧 IMPLEMENTATION

### Service File

`services/DerivativeGradeBusinessRules.js`

### Usage Example

```javascript
const rules = require("./services/DerivativeGradeBusinessRules");

// Validate a product
const result = rules.validate({
  speciesType: "ROUND_FISH",
  derivative: "FILLET",
  grade: "A",
  weight: 450,
});

if (result.valid) {
  console.log("✅ Valid combination");
} else {
  console.log("❌ Error:", result.error);
  console.log("Rule:", result.rule);
}
```

### Integration Points

1. **Product Creation API** - Validate before insert
2. **Order Management** - Check product derivability
3. **Inventory Processing** - Enforce grade-derivative rules
4. **Quality Control** - Flag invalid combinations

---

## 📊 Rule Coverage Summary

| Species Type | Rules | Derivatives | Grade Rules       | Special             |
| ------------ | ----- | ----------- | ----------------- | ------------------- |
| Round Fish   | ✅    | 7           | Weight threshold  | Fillet > 500g       |
| Wing Fillet  | ✅    | 1           | No Grade C        | Degradation rule    |
| Flat Fish    | ✅    | 5           | C only trim       | Quality retention   |
| Tuna         | ✅    | 4           | Storage temp      | -60°C sashimi       |
| Shrimp       | ✅    | 5           | Count/kg sizing   | A split option      |
| Crab         | ✅    | 5           | Weight minimums   | Claw flexibility    |
| Lobster      | ✅    | 5           | Export thresholds | Tail meat critical  |
| Squid        | ✅    | 5           | Length-based      | Diameter future     |
| Octopus      | ✅    | 4           | Size-based        | Small/large split   |
| Bivalve      | ✅    | 4           | Export count      | Live/frozen diverge |
| Gastropod    | ✅    | 3           | 100g minimum      | Conservation        |
| **GLOBAL**   | ✅    | -           | Grade D blocking  | Processing only     |

---

## ✅ Validation Checklist

- [x] Grade D restrictions implemented (global rule)
- [x] Round fish fillet > 500g → PORTION enforcement
- [x] Wing fillet no Grade C rule
- [x] Flat fish Grade C only as trim/mince
- [x] Tuna SAKU -60°C temperature requirement
- [x] Shrimp count/kg sizing support
- [x] Crab weight minimums enforced
- [x] Lobster export tail meat thresholds
- [x] Squid length-based grading
- [x] Octopus small vs. large processing split
- [x] Bivalve count/kg export specs
- [x] Gastropod 100g minimum blocking

---

## 🚀 Next Steps

1. **API Integration** - Add validation to product creation endpoints
2. **UI Enforcement** - Show allowed derivatives per grade in forms
3. **Inventory Validation** - Check incoming products against rules
4. **Reporting** - Flag invalid derivative-grade combinations
5. **Future Extensions**:
   - Tube diameter for squid premium markets
   - Live vs. frozen bivalve separate grading
   - Shrimp A+ (head-on) vs A (headless) split
   - Temperature tracking for sashimi tuna

---

_Rules based on industry standards and buyer expectations_  
_Implemented: January 9, 2026_  
_Version: 1.0 - Complete Implementation_
