"use strict";

const { v4: uuidv4 } = require("uuid");

/**
 * CONSOLIDATED MASTER DATA SEEDER
 *
 * This seeder provides essential master data records that are required for the system to function.
 * It includes basic suppliers, customers, locations, divisions, carriers, vehicles, drivers,
 * packaging types, and units that are needed for procurement, sales, and operational activities.
 *
 * This seeder should be run after the core system seeders (users, roles, modules) but before
 * operational seeders that depend on this master data.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const systemUserId = "00000000-0000-0000-0000-000000000000";

    console.log("Starting consolidated master data seeding...");

    // ============================================================================
    // PHASE 1: SEED DIVISIONS
    // ============================================================================

    console.log("Seeding division master...");

    const divisions = [
      {
        id: uuidv4(),
        division_name: "Frozen",
        division_code: "FROZ",
        description: "Frozen seafood products division",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        division_name: "Fresh",
        division_code: "FRESH",
        description: "Fresh seafood products division",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        division_name: "Crab",
        division_code: "CRAB",
        description: "Crab products division",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        division_name: "Value Added",
        division_code: "VALUE",
        description: "Value-added seafood products division",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    // Check for existing divisions
    const existingDivisionsCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM division_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingDivisionsCount[0].count === 0) {
      await queryInterface.bulkInsert("division_master", divisions, {});
      console.log(`Inserted ${divisions.length} division records`);
    } else {
      console.log(`Division master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 2: SEED LOCATIONS
    // ============================================================================

    console.log("Seeding location master...");

    const locations = [
      {
        id: uuidv4(),
        location_name: "Mumbai Port",
        location_code: "MUM_PORT",
        location_type: "PORT",
        address: "Mumbai Port Trust, Mumbai, Maharashtra",
        pincode: "400001",
        state: "Maharashtra",
        country: "India",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        location_name: "Chennai Port",
        location_code: "CHE_PORT",
        location_type: "PORT",
        address: "Chennai Port Trust, Chennai, Tamil Nadu",
        pincode: "600001",
        state: "Tamil Nadu",
        country: "India",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        location_name: "Kochi Port",
        location_code: "KOC_PORT",
        location_type: "PORT",
        address: "Cochin Port Trust, Kochi, Kerala",
        pincode: "682001",
        state: "Kerala",
        country: "India",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        location_name: "Main Warehouse",
        location_code: "MAIN_WH",
        location_type: "WAREHOUSE",
        address: "Industrial Area, Mumbai, Maharashtra",
        pincode: "400001",
        state: "Maharashtra",
        country: "India",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        location_name: "Processing Plant",
        location_code: "PROC_PLANT",
        location_type: "PROCESSING",
        address: "Processing Zone, Chennai, Tamil Nadu",
        pincode: "600001",
        state: "Tamil Nadu",
        country: "India",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingLocationsCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM location_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingLocationsCount[0].count === 0) {
      await queryInterface.bulkInsert("location_master", locations, {});
      console.log(`Inserted ${locations.length} location records`);
    } else {
      console.log(`Location master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 3: SEED SUPPLIERS
    // ============================================================================

    console.log("Seeding supplier master...");

    const suppliers = [
      {
        id: uuidv4(),
        supplier_name: "Coastal Fisheries Ltd",
        supplier_code: "SUP001",
        contact_person: "Rajesh Kumar",
        phone: "+91-9876543210",
        email: "rajesh@coastalfisheries.com",
        address: "Marine Drive, Mumbai, Maharashtra",
        pincode: "400001",
        gst_number: "22AAAAA0000A1Z5",
        pan_number: "AAAAA0000A",
        supplier_type: "FISHERMAN_COOPERATIVE",
        credit_limit: 500000.0,
        payment_terms: "30 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        supplier_name: "Bay Fisheries Cooperative",
        supplier_code: "SUP002",
        contact_person: "Suresh Patel",
        phone: "+91-9876543211",
        email: "suresh@bayfisheries.com",
        address: "Fisheries Colony, Chennai, Tamil Nadu",
        pincode: "600001",
        gst_number: "33BBBBB0000B1Z6",
        pan_number: "BBBBB0000B",
        supplier_type: "FISHERMAN_COOPERATIVE",
        credit_limit: 300000.0,
        payment_terms: "15 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        supplier_name: "Ocean Traders Pvt Ltd",
        supplier_code: "SUP003",
        contact_person: "Amit Singh",
        phone: "+91-9876543212",
        email: "amit@oceantraders.com",
        address: "Business District, Kochi, Kerala",
        pincode: "682001",
        gst_number: "32CCCCC0000C1Z7",
        pan_number: "CCCCC0000C",
        supplier_type: "TRADER",
        credit_limit: 1000000.0,
        payment_terms: "45 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingSuppliersCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM supplier_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingSuppliersCount[0].count === 0) {
      await queryInterface.bulkInsert("supplier_master", suppliers, {});
      console.log(`Inserted ${suppliers.length} supplier records`);
    } else {
      console.log(`Supplier master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 4: SEED CUSTOMERS
    // ============================================================================

    console.log("Seeding customer master...");

    const customers = [
      {
        id: uuidv4(),
        customer_name: "Global Seafood Exports",
        customer_code: "CUS001",
        contact_person: "John Smith",
        phone: "+1-555-0123",
        email: "john@globalseafood.com",
        address: "123 Ocean Drive, Miami, FL, USA",
        pincode: "33101",
        gst_number: null, // International customer
        pan_number: null,
        customer_type: "EXPORT",
        credit_limit: 2000000.0,
        payment_terms: "60 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_name: "Metro Supermarkets",
        customer_code: "CUS002",
        contact_person: "Priya Sharma",
        phone: "+91-9876543213",
        email: "priya@metrosuper.com",
        address: "Retail Plaza, Delhi",
        pincode: "110001",
        gst_number: "07DDDDD0000D1Z8",
        pan_number: "DDDDD0000D",
        customer_type: "DOMESTIC",
        credit_limit: 500000.0,
        payment_terms: "30 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        customer_name: "Fresh Fish Distributors",
        customer_code: "CUS003",
        contact_person: "Ahmed Khan",
        phone: "+91-9876543214",
        email: "ahmed@freshfishdist.com",
        address: "Market Area, Mumbai, Maharashtra",
        pincode: "400001",
        gst_number: "27EEEEE0000E1Z9",
        pan_number: "EEEEE0000E",
        customer_type: "DISTRIBUTOR",
        credit_limit: 750000.0,
        payment_terms: "21 days",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingCustomersCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM customer_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingCustomersCount[0].count === 0) {
      await queryInterface.bulkInsert("customer_master", customers, {});
      console.log(`Inserted ${customers.length} customer records`);
    } else {
      console.log(`Customer master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 5: SEED CARRIERS
    // ============================================================================

    console.log("Seeding carrier master...");

    const carriers = [
      {
        id: uuidv4(),
        carrier_name: "Blue Dart Express",
        carrier_code: "CAR001",
        contact_person: "Ravi Kumar",
        phone: "+91-1800-209-1234",
        email: "ravi@bluedart.com",
        address: "Logistics Hub, Mumbai",
        carrier_type: "COURIER",
        service_type: "EXPRESS",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        carrier_name: "DTDC Courier",
        carrier_code: "CAR002",
        contact_person: "Sunil Mehta",
        phone: "+91-1800-209-5959",
        email: "sunil@dtdc.com",
        address: "Distribution Center, Delhi",
        carrier_type: "COURIER",
        service_type: "STANDARD",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        carrier_name: "Refrigerated Transport Ltd",
        carrier_code: "CAR003",
        contact_person: "Vijay Singh",
        phone: "+91-9876543215",
        email: "vijay@reftransport.com",
        address: "Cold Chain Facility, Chennai",
        carrier_type: "ROAD_TRANSPORT",
        service_type: "REFRIGERATED",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingCarriersCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM carrier_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingCarriersCount[0].count === 0) {
      await queryInterface.bulkInsert("carrier_master", carriers, {});
      console.log(`Inserted ${carriers.length} carrier records`);
    } else {
      console.log(`Carrier master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 6: SEED VEHICLES
    // ============================================================================

    console.log("Seeding vehicle master...");

    const vehicles = [
      {
        id: uuidv4(),
        vehicle_number: "MH01AB1234",
        vehicle_type: "TRUCK",
        capacity_kg: 5000,
        carrier_master_id: null, // Will be set after carriers are inserted
        registration_date: new Date("2020-01-15"),
        insurance_expiry: new Date("2025-01-15"),
        fitness_expiry: new Date("2025-06-15"),
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        vehicle_number: "TN05CD5678",
        vehicle_type: "REEFER_TRUCK",
        capacity_kg: 3000,
        carrier_master_id: null,
        registration_date: new Date("2019-08-20"),
        insurance_expiry: new Date("2024-08-20"),
        fitness_expiry: new Date("2025-02-20"),
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingVehiclesCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM vehicle_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingVehiclesCount[0].count === 0) {
      await queryInterface.bulkInsert("vehicle_master", vehicles, {});
      console.log(`Inserted ${vehicles.length} vehicle records`);
    } else {
      console.log(`Vehicle master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 7: SEED DRIVERS
    // ============================================================================

    console.log("Seeding driver master...");

    const drivers = [
      {
        id: uuidv4(),
        driver_name: "Ramesh Kumar",
        license_number: "MH0123456789",
        phone: "+91-9876543216",
        address: "Driver Colony, Mumbai",
        license_expiry: new Date("2026-03-15"),
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        driver_name: "Suresh Babu",
        license_number: "TN0567890123",
        phone: "+91-9876543217",
        address: "Transport Nagar, Chennai",
        license_expiry: new Date("2025-11-20"),
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingDriversCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM driver_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingDriversCount[0].count === 0) {
      await queryInterface.bulkInsert("driver_master", drivers, {});
      console.log(`Inserted ${drivers.length} driver records`);
    } else {
      console.log(`Driver master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 8: SEED PACKAGING MASTER
    // ============================================================================

    console.log("Seeding packaging master...");

    const packaging = [
      {
        id: uuidv4(),
        packaging_code: "VAC_POUCH_1KG",
        packaging_type: "VACUUM_POUCH",
        description: "1KG Vacuum Pouch",
        capacity_kg: 1.0,
        unit_cost: 2.5,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "IQF_BAG_2KG",
        packaging_type: "IQF_BAG",
        description: "2KG IQF Bag",
        capacity_kg: 2.0,
        unit_cost: 3.75,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "TRAY_500G",
        packaging_type: "TRAY",
        description: "500G Tray",
        capacity_kg: 0.5,
        unit_cost: 1.25,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "BOX_10KG",
        packaging_type: "BOX",
        description: "10KG Master Box",
        capacity_kg: 10.0,
        unit_cost: 5.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "MC_25KG",
        packaging_type: "MC",
        description: "25KG Master Carton",
        capacity_kg: 25.0,
        unit_cost: 25.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        packaging_code: "PALLET_500KG",
        packaging_type: "PALLET",
        description: "500KG Pallet",
        capacity_kg: 500.0,
        unit_cost: 150.0,
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingPackagingCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM packaging_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPackagingCount[0].count === 0) {
      await queryInterface.bulkInsert("packaging_master", packaging, {});
      console.log(`Inserted ${packaging.length} packaging records`);
    } else {
      console.log(`Packaging master data already exists, skipping...`);
    }

    // ============================================================================
    // PHASE 9: SEED UNIT MASTER
    // ============================================================================

    console.log("Seeding unit master...");

    const units = [
      {
        id: uuidv4(),
        unit_name: "Kilogram",
        unit_code: "KG",
        unit_type: "WEIGHT",
        conversion_factor: 1.0,
        base_unit: "KG",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        unit_name: "Gram",
        unit_code: "G",
        unit_type: "WEIGHT",
        conversion_factor: 0.001,
        base_unit: "KG",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        unit_name: "Piece",
        unit_code: "PCS",
        unit_type: "COUNT",
        conversion_factor: 1.0,
        base_unit: "PCS",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
      {
        id: uuidv4(),
        unit_name: "Box",
        unit_code: "BOX",
        unit_type: "PACKAGING",
        conversion_factor: 1.0,
        base_unit: "BOX",
        is_active: true,
        created_by: systemUserId,
        updated_by: systemUserId,
        created_at: now,
        updated_at: now,
      },
    ];

    const existingUnitsCount = await queryInterface.sequelize.query(
      "SELECT COUNT(*) as count FROM unit_master",
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingUnitsCount[0].count === 0) {
      await queryInterface.bulkInsert("unit_master", units, {});
      console.log(`Inserted ${units.length} unit records`);
    } else {
      console.log(`Unit master data already exists, skipping...`);
    }

    console.log("Consolidated master data seeding completed successfully");
  },

  async down(queryInterface, Sequelize) {
    // Remove in reverse order
    await queryInterface.bulkDelete(
      "unit_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "packaging_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "driver_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "vehicle_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "carrier_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "customer_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "supplier_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "location_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );

    await queryInterface.bulkDelete(
      "division_master",
      {
        created_by: "00000000-0000-0000-0000-000000000000",
      },
      {}
    );
  },
};
