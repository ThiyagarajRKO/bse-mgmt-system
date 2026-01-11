/**
 * Production Output Recording Component
 * Records actual output with grades, sizes, and quantities
 */

Vue.component("production-output-recorder", {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-success text-white">
        <h5 class="mb-0">
          <i class="fas fa-cubes"></i> Record Production Output
        </h5>
      </div>
      <div class="card-body">
        <div v-if="!productionOrder" class="alert alert-warning">
          <i class="fas fa-info-circle"></i> Select a production order with RAW_ISSUED status
        </div>

        <div v-else-if="productionOrder.status !== 'RAW_ISSUED'">
          <div class="alert alert-info">
            Current status: <strong>{{ productionOrder.status }}</strong>
            <br>
            Production must be RAW_ISSUED to record output
          </div>
        </div>

        <div v-else>
          <!-- Actual Outputs -->
          <div class="table-responsive mb-3">
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>Derivative</th>
                  <th class="text-center">Expected (kg)</th>
                  <th class="text-center">Actual (kg)</th>
                  <th class="text-center">Grade</th>
                  <th class="text-center">Size</th>
                  <th class="text-center">Variance</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(output, idx) in actualOutputs" 
                  :key="idx"
                >
                  <td>
                    <strong>{{ output.derivative_name }}</strong>
                    <br>
                    <small class="text-muted">{{ output.derivative_code }}</small>
                  </td>
                  <td class="text-center">
                    {{ output.expected_quantity_kg }}
                  </td>
                  <td class="text-center">
                    <input 
                      v-model.number="output.actual_quantity_kg"
                      type="number"
                      step="0.01"
                      class="form-control form-control-sm text-center"
                      min="0"
                      @blur="calculateVariance(output)"
                    >
                  </td>
                  <td class="text-center">
                    <select v-model="output.actual_grade" class="form-select form-select-sm">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </td>
                  <td class="text-center">
                    <select v-model="output.size_code" class="form-select form-select-sm">
                      <option value="SMALL">Small</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LARGE">Large</option>
                      <option value="XL">XL</option>
                    </select>
                  </td>
                  <td class="text-center">
                    <span 
                      :class="getVarianceBadge(output.variance_percent)"
                    >
                      {{ output.variance_percent }}%
                    </span>
                  </td>
                  <td>
                    <input 
                      v-model="output.variance_reason"
                      type="text"
                      class="form-control form-control-sm"
                      placeholder="e.g., slight breakage"
                    >
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Summary -->
          <div class="row mb-3">
            <div class="col-md-3">
              <small class="text-muted">Total Input</small>
              <p class="fw-bold">{{ productionOrder.planned_quantity_kg }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Total Output</small>
              <p class="fw-bold text-success">{{ totalActualOutput }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Waste</small>
              <p class="fw-bold text-danger">{{ totalWaste }} kg</p>
            </div>
            <div class="col-md-3">
              <small class="text-muted">Waste %</small>
              <p class="fw-bold">{{ wastePercent }}%</p>
            </div>
          </div>

          <!-- Buttons -->
          <div class="mt-3">
            <button 
              @click="submitOutput"
              class="btn btn-success"
              :disabled="isSubmitting || !isValid"
            >
              <i class="fas fa-check-circle"></i>
              {{ isSubmitting ? 'Recording...' : 'Record Output' }}
            </button>
            <button 
              @click="resetForm"
              class="btn btn-secondary ms-2"
            >
              Reset
            </button>
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
      actualOutputs: [],
      isSubmitting: false,
    };
  },
  computed: {
    totalActualOutput() {
      return this.actualOutputs.reduce(
        (sum, o) => sum + (o.actual_quantity_kg || 0),
        0
      );
    },
    totalWaste() {
      return Math.max(
        0,
        (this.productionOrder?.planned_quantity_kg || 0) -
          this.totalActualOutput
      );
    },
    wastePercent() {
      const qty = this.productionOrder?.planned_quantity_kg || 1;
      return ((this.totalWaste / qty) * 100).toFixed(2);
    },
    isValid() {
      return (
        this.actualOutputs.length > 0 &&
        this.actualOutputs.every((o) => o.actual_quantity_kg >= 0)
      );
    },
  },
  methods: {
    getVarianceBadge(variancePercent) {
      if (variancePercent === undefined || variancePercent === null) {
        return "badge bg-light text-dark";
      }
      if (variancePercent <= -5) return "badge bg-danger";
      if (variancePercent < 0) return "badge bg-warning";
      if (variancePercent === 0) return "badge bg-success";
      return "badge bg-info";
    },
    calculateVariance(output) {
      if (output.expected_quantity_kg && output.actual_quantity_kg !== null) {
        output.variance_percent = (
          ((output.actual_quantity_kg - output.expected_quantity_kg) /
            output.expected_quantity_kg) *
          100
        ).toFixed(2);
      }
    },
    async loadOutputs() {
      if (!this.productionOrder) return;

      try {
        // Get production outputs for this order
        const response = await axios.get(
          `/api/production/${this.productionOrder.id}/outputs`
        );
        this.actualOutputs = response.data.data.map((output) => ({
          derivative_id: output.derivative_id,
          derivative_code: output.derivative_code || "Unknown",
          derivative_name: output.derivative_name || "Unknown",
          expected_quantity_kg: output.expected_quantity_kg || 0,
          actual_quantity_kg: 0,
          actual_grade: "B",
          size_code: "MEDIUM",
          variance_reason: "",
          variance_percent: 0,
        }));
      } catch (error) {
        console.error("Error loading outputs:", error);
        alert("Error loading production outputs");
      }
    },
    async submitOutput() {
      if (!confirm("Submit production output?")) return;

      this.isSubmitting = true;
      try {
        const result = await productionService.receiveProductionOutput(
          this.productionOrder.id,
          {
            actual_outputs: this.actualOutputs,
          }
        );
        alert(
          `Output recorded successfully! Created ${result.data.fg_inventory_created} FG items`
        );
        this.$emit("output-recorded", result.data);
        this.resetForm();
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        this.isSubmitting = false;
      }
    },
    resetForm() {
      this.actualOutputs.forEach((output) => {
        output.actual_quantity_kg = 0;
        output.actual_grade = "B";
        output.size_code = "MEDIUM";
        output.variance_reason = "";
        output.variance_percent = 0;
      });
    },
  },
  watch: {
    productionOrder() {
      if (this.productionOrder?.status === "RAW_ISSUED") {
        this.loadOutputs();
      }
    },
  },
  mounted() {
    if (this.productionOrder?.status === "RAW_ISSUED") {
      this.loadOutputs();
    }
  },
});
