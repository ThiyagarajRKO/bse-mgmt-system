const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('seafood-erp', 'automatly', 'automatly123', {
  host: 'localhost',
  dialect: 'postgres',
  logging: false
});

(async () => {
  try {
    const productId = '5fec00fc-1af8-4cd1-a4c5-5b81a156aecc';
    const quantity = 3997;
    
    // Get defaults
    const [procProduct] = await sequelize.query(`
      SELECT id FROM procurement_products LIMIT 1
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    const [user] = await sequelize.query(`
      SELECT id FROM user_profiles LIMIT 1
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Create purchase inventory record
    await sequelize.query(`
      INSERT INTO purchase_inventory 
      (id, product_master_id, procurement_product_id, procurement_product_type, quantity, available_stock, reserved_quantity, is_active, created_by, created_at)
      VALUES 
      (gen_random_uuid(), $1, $2, 'PROCESSED', $3, $3, 0, true, $4, NOW())
    `, {
      replacements: [productId, procProduct.id, quantity, user.id],
      type: Sequelize.QueryTypes.INSERT
    });
    
    console.log('✓ Created purchase inventory:');
    console.log('  Product: Big Blue Octopus | PRC TENTACLES | 30UP-CM | B');
    console.log('  Quantity: 3997 kg');
    console.log('  Available Stock: 3997 kg');
    
    await sequelize.close();
  } catch(err) {
    console.error('Error:', err.message);
  }
})();
