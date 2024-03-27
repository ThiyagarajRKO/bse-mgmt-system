"use strict";

import usersRoute from "./users";
import profileRoutes from "./profile";
import roleMasterRoute from "./role_master";
import locationMasterRoute from "./location_master";
import unitMasterRoute from "./unit_master";
import vendorMasterRoute from "./vendor_master";
import PackagingMasterRoute from "./packaging_master";
import SpeciesMasterRoute from "./species_master";
import GradeMasterRoute from "./grade_master";
import vehicleMasterRoute from "./vehicle_master";
import driverMasterRoute from "./driver_master";
import SizeMasterRoute from "./size_master";

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

  fastify.register(locationMasterRoute, { prefix: "/master/location" });

  fastify.register(unitMasterRoute, { prefix: "/master/unit" });

  fastify.register(vendorMasterRoute, { prefix: "/master/vendor" });

  fastify.register(PackagingMasterRoute, { prefix: "/master/packaging" });

  fastify.register(SpeciesMasterRoute, { prefix: "/master/species" });

  fastify.register(GradeMasterRoute, { prefix: "/master/grade" });

  fastify.register(SizeMasterRoute, { prefix: "/master/size" });

  fastify.register(vehicleMasterRoute, { prefix: "/master/vehicle" });

  fastify.register(driverMasterRoute, { prefix: "/master/driver" });

  done();
};
