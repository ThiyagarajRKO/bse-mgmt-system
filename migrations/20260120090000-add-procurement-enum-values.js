"use strict";

/**
 * Migration: Add missing procurement product enum labels
 *
 * This migration will add the provided labels to the
 * enum type: enum_procurement_products_procurement_product_type
 * Only adds a label if it doesn't already exist.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const labels = [
      // Processed / handling labels
      "WASHED / RINSED",
      "DEHEADED (DH)",
      "HEAD-ON (HOSO)",
      "SHELLED",
      "DEVEINED",
      "TAIL-ON / TAIL-OFF",
      "BUTTERFLIED",
      "CUT / SLICED / PORTIONED",
      "TRIMMED",
      "DESKINNED",
      "DEBONED",
      "FILLETED",

      // Preservation / Safety
      "CHILLED",
      "FROZEN",
      "IQF (Individually Quick Frozen)",
      "BLOCK FROZEN",
      "BLAST FROZEN",
      "BRINED",
      "SALTED / DRY SALTED",
      "DRIED / DEHYDRATED",
      "SMOKED",
      "MARINATED",
      "PASTEURIZED",
      "STERILIZED / RETORT",
      "CANNED",

      // Coating / Ready-to-cook
      "BATTERED",
      "BREADCRUMBED",
      "PAR-FRIED",
      "SEASONED / SPICED",
      "MARINATED READY-TO-COOK",
      "TEMPURA COATED",

      // Cooking / Finished
      "BOILED",
      "STEAMED",
      "GRILLED",
      "FRIED",
      "ROASTED",
      "READY-TO-EAT (RTE)",

      // Quality / Commercial operations
      "GLAZED",
      "DOUBLE GLAZED",
      "REWORKED / REPROCESSED",
      "BLENDED",
      "MIXED LOT",
      "PACKED",
      "VACUUM PACKED",
      "MODIFIED ATMOSPHERE PACKED (MAP)",

      // Value added (more specific)
      "SKEWERED",
      "RING CUT",
      "NOBASHI",
      "STUFFED",
      "KABAB / PATTY FORM",
      "MINCED",
      "SURIMI / PASTE",
    ];

    // For each label, run a conditional DO block that adds the value only if missing.
    for (const label of labels) {
      // Use queryInterface.sequelize.escape to safely quote the label
      const quoted = queryInterface.sequelize.escape(label);
      const sql = `DO $$\nBEGIN\n  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumtypid = 'enum_procurement_products_procurement_product_type'::regtype AND enumlabel = ${quoted}) THEN\n    ALTER TYPE enum_procurement_products_procurement_product_type ADD VALUE ${quoted};\n  END IF;\nEND$$;`;
      // Execute the SQL. Some environments disallow DDL in transactions; Sequelize
      // usually runs migrations inside a transaction, but these statements are
      // generally supported. If needed, run migrations with transaction disabled.
      // We use await to ensure sequential execution.
      // eslint-disable-next-line no-await-in-loop
      await queryInterface.sequelize.query(sql);
    }
  },

  async down(queryInterface, Sequelize) {
    // Removing enum values is not trivial in PostgreSQL (requires recreating the type).
    // For safety, we leave down() as a no-op. If rollback is required in future,
    // implement by creating a new enum type, migrating columns, dropping the old type.
    return Promise.resolve();
  },
};
