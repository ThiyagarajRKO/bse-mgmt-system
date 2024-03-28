"use strict";

import usersRoute from "./users";
import profileRoutes from "./profile";
import roleMasterRoute from "./role_master";
import divisionMasterRoute from "./division_master";
import locationMasterRoute from "./location_master";
import unitMasterRoute from "./unit_master";
import vendorMasterRoute from "./vendor_master";
import packagingMasterRoute from "./packaging_master";
import inventoryMasterRoute from "./inventory_master";
import speciesMasterRoute from "./species_master";
import gradeMasterRoute from "./grade_master";
import sizeMasterRoute from "./size_master";
import productCategoryMasterRoute from "./product_category_master";
import productMasterRoute from "./product_master";
import vehicleMasterRoute from "./vehicle_master";
import driverMasterRoute from "./driver_master";

// Auth Middleware
import { ValidateUser } from "../middlewares/authentication";

//Public Routes
export const PublicRouters = (fastify, opts, done) => {
  fastify.register(usersRoute, { prefix: "/auth" });

  fastify.register(roleMasterRoute, { prefix: "/roles" });

  done();
};

//Protected Routes
export const PrivateRouters = (fastify, opts, done) => {
  // Validating session
  fastify.addHook("onRequest", ValidateUser);

  fastify.register(profileRoutes, { prefix: "/profile" });

  fastify.register(divisionMasterRoute, { prefix: "/master/division" });

  fastify.register(locationMasterRoute, { prefix: "/master/location" });

  fastify.register(unitMasterRoute, { prefix: "/master/unit" });

  fastify.register(vendorMasterRoute, { prefix: "/master/vendor" });

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

  done();
};
