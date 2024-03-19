"use strict";

import usersRoute from "./users";
import userProfilesRoute from "./user_profiles";

import { ValidateAdmin } from "../../middlewares/authentication";

//Public Routes
export const AdminPublicRouters = (fastify, opts, done) => {
  fastify.register(usersRoute, { prefix: "/auth" });
  done();
};

//Protected Routes
export const AdminPrivateRouters = (fastify, opts, done) => {
  // Validating session
  fastify.addHook("onRequest", ValidateAdmin);
  fastify.register(userProfilesRoute, { prefix: "/profile" });

  done();
};
