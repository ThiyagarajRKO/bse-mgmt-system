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
import roleMasterRoute from "./role_master";
import companyMasterRoute from "./company_master";
import divisionMasterRoute from "./division_master";
import locationMasterRoute from "./location_master";
import unitMasterRoute from "./unit_master";
import supplierMasterRoute from "./supplier_master";
import packagingMasterRoute from "./packaging_master";
import inventoryMasterRoute from "./inventory_master";
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
import { chartOfAccountsRoute } from "./master/chart_of_accounts";
import consolidatedGstMasterRoute from "./consolidated_gst_master";
import { ledgerMasterRoute } from "./master/ledger_master";
import { taxCodeMasterRoute } from "./master/tax_code_master";
import { productGstMappingRoute } from "./master/product_gst_mapping";

// Auth Middleware
import { ValidateUser } from "../middlewares/authentication";

// Controllers
import { AuditLogs, ModuleMasters } from "../controllers";

//Public Routes
export const PublicRouters = (fastify, opts, done) => {
  fastify.register(usersRoute, { prefix: "/auth" });

  fastify.register(roleMasterRoute, { prefix: "/roles" });

  // Temporary debug route (unprotected) for testing unit payloads
  try {
    const debugUnitRoute = require("./debug_unit").default;
    fastify.register(debugUnitRoute, { prefix: "/debug" });
  } catch (err) {
    // ignore if not present
  }

  done();
};

//Protected Routes
export const PrivateRouters = (fastify, opts, done) => {
  // Validating session
  fastify.addHook("onRequest", ValidateUser);

  fastify.addHook("onRequest", async (req, res) => {
    try {
      let module_master_ids = {};
      const module_master = await ModuleMasters.GetAll({});

      module_master?.rows?.forEach((module) => {
        module_master_ids[
          module?.module_name?.replace(" ", "_")?.toLowerCase()
        ] = module?.id;
      });

      const url_path = req.url?.replace("/api/v1/", "");
      const module_name = url_path.split("/")[0];
      const module_master_id =
        module_master_ids[
          module_name == "master" ? "master_data" : module_name
        ];

      if (!module_master_id) {
        return;
      }

      AuditLogs.Insert(req.token_profile_id, {
        module_master_id,
        action_name: req.method,
        request_params: req?.query || req.body,
        source_ip_address: req.socket.remoteAddress,
        user_agent: req.headers["user-agent"],
        platform: req.headers["sec-ch-ua-platform"]?.replaceAll('"', ""),
      }).catch((err) => {
        fastify.log.error(err);
      });
    } catch (err) {
      fastify.log.error(err);
    }
  });

  fastify.register(profileRoutes, { prefix: "/profile" });

  fastify.register(companyMasterRoute, { prefix: "/master/company" });

  fastify.register(divisionMasterRoute, { prefix: "/master/division" });

  fastify.register(procurementLotsRoute, { prefix: "/procurement/lot" });

  fastify.register(procurementProductsRoute, {
    prefix: "/procurement/product",
  });

  fastify.register(purchasePaymentRoute, {
    prefix: "/purchase/payment",
  });

  fastify.register(dispatchRoute, { prefix: "/dispatch" });

  fastify.register(peelingRoute, { prefix: "/peeling" });

  fastify.register(peelingProductRoute, { prefix: "/peeling/product" });

  fastify.register(peeledDispatchRoute, { prefix: "/peeled/dispatch" });

  fastify.register(packingRoute, { prefix: "/packing" });

  fastify.register(ordersRoute, { prefix: "/order" });

  fastify.register(orderProductsRoute, { prefix: "/order/product" });

  fastify.register(salesPaymentRoute, {
    prefix: "/sales/payment",
  });

  fastify.register(locationMasterRoute, { prefix: "/master/location" });

  fastify.register(unitMasterRoute, { prefix: "/master/unit" });

  fastify.register(supplierMasterRoute, { prefix: "/master/supplier" });

  fastify.register(packagingMasterRoute, { prefix: "/master/packaging" });

  fastify.register(inventoryMasterRoute, { prefix: "/master/inventory" });

  fastify.register(speciesMasterRoute, { prefix: "/master/species" });

  fastify.register(gradeMasterRoute, { prefix: "/master/grade" });

  fastify.register(sizeMasterRoute, { prefix: "/master/size" });

  fastify.register(productCategoryMasterRoute, {
    prefix: "/master/product/category",
  });

  fastify.register(productMasterRoute, { prefix: "/master/product" });

  fastify.register(vehicleMasterRoute, { prefix: "/master/vehicle" });

  fastify.register(driverMasterRoute, { prefix: "/master/driver" });

  fastify.register(customerMasterRoute, { prefix: "/master/customer" });

  fastify.register(carrierMasterRoute, { prefix: "/master/carrier" });

  fastify.register(priceListMasterRoute, { prefix: "/master/pricelist" });

  fastify.register(priceListProductMasterRoute, {
    prefix: "/master/pricelist/product",
  });
  fastify.register(shippingMasterRoute, { prefix: "/master/shipping" });

  fastify.register(auditLogsRoute, { prefix: "/logs" });

  fastify.register(purchaseInventoryRoute, { prefix: "/inventory/purchase" });

  fastify.register(salesInventoryRoute, { prefix: "/inventory/sales" });

  // Accounting Master Data Routes
  fastify.register(chartOfAccountsRoute, {
    prefix: "/master/chart-of-accounts",
  });
  fastify.register(consolidatedGstMasterRoute, {
    prefix: "/master/consolidated-gst-master",
  });
  fastify.register(ledgerMasterRoute, { prefix: "/master/ledger-master" });
  fastify.register(taxCodeMasterRoute, { prefix: "/master/tax-code-master" });
  fastify.register(productGstMappingRoute, {
    prefix: "/master/product-gst-mapping",
  });

  done();
};
