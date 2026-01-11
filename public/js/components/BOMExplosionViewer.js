/**
 * BOM Explosion Viewer Component
 * Displays planned outputs from BOM explosion
 */

Vue.component('bom-explosion-viewer', {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-info text-white">
        <h5 class="mb-0">
          <i class="fas fa-sitemap"></i> BOM Explosion
        </h5>
      </div>
      <div class="card-body">
        <div v-if="!productionOrder" class="alert alert-warning">
          <i class="fas fa-info-circle"></i> Select a production order to view BOM explosion
        </div>

        <div v-else>
          <!-- Order Info -->
          <div class="row mb-3">
            <div class="col-md-3">
              <small class="text-muted">Order Number</small>
              <p class="fw-bold">{{ productionOrder.order_number }}</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Input Qty</small>
              <p class="fw-bold">{{ productionOrder.planned_quantity_kg }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Status</small>
              <p>
                <span :class="getStatusBadge(productionOrder.status)">
                  {{ productionOrder.status }}
                </span>
              </p>
            </div>
            <div class="col-md-3">
              <button 
                @click="startProduction"
                class="btn btn-sm btn-success"
                :disabled="productionOrder.status !== 'PLANNED' || isLoading"
              >
                <i class="fas fa-play"></i> Start Production
              </button>
            </div>
          </div>

          <!-- BOM Table -->
          <div v-if="bomExplosion" class="table-responsive">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Derivative</th>
                  <th class="text-end">Base Yield %</th>
                  <th class="text-end">Grade Multiplier</th>
                  <th class="text-end">Size Multiplier</th>
                  <th class="text-end">Effective Yield %</th>
                  <th class="text-end">Planned Qty (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="output in bomExplosion.planned_outputs" 
                  :key="output.derivative_id"
                  :class="output.derivative_code === 'WASTE' ? 'table-danger' : ''"
                >
                  <td>
                    <strong>{{ output.derivative_name }}</strong>
                    <br>
                    <small class="text-muted">{{ output.derivative_code }}</small>
                  </td>
                  <td class="text-end">
                    <span class="badge bg-light text-dark">
                      {{ output.base_yield_percent }}%
                    </span>
                  </td>
                  <td class="text-end">{{ output.grade_multiplier || '-' }}</td>
                  <td class="text-end">{{ output.size_multiplier || '-' }}</td>
                  <td class="text-end">
                    <strong>{{ output.effective_yield_percent }}%</strong>
                  </td>
                  <td class="text-end">
                    <strong>{{ output.planned_quantity_kg }} kg</strong>
                  </td>
                </tr>
              </tbody>
              <tfoot class="table-light fw-bold">
                <tr>
                  <td colspan="5">Total Output:</td>
                  <td class="text-end">{{ bomExplosion.total_planned_output_kg }} kg</td>
                </tr>
                <tr class="table-danger">
                  <td colspan="5">Total Waste:</td>
                  <td class="text-end">{{ bomExplosion.total_waste_kg }} kg ({{ bomExplosion.waste_percent }}%)</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <!-- Loading -->
          <div v-if="isLoading" class="text-center">
            <div class="spinner-border" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  props: {
    productionOrder: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      bomExplosion: null,
      isLoading: false,
    };
  },
  methods: {
    getStatusBadge(status) {
      const badges = {
        PLANNED: 'badge bg-warning',
        RAW_ISSUED: 'badge bg-info',
        IN_PRODUCTION: 'badge bg-primary',
        COMPLETED: 'badge bg-success',
        CLOSED: 'badge bg-secondary',
      };
      return badges[status] || 'badge bg-light';
    },
    async startProduction() {
      if (!confirm('Start production for this order?')) return;

      this.isLoading = true;
      try {
        const result = await productionService.startProduction(
          this.productionOrder.id,
          {
            initial_grade: 'B',
            size_code: 'MEDIUM',
          }
        );
        this.bomExplosion = result.data.bom_explosion;
        alert('Production started! BOM exploded.');
        this.$emit('production-started', result.data);
      } catch (error) {
        alert('Error: ' + error.message);
      } finally {
        this.isLoading = false;
      }
    },
    async loadBOMExplosion() {
      if (!this.productionOrder) return;

      this.isLoading = true;
      try {
        // Get BOM data from API
        const result = await productionService.getProductionOrder(
          this.productionOrder.id
        );
        if (result.data.bom_explosion) {
          this.bomExplosion = result.data.bom_explosion;
        }
      } catch (error) {
        console.error('Error loading BOM:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
  watch: {
    productionOrder() {
      this.loadBOMExplosion();
    },
  },
  mounted() {
    if (this.productionOrder) {
      this.loadBOMExplosion();
    }
  },
});
