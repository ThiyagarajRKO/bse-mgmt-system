"use strict";

const { DataTypes } = require("sequelize");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add peeled_dispatch_id column to qa_checklist table
    await queryInterface.addColumn("qa_checklist", "peeled_dispatch_id", {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: "peeled_dispatches",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
      comment: "Reference to peeled dispatch record",
    });

    // Add index for performance
    await queryInterface.addIndex("qa_checklist", ["peeled_dispatch_id"]);
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the index
    await queryInterface.removeIndex("qa_checklist", ["peeled_dispatch_id"]);
    // Remove the column
    await queryInterface.removeColumn("qa_checklist", "peeled_dispatch_id");
  },
};
