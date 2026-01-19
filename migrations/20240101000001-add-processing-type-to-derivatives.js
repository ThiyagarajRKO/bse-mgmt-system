"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add processing_type column if it doesn't exist
    try {
      await queryInterface.addColumn("derivative_masters", "processing_type", {
        type: Sequelize.ENUM("UNPROCESSED", "PROCESSED_UNCOOKED", "COOKED"),
        allowNull: true,
      });
    } catch (error) {
      // Column might already exist
      console.log("Column already exists or other migration issue");
    }

    // Make processing_level nullable if it isn't already
    try {
      await queryInterface.changeColumn(
        "derivative_masters",
        "processing_level",
        {
          type: Sequelize.ENUM(
            "Raw",
            "Semi-Processed",
            "Cooked",
            "RTC",
            "RTE",
            "Stock/Sauce",
            "Formed",
            "Dried/Cured",
            "Byproduct",
          ),
          allowNull: true,
        },
      );
    } catch (error) {
      console.log("Column modification skipped");
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn(
        "derivative_masters",
        "processing_type",
      );
    } catch (error) {
      console.log("Column removal skipped");
    }
  },
};
