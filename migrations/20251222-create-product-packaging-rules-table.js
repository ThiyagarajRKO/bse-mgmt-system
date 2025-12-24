"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("product_packaging_rules", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
      },
      parent_category_type: {
        type: Sequelize.ENUM(
          "Fish",
          "Crustacean",
          "Cephalopod",
          "Mollusk",
          "ALL"
        ),
        allowNull: false,
        comment: "Parent category from species master",
      },
      product_category: {
        type: Sequelize.ENUM("Fresh", "Frozen", "Cooked", "Live"),
        allowNull: false,
        comment: "Product category/type",
      },
      grade: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: "Grade level (A, Export, etc.) - null for all grades",
      },
      min_net_weight_kg: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: "Minimum net weight in kg",
      },
      max_net_weight_kg: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: "Maximum net weight in kg",
      },
      primary_packaging_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Primary packaging type (VAC, IQF, TRAY, etc.)",
      },
      secondary_packaging_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: "Secondary packaging type (BOX, BAG, etc.)",
      },
      tertiary_packaging_type: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: "Tertiary packaging type (MC, PALLET, etc.)",
      },
      is_export: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: "Whether this rule applies to export products",
      },
      priority: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: "Rule priority (lower number = higher priority)",
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex("product_packaging_rules", [
      "parent_category_type",
    ]);
    await queryInterface.addIndex("product_packaging_rules", [
      "product_category",
    ]);
    await queryInterface.addIndex("product_packaging_rules", ["grade"]);
    await queryInterface.addIndex("product_packaging_rules", ["is_export"]);
    await queryInterface.addIndex("product_packaging_rules", ["priority"]);
    await queryInterface.addIndex("product_packaging_rules", ["is_active"]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("product_packaging_rules");
  },
};
