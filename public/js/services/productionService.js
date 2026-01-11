/**
 * BOM Production Management Service
 * Handles all API calls for BOM-driven production workflow
 * 
 * Integration: Calls Fastify backend endpoints
 */

class ProductionService {
  constructor(baseURL = '/api/production') {
    this.baseURL = baseURL;
    this.apiClient = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Create production order
   */
  async createProductionOrder(data) {
    try {
      const response = await this.apiClient.post('/orders', data);
      return response.data;
    } catch (error) {
      console.error('Error creating production order:', error);
      throw error;
    }
  }

  /**
   * Get production order by ID
   */
  async getProductionOrder(orderId) {
    try {
      const response = await this.apiClient.get(`/orders/${orderId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching production order:', error);
      throw error;
    }
  }

  /**
   * Get all production orders (paginated)
   */
  async getAllProductionOrders(page = 1, limit = 20, filters = {}) {
    try {
      const response = await this.apiClient.get('/orders', {
        params: {
          page,
          limit,
          ...filters,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching production orders:', error);
      throw error;
    }
  }

  /**
   * Start production (BOM explosion)
   */
  async startProduction(orderId, data) {
    try {
      const response = await this.apiClient.post(`/${orderId}/start`, data);
      return response.data;
    } catch (error) {
      console.error('Error starting production:', error);
      throw error;
    }
  }

  /**
   * Consume raw material (FIFO)
   */
  async consumeRawMaterial(orderId) {
    try {
      const response = await this.apiClient.post(`/${orderId}/consume`);
      return response.data;
    } catch (error) {
      console.error('Error consuming raw material:', error);
      throw error;
    }
  }

  /**
   * Record production output
   */
  async receiveProductionOutput(orderId, data) {
    try {
      const response = await this.apiClient.post(`/${orderId}/output`, data);
      return response.data;
    } catch (error) {
      console.error('Error receiving production output:', error);
      throw error;
    }
  }

  /**
   * Close production order
   */
  async closeProductionOrder(orderId) {
    try {
      const response = await this.apiClient.post(`/${orderId}/close`);
      return response.data;
    } catch (error) {
      console.error('Error closing production order:', error);
      throw error;
    }
  }

  /**
   * Get inventory stock
   */
  async getInventoryStock(filters = {}) {
    try {
      const response = await axios.get('/api/inventory/stock', {
        params: filters,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching inventory stock:', error);
      throw error;
    }
  }

  /**
   * Get production variance report
   */
  async getVarianceReport(orderId) {
    try {
      const response = await this.apiClient.get(`/${orderId}/variance`);
      return response.data;
    } catch (error) {
      console.error('Error fetching variance report:', error);
      throw error;
    }
  }
}

// Export
const productionService = new ProductionService();
