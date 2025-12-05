/**
 * Business Rules Configuration
 * Maps grades to applicable sizes and other business logic
 */

module.exports = {
  /**
   * Grade to Sizes Mapping
   * Maps grade IDs to compatible size IDs for product creation
   */
  gradeToSizes: {
    // This will be populated dynamically if needed
    // For now, keeping it empty as grade-size mappings are handled separately
  },

  /**
   * Category to Grades Mapping
   * Maps product category names to their applicable grade IDs
   */
  categoryToGrades: {
    // This will be populated dynamically if needed
    // For now, keeping it empty as category-grade mappings are handled separately in seeders
  },

  /**
   * Category Mappings
   * Maps product categories to their applicable species
   */
  categoryMappings: {
    // Add category-to-species mappings here as needed
  },

  /**
   * Validation Rules
   * Business validation constraints
   */
  validationRules: {
    minProductNameLength: 3,
    maxProductNameLength: 255,
    minQuantity: 0.1,
    maxQuantity: 100000,
  },
};
