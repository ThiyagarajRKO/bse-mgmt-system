"use strict";

import usersRoute from "./users";
import profileRoutes from "./profile";
import procurementLotsRoute from "./procurement_lots";
import procurementProductsRoute from "./procurement_products";
import dispatchRoute from "./dispatches";
import peelingRoute from "./peeling";
import peelingProductRoute from "./peeling_products";
import peeledDispatchRoute from "./peeled_dispatches";
import packingRoute from "./packing";
import packingRulesRoute from "./packing_rules";
import roleMasterRoute from "./role_master";
import companyMasterRoute from "./company_master";
import divisionMasterRoute from "./division_master";
import locationMasterRoute from "./location_master";
import unitMasterRoute from "./unit_master";
import supplierMasterRoute from "./supplier_master";
import packagingMasterRoute from "./packaging_master";
import inventoryMasterRoute from "./inventory_master";
import inventoryRoute from "./inventory";
import speciesMasterRoute from "./species_master";
import gradeMasterRoute from "./grade_master";
import sizeMasterRoute from "./size_master";
import productCategoryMasterRoute from "./product_category_master";
import productMasterRoute from "./product_master";
import vehicleMasterRoute from "./vehicle_master";
import driverMasterRoute from "./driver_master";
import customerMasterRoute from "./customer_master";
import carrierMasterRoute from "./carrier_master";
import priceListMasterRoute from "./price_list_master";
import priceListProductMasterRoute from "./price_list_product_master";
import shippingMasterRoute from "./shipping_master";
import auditLogsRoute from "./audit_logs";
import ordersRoute from "./orders";
import orderProductsRoute from "./order_products";
import purchasePaymentRoute from "./purchase_payments";
import salesPaymentRoute from "./sales_payments";
import purchaseInventoryRoute from "./purchase_inventory";
import salesInventoryRoute from "./sales_inventory";

// Master Data Routes
import { ChartOfAccountsRoute } from "./chart_of_accounts";
import { GlAccountMasterRoute } from "./gl_account_master";
import consolidatedGstMasterRoute from "./consolidated_gst_master";
import { LedgerMasterRoute } from "./ledger_master";
import { TaxCodeMasterRoute } from "./tax_code_master";
import { ProductGstMappingRoute } from "./product_gst_mapping";
import { authRoutes } from "./auth";
import { documentFlowRoutes } from "./document-flow";

// Accounting Routes
import { AccountingRoute } from "./accounting";
import { yieldTrackingRoutes } from "./yield-tracking";
import { marginVarianceRoutes } from "./margin-variance";
import pricingRoutes from "./pricing";
import profitabilityRoutes from "./profitability";
import priceRecommendationRoutes from "./price-recommendations";

// Sales Order Workflow Routes (NEW)
import salesOrderWorkflowRoute from "./sales-order-workflow";
import allocationRoute from "./allocation";
import productionRoute from "./production";
import qaRoute from "./qa";
import traceabilityRoute from "./traceability";
import taxEngineRoute from "./tax-engine";
import postingRoute from "./posting";
import salesAllocationRoute from "./sales_allocations";
import salesInvoiceRoute from "./sales_invoices";
import glPostingRoute from "./gl_postings";
import purchaseRequestsRoute from "./purchase-requests";

// Auth Middleware
import { ValidateUser } from "../middlewares/authentication";

// Controllers
import { AuditLogs, ModuleMasters } from "../controllers";

//Public Routes
export const PublicRouters = (fastify, opts, done) => {
  fastify.register(usersRoute, { prefix: "/auth" });

  fastify.register(authRoutes, { prefix: "/v1/auth" });

  fastify.register(roleMasterRoute, { prefix: "/roles" });

  // Temporary debug route (unprotected) for testing unit payloads
  try {
    const debugUnitRoute = require("./debug_unit").default;
    fastify.register(debugUnitRoute, { prefix: "/debug" });
  } catch (err) {
    // ignore if not present
  }

  // Backwards-compatible aliases for legacy AJAX calls that still hit
  // /api/products or /api/suppliers. These were causing 404s in the console
  // when various procurement pages tried to load dropdowns. The real
  // endpoints today live under /api/master/product and /api/master/supplier
  // so we provide lightweight wrappers here to avoid noise.
  fastify.get("/products", async (req, reply) => {
    try {
      // use models directly to avoid potential decoration timing issues
      const models = require("../../models").default || require("../../models");
      const products = await models.ProductMaster.findAll({
        attributes: ["id", "product_name"],
        where: { is_active: true },
      });
      return reply.send({ success: true, data: products });
    } catch (err) {
      fastify.log.error("Error in legacy /products route:", err);
      return reply
        .code(500)
        .send({ success: false, message: "Unable to fetch products" });
    }
  });

  fastify.get("/suppliers", async (req, reply) => {
    try {
      const models = require("../../models").default || require("../../models");
      const suppliers = await models.SupplierMaster.findAll({
        attributes: ["id", "supplier_name"],
        where: { is_active: true },
      });
      return reply.send({ success: true, data: suppliers });
    } catch (err) {
      fastify.log.error("Error in legacy /suppliers route:", err);
      return reply
        .code(500)
        .send({ success: false, message: "Unable to fetch suppliers" });
    }
  });

  // DROPDOWN ENDPOINTS MOVED TO src/index.js - registered at top level for proper route matching priority

  done();
};

//Protected Routes
export const PrivateRouters = (fastify, opts, done) => {
  // Validating session
  fastify.addHook("onRequest", ValidateUser);

  // Price Recommendation Engine Routes
  fastify.register(priceRecommendationRoutes, {
    prefix: "/price-recommendations",
  });

  // Procurement Routes
  fastify.register(procurementLotsRoute, {
    prefix: "/procurement/lot",
  });

  fastify.register(procurementProductsRoute, {
    prefix: "/procurement/product",
  });

  // Purchase Request Routes
  fastify.register(purchaseRequestsRoute, {
    prefix: "/purchase-requests",
  });

  // Inventory Routes
  fastify.register(inventoryRoute, {
    prefix: "/inventory",
  });

  // Master Data Routes
  fastify.register(companyMasterRoute, {
    prefix: "/master/company",
  });

  fastify.register(divisionMasterRoute, {
    prefix: "/master/division",
  });

  fastify.register(locationMasterRoute, {
    prefix: "/master/location",
  });

  fastify.register(speciesMasterRoute, {
    prefix: "/master/species",
  });

  fastify.register(sizeMasterRoute, {
    prefix: "/master/size",
  });

  fastify.register(gradeMasterRoute, {
    prefix: "/master/grade",
  });

  fastify.register(productCategoryMasterRoute, {
    prefix: "/master/product-category",
  });

  fastify.register(vehicleMasterRoute, {
    prefix: "/master/vehicle",
  });

  fastify.register(driverMasterRoute, {
    prefix: "/master/driver",
  });

  fastify.register(unitMasterRoute, {
    prefix: "/master/unit",
  });

  fastify.register(customerMasterRoute, {
    prefix: "/master/customer",
  });

  fastify.register(shippingMasterRoute, {
    prefix: "/master/shipping",
  });

  fastify.register(supplierMasterRoute, {
    prefix: "/master/supplier",
  });

  fastify.register(carrierMasterRoute, {
    prefix: "/master/carrier",
  });

  fastify.register(packagingMasterRoute, {
    prefix: "/master/packaging",
  });

  fastify.register(priceListMasterRoute, {
    prefix: "/master/price-list",
  });

  fastify.register(priceListProductMasterRoute, {
    prefix: "/master/price-list-product",
  });

  fastify.register(productMasterRoute, {
    prefix: "/master/product",
  });

  fastify.register(consolidatedGstMasterRoute, {
    prefix: "/master/consolidated-gst-master",
  });

  fastify.register(GlAccountMasterRoute, {
    prefix: "/master/gl-account",
  });

  fastify.register(ChartOfAccountsRoute, {
    prefix: "/master/chart-of-accounts",
  });

  fastify.register(AccountingRoute, {
    prefix: "/api/accounting",
  });

  // Note: accounting dashboard route is handled in src/index.js via fastify.get("/accounting")
  // fastify.register(accountingDashboardRoutes);

  fastify.register(LedgerMasterRoute, {
    prefix: "/master/ledger",
  });

  fastify.register(TaxCodeMasterRoute, {
    prefix: "/master/tax-code",
  });

  // Alias for backward compatibility
  fastify.register(TaxCodeMasterRoute, {
    prefix: "/master/tax-code-master",
  });

  fastify.register(ProductGstMappingRoute, {
    prefix: "/master/product-gst-mapping",
  });

  // Orders Routes
  fastify.register(ordersRoute, {
    prefix: "/orders",
  });

  // Order Products Routes
  fastify.register(orderProductsRoute, {
    prefix: "/order/product",
  });

  // Purchase Payment Routes
  fastify.register(purchasePaymentRoute, {
    prefix: "/purchase/payment",
  });

  // Sales Payment Routes
  fastify.register(salesPaymentRoute, {
    prefix: "/sales/payment",
  });

  // Dispatch Routes
  fastify.register(dispatchRoute, {
    prefix: "/dispatch",
  });

  // Peeling Routes
  fastify.register(peelingRoute, {
    prefix: "/peeling",
  });

  // Peeling Products Routes
  fastify.register(peelingProductRoute, {
    prefix: "/peeling/product",
  });

  // Peeled Dispatch Routes
  fastify.register(peeledDispatchRoute, {
    prefix: "/peeled_dispatches",
  });

  // Packing Routes
  fastify.register(packingRoute, {
    prefix: "/packing",
  });

  // Packing Rules Routes
  fastify.register(packingRulesRoute, {
    prefix: "/packing-rules",
  });

  // Additional Master Routes
  fastify.register(pricingRoutes, {
    prefix: "/pricing",
  });

  fastify.register(profitabilityRoutes, {
    prefix: "/profitability",
  });

  fastify.register(documentFlowRoutes, {
    prefix: "/document-flow",
  });

  fastify.register(yieldTrackingRoutes, {
    prefix: "/yield-tracking",
  });

  fastify.register(marginVarianceRoutes, {
    prefix: "/margin-variance",
  });

  // Sales Order Workflow Routes (NEW)
  fastify.register(salesOrderWorkflowRoute, {
    prefix: "/sales-orders",
  });

  fastify.register(allocationRoute, {
    prefix: "/allocation",
  });

  fastify.register(productionRoute, {
    prefix: "/production",
  });

  fastify.register(qaRoute, {
    prefix: "/qa",
  });

  fastify.register(traceabilityRoute, {
    prefix: "/traceability",
  });

  fastify.register(taxEngineRoute, {
    prefix: "/tax-engine",
  });

  fastify.register(postingRoute, {
    prefix: "/posting",
  });

  fastify.register(salesAllocationRoute, {
    prefix: "/",
  });

  fastify.register(salesInvoiceRoute, {
    prefix: "/",
  });

  fastify.register(glPostingRoute, {
    prefix: "/",
  });

  // Add a simple test route to check if server can handle routes
  fastify.get("/test", async (req, reply) => {
    return reply.code(200).send({
      success: true,
      message: "Test route works",
      data: { procurement_purchaser: "System Admin" },
    });
  });

  done();
};
