/**
 * Raw Material Consumption Component
 * Handles FIFO-based raw material consumption from RAW_INVENTORY to WIP
 */

Vue.component("raw-material-consumption", {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-warning text-dark">
        <h5 class="mb-0">
          <i class="fas fa-arrow-right"></i> Consume Raw Material
        </h5>
      </div>
      <div class="card-body">
        <div v-if="!productionOrder" class="alert alert-warning">
          <i class="fas fa-info-circle"></i> Select a production order with PLANNED status
        </div>

        <div v-else-if="productionOrder.status !== 'PLANNED'">
          <div class="alert alert-info">
            Current status: <strong>{{ productionOrder.status }}</strong>
            <br>
            Production must be PLANNED to consume raw material
          </div>
        </div>

        <div v-else>
          <!-- Input Species & Required Qty -->
          <div class="row mb-3">
            <div class="col-md-6">
              <small class="text-muted">Input Species</small>
              <p class="fw-bold">{{ productionOrder.input_species_name }}</p>
            </div>
            <div class="col-md-6">
              <small class="text-muted">Required Quantity</small>
              <p class="fw-bold">{{ productionOrder.planned_quantity_kg }} kg</p>
            </div>
          </div>

          <!-- Available Lots (FIFO) -->
          <h6 class="mt-4">Available Lots (Ordered by Receipt Date - FIFO)</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm table-hover">
              <thead class="table-light">
                <tr>
                  <th>Lot ID</th>
                  <th>Received</th>
                  <th>Supplier</th>
                  <th>Available (kg)</th>
                  <th>Cost/kg</th>
                  <th class="text-center">To Consume (kg)</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="lot in availableLots" :key="lot.id">
                  <td>
                    <strong>{{ lot.lot_number }}</strong>
                    <br>
                    <small class="text-muted">{{ lot.id }}</small>
                  </td>
                  <td>
                    {{ formatDate(lot.received_date) }}
                  </td>
                  <td>
                    {{ lot.supplier_name }}
                  </td>
                  <td>
                    {{ lot.available_quantity_kg.toFixed(2) }}
                  </td>
                  <td>
                    {{ lot.cost_per_unit.toFixed(2) }}
                  </td>
                  <td class="text-center">
                    <input 
                      v-model.number="lot.consume_quantity"
                      type="number"
                      step="0.01"
                      class="form-control form-control-sm"
                      min="0"
                      :max="lot.available_quantity_kg"
                      @blur="updateConsumption"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Consumption Summary -->
          <div class="row bg-light p-3 rounded mb-3">
            <div class="col-md-3">
              <small class="text-muted">Total Required</small>
              <p class="fw-bold">{{ productionOrder.planned_quantity_kg }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Total Allocated</small>
              <p class="fw-bold text-success">{{ totalAllocated.toFixed(2) }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Remaining</small>
              <p class="fw-bold" :class="remainingQty >= 0 ? 'text-success' : 'text-danger'">
                {{ remainingQty.toFixed(2) }} kg
              </p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Estimated Cost</small>
              <p class="fw-bold">{{ totalCost.toFixed(2) }}</p>
            </div>
          </div>

          <!-- Allocation Status -->
          <div v-if="remainingQty > 0" class="alert alert-warning">
            <i class="fas fa-exclamation-triangle"></i>
            Insufficient allocation: {{ remainingQty.toFixed(2) }} kg short
          </div>
          <div v-else-if="remainingQty < 0" class="alert alert-info">
            <i class="fas fa-info-circle"></i>
            Over-allocation by {{ Math.abs(remainingQty).toFixed(2) }} kg (will be adjusted)
          </div>
          <div v-else class="alert alert-success">
            <i class="fas fa-check-circle"></i>
            Perfect allocation: All required material allocated
          </div>

          <!-- Action Buttons -->
          <div class="mt-3">
            <button 
              @click="consumeRawMaterial"
              class="btn btn-warning"
              :disabled="isSubmitting || remainingQty > 0.01"
            >
              <i class="fas fa-check-circle"></i>
              {{ isSubmitting ? 'Consuming...' : 'Consume Raw Material' }}
            </button>
            <button 
              @click="resetAllocation"
              class="btn btn-secondary ms-2"
            >
              Reset Allocation
            </button>
            <small class="d-block mt-2 text-muted">
              {{ availableLots.length }} lots available. FIFO order applied.
            </small>
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
      availableLots: [],
      isSubmitting: false,
    };
  },
  computed: {
    totalAllocated() {
      return this.availableLots.reduce(
        (sum, lot) => sum + (lot.consume_quantity || 0),
        0
      );
    },
    remainingQty() {
      return (
        (this.productionOrder?.planned_quantity_kg || 0) - this.totalAllocated
      );
    },
    totalCost() {
      return this.availableLots.reduce(
        (sum, lot) => sum + (lot.consume_quantity || 0) * lot.cost_per_unit,
        0
      );
    },
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return "N/A";
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    },
    async loadAvailableLots() {
      if (!this.productionOrder?.input_species_id) return;

      try {
        const response = await axios.get(
          `/api/inventory/stock?species_id=${this.productionOrder.input_species_id}&warehouse=RAW_INVENTORY&status=ON_HAND`
        );

        this.availableLots = response.data.data
          .sort((a, b) => new Date(a.received_date) - new Date(b.received_date))
          .map((lot) => ({
            ...lot,
            consume_quantity: 0,
          }));
      } catch (error) {
        console.error("Error loading available lots:", error);
        this.availableLots = [];
      }
    },
    updateConsumption() {
      // Validates that consumption doesn't exceed available
      this.availableLots.forEach((lot) => {
        if (lot.consume_quantity > lot.available_quantity_kg) {
          lot.consume_quantity = lot.available_quantity_kg;
        }
      });
    },
    async consumeRawMaterial() {
      if (
        !confirm(
          "Consume raw material? This will transition to RAW_ISSUED status."
        )
      ) {
        return;
      }

      this.isSubmitting = true;
      try {
        const result = await productionService.consumeRawMaterial(
          this.productionOrder.id,
          {
            lot_allocations: this.availableLots
              .filter((lot) => lot.consume_quantity > 0)
              .map((lot) => ({
                inventory_lot_id: lot.id,
                quantity_kg: lot.consume_quantity,
                cost_per_unit: lot.cost_per_unit,
              })),
          }
        );

        alert(
          `Raw material consumed! WIP inventory created. Transaction ID: ${result.data.transaction_id}`
        );
        this.$emit("raw-consumed", result.data);
        this.availableLots = [];
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        this.isSubmitting = false;
      }
    },
    resetAllocation() {
      this.availableLots.forEach((lot) => {
        lot.consume_quantity = 0;
      });
    },
  },
  watch: {
    productionOrder() {
      if (this.productionOrder?.status === "PLANNED") {
        this.loadAvailableLots();
      }
    },
  },
  mounted() {
    if (this.productionOrder?.status === "PLANNED") {
      this.loadAvailableLots();
    }
  },
});
