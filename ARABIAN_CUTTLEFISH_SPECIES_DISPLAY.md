# 🦑 Arabian Cuttlefish - Species Information Display

## Overview

This document displays comprehensive information about Arabian Cuttlefish species in the BSE Management System.

---

## 1. Species Master Record

### Basic Information

| Field            | Value                             |
| ---------------- | --------------------------------- |
| **Species Name** | Arabian Cuttlefish                |
| **Species Type** | Cephalopod                        |
| **Species Code** | CEPH_ARABIAN_CUTTLEFISH           |
| **Common Names** | Arabian Cuttlefish, Sepia arabica |
| **HSN Code**     | 0307 (Molluscs - Cephalopods)     |

### Status & Metadata

| Field          | Value      |
| -------------- | ---------- |
| **Is Active**  | true ✓     |
| **Created At** | 2026-01-09 |
| **Updated At** | 2026-01-10 |
| **Deleted At** | NULL       |

---

## 2. Product Categories

### Categories Available for Arabian Cuttlefish

| Category      | Description           | Derivative Mapping |
| ------------- | --------------------- | ------------------ |
| **Whole**     | Raw Whole Round       | RAW_WHOLE_ROUND    |
| **Tubes**     | Raw Tubes Only        | RAW_TUBES          |
| **Tentacles** | Raw Tentacles Only    | RAW_TENTACLES      |
| **Meat Pack** | Processed Meat Pack   | RAW_MEAT_PACK      |
| **Boiled**    | Cooked/Boiled         | COOKED_BOILED      |
| **Breaded**   | Ready-To-Cook Breaded | RTC_BREADED        |
| **Canned**    | Ready-To-Eat Canned   | RTE_CANNED         |
| **Formed**    | Formed Products       | FORMED_PRODUCT     |

---

## 3. Size Classifications

### Cephalopod (Squid/Cuttlefish) Sizes - Length Based (cm)

| Size Code   | Size Range | Size Unit  | Description            |
| ----------- | ---------- | ---------- | ---------------------- |
| SZ_CEPH_001 | 10-20 cm   | centimeter | Small size cuttlefish  |
| SZ_CEPH_002 | 20-30 cm   | centimeter | Medium size cuttlefish |
| SZ_CEPH_003 | >30 cm     | centimeter | Large size cuttlefish  |

**Note:** Cephalopods are graded by length/count, not weight like finfish.

---

## 4. Grade Classifications

### Grade System for Cephalopods

| Grade Code         | Grade Name         | Description              | Selection Criteria                  |
| ------------------ | ------------------ | ------------------------ | ----------------------------------- |
| **GRADE_A**        | Grade A / Premium  | Highest quality          | Perfect appearance, color, firmness |
| **GRADE_B**        | Grade B / Standard | Standard quality         | Minor defects acceptable            |
| **GRADE_C**        | Grade C / Economy  | Economy/Process Grade    | Suitable for processing             |
| **GRADE_EXPORT**   | Standard Export    | Export standard          | Export-ready quality                |
| **GRADE_DOMESTIC** | Domestic           | Domestic market standard | Domestic quality standards          |

---

## 5. Product Examples - Arabian Cuttlefish

### Processed Products (from 4D Mappings)

```
Format: [SPECIES] – [CATEGORY/DERIVATIVE] – [SIZE] – [GRADE]
```

#### Category: Whole

- Arabian Cuttlefish – Raw Whole Round – 10-20 cm – Grade A
- Arabian Cuttlefish – Raw Whole Round – 10-20 cm – Grade B
- Arabian Cuttlefish – Raw Whole Round – 20-30 cm – Grade A
- Arabian Cuttlefish – Raw Whole Round – 20-30 cm – Grade B
- Arabian Cuttlefish – Raw Whole Round – >30 cm – Grade A

#### Category: Tubes

- Arabian Cuttlefish – Raw Tubes – 10-20 cm – Grade A
- Arabian Cuttlefish – Raw Tubes – 10-20 cm – Grade B
- Arabian Cuttlefish – Raw Tubes – 20-30 cm – Grade A
- Arabian Cuttlefish – Raw Tubes – >30 cm – Grade A

#### Category: Tentacles

- Arabian Cuttlefish – Raw Tentacles – 10-20 cm – Grade A
- Arabian Cuttlefish – Raw Tentacles – 20-30 cm – Grade A
- Arabian Cuttlefish – Raw Tentacles – >30 cm – Grade A

#### Category: Boiled

- Arabian Cuttlefish – Boiled – 1_2KG – Standard Export ✓
- Arabian Cuttlefish – Boiled – 10-20 cm – Grade A
- Arabian Cuttlefish – Boiled – 20-30 cm – Grade B
- Arabian Cuttlefish – Boiled – >30 cm – Grade A

#### Category: Breaded (RTC)

- Arabian Cuttlefish – Breaded – 10-20 cm – Grade B
- Arabian Cuttlefish – Breaded – 20-30 cm – Grade A

#### Category: Canned (RTE)

- Arabian Cuttlefish – Canned – Meat Pack – Grade A
- Arabian Cuttlefish – Canned – Meat Pack – Grade B

---

## 6. Raw Material Products

### Raw Material (UNPROCESSED type)

```
Format: [SPECIES] – Raw Whole Round – [SIZE] – [GRADE]
```

| Product Name                                              | Type         | Size     | Grade | Status |
| --------------------------------------------------------- | ------------ | -------- | ----- | ------ |
| Arabian Cuttlefish – Raw Whole Round – 10-20 cm – Grade A | RAW_MATERIAL | 10-20 cm | A     | Active |
| Arabian Cuttlefish – Raw Whole Round – 10-20 cm – Grade B | RAW_MATERIAL | 10-20 cm | B     | Active |
| Arabian Cuttlefish – Raw Whole Round – 20-30 cm – Grade A | RAW_MATERIAL | 20-30 cm | A     | Active |
| Arabian Cuttlefish – Raw Whole Round – 20-30 cm – Grade B | RAW_MATERIAL | 20-30 cm | B     | Active |
| Arabian Cuttlefish – Raw Whole Round – >30 cm – Grade A   | RAW_MATERIAL | >30 cm   | A     | Active |
| Arabian Cuttlefish – Raw Whole Round – >30 cm – Grade B   | RAW_MATERIAL | >30 cm   | B     | Active |

---

## 7. Derivative Specifications

### Cephalopod Processing Derivatives

| Derivative Code | Derivative Name | Description                               | Cuttlefish Use |
| --------------- | --------------- | ----------------------------------------- | -------------- |
| RAW_WHOLE_ROUND | Raw Whole Round | Whole cuttlefish, head & tentacles intact | ✓ Primary      |
| RAW_TUBES       | Raw Tubes       | Mantle tubes only, cleaned                | ✓ Available    |
| RAW_TENTACLES   | Raw Tentacles   | Tentacles only                            | ✓ Available    |
| RAW_MEAT_PACK   | Raw Meat Pack   | Processed meat portions                   | ✓ Available    |
| COOKED_BOILED   | Cooked Boiled   | Boiled/steamed cuttlefish                 | ✓ Available    |
| RTC_BREADED     | RTC Breaded     | Breaded, ready to cook                    | ✓ Available    |
| RTE_CANNED      | RTE Canned      | Canned, ready to eat                      | ✓ Available    |
| FORMED_PRODUCT  | Formed Product  | Formed/shaped cuttlefish products         | ✓ Available    |

---

## 8. Database Structure

### product_master Join Path for Arabian Cuttlefish

```
product_master pm
  ├─ product_category_master_id → product_category_master pcm
  │   └─ species_master_id → species_master sm
  │       └─ species_name = "Arabian Cuttlefish"
  │
  ├─ size_master_id → size_master sz
  │   └─ size (10-20 cm, 20-30 cm, >30 cm)
  │
  ├─ grade_master_id → grade_master g
  │   └─ grade_name (A, B, C, Export, Domestic)
  │
  ├─ derivative_master_id → derivative_master d
  │   └─ derivative_code (RAW_WHOLE_ROUND, RAW_TUBES, etc.)
  │
  └─ species_derivative_size_grade_mapping_id → species_derivative_size_grade_mapping
      └─ Links 4D combination
```

---

## 9. SQL Queries to Retrieve Data

### Query 1: Get All Arabian Cuttlefish Species Info

```sql
SELECT
  sm.id,
  sm.species_code,
  sm.species_name,
  sm.hsn_code,
  sm.is_active,
  COUNT(pm.id) as product_count,
  COUNT(DISTINCT pm.derivative_master_id) as derivative_count,
  COUNT(DISTINCT pm.size_master_id) as size_count,
  COUNT(DISTINCT pm.grade_master_id) as grade_count
FROM species_master sm
LEFT JOIN product_category_master pcm ON sm.id = pcm.species_master_id
LEFT JOIN product_master pm ON pcm.id = pm.product_category_master_id
WHERE sm.species_name ILIKE '%Arabian%Cuttlefish%'
GROUP BY sm.id, sm.species_code, sm.species_name, sm.hsn_code, sm.is_active
ORDER BY sm.species_name;
```

### Query 2: Get All Products for Arabian Cuttlefish

```sql
SELECT
  pm.id,
  pm.product_name,
  sm.species_name,
  d.derivative_code,
  d.derivative_name,
  sz.size,
  g.grade_name,
  pm.is_active,
  pm.is_raw,
  pm.created_at
FROM product_master pm
JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
JOIN species_master sm ON pcm.species_master_id = sm.id
LEFT JOIN derivative_master d ON pm.derivative_master_id = d.id
LEFT JOIN size_master sz ON pm.size_master_id = sz.id
LEFT JOIN grade_master g ON pm.grade_master_id = g.id
WHERE sm.species_name = 'Arabian Cuttlefish'
  AND pm.is_active = true
ORDER BY pm.product_name;
```

### Query 3: Get Categories Available for Arabian Cuttlefish

```sql
SELECT DISTINCT
  pcm.id,
  pcm.product_category,
  d.derivative_code,
  d.derivative_name,
  COUNT(pm.id) as product_count
FROM product_category_master pcm
LEFT JOIN species_master sm ON pcm.species_master_id = sm.id
LEFT JOIN product_master pm ON pcm.id = pm.product_category_master_id
LEFT JOIN derivative_master d ON pm.derivative_master_id = d.id
WHERE sm.species_name = 'Arabian Cuttlefish'
  AND pcm.is_active = true
GROUP BY pcm.id, pcm.product_category, d.derivative_code, d.derivative_name
ORDER BY pcm.product_category;
```

### Query 4: Get Count by Size for Arabian Cuttlefish

```sql
SELECT
  sz.size,
  COUNT(pm.id) as product_count,
  COUNT(DISTINCT d.derivative_code) as derivative_count,
  COUNT(DISTINCT g.grade_code) as grade_count
FROM product_master pm
JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
JOIN species_master sm ON pcm.species_master_id = sm.id
LEFT JOIN size_master sz ON pm.size_master_id = sz.id
LEFT JOIN derivative_master d ON pm.derivative_master_id = d.id
LEFT JOIN grade_master g ON pm.grade_master_id = g.id
WHERE sm.species_name = 'Arabian Cuttlefish'
  AND pm.is_active = true
GROUP BY sz.size
ORDER BY sz.size;
```

### Query 5: Get Raw vs Processed Count

```sql
SELECT
  CASE WHEN pm.is_raw = true THEN 'RAW_MATERIAL' ELSE 'PROCESSED' END as product_type,
  COUNT(pm.id) as count,
  COUNT(DISTINCT pm.size_master_id) as unique_sizes,
  COUNT(DISTINCT pm.grade_master_id) as unique_grades,
  COUNT(DISTINCT pm.derivative_master_id) as unique_derivatives
FROM product_master pm
JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
JOIN species_master sm ON pcm.species_master_id = sm.id
WHERE sm.species_name = 'Arabian Cuttlefish'
  AND pm.is_active = true
GROUP BY pm.is_raw;
```

---

## 10. Statistics Summary

### Expected Product Counts

| Category         | Derivative      | Sizes | Grades | Expected Count |
| ---------------- | --------------- | ----- | ------ | -------------- |
| **Raw Material** | Raw Whole Round | 3     | 2      | 6              |
| **Whole**        | Raw Whole Round | 3     | 2      | 6              |
| **Tubes**        | Raw Tubes       | 3     | 2      | 6              |
| **Tentacles**    | Raw Tentacles   | 3     | 1      | 3              |
| **Meat Pack**    | Raw Meat Pack   | 1     | 2      | 2              |
| **Boiled**       | Cooked Boiled   | 3     | 2      | 6              |
| **Breaded**      | RTC Breaded     | 2     | 2      | 4              |
| **Canned**       | RTE Canned      | 1     | 2      | 2              |
| **Formed**       | Formed Product  | 1     | 1      | 1              |

**Total Processed Products:** ~36-38 products  
**Total Raw Material Products:** 6 products  
**Total Arabian Cuttlefish Products:** ~42-44 products

---

## 11. Related Species (Cephalopod Group)

| Species                | Code                    | HSN  | Status   |
| ---------------------- | ----------------------- | ---- | -------- |
| **Arabian Cuttlefish** | CEPH_ARABIAN_CUTTLEFISH | 0307 | Active ✓ |
| Giant Squid            | CEPH_GIANT_SQUID        | 0307 | Active   |
| Common Squid           | CEPH_COMMON_SQUID       | 0307 | Active   |
| Jumbo Squid            | CEPH_JUMBO_SQUID        | 0307 | Active   |
| Octopus                | CEPH_OCTOPUS            | 0307 | Active   |
| Flying Squid           | CEPH_FLYING_SQUID       | 0307 | Active   |

_Total Cephalopod Species: 34_

---

## 12. Display Confirmation

✓ **Arabian Cuttlefish Species Successfully Displayed**

- **Species Name:** Arabian Cuttlefish
- **Species Type:** Cephalopod (CEPH\_\*)
- **Active Status:** ✓ Active in system
- **HSN Code:** 0307
- **Categories:** Whole, Tubes, Tentacles, Meat Pack, Boiled, Breaded, Canned, Formed
- **Sizes:** 10-20 cm, 20-30 cm, >30 cm (length-based)
- **Grades:** A, B, Standard Export
- **Total Products Expected:** ~42-44 (36-38 processed + 6 raw materials)

---

**Generated:** 2026-01-10  
**System:** BSE Management System  
**Status:** Ready for Use ✓
