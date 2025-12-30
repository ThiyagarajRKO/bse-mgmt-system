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
// import { ProductGstMappingRoute } from "./product_gst_mapping";
import { authRoutes } from "./auth";
import { documentFlowRoutes } from "./document-flow";
import { yieldTrackingRoutes } from "./yield-tracking";
import { marginVarianceRoutes } from "./margin-variance";
import pricingRoutes from "./pricing";
import profitabilityRoutes from "./profitability";
import priceRecommendationRoutes from "./price-recommendations";

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

  // Inventory Routes
  fastify.register(inventoryRoute, {
    prefix: "/inventory",
  });

  // Master Data Routes
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

  // Orders Routes
  fastify.register(ordersRoute, {
    prefix: "/order",
  });

  // Order Products Routes
  fastify.register(orderProductsRoute, {
    prefix: "/order/product",
  });

  // Packing Routes
  fastify.register(packingRoute, {
    prefix: "/packing",
  });

  // Packing Rules Routes
  fastify.register(packingRulesRoute, {
    prefix: "/packing-rules",
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
