/**
 * Inventory Dashboard Component
 * Real-time inventory visibility by warehouse, product, and lot
 */

Vue.component('inventory-dashboard', {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">
          <i class="fas fa-warehouse"></i> Inventory Dashboard
        </h5>
      </div>
      <div class="card-body">
        <!-- Filters -->
        <div class="row mb-3">
          <div class="col-md-3">
            <label class="form-label">Warehouse</label>
            <select v-model="filters.warehouse" class="form-select" @change="loadInventory">
              <option value="">All Warehouses</option>
              <option value="RAW_INVENTORY">Raw Inventory</option>
              <option value="WIP_RAW_CONSUMPTION">WIP</option>
              <option value="FG_INVENTORY">Finished Goods</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="form-select" @change="loadInventory">
              <option value="">All Status</option>
              <option value="ON_HAND">On Hand</option>
              <option value="RESERVED">Reserved</option>
              <option value="DAMAGED">Damaged</option>
              <option value="EXPIRED">Expired</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Product</label>
            <select v-model="filters.product_id" class="form-select" @change="loadInventory">
              <option value="">All Products</option>
              <option v-for="product in products" :key="product.id" :value="product.id">
                {{ product.name }} ({{ product.code }})
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">&nbsp;</label>
            <button @click="loadInventory" class="btn btn-primary w-100">
              <i class="fas fa-search"></i> Refresh
            </button>
          </div>
        </div>

        <!-- Summary Metrics -->
        <div class="row mb-3">
          <div class="col-md-3">
            <div class="card border-0 bg-success bg-opacity-10">
              <div class="card-body text-center">
                <small class="text-muted">Total On-Hand</small>
                <p class="h5 mb-0 text-success">{{ totalOnHand.toFixed(2) }} kg</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 bg-warning bg-opacity-10">
              <div class="card-body text-center">
                <small class="text-muted">Total Reserved</small>
                <p class="h5 mb-0 text-warning">{{ totalReserved.toFixed(2) }} kg</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 bg-info bg-opacity-10">
              <div class="card-body text-center">
                <small class="text-muted">Total Available</small>
                <p class="h5 mb-0 text-info">{{ totalAvailable.toFixed(2) }} kg</p>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 bg-danger bg-opacity-10">
              <div class="card-body text-center">
                <small class="text-muted">Total Value</small>
                <p class="h5 mb-0 text-danger">{{ totalValue.toFixed(2) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Inventory Table -->
        <h6>Current Inventory</h6>
        <div class="table-responsive">
          <table class="table table-sm" v-if="inventoryItems.length > 0">
            <thead class="table-light sticky-top">
              <tr>
                <th>Warehouse</th>
                <th>Product</th>
                <th>Lot</th>
                <th class="text-center">On-Hand (kg)</th>
                <th class="text-center">Reserved (kg)</th>
                <th class="text-center">Available (kg)</th>
                <th class="text-center">Cost/Unit</th>
                <th class="text-center">Total Value</th>
                <th class="text-center">Status</th>
                <th class="text-center">Expiry</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in inventoryItems" :key="`${item.warehouse}-${item.product_id}-${item.lot_id}`">
                <td>
                  <span :class="getWarehouseBadge(item.warehouse)">
                    {{ formatWarehouse(item.warehouse) }}
                  </span>
                </td>
                <td>
                  <strong>{{ item.product_name }}</strong>
                  <br>
                  <small class="text-muted">{{ item.product_code }}</small>
                </td>
                <td>
                  <small>{{ item.lot_number }}</small>
                  <br>
                  <small class="text-muted">{{ formatDate(item.received_date) }}</small>
                </td>
                <td class="text-center text-success">
                  <strong>{{ item.on_hand_quantity.toFixed(2) }}</strong>
                </td>
                <td class="text-center text-warning">
                  {{ item.reserved_quantity.toFixed(2) }}
                </td>
                <td class="text-center text-primary">
                  <strong>{{ item.available_quantity.toFixed(2) }}</strong>
                </td>
                <td class="text-center">
                  {{ item.cost_per_unit.toFixed(2) }}
                </td>
                <td class="text-center">
                  {{ (item.on_hand_quantity * item.cost_per_unit).toFixed(2) }}
                </td>
                <td class="text-center">
                  <span :class="getStatusBadge(item.status)">
                    {{ item.status }}
                  </span>
                </td>
                <td class="text-center">
                  <small v-if="item.expiry_date">{{ formatDate(item.expiry_date) }}</small>
                  <small v-else class="text-muted">No expiry</small>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="alert alert-info">
            <i class="fas fa-info-circle"></i> No inventory items found
          </div>
        </div>

        <!-- Warehouse Summary -->
        <h6 class="mt-4">Warehouse Summary</h6>
        <div class="row">
          <div class="col-md-4" v-for="warehouse in warehouseSummary" :key="warehouse.name">
            <div class="card border-start border-3" :class="getBorderClass(warehouse.name)">
              <div class="card-body">
                <small class="text-muted">{{ warehouse.label }}</small>
                <p class="h6 mb-2">{{ warehouse.on_hand.toFixed(2) }} kg</p>
                <small>
                  <span class="text-success">Reserved: {{ warehouse.reserved.toFixed(2) }} kg</span>
                  <br>
                  <span class="text-primary">Available: {{ warehouse.available.toFixed(2) }} kg</span>
                </small>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-3">
          <button @click="exportInventory" class="btn btn-secondary">
            <i class="fas fa-download"></i> Export CSV
          </button>
          <button @click="printReport" class="btn btn-secondary ms-2">
            <i class="fas fa-print"></i> Print
          </button>
        </div>
      </div>
    </div>
  `,
  data() {
    return {
      inventoryItems: [],
      products: [],
      filters: {
        warehouse: '',
        status: '',
        product_id: '',
      },
      isLoading: false,
    };
  },
  computed: {
    totalOnHand() {
      return this.inventoryItems.reduce((sum, item) => sum + item.on_hand_quantity, 0);
    },
    totalReserved() {
      return this.inventoryItems.reduce((sum, item) => sum + item.reserved_quantity, 0);
    },
    totalAvailable() {
      return this.inventoryItems.reduce((sum, item) => sum + item.available_quantity, 0);
    },
    totalValue() {
      return this.inventoryItems.reduce(
        (sum, item) => sum + item.on_hand_quantity * item.cost_per_unit,
        0
      );
    },
    warehouseSummary() {
      const raw = this.inventoryItems.filter(
        (item) => item.warehouse === 'RAW_INVENTORY'
      );
      const wip = this.inventoryItems.filter(
        (item) => item.warehouse === 'WIP_RAW_CONSUMPTION'
      );
      const fg = this.inventoryItems.filter(
        (item) => item.warehouse === 'FG_INVENTORY'
      );

      return [
        {
          name: 'RAW_INVENTORY',
          label: 'Raw Inventory',
          on_hand: raw.reduce((s, i) => s + i.on_hand_quantity, 0),
          reserved: raw.reduce((s, i) => s + i.reserved_quantity, 0),
          available: raw.reduce((s, i) => s + i.available_quantity, 0),
        },
        {
          name: 'WIP_RAW_CONSUMPTION',
          label: 'WIP',
          on_hand: wip.reduce((s, i) => s + i.on_hand_quantity, 0),
          reserved: wip.reduce((s, i) => s + i.reserved_quantity, 0),
          available: wip.reduce((s, i) => s + i.available_quantity, 0),
        },
        {
          name: 'FG_INVENTORY',
          label: 'Finished Goods',
          on_hand: fg.reduce((s, i) => s + i.on_hand_quantity, 0),
          reserved: fg.reduce((s, i) => s + i.reserved_quantity, 0),
          available: fg.reduce((s, i) => s + i.available_quantity, 0),
        },
      ];
    },
  },
  methods: {
    formatWarehouse(warehouse) {
      const map = {
        RAW_INVENTORY: 'Raw',
        WIP_RAW_CONSUMPTION: 'WIP',
        FG_INVENTORY: 'Finished Goods',
      };
      return map[warehouse] || warehouse;
    },
    formatDate(dateStr) {
      if (!dateStr) return 'N/A';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    getWarehouseBadge(warehouse) {
      switch (warehouse) {
        case 'RAW_INVENTORY':
          return 'badge bg-primary';
        case 'WIP_RAW_CONSUMPTION':
          return 'badge bg-warning text-dark';
        case 'FG_INVENTORY':
          return 'badge bg-success';
        default:
          return 'badge bg-light text-dark';
      }
    },
    getStatusBadge(status) {
      switch (status) {
        case 'ON_HAND':
          return 'badge bg-success';
        case 'RESERVED':
          return 'badge bg-warning text-dark';
        case 'DAMAGED':
          return 'badge bg-danger';
        case 'EXPIRED':
          return 'badge bg-secondary';
        default:
          return 'badge bg-light text-dark';
      }
    },
    getBorderClass(warehouse) {
      switch (warehouse) {
        case 'RAW_INVENTORY':
          return 'border-primary';
        case 'WIP_RAW_CONSUMPTION':
          return 'border-warning';
        case 'FG_INVENTORY':
          return 'border-success';
        default:
          return 'border-secondary';
      }
    },
    async loadProducts() {
      try {
        const response = await axios.get('/api/products?limit=500');
        this.products = response.data.data || [];
      } catch (error) {
        console.error('Error loading products:', error);
      }
    },
    async loadInventory() {
      this.isLoading = true;
      try {
        const params = {};
        if (this.filters.warehouse) params.warehouse = this.filters.warehouse;
        if (this.filters.status) params.status = this.filters.status;
        if (this.filters.product_id) params.product_id = this.filters.product_id;

        const response = await productionService.getInventoryStock(params);
        this.inventoryItems = response.data.data || [];
      } catch (error) {
        console.error('Error loading inventory:', error);
        alert('Error loading inventory');
      } finally {
        this.isLoading = false;
      }
    },
    exportInventory() {
      let csv = 'Warehouse,Product,Lot,On-Hand (kg),Reserved (kg),Available (kg),Cost/Unit,Total Value,Status,Expiry\n';

      this.inventoryItems.forEach((item) => {
        csv += `"${this.formatWarehouse(item.warehouse)}","${item.product_name}","${item.lot_number}",${item.on_hand_quantity.toFixed(2)},${item.reserved_quantity.toFixed(2)},${item.available_quantity.toFixed(2)},${item.cost_per_unit.toFixed(2)},${(
          item.on_hand_quantity * item.cost_per_unit
        ).toFixed(2)},"${item.status}","${this.formatDate(item.expiry_date)}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    printReport() {
      window.print();
    },
  },
  mounted() {
    this.loadProducts();
    this.loadInventory();
    // Refresh every 60 seconds
    setInterval(() => this.loadInventory(), 60000);
  },
});
