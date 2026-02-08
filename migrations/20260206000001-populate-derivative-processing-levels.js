"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Update processing_level for raw materials
    await queryInterface.sequelize.query(`
      UPDATE derivative_master
      SET processing_level = 'Raw'
      WHERE derivative_name IN (
        'Whole (Round / As Received)',
        'Whole (In Shell)',
        'Whole (Head-on Shell-on)'
      )
    `);

    // Update processing_level for semi-processed products
    await queryInterface.sequelize.query(`
      UPDATE derivative_master
      SET processing_level = 'Semi-Processed'
      WHERE derivative_name IN (
        'Gutted',
        'Gilled & Gutted (GG)',
        'Headed',
        'Headed & Gutted (H&G)',
        'Dressed',
        'Headless',
        'Tails (Shrimp/Lobster)',
        'Peeled Undeveined (PUD)',
        'Peeled Deveined (PD)',
        'Peeled Tail-on (PTO / PDTO)',
        'EZ Peel',
        'Claws / Knuckles (Crab/Lobster)'
      )
    `);

    // Update processing_level for cooked/processed products
    await queryInterface.sequelize.query(`
      UPDATE derivative_master
      SET processing_level = 'Cooked'
      WHERE derivative_name IN (
        'Fillet (Skin-on)',
        'Fillet (Skinless)',
        'Loin',
        'Portion',
        'Steaks / Slices'
      )
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Reset processing_level to null
    await queryInterface.sequelize.query(`
      UPDATE derivative_master
      SET processing_level = NULL
    `);
  },
};
