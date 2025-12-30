import { Op } from "sequelize";
import models from "../../models";
import { validate as validateUuid } from "uuid";

const {
  ProductPackagingMapping,
  PackingRuleConfig,
  PackagingMaster,
  ProductMaster,
  GradeMaster,
  SizeMaster,
  ProductPackagingRules,
} = models;

/**
 * Validate UUID format
 */
const isValidUuid = (id) => {
  return typeof id === "string" && validateUuid(id);
};

/**
 * Get packaging suggestions based on product attributes
 * Input: product_id, market (grade and size fetched from product)
 * Output: Ranked list of compatible packages with confidence scores
 */
export const GetPackagingSuggestions = async ({
  product_id,
  market,
  start = 0,
  length = 10,
}) => {
  try {
    if (!product_id || !market) {
      throw {
        statusCode: 420,
        message: "Product ID and Market are required!",
      };
    }

    // Validate product_id is a valid UUID
    if (!isValidUuid(product_id)) {
      throw {
        statusCode: 422,
        message: "Invalid Product ID format. Expected valid UUID.",
      };
    }

    // Fetch product details including grade and size
    const product = await ProductMaster.findOne({
      where: { id: product_id },
      include: [
        {
          model: GradeMaster,
          attributes: ["grade_name"],
        },
        {
          model: SizeMaster,
          attributes: ["size"],
        },
      ],
    });

    if (!product) {
      throw {
        statusCode: 404,
        message: "Product not found!",
      };
    }

    const grade = product.GradeMaster?.grade_name;
    const size = product.SizeMaster?.size;
    const netWeight = product.net_weight; // Assuming this field exists

    if (!grade || !size || !netWeight) {
      return {
        suggestions: [],
        count: 0,
      };
    }

    // Get species information for parent_category_type
    const species = await models.SpeciesMaster.findOne({
      where: { id: product.species_master_id },
      attributes: ["parent_category_type"],
    });

    if (!species) {
      return {
        suggestions: [],
        count: 0,
      };
    }

    // Find matching packaging rules
    const matchingRules = await ProductPackagingRules.findAll({
      where: {
        is_active: true,
        [Op.or]: [
          { parent_category_type: species.parent_category_type },
          { parent_category_type: "ALL" },
        ],
        product_category: product.category, // Assuming product has category field
        [Op.or]: [
          { grade: grade },
          { grade: null }, // Rules that apply to all grades
        ],
        min_net_weight_kg: { [Op.lte]: netWeight },
        max_net_weight_kg: { [Op.gte]: netWeight },
        is_export: market === "EXPORT", // Assuming market determines export flag
      },
      order: [["priority", "ASC"]], // Lower priority number = higher priority
      raw: true,
    });

    if (!matchingRules.length) {
      return {
        suggestions: [],
        count: 0,
      };
    }

    // Convert rules to packaging suggestions
    const suggestions = matchingRules.map((rule, index) => ({
      id: rule.id,
      primary_packaging_type: rule.primary_packaging_type,
      secondary_packaging_type: rule.secondary_packaging_type,
      tertiary_packaging_type: rule.tertiary_packaging_type,
      confidence_score: Math.max(100 - index * 10, 10), // Decreasing confidence based on priority
      rule_priority: rule.priority,
      is_export: rule.is_export,
    }));

    return {
      suggestions: suggestions.slice(start, start + length),
      count: suggestions.length,
    };
  } catch (err) {
    throw err;
  }
};

/**
 * Validate packing selection against rules
 * Returns { isValid, errors: [] }
 */
export const ValidatePackingSelection = async ({
  product_id,
  packaging_id,
  market,
  quantity,
}) => {
  try {
    const errors = [];

    // Validate product_id is a valid UUID
    if (!isValidUuid(product_id)) {
      throw {
        statusCode: 422,
        message: "Invalid Product ID format. Expected valid UUID.",
      };
    }

    // Validate packaging_id is a valid UUID
    if (packaging_id && !isValidUuid(packaging_id)) {
      throw {
        statusCode: 422,
        message: "Invalid Packaging ID format. Expected valid UUID.",
      };
    }

    // Check 1: Mapping exists
    const mapping = await ProductPackagingMapping.findOne({
      where: {
        product_id,
        packaging_id,
        market,
        is_active: true,
      },
    });

    if (!mapping) {
      errors.push("This package is not mapped for this product/market");
      return { isValid: false, errors };
    }

    // Fetch product details including grade and size
    const product = await ProductMaster.findOne({
      where: { id: product_id },
      include: [
        {
          model: GradeMaster,
          attributes: ["grade_name"],
        },
        {
          model: SizeMaster,
          attributes: ["size"],
        },
      ],
    });

    if (!product) {
      errors.push("Product not found");
      return { isValid: false, errors };
    }

    const grade = product.GradeMaster?.grade_name;
    const size = product.SizeMaster?.size;

    // Check 2: Get packaging details
    const pkg = await PackagingMaster.findOne({ where: { id: packaging_id } });

    if (!pkg) {
      errors.push("Package not found");
      return { isValid: false, errors };
    }

    // Check 3: Get and apply rules
    const rules = await PackingRuleConfig.findAll({
      where: { is_active: true },
      raw: true,
    });

    const ruleMap = {};
    rules.forEach((r) => {
      ruleMap[r.rule_name] = r.rule_config;
    });

    // Apply market rules
    const marketRules = ruleMap["market_rules"]?.[market] || {};
    if (marketRules.disallowed_package_types?.includes(pkg.packaging_type)) {
      errors.push(
        `${pkg.packaging_type} packages are not allowed for ${market} market`
      );
    }

    // Apply grade rules
    const gradeRules = ruleMap["grade_rules"]?.[grade] || {};
    if (gradeRules.disallowed_package_types?.includes(pkg.packaging_type)) {
      errors.push(`${pkg.packaging_type} cannot be used for ${grade} grade`);
    }

    // Apply size rules
    const sizeRules = ruleMap["size_rules"]?.[size] || {};
    if (
      sizeRules.max_weight_kg &&
      pkg.packaging_weight > sizeRules.max_weight_kg
    ) {
      errors.push(`Maximum weight for ${size} is ${sizeRules.max_weight_kg}kg`);
    }
    if (
      sizeRules.min_weight_kg &&
      pkg.packaging_weight < sizeRules.min_weight_kg
    ) {
      errors.push(`Minimum weight for ${size} is ${sizeRules.min_weight_kg}kg`);
    }

    // Check dimensional constraints
    if (sizeRules.max_dimensions_cm) {
      const maxDims = sizeRules.max_dimensions_cm;
      if (pkg.packaging_length > maxDims.length) {
        errors.push(
          `Package length ${pkg.packaging_length}cm exceeds maximum ${maxDims.length}cm for ${size}`
        );
      }
      if (pkg.packaging_width > maxDims.width) {
        errors.push(
          `Package width ${pkg.packaging_width}cm exceeds maximum ${maxDims.width}cm for ${size}`
        );
      }
      if (pkg.packaging_height > maxDims.height) {
        errors.push(
          `Package height ${pkg.packaging_height}cm exceeds maximum ${maxDims.height}cm for ${size}`
        );
      }
    }

    // Check allowed package types for size
    if (
      sizeRules.allowed_package_types &&
      !sizeRules.allowed_package_types.includes(pkg.packaging_type)
    ) {
      errors.push(`${pkg.packaging_type} is not allowed for ${size} size`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (err) {
    throw err;
  }
};

/**
 * Get all product-packaging mappings
 */
export const GetAllMappings = async ({ start = 0, length = 10, search }) => {
  try {
    let where = { is_active: true };

    if (search) {
      where[Op.or] = [
        { "$ProductMaster.product_name$": { [Op.iLike]: `%${search}%` } },
        { "$PackagingMaster.packaging_code$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await ProductPackagingMapping.findAndCountAll({
      where,
      include: [
        {
          model: ProductMaster,
          attributes: ["id", "product_name"],
          required: false,
        },
        {
          model: PackagingMaster,
          attributes: [
            "id",
            "packaging_code",
            "packaging_type",
            "packaging_weight",
            "packaging_length",
            "packaging_width",
            "packaging_height",
          ],
          required: false,
        },
      ],
      offset: Number(start),
      limit: Number(length),
      order: [["created_at", "DESC"]],
    });

    return result;
  } catch (err) {
    throw err;
  }
};

/**
 * Create product-packaging mapping
 */
export const CreateMapping = async (profile_id, data) => {
  try {
    if (!data.product_id || !data.packaging_id || !data.market) {
      throw {
        statusCode: 420,
        message: "Product ID, Packaging ID, and Market are required!",
      };
    }

    const mapping = await ProductPackagingMapping.create(
      {
        ...data,
        created_by: profile_id,
      },
      { profile_id }
    );

    return mapping;
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw {
        statusCode: 420,
        message: "This product-packaging-market combination already exists!",
      };
    }
    throw err;
  }
};
