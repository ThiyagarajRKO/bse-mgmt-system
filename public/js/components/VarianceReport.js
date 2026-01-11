/**
 * Production Variance Report Component
 * Displays yield variance analysis (normal vs abnormal)
 */

Vue.component("variance-report", {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-info text-white">
        <h5 class="mb-0">
          <i class="fas fa-chart-bar"></i> Production Variance Report
        </h5>
      </div>
      <div class="card-body">
        <div v-if="!productionOrder" class="alert alert-info">
          <i class="fas fa-info-circle"></i> Select a production order with COMPLETED status
        </div>

        <div v-else-if="!varianceData" class="alert alert-secondary">
          <i class="fas fa-hourglass-half"></i> Loading variance data...
        </div>

        <div v-else>
          <!-- Summary Cards -->
          <div class="row mb-4">
            <div class="col-md-3">
              <div class="card border-0 bg-light">
                <div class="card-body text-center">
                  <small class="text-muted">Derivatives</small>
                  <p class="h4 mb-0">{{ varianceData.derivative_count }}</p>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 bg-success bg-opacity-10">
                <div class="card-body text-center">
                  <small class="text-muted">Normal Variance</small>
                  <p class="h4 mb-0 text-success">
                    {{ varianceData.normal_variance_count }}
                  </p>
                  <small>(≤5%)</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 bg-danger bg-opacity-10">
                <div class="card-body text-center">
                  <small class="text-muted">Abnormal Variance</small>
                  <p class="h4 mb-0 text-danger">
                    {{ varianceData.abnormal_variance_count }}
                  </p>
                  <small>(>5%)</small>
                </div>
              </div>
            </div>
            <div class="col-md-3">
              <div class="card border-0 bg-warning bg-opacity-10">
                <div class="card-body text-center">
                  <small class="text-muted">GL Posted</small>
                  <p class="h4 mb-0 text-warning">
                    {{ varianceData.gl_posted_count }}
                  </p>
                  <small>abnormal only</small>
                </div>
              </div>
            </div>
          </div>

          <!-- Variance Details Table -->
          <h6>Derivative Variance Details</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>Derivative</th>
                  <th class="text-center">Plan (kg)</th>
                  <th class="text-center">Actual (kg)</th>
                  <th class="text-center">Variance (kg)</th>
                  <th class="text-center">Variance %</th>
                  <th class="text-center">Status</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in varianceData.variances" :key="item.id">
                  <td>
                    <strong>{{ item.derivative_name }}</strong>
                    <br>
                    <small class="text-muted">{{ item.derivative_code }}</small>
                  </td>
                  <td class="text-center">
                    {{ item.planned_quantity_kg.toFixed(2) }}
                  </td>
                  <td class="text-center">
                    {{ item.actual_quantity_kg.toFixed(2) }}
                  </td>
                  <td class="text-center">
                    <strong>{{ item.variance_quantity_kg.toFixed(2) }}</strong>
                  </td>
                  <td class="text-center">
                    <strong :class="getVarianceClass(item.variance_percent)">
                      {{ item.variance_percent.toFixed(2) }}%
                    </strong>
                  </td>
                  <td class="text-center">
                    <span :class="getVarianceBadge(item.variance_type)">
                      {{ item.variance_type }}
                    </span>
                  </td>
                  <td>
                    {{ item.variance_reason || 'N/A' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- GL Posting Section -->
          <h6 class="mt-4">GL Posting Status</h6>
          <div class="table-responsive mb-3">
            <table class="table table-sm">
              <thead class="table-light">
                <tr>
                  <th>Abnormal Variance Item</th>
                  <th>Amount</th>
                  <th class="text-center">GL Account</th>
                  <th class="text-center">Posted</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="gl in varianceData.gl_postings" :key="gl.id">
                  <td>
                    <strong>{{ gl.description }}</strong>
                    <br>
                    <small class="text-muted">{{ gl.variance_type }}</small>
                  </td>
                  <td>
                    {{ gl.currency_symbol }} {{ gl.amount.toFixed(2) }}
                  </td>
                  <td class="text-center">
                    <code>{{ gl.account_code }}</code>
                  </td>
                  <td class="text-center">
                    <i v-if="gl.posted_date" class="fas fa-check text-success"></i>
                    <i v-else class="fas fa-times text-danger"></i>
                  </td>
                  <td>
                    <small v-if="gl.transaction_id">{{ gl.transaction_id }}</small>
                    <small v-else class="text-muted">Pending</small>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Summary Stats -->
          <h6 class="mt-4">Summary Statistics</h6>
          <div class="row">
            <div class="col-md-6">
              <div class="bg-light p-3 rounded">
                <div class="row mb-2">
                  <div class="col-6">
                    <small class="text-muted">Total Planned Output</small>
                    <p class="fw-bold">{{ varianceData.total_planned_kg.toFixed(2) }} kg</p>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Total Actual Output</small>
                    <p class="fw-bold text-success">{{ varianceData.total_actual_kg.toFixed(2) }} kg</p>
                  </div>
                </div>
                <div class="row">
                  <div class="col-6">
                    <small class="text-muted">Total Variance</small>
                    <p class="fw-bold">{{ varianceData.total_variance_kg.toFixed(2) }} kg</p>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Overall Variance %</small>
                    <p class="fw-bold" :class="getVarianceClass(varianceData.overall_variance_percent)">
                      {{ varianceData.overall_variance_percent.toFixed(2) }}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-md-6">
              <div class="bg-light p-3 rounded">
                <div class="row mb-2">
                  <div class="col-6">
                    <small class="text-muted">Total Waste</small>
                    <p class="fw-bold text-danger">{{ varianceData.total_waste_kg.toFixed(2) }} kg</p>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Waste %</small>
                    <p class="fw-bold">{{ varianceData.waste_percent.toFixed(2) }}%</p>
                  </div>
                </div>
                <div class="row">
                  <div class="col-6">
                    <small class="text-muted">GL Amount Posted</small>
                    <p class="fw-bold">{{ varianceData.total_gl_amount.toFixed(2) }}</p>
                  </div>
                  <div class="col-6">
                    <small class="text-muted">Status</small>
                    <p class="fw-bold">
                      <span v-if="varianceData.gl_posted_count === varianceData.abnormal_variance_count" class="badge bg-success">
                        Complete
                      </span>
                      <span v-else class="badge bg-warning">
                        Pending
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="mt-3">
            <button 
              @click="refreshReport"
              class="btn btn-info"
              :disabled="isLoading"
            >
              <i class="fas fa-sync-alt"></i>
              {{ isLoading ? 'Refreshing...' : 'Refresh Report' }}
            </button>
            <button 
              @click="exportReport"
              class="btn btn-secondary ms-2"
            >
              <i class="fas fa-download"></i>
              Export
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
      varianceData: null,
      isLoading: false,
    };
  },
  methods: {
    getVarianceClass(variancePercent) {
      if (variancePercent === undefined || variancePercent === null) {
        return "text-muted";
      }
      const abs = Math.abs(variancePercent);
      if (abs <= 5) return "text-success";
      if (abs <= 10) return "text-warning";
      return "text-danger";
    },
    getVarianceBadge(varianceType) {
      switch (varianceType) {
        case "NORMAL":
          return "badge bg-success";
        case "ABNORMAL":
          return "badge bg-danger";
        case "GRADE_VARIANCE":
          return "badge bg-warning";
        default:
          return "badge bg-light text-dark";
      }
    },
    async loadVarianceReport() {
      if (!this.productionOrder?.id) return;

      this.isLoading = true;
      try {
        const response = await productionService.getVarianceReport(
          this.productionOrder.id
        );
        this.varianceData = response.data;
      } catch (error) {
        console.error("Error loading variance report:", error);
        alert("Error loading variance report");
      } finally {
        this.isLoading = false;
      }
    },
    async refreshReport() {
      await this.loadVarianceReport();
    },
    exportReport() {
      if (!this.varianceData) return;

      const csv = this.generateCSV();
      const blob = new Blob([csv], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `variance-report-${this.productionOrder.order_number}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    generateCSV() {
      const data = this.varianceData;
      let csv =
        "Derivative,Planned (kg),Actual (kg),Variance (kg),Variance %,Type,Reason\n";

      data.variances.forEach((v) => {
        csv += `"${v.derivative_name}",${v.planned_quantity_kg.toFixed(
          2
        )},${v.actual_quantity_kg.toFixed(2)},${v.variance_quantity_kg.toFixed(
          2
        )},${v.variance_percent.toFixed(2)},${v.variance_type},"${
          v.variance_reason || ""
        }"\n`;
      });

      csv += `\nSummary\nTotal Planned,${data.total_planned_kg.toFixed(
        2
      )}\nTotal Actual,${data.total_actual_kg.toFixed(
        2
      )}\nTotal Variance,${data.total_variance_kg.toFixed(
        2
      )}\nVariance %,${data.overall_variance_percent.toFixed(2)}\n`;

      return csv;
    },
  },
  watch: {
    productionOrder() {
      if (this.productionOrder?.status === "COMPLETED") {
        this.loadVarianceReport();
      }
    },
  },
  mounted() {
    if (this.productionOrder?.status === "COMPLETED") {
      this.loadVarianceReport();
    }
  },
});
