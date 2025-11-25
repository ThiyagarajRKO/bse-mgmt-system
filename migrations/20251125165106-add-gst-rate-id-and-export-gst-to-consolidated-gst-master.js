"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add gst_rate_id column
    await queryInterface.addColumn("consolidated_gst_master", "gst_rate_id", {
      type: Sequelize.STRING(50),
      allowNull: true,
      unique: true,
    });

    // Add export_gst column
    await queryInterface.addColumn("consolidated_gst_master", "export_gst", {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0.0,
    });

    // Add index on gst_rate_id
    await queryInterface.addIndex("consolidated_gst_master", ["gst_rate_id"], {
      unique: true,
      where: {
        gst_rate_id: {
          [Sequelize.Op.ne]: null,
        },
      },
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove index first
    await queryInterface.removeIndex("consolidated_gst_master", [
      "gst_rate_id",
    ]);

    // Remove columns
    await queryInterface.removeColumn("consolidated_gst_master", "gst_rate_id");
    await queryInterface.removeColumn("consolidated_gst_master", "export_gst");
  },
};
