require("dotenv").config();
const { Sequelize, QueryTypes } = require("sequelize");

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

    console.log("\n========== FINAL VERIFICATION ==========\n");

    // Overall counts
    const [counts] = await sequelize.query(
      `
      SELECT 
        COUNT(*)::int AS total_products,
        COUNT(CASE WHEN species_derivative_size_grade_mapping_id IS NOT NULL THEN 1 END)::int AS with_4d_mapping,
        COUNT(CASE WHEN species_derivative_size_grade_mapping_id IS NULL THEN 1 END)::int AS raw_products
      FROM product_master 
      WHERE is_active = true
    `,
      { type: QueryTypes.SELECT }
    );
    console.log("Product Counts:");
    console.table(counts[0]);

    // Species distribution via product categories
    const [speciesDist] = await sequelize.query(
      `
      SELECT 
        s.species_name,
        COUNT(pm.id)::int AS product_count
      FROM species_master s
      LEFT JOIN product_category_master pcm ON s.id = pcm.species_master_id AND pcm.is_active = true
      LEFT JOIN product_master pm ON pcm.id = pm.product_category_master_id AND pm.is_active = true
      WHERE s.is_active = true
      GROUP BY s.id, s.species_name
      HAVING COUNT(pm.id) > 0
      ORDER BY COUNT(pm.id) DESC
    `,
      { type: QueryTypes.SELECT }
    );

    console.log("\nSpecies Distribution (products per species):");
    console.table(speciesDist[0] || []);

    const totalInDistribution = (speciesDist[0] || []).reduce(
      (sum, r) => sum + r.product_count,
      0
    );
    console.log(
      `\nTotal products in species distribution: ${totalInDistribution}`
    );
    console.log(
      `Unique species with products: ${(speciesDist[0] || []).length}`
    );

    // Verify mapped vs raw split
    const [mappedSplit] = await sequelize.query(
      `
      SELECT 
        CASE 
          WHEN species_derivative_size_grade_mapping_id IS NOT NULL THEN 'With 4D Mapping'
          ELSE 'Raw (No Mapping)'
        END AS product_type,
        COUNT(*)::int AS count
      FROM product_master
      WHERE is_active = true
      GROUP BY product_type
      ORDER BY count DESC
    `,
      { type: QueryTypes.SELECT }
    );

    console.log("\nProduct Type Split:");
    console.table(mappedSplit[0] || []);

    // Sample check: raw products should now be assigned to species categories
    const [rawSample] = await sequelize.query(
      `
      SELECT 
        pm.product_name,
        s.species_name,
        pm.product_category_master_id,
        pm.species_derivative_size_grade_mapping_id
      FROM product_master pm
      LEFT JOIN product_category_master pcm ON pm.product_category_master_id = pcm.id
      LEFT JOIN species_master s ON pcm.species_master_id = s.id
      WHERE pm.is_active = true 
      AND pm.species_derivative_size_grade_mapping_id IS NULL
      LIMIT 20
    `,
      { type: QueryTypes.SELECT }
    );

    console.log("\nSample Raw Products (showing species assignment):");
    console.table(
      (rawSample[0] || []).map((r) => ({
        product_name: r.product_name.substring(0, 50),
        species_name: r.species_name,
      }))
    );

    console.log("\n✓ Verification complete.\n");
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
