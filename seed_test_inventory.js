const { v4: uuidv4 } = require('uuid');
const db = require('sequelize');
const { sequelize } = require('./config/config');

async function seedTestInventory() {
  try {
    console.log('\n🌱 Seeding test inventory for BOM testing...\n');
    
    // Get all BOMs with their raw materials
    const [boms] = await sequelize.query(`
      SELECT DISTINCT bm.id, bm.bom_code, bm.species_id, 
             bi.raw_product_id
      FROM bom_master bm
      LEFT JOIN bom_input bi ON bm.id = bi.bom_id
      WHERE bi.raw_product_id IS NOT NULL
      LIMIT 10
    `);
    
    console.log(`Found ${boms.length} BOMs with raw materials\n`);
    
    for (const bom of boms) {
      // Get procurement products for this raw material
      const [procProds] = await sequelize.query(`
        SELECT id FROM procurement_products
        WHERE product_master_id = $1 AND is_active = true
        LIMIT 1
      `, { bind: [bom.raw_product_id] });
      
      if (procProds.length > 0) {
        const procProdId = procProds[0].id;
        
        // Insert test inventory
        await sequelize.query(`
          INSERT INTO purchase_inventory (id, procurement_product_id, quantity, batch_number, is_active, created_at, updated_at)
          VALUES (:id, :procurement_product_id, :quantity, :batch_number, true, NOW(), NOW())
        `, {
          replacements: {
            id: uuidv4(),
            procurement_product_id: procProdId,
            quantity: 5000,
            batch_number: 'TEST-' + Date.now()
          }
        });
        
        console.log(`✓ Added 5000 units to BOM: ${bom.bom_code}`);
      }
    }
    
    console.log('\n✅ Test inventory seeded\n');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

seedTestInventory();
