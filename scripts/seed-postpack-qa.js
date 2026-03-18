const db = require("../models");
const { v4: uuidv4 } = require("uuid");

(async () => {
  try {
    await db.authenticate();
    console.log("✅ DB authenticated");

    // Create a user
    const userId = uuidv4();
    const user = await db.Users.create({
      id: userId,
      username: "seed_user",
      email: "seeduser@example.com",
      password: "password123",
      is_active: true,
      created_at: new Date(),
    });
    console.log("✅ Created user:", user.id);

    // Create a user profile
    const profileId = uuidv4();
    const profile = await db.UserProfiles.create({
      id: profileId,
      first_name: "Seed",
      last_name: "User",
      full_name: "Seed User",
      is_active: true,
      created_at: new Date(),
      created_by: user.id,
    });
    console.log("✅ Created profile:", profile.id);

    // Create company master
    const companyId = uuidv4();
    await db.CompanyMaster.create({
      id: companyId,
      company_name: "Seed Company",
      company_short_name: "SC",
      company_gstin: "00AAACS0000A1Z0",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created company:", companyId);

    // Create location master
    const locationId = uuidv4();
    await db.LocationMaster.create({
      id: locationId,
      location_name: "Seed Location",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created location:", locationId);

    // Create unit master
    const unitId = uuidv4();
    await db.UnitMaster.create({
      id: unitId,
      unit_name: "KG",
      company_id: companyId,
      location_master_id: locationId,
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created unit:", unitId);

    // Create grade master
    const gradeId = uuidv4();
    await db.GradeMaster.create({
      id: gradeId,
      grade_name: "Grade A",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created grade:", gradeId);

    // Create size master
    const sizeId = uuidv4();
    await db.SizeMaster.create({
      id: sizeId,
      size_name: "20-30",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created size:", sizeId);

    // Create packaging master
    const packagingId = uuidv4();
    await db.PackagingMaster.create({
      id: packagingId,
      packaging_name: "1 KG Box",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created packaging:", packagingId);

    // Create product category
    const categoryId = uuidv4();
    await db.ProductCategoryMaster.create({
      id: categoryId,
      category_name: "Seed Category",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created product category:", categoryId);

    // Create species
    const speciesId = uuidv4();
    await db.SpeciesMaster.create({
      id: speciesId,
      species_name: "Shrimp",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created species:", speciesId);

    // Create product master
    const productId = uuidv4();
    await db.ProductMaster.create({
      id: productId,
      product_id: "SEED-SHRIMP-001",
      product_name: "Seed Shrimp",
      product_status: "Active",
      product_category_master_id: categoryId,
      species_master_id: speciesId,
      size_master_id: sizeId,
      grade_master_id: gradeId,
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created product:", productId);

    // Create peeling
    const peelingId = uuidv4();
    const orderIdForPeeling = uuidv4();
    await db.Peeling.create({
      id: peelingId,
      order_id: orderIdForPeeling,
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created peeling:", peelingId);

    // Create peeling product
    const peelingProductId = uuidv4();
    await db.PeelingProducts.create({
      id: peelingProductId,
      peeling_id: peelingId,
      product_master_id: productId,
      order_id: orderIdForPeeling,
      yield_quantity: 50.0,
      peeling_status: "Completed",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created peeling product:", peelingProductId);

    // Create peeled dispatch
    const peeledDispatchId = uuidv4();
    await db.PeeledDispatches.create({
      id: peeledDispatchId,
      peeled_product_id: peelingProductId,
      unit_master_id: unitId,
      order_id: orderIdForPeeling,
      peeled_dispatch_quantity: 40.0,
      delivery_status: "Initiated",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created peeled dispatch:", peeledDispatchId);

    // Create packing
    const packingId = uuidv4();
    await db.Packing.create({
      id: packingId,
      peeled_dispatch_id: peeledDispatchId,
      unit_master_id: unitId,
      grade_master_id: gradeId,
      size_master_id: sizeId,
      packaging_master_id: packagingId,
      order_id: orderIdForPeeling,
      packing_quantity: 40.0,
      packing_status: "In Progress",
      is_active: true,
      created_at: new Date(),
      created_by: profile.id,
    });
    console.log("✅ Created packing:", packingId);

    // Create post-pack QA inspection
    const qaId = uuidv4();
    await db.PostPackQAInspection.create({
      id: qaId,
      packing_id: packingId,
      order_id: orderIdForPeeling,
      batch_id: "SEED-BATCH-001",
      sample_size: 3,
      seal_integrity: true,
      vacuum_proper: true,
      tray_damage: false,
      carton_condition: true,
      label_correct: true,
      net_weight_compliant: true,
      glazing_compliant: true,
      product_appearance_pass: true,
      foreign_matter_found: false,
      temperature_core: -20.5,
      temperature_compliant: true,
      carton_weight_compliant: true,
      traceability_verified: true,
      qa_status: "PASS",
      qa_decision_remarks: "All checks passed. Ready for shipment.",
      follow_up_action: "SALEABLE",
      inventory_status: "AVAILABLE",
      inspected_by: profile.id,
      inspected_at: new Date(),
      is_active: true,
      created_by: profile.id,
      created_at: new Date(),
    });

    console.log("✅ Created Post-Pack QA inspection:", qaId);
    console.log(
      "\n✅ Seeding complete! Post-Pack QA side panel should now show 1 record.",
    );
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
})();
