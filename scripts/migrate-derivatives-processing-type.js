const { Sequelize } = require("sequelize");
require("dotenv").config();

async function runDerivativeMigration() {
  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USERNAME,
    process.env.DB_SECRET,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: "postgres",
      logging: false,
    },
  );

  try {
    console.log("Starting derivative processing_type migration...");

    // Connect to database
    await sequelize.authenticate();
    console.log("Database connection established");

    // Add processing_type column
    await sequelize.query(`
      ALTER TABLE derivative_master 
      ADD COLUMN IF NOT EXISTS processing_type VARCHAR(50);
    `);
    console.log("✓ Added processing_type column");

    // Make processing_level nullable
    await sequelize.query(`
      ALTER TABLE derivative_master 
      ALTER COLUMN processing_level DROP NOT NULL;
    `);
    console.log("✓ Made processing_level nullable");

    // Create ENUM type for processing_type if it doesn't exist
    await sequelize.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_derivative_master_processing_type') THEN
          CREATE TYPE enum_derivative_master_processing_type AS ENUM ('UNPROCESSED', 'PROCESSED_UNCOOKED', 'COOKED');
        END IF;
      END $$;
    `);
    console.log("✓ Created processing_type ENUM");

    // Change column type to ENUM
    await sequelize.query(`
      ALTER TABLE derivative_master 
      ALTER COLUMN processing_type TYPE enum_derivative_master_processing_type USING 
        CASE 
          WHEN processing_type IS NULL THEN 'PROCESSED_UNCOOKED'::enum_derivative_master_processing_type
          ELSE processing_type::enum_derivative_master_processing_type
        END;
    `);
    console.log("✓ Converted processing_type to ENUM");

    // Set NOT NULL constraint
    await sequelize.query(`
      ALTER TABLE derivative_master 
      ALTER COLUMN processing_type SET NOT NULL;
    `);
    console.log("✓ Set processing_type NOT NULL");

    console.log("✅ Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runDerivativeMigration();
