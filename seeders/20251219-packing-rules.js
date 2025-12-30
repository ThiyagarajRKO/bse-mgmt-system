"use strict";

module.exports = {
  up: async (queryInterface) => {
    const defaultRules = [
      {
        id: "550e8400-e29b-41d4-a716-446655440100",
        rule_name: "market_rules",
        rule_config: JSON.stringify({
          RETAIL: {
            allowed_weights_kg: [0.25, 0.5, 1.0, 2.0],
            disallowed_package_types: ["CARTON", "MASTER_CARTON"],
            max_pack_weight: 2.0,
          },
          EXPORT: {
            mandatory_carton_weights: [10, 20],
            require_inner_pack: true,
            allowed_package_types: ["CARTON", "MASTER_CARTON"],
          },
        }),
        is_active: true,
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440101",
        rule_name: "grade_rules",
        rule_config: JSON.stringify({
          WHOLE: {
            disallowed_package_types: ["VACUUM"],
            allowed_package_types: ["TRAY", "CARTON"],
          },
          FILLET: {
            allowed_package_types: ["VACUUM", "TRAY"],
            disallowed_package_types: ["CARTON"],
          },
          SLICE: {
            allowed_package_types: ["VACUUM", "TRAY"],
          },
          CHUNK: {
            allowed_package_types: ["TRAY", "VACUUM"],
          },
        }),
        is_active: true,
        updated_at: new Date(),
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440102",
        rule_name: "size_rules",
        rule_config: JSON.stringify({
          "U5 (5–10 cm)": {
            max_weight_kg: 0.5,
            min_weight_kg: 0.1,
            max_dimensions_cm: { length: 15, width: 10, height: 5 },
            allowed_package_types: ["Pouch", "Tray"],
          },
          "U10 (15–20 cm)": {
            max_weight_kg: 1.0,
            min_weight_kg: 0.25,
            max_dimensions_cm: { length: 25, width: 18, height: 8 },
            allowed_package_types: ["Pouch", "Tray", "Duplex Carton"],
          },
          "U15 (20–25 cm)": {
            max_weight_kg: 2.0,
            min_weight_kg: 0.5,
            max_dimensions_cm: { length: 30, width: 22, height: 10 },
            allowed_package_types: ["Pouch", "Tray", "Duplex Carton"],
          },
          "U20 (25–30 cm)": {
            max_weight_kg: 3.0,
            min_weight_kg: 1.0,
            max_dimensions_cm: { length: 35, width: 25, height: 12 },
            allowed_package_types: ["Tray", "Duplex Carton"],
          },
          "U30 (30–40 cm)": {
            max_weight_kg: 5.0,
            min_weight_kg: 2.0,
            max_dimensions_cm: { length: 45, width: 30, height: 15 },
            allowed_package_types: ["Tray", "Duplex Carton"],
          },
          WHOLE: {
            min_weight_kg: 5.0,
            max_dimensions_cm: { length: 60, width: 40, height: 20 },
            allowed_package_types: ["Duplex Carton", "Master Carton"],
          },
        }),
        is_active: true,
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert("packing_rule_config", defaultRules);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      "packing_rule_config",
      {
        rule_name: {
          [queryInterface.sequelize.Op.in]: [
            "market_rules",
            "grade_rules",
            "size_rules",
          ],
        },
      },
      {}
    );
  },
};
