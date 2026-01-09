"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("derivative_master", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      derivative_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment:
          "Unique code for derivative (e.g., RAW_WHOLE, SEMI_PD, COOKED_BOILED)",
      },
      derivative_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: "User-friendly name (e.g., Whole (Round), Peeled & Deveined)",
      },
      processing_level: {
        type: Sequelize.ENUM(
          "Raw",
          "Semi-Processed",
          "Cooked",
          "RTC",
          "RTE",
          "Stock/Sauce",
          "Formed",
          "Dried/Cured",
          "Byproduct"
        ),
        allowNull: false,
        comment: "Processing level category",
      },
      hsn_code_applicable: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: "Comma-separated HSN codes (e.g., 0302,0303,0304)",
      },
      default_gst_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: "Default GST rate for this derivative (%)",
      },
      heat_treated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Whether this derivative is heat-treated",
      },
      value_added: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: "Whether this derivative adds value to raw material",
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: "Detailed description of the derivative",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      updated_by: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex("derivative_master", ["processing_level"]);
    await queryInterface.addIndex("derivative_master", ["is_active"]);
    await queryInterface.addIndex("derivative_master", ["derivative_code"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("derivative_master");
  },
};
