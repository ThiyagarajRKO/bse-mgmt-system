"use strict";

import usersRoute from "./users";
import profileRoutes from "./profile";
import roleMasterRoute from "./role_master";
import unitMasterRoute from "./unit_master";
import locationMasterRoute from "./location_master";
import vendorMasterRoute from "./vendor_master";
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

  fastify.register(unitMasterRoute, { prefix: "/master/unit" });

  fastify.register(locationMasterRoute, { prefix: "/master/location" });

  fastify.register(vendorMasterRoute, { prefix: "/master/vendor" });

  fastify.register(vehicleMasterRoute, { prefix: "/master/vehicle" });

  fastify.register(driverMasterRoute, { prefix: "/master/driver" });

  done();
};
