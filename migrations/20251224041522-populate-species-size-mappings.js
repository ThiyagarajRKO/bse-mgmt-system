"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get a system user ID for created_by/updated_by
    const users = await queryInterface.sequelize.query(
      "SELECT id FROM user_profiles LIMIT 1",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!users || users.length === 0) {
      console.warn(
        "⚠️  No user profiles found. Skipping data population. Please populate species_size_mapping manually after users are created."
      );
      return;
    }

    const systemUserId = users[0].id;

    // Comprehensive species-size mappings including unprocessed/raw product sizes
    const speciesSizeMappings = [
      // Fish - typically by weight or count, including unprocessed (whole fish by size/length)
      {
        parent_category_type: "Fish",
        unit_of_measure: "g", // S (200–400 g)
        priority: 1,
        description: "Small fish portions or fillets by weight",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Fish",
        unit_of_measure: "kg", // M (400–700 g), L (700–1000 g), XL (1–2 kg)
        priority: 2,
        description: "Whole fish or bulk portions by weight",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Fish",
        unit_of_measure: "pcs/kg", // Count-based sizing for fish
        priority: 3,
        description: "Fish sold by count per kilogram",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Fish",
        unit_of_measure: "pcs/lb", // Count-based sizing for fish (pounds)
        priority: 4,
        description: "Fish sold by count per pound",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Fish",
        unit_of_measure: "cm", // Length-based sizing for whole fish
        priority: 5,
        description:
          "Whole fish measured by length in centimeters (unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Bivalve - by shell size or count, including unprocessed
      {
        parent_category_type: "Bivalve",
        unit_of_measure: "cm", // Shell size for bivalves
        priority: 1,
        description:
          "Bivalves measured by shell size in centimeters (unprocessed/live)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Bivalve",
        unit_of_measure: "g", // Weight-based for processed bivalves
        priority: 2,
        description: "Bivalves sold by weight in grams",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Bivalve",
        unit_of_measure: "kg", // Bulk weight for bivalves
        priority: 3,
        description: "Bivalves sold by bulk weight",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Bivalve",
        unit_of_measure: "pcs/kg", // Count per kg for bivalves
        priority: 4,
        description: "Bivalves sold by count per kilogram",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Crustacean - by count or weight, including unprocessed
      {
        parent_category_type: "Crustacean",
        unit_of_measure: "pcs/kg", // Primary sizing for crustaceans
        priority: 1,
        description:
          "Crustaceans sold by count per kilogram (live/unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Crustacean",
        unit_of_measure: "pcs/lb", // Count per pound for crustaceans
        priority: 2,
        description: "Crustaceans sold by count per pound",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Crustacean",
        unit_of_measure: "kg", // Bulk weight for crustaceans
        priority: 3,
        description: "Crustaceans sold by bulk weight",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Crustacean",
        unit_of_measure: "g", // Smaller portions
        priority: 4,
        description: "Crustaceans sold by weight in grams",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Crustacean",
        unit_of_measure: "cm", // Size-based for whole crustaceans
        priority: 5,
        description:
          "Crustaceans measured by size in centimeters (live/unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Cephalopod - by weight or size, including unprocessed
      {
        parent_category_type: "Cephalopod",
        unit_of_measure: "kg", // Primary weight-based sizing
        priority: 1,
        description:
          "Cephalopods sold by weight in kilograms (whole/unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Cephalopod",
        unit_of_measure: "g", // Smaller portions
        priority: 2,
        description: "Cephalopods sold by weight in grams",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Cephalopod",
        unit_of_measure: "pcs/kg", // Count-based
        priority: 3,
        description: "Cephalopods sold by count per kilogram",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Cephalopod",
        unit_of_measure: "cm", // Size-based for whole cephalopods
        priority: 4,
        description:
          "Cephalopods measured by size in centimeters (live/unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Gastropod - by shell size or weight, including unprocessed
      {
        parent_category_type: "Gastropod",
        unit_of_measure: "cm", // Shell size for gastropods
        priority: 1,
        description:
          "Gastropods measured by shell size in centimeters (live/unprocessed)",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Gastropod",
        unit_of_measure: "g", // Weight-based
        priority: 2,
        description: "Gastropods sold by weight in grams",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Gastropod",
        unit_of_measure: "kg", // Bulk weight
        priority: 3,
        description: "Gastropods sold by bulk weight",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Other - flexible sizing for miscellaneous species
      {
        parent_category_type: "Other",
        unit_of_measure: "g", // Generic gram measurement
        priority: 1,
        description: "Generic gram measurement",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Other",
        unit_of_measure: "kg", // Generic kilogram measurement
        priority: 2,
        description: "Generic kilogram measurement",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Other",
        unit_of_measure: "cm", // Generic size measurement
        priority: 3,
        description: "Generic size measurement",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        parent_category_type: "Other",
        unit_of_measure: "pcs/kg", // Generic count per kilogram
        priority: 4,
        description: "Generic count per kilogram",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Insert the mappings
    await queryInterface.bulkInsert(
      "species_size_mapping",
      speciesSizeMappings
    );
  },

  async down(queryInterface, Sequelize) {
    // Remove all inserted mappings
    await queryInterface.bulkDelete("species_size_mapping", null, {});
  },
};
