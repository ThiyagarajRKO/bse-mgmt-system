"use strict";
const { v4: uuidv4 } = require("uuid");

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const grades = await queryInterface.sequelize.query(
      `SELECT id, grade_code FROM grade_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const sizes = await queryInterface.sequelize.query(
      `SELECT id, size FROM size_master WHERE is_active = true`,
      { type: queryInterface.sequelize.QueryTypes.SELECT },
    );

    const gradeMap = Object.fromEntries(
      grades.map((g) => [g.grade_code, g.id]),
    );
    const sizeMap = Object.fromEntries(sizes.map((s) => [s.size, s.id]));

    const rows = [];
    const allow = (gradeName, sizeName) => {
      if (!gradeMap[gradeName] || !sizeMap[sizeName]) {
        console.log(`Skipping: Grade=${gradeName}, Size=${sizeName}`);
        return;
      }
      rows.push({
        id: uuidv4(),
        grade_id: gradeMap[gradeName],
        size_id: sizeMap[sizeName],
        created_at: now,
        updated_at: now,
      });
    };

    // ----------------------------
    // Grade A (Premium Export)
    // ----------------------------
    [
      "500_1KG",
      "1_2KG",
      "2_3KG",
      "3UP_KG",
      "30UP_CM",
      "16_20_COUNT",
      "300_500G",
      "200_300G",
    ].forEach((s) => allow("A", s));

    // ----------------------------
    // Grade B (Standard Export)
    // ----------------------------
    [
      "300_500G",
      "500_1KG",
      "1_2KG",
      "2_3KG",
      "20_30CM",
      "30UP_CM",
      "16_20_COUNT",
      "21_25_COUNT",
    ].forEach((s) => allow("B", s));

    // ----------------------------
    // Grade C (Domestic / Processing)
    // ----------------------------
    [
      "200_300G",
      "300_500G",
      "500_1KG",
      "10_20CM",
      "20_30CM",
      "21_25_COUNT",
      "26_30_COUNT",
      "UNSIZED",
    ].forEach((s) => allow("C", s));

    // ----------------------------
    // Grade D (Industrial - mince/value-added only)
    // ----------------------------
    ["UNSIZED"].forEach((s) => allow("D", s));

    if (rows.length > 0) {
      await queryInterface.bulkInsert("grade_size_mapping", rows, {});
      console.log(`Inserted ${rows.length} grade-size mappings`);
    }
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete("grade_size_mapping", null, {});
  },
};
