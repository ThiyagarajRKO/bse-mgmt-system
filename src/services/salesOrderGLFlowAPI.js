/**
 * Sales Order → GL Flow API Service
 * 
 * Handles all API calls for:
 * - Sales Allocations
 * - Production Demands
 * - Sales Invoices
 * - GL Postings
 */

import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== SALES ALLOCATIONS API =====

export const salesAllocationAPI = {
  // Create allocation
  createAllocation: (data) =>
    api.post('/sales/allocations', data),

  // List allocations with filters
  listAllocations: (params = {}) =>
    api.get('/sales/allocations', { params }),

  // Get allocation details
  getAllocationDetails: (allocationId) =>
    api.get(`/sales/allocations/${allocationId}`),

  // Confirm allocation
  confirmAllocation: (allocationId) =>
    api.put(`/sales/allocations/${allocationId}/confirm`, {}),

  // Update fulfillment
  updateFulfillment: (allocationId, data) =>
    api.put(`/sales/allocations/${allocationId}/fulfill`, data),

  // Complete allocation
  completeAllocation: (allocationId) =>
    api.put(`/sales/allocations/${allocationId}/complete`, {}),

  // Cancel allocation
  cancelAllocation: (allocationId) =>
    api.put(`/sales/allocations/${allocationId}/cancel`, {}),

  // Create production demands from allocation
  createDemandsFromAllocation: (allocationId, data) =>
    api.post(`/sales/allocations/${allocationId}/create-demands`, data),

  // Get order allocation summary
  getOrderAllocationSummary: (orderId) =>
    api.get(`/sales/orders/${orderId}/allocation-summary`),
};

// ===== PRODUCTION DEMANDS API =====

export const productionDemandAPI = {
  // List demands with filters
  listDemands: (params = {}) =>
    api.get('/production/demands', { params }),

  // Get demand details
  getDemandDetails: (demandId) =>
    api.get(`/production/demands/${demandId}`),

  // Link to production order
  linkToProductionOrder: (demandId, data) =>
    api.put(`/production/demands/${demandId}/link`, data),

  // Update demand status
  updateDemandStatus: (demandId, data) =>
    api.put(`/production/demands/${demandId}/status`, data),

  // Get fulfillment summary
  getFulfillmentSummary: (demandId) =>
    api.get(`/production/demands/${demandId}/fulfillment-summary`),
};

// ===== SALES INVOICES API =====

export const salesInvoiceAPI = {
  // Create invoice
  createInvoice: (data) =>
    api.post('/sales/invoices', data),

  // List invoices with filters
  listInvoices: (params = {}) =>
    api.get('/sales/invoices', { params }),

  // Get invoice details
  getInvoiceDetails: (invoiceId) =>
    api.get(`/sales/invoices/${invoiceId}`),

  // Add line items
  addLineItems: (invoiceId, data) =>
    api.post(`/sales/invoices/${invoiceId}/line-items`, data),

  // Update charges (shipping, discount)
  updateCharges: (invoiceId, data) =>
    api.put(`/sales/invoices/${invoiceId}/charges`, data),

  // Post invoice to GL
  postInvoiceToGL: (invoiceId, data) =>
    api.put(`/sales/invoices/${invoiceId}/post`, data),

  // Cancel invoice
  cancelInvoice: (invoiceId) =>
    api.put(`/sales/invoices/${invoiceId}/cancel`, {}),

  // Get revenue summary
  getRevenueSummary: (params = {}) =>
    api.get('/sales/invoices/summary/revenue', { params }),
};

// ===== GL POSTINGS API =====

export const glPostingAPI = {
  // Post production output
  postProductionOutput: (outputId) =>
    api.post(`/gl/post/production-output/${outputId}`, {}),

  // Post sales invoice
  postSalesInvoice: (invoiceId) =>
    api.post(`/gl/post/invoice/${invoiceId}`, {}),

  // Post payment
  postPayment: (paymentId) =>
    api.post(`/gl/post/payment/${paymentId}`, {}),

  // List GL entries with filters
  listEntries: (params = {}) =>
    api.get('/gl/entries', { params }),

  // Get account balance
  getAccountBalance: (accountCode) =>
    api.get(`/gl/accounts/${accountCode}/balance`),

  // Get trial balance
  getTrialBalance: () =>
    api.get('/gl/trial-balance'),

  // Reverse GL entry
  reverseEntry: (entryId) =>
    api.put(`/gl/entries/${entryId}/reverse`, {}),
};

export default api;
