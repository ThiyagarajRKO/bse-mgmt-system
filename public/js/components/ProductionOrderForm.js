/**
 * Production Order Creation Component
 * Handles creation of new production orders with BOM
 */

Vue.component("production-order-form", {
  template: `
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">
        <h5 class="mb-0">
          <i class="fas fa-plus-circle"></i> Create Production Order
        </h5>
      </div>
      <div class="card-body">
        <form @submit.prevent="submitForm">
          <div class="row">
            <!-- Order Number -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Order Number</label>
              <input 
                v-model="form.order_number" 
                type="text" 
                class="form-control" 
                placeholder="e.g., PO-20260111-001"
                required
              >
            </div>

            <!-- Plant -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Plant/Location</label>
              <select v-model="form.plant_id" class="form-control" required>
                <option value="">Select Plant</option>
                <option value="PLANT_001">PLANT_001</option>
                <option value="PLANT_002">PLANT_002</option>
              </select>
            </div>

            <!-- Species Selection -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Species</label>
              <select 
                v-model="form.input_species_id" 
                class="form-control" 
                @change="onSpeciesChange"
                required
              >
                <option value="">Select Species</option>
                <option 
                  v-for="species in species_list" 
                  :key="species.id" 
                  :value="species.id"
                >
                  {{ species.species_name }} ({{ species.species_code }})
                </option>
              </select>
            </div>

            <!-- Order Type -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Order Type</label>
              <select v-model="form.order_type" class="form-control">
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="VALUE_ADDED">Value Added</option>
                <option value="REWORK">Rework</option>
              </select>
            </div>

            <!-- Planned Quantity -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Planned Quantity (kg)</label>
              <input 
                v-model.number="form.planned_quantity_kg" 
                type="number" 
                step="0.01"
                class="form-control"
                min="0"
                required
              >
            </div>

            <!-- Start Date -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Start Date</label>
              <input 
                v-model="form.planned_start_date" 
                type="datetime-local" 
                class="form-control"
                required
              >
            </div>

            <!-- Initial Grade -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Initial Grade</label>
              <select v-model="form.initial_grade" class="form-control">
                <option value="A">Grade A</option>
                <option value="B" selected>Grade B (Standard)</option>
                <option value="C">Grade C</option>
                <option value="D">Grade D</option>
              </select>
            </div>

            <!-- Size Code -->
            <div class="col-md-6 mb-3">
              <label class="form-label">Size</label>
              <select v-model="form.size_code" class="form-control">
                <option value="SMALL">Small</option>
                <option value="MEDIUM" selected>Medium (Standard)</option>
                <option value="LARGE">Large</option>
                <option value="XL">XL</option>
              </select>
            </div>

            <!-- Remarks -->
            <div class="col-md-12 mb-3">
              <label class="form-label">Remarks</label>
              <textarea 
                v-model="form.remarks" 
                class="form-control" 
                rows="2"
                placeholder="Any special notes..."
              ></textarea>
            </div>
          </div>

          <!-- BOM Preview -->
          <div v-if="selectedSpecies" class="alert alert-info mt-3">
            <strong>BOM for {{ selectedSpecies.species_name }}:</strong>
            <p class="mb-0">{{ selectedSpecies.bom_count || 'Loading...' }} outputs configured</p>
          </div>

          <!-- Buttons -->
          <div class="mt-4">
            <button 
              type="submit" 
              class="btn btn-primary"
              :disabled="isSubmitting"
            >
              <i class="fas fa-play-circle"></i>
              {{ isSubmitting ? 'Creating...' : 'Create Production Order' }}
            </button>
            <button 
              type="reset" 
              class="btn btn-secondary ms-2"
            >
              Clear
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  data() {
    return {
      form: {
        order_number: "",
        plant_id: "PLANT_001",
        input_species_id: "",
        order_type: "PRIMARY",
        planned_quantity_kg: 1000,
        planned_start_date: new Date().toISOString().slice(0, 16),
        initial_grade: "B",
        size_code: "MEDIUM",
        remarks: "",
      },
      species_list: [],
      selectedSpecies: null,
      isSubmitting: false,
    };
  },
  methods: {
    async loadSpecies() {
      try {
        const response = await axios.get("/api/species");
        this.species_list = response.data.data || [];
      } catch (error) {
        alert("Error loading species: " + error.message);
      }
    },
    onSpeciesChange() {
      this.selectedSpecies = this.species_list.find(
        (s) => s.id === this.form.input_species_id
      );
    },
    async submitForm() {
      this.isSubmitting = true;
      try {
        const result = await productionService.createProductionOrder(this.form);
        alert(`Production Order created! ID: ${result.data.id}`);
        this.$emit("order-created", result.data);
        this.form = {
          order_number: "",
          plant_id: "PLANT_001",
          input_species_id: "",
          order_type: "PRIMARY",
          planned_quantity_kg: 1000,
          planned_start_date: new Date().toISOString().slice(0, 16),
          initial_grade: "B",
          size_code: "MEDIUM",
          remarks: "",
        };
      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        this.isSubmitting = false;
      }
    },
  },
  mounted() {
    this.loadSpecies();
  },
});
