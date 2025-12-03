'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get all active species
    const speciesRows = await queryInterface.sequelize.query(
      `SELECT id, species_name FROM species_master WHERE is_active = true`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Create species lookup map
    const speciesMap = {};
    speciesRows.forEach((s) => {
      const key = s.species_name.toLowerCase();
      speciesMap[key] = s.id;
    });

    // Helper function to find species ID
    const getSpeciesId = (keyword) => {
      const keywords = keyword.toLowerCase();
      
      // Direct match
      if (speciesMap[keywords]) return speciesMap[keywords];
      
      // Partial match
      for (const [key, id] of Object.entries(speciesMap)) {
        if (key.includes(keywords) || keywords.includes(key.split(' ')[0])) {
          return id;
        }
      }
      return null;
    };

    // All product categories organized by species
    const categories = [
      // CEPHALOPOD FORMS (Squid, Cuttlefish, Octopus)
      { name: 'Whole Round', speciesKeyword: 'Squid' },
      { name: 'Whole Cleaned', speciesKeyword: 'Squid' },
      { name: 'Semi Cleaned', speciesKeyword: 'Squid' },
      { name: 'Fillet', speciesKeyword: 'Squid' },
      { name: 'Strips', speciesKeyword: 'Squid' },
      { name: 'Slices', speciesKeyword: 'Squid' },
      { name: 'Rings', speciesKeyword: 'Squid' },
      { name: 'Tentacles', speciesKeyword: 'Squid' },
      { name: 'Tubes (T1/T2/T3/T4)', speciesKeyword: 'Squid' },

      // SHRIMP / PRAWN FORMS
      { name: 'HOSO', speciesKeyword: 'Shrimp' },
      { name: 'HLSO', speciesKeyword: 'Shrimp' },
      { name: 'HL', speciesKeyword: 'Shrimp' },
      { name: 'PUD', speciesKeyword: 'Shrimp' },
      { name: 'PD', speciesKeyword: 'Shrimp' },
      { name: 'PDTO', speciesKeyword: 'Shrimp' },
      { name: 'PUDTO', speciesKeyword: 'Shrimp' },
      { name: 'Raw Meat (Peeled)', speciesKeyword: 'Shrimp' },
      { name: 'Butterfly Cut', speciesKeyword: 'Shrimp' },
      { name: 'Nobashi', speciesKeyword: 'Shrimp' },
      { name: 'EZ Peel', speciesKeyword: 'Shrimp' },
      { name: 'IQF', speciesKeyword: 'Shrimp' },
      { name: 'Block Frozen', speciesKeyword: 'Shrimp' },

      // CRAB FORMS
      { name: 'Whole Crab', speciesKeyword: 'Crab' },
      { name: 'Half Cut Crab', speciesKeyword: 'Crab' },
      { name: 'Claw Meat', speciesKeyword: 'Crab' },
      { name: 'Knuckle Meat', speciesKeyword: 'Crab' },
      { name: 'Leg Meat', speciesKeyword: 'Crab' },
      { name: 'Body Meat', speciesKeyword: 'Crab' },
      { name: 'Claw & Leg Combo', speciesKeyword: 'Crab' },
      { name: 'Jumbo Lump', speciesKeyword: 'Crab' },
      { name: 'Lump', speciesKeyword: 'Crab' },
      { name: 'Special', speciesKeyword: 'Crab' },
      { name: 'Flake', speciesKeyword: 'Crab' },
      { name: 'Soft Shell Whole', speciesKeyword: 'Crab' },
      { name: 'Soft Shell Cut', speciesKeyword: 'Crab' },
      { name: 'Crab Clusters', speciesKeyword: 'Crab' },
      { name: 'King Crab Cuts', speciesKeyword: 'Crab' },
      { name: 'Snow Crab Sections', speciesKeyword: 'Crab' },

      // BIVALVE FORMS
      { name: 'Half Shell', speciesKeyword: 'Mussel' },
      { name: 'Whole Shell', speciesKeyword: 'Mussel' },
      { name: 'Live Shell', speciesKeyword: 'Mussel' },
      { name: 'Meat Only', speciesKeyword: 'Mussel' },
      { name: 'Roe On', speciesKeyword: 'Mussel' },
      { name: 'Roe Off', speciesKeyword: 'Mussel' },
      { name: 'IQF Meat', speciesKeyword: 'Mussel' },
      { name: 'Scallop Half Shell', speciesKeyword: 'Scallop' },
      { name: 'Scallop Meat', speciesKeyword: 'Scallop' },
      { name: 'Scallop Roe Only', speciesKeyword: 'Scallop' },

      // GASTROPOD FORMS
      { name: 'Whole Cleaned', speciesKeyword: 'Abalone' },
      { name: 'Meat Only', speciesKeyword: 'Abalone' },
      { name: 'Cooked Meat', speciesKeyword: 'Abalone' },
      { name: 'Sliced Meat', speciesKeyword: 'Abalone' },

      // VALUE-ADDED / COOKED FORMS (use Squid as default)
      { name: 'Cooked', speciesKeyword: 'Squid' },
      { name: 'Blanched', speciesKeyword: 'Squid' },
      { name: 'Marinated', speciesKeyword: 'Squid' },
      { name: 'Breaded', speciesKeyword: 'Squid' },
      { name: 'Smoked', speciesKeyword: 'Squid' },
      { name: 'Grilled', speciesKeyword: 'Squid' },
      { name: 'Steamed', speciesKeyword: 'Squid' },
      { name: 'Pre-cooked IQF', speciesKeyword: 'Squid' },
    ];

    // Build rows for bulk insert
    const categoryRows = categories
      .map((cat) => {
        const speciesId = getSpeciesId(cat.speciesKeyword);
        if (!speciesId) return null; // Skip if species not found

        return {
          id: uuidv4(),
          product_category: cat.name,
          species_master_id: speciesId,
          is_active: true,
          created_by: '87ffbaff-b7e9-4198-90d2-0fa12d85ef82',
          created_at: new Date(),
          updated_at: new Date(),
        };
      })
      .filter((row) => row !== null);

    // Insert all categories
    if (categoryRows.length > 0) {
      await queryInterface.bulkInsert(
        'product_category_master',
        categoryRows,
        { ignoreDuplicates: true }
      );
    }

    console.log(`✅ Seeded ${categoryRows.length} product categories`);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove categories added by this seeder (optional)
    // This is safe to leave empty for this seeder
  },
};
