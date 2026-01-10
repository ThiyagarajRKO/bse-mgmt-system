require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USERNAME,
  process.env.DB_PASSWORD || process.env.DB_SECRET,
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres",
    logging: false,
  }
);

(async function main() {
  try {
    await sequelize.authenticate();
    console.log("\n-- Counts --");
    const [c] = await sequelize.query(
      `SELECT COUNT(*)::int AS total_products, COUNT(CASE WHEN species_derivative_size_grade_mapping_id IS NOT NULL THEN 1 END)::int AS with_mapping, COUNT(CASE WHEN species_derivative_size_grade_mapping_id IS NULL THEN 1 END)::int AS without_mapping FROM product_master WHERE is_active=true`
    );
    console.log(c[0]);

    const [cats] = await sequelize.query(
      `SELECT COUNT(*)::int AS total_categories, COUNT(CASE WHEN species_master_id IS NOT NULL THEN 1 END)::int AS categories_with_species FROM product_category_master WHERE is_active=true`
    );
    console.log("\n-- Categories --");
    console.log(cats[0]);

    const [mismatch] = await sequelize.query(
      `SELECT pm.id, pm.product_name, pm.product_category_master_id, pcm.species_master_id AS category_species, sdsgm.species_master_id AS mapping_species FROM product_master pm LEFT JOIN product_category_master pcm ON pm.product_category_master_id=pcm.id LEFT JOIN species_derivative_size_grade_mapping sdsgm ON pm.species_derivative_size_grade_mapping_id=sdsgm.id WHERE pm.is_active=true AND pm.species_derivative_size_grade_mapping_id IS NOT NULL AND pcm.species_master_id IS NOT NULL AND pcm.species_master_id <> sdsgm.species_master_id ORDER BY pm.id LIMIT 20`
    );
    console.log("\n-- Sample mismatched products (category vs mapping) --");
    console.table(mismatch[0] || []);

    const [rawSamples] = await sequelize.query(
      `SELECT id, product_name, product_category_master_id FROM product_master WHERE is_active=true AND species_derivative_size_grade_mapping_id IS NULL ORDER BY id LIMIT 20`
    );
    console.log("\n-- Sample raw products (no 4D mapping) --");
    console.table(rawSamples[0] || []);

    const [speciesNoCat] = await sequelize.query(
      `SELECT s.id, s.species_name FROM species_master s WHERE s.is_active=true AND NOT EXISTS (SELECT 1 FROM product_category_master pcm WHERE pcm.species_master_id=s.id AND pcm.is_active=true) ORDER BY s.id LIMIT 50`
    );
    console.log("\n-- Species without a category --");
    console.table(speciesNoCat[0] || []);

    await sequelize.close();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
