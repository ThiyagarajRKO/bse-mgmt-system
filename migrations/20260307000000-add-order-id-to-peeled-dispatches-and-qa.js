"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // add order_id to peeled_dispatches
    await queryInterface.sequelize.query(`
      ALTER TABLE peeled_dispatches
      ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS peeled_dispatches_order_id_idx ON peeled_dispatches(order_id);
    `);

    // backfill peeled_dispatches.order_id based on the underlying product/dispatch
    await queryInterface.sequelize.query(`
      UPDATE peeled_dispatches pd
      SET order_id = COALESCE(pp.order_id, d.order_id)
      FROM peeling_products pp
      JOIN peeling p ON p.id = pp.peeling_id AND p.is_active = true
      LEFT JOIN dispatches d ON d.id = p.dispatch_id AND d.is_active = true
      WHERE pd.peeled_product_id = pp.id
        AND pd.order_id IS NULL
        AND (pp.order_id IS NOT NULL OR d.order_id IS NOT NULL);
    `);

    // propagate newly-filled order_id into existing packing rows
    await queryInterface.sequelize.query(`
      UPDATE packing p
      SET order_id = pd.order_id
      FROM peeled_dispatches pd
      WHERE p.peeled_dispatch_id = pd.id
        AND p.order_id IS NULL
        AND pd.order_id IS NOT NULL;
    `);

    // add order_id to qa_checklist (singular table)
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist
      ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    await queryInterface.sequelize.query(`
      CREATE INDEX IF NOT EXISTS qa_checklist_order_id_idx ON qa_checklist(order_id);
    `);

    // also add peeled_product_id & peeled_dispatch_id & status etc if missing (schema sync)
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS peeled_product_id UUID;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS peeled_dispatch_id UUID;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS inspection_date TIMESTAMP WITH TIME ZONE;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS inspector_name VARCHAR(255);
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS remarks TEXT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS defects TEXT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS foreign_matter_notes TEXT;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS created_by UUID;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS updated_by UUID;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE qa_checklist ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
    `);

    // backfill qa_checklist.order_id using any available reference
    await queryInterface.sequelize.query(`
      UPDATE qa_checklist q
      SET order_id = COALESCE(pd.order_id, pp.order_id, p.order_id)
      FROM peeled_dispatches pd
      LEFT JOIN peeling_products pp ON pp.id = pd.peeled_product_id
      LEFT JOIN peeling p ON p.id = pp.peeling_id
      WHERE (q.peeled_dispatch_id = pd.id
             OR q.peeled_product_id = pp.id
             OR q.peeling_id = p.id)
        AND q.order_id IS NULL
        AND (pd.order_id IS NOT NULL
             OR pp.order_id IS NOT NULL
             OR p.order_id IS NOT NULL);
    `);
  },

  async down(queryInterface, Sequelize) {
    // we intentionally do not drop columns on down; data may be valuable
  },
};
