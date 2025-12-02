const { v4: uuidv4 } = require("uuid");
const db = require("./models");

const populateProductCategories = async () => {
  try {
    // Connect to database
    await db.authenticate();
    console.log("✓ Database connection established");

    const sequelize = db.sequelize;

    // Default product categories
    const defaultCategories = [
      "Whole Fish",
      "Fillets",
      "Steaks",
      "Whole Cleaned",
      "Whole Round",
    ];

    // Get first available user ID (admin user)
    const firstUser = await sequelize.query(
      `SELECT id FROM user_profiles LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!firstUser || firstUser.length === 0) {
      console.error("✗ No users found in database");
      process.exit(1);
    }

    const userId = firstUser[0].id;
    console.log(`✓ Found user ID: ${userId}`);

    // Find species without categories
    const speciesWithoutCategories = await sequelize.query(
      `SELECT s.id, s.species_name FROM species_master s
       WHERE s.id NOT IN (
         SELECT DISTINCT species_master_id FROM product_category_master 
         WHERE deleted_at IS NULL
       )
       AND s.deleted_at IS NULL`,
      { type: sequelize.QueryTypes.SELECT }
    );

    console.log(
      `✓ Found ${speciesWithoutCategories.length} species without categories\n`
    );

    let categoriesAdded = 0;

    // Add default categories to each species without categories
    for (const species of speciesWithoutCategories) {
      for (const categoryName of defaultCategories) {
        const categoryId = uuidv4();
        const now = new Date();

        await sequelize.query(
          `INSERT INTO product_category_master 
           (id, species_master_id, product_category, is_active, created_at, updated_at, created_by)
           VALUES (:id, :speciesId, :category, true, :now, :now, :userId)`,
          {
            replacements: {
              id: categoryId,
              speciesId: species.id,
              category: categoryName,
              now: now,
              userId: userId,
            },
            type: sequelize.QueryTypes.INSERT,
          }
        );
        categoriesAdded++;
      }
      console.log(
        `  ✓ Added ${defaultCategories.length} categories for: ${species.species_name}`
      );
    }

    console.log(
      `\n✓ Successfully added ${categoriesAdded} product categories!`
    );
    console.log(`✓ All species now have default product categories`);
  } catch (error) {
    console.error("✗ Error:", error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
};

// Run the script
populateProductCategories();
