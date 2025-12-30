"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Fix Shark and Ray species to have parent_category_type = "Fish" instead of "Shark" or "Ray"
    await queryInterface.sequelize.query(`
      UPDATE species_master 
      SET parent_category_type = 'Fish' 
      WHERE parent_category_type IN ('Shark', 'Ray')
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert the changes - set back to original values
    await queryInterface.sequelize.query(`
      UPDATE species_master 
      SET parent_category_type = 'Shark' 
      WHERE species_name LIKE '%Shark%'
    `);

    await queryInterface.sequelize.query(`
      UPDATE species_master 
      SET parent_category_type = 'Ray' 
      WHERE species_name LIKE '%Ray%'
    `);
  },
};
