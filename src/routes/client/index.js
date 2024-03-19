"use strict";

import usersRoute from "./users";
import profileRoutes from "./profile";

// Auth Middleware
import { ValidateUser } from "../../middlewares/authentication";

//Public Routes
export const PublicRouters = (fastify, opts, done) => {
  fastify.register(usersRoute, { prefix: "/auth" });
  done();
};

//Protected Routes
export const PrivateRouters = (fastify, opts, done) => {
  // Validating session
  fastify.addHook("onRequest", ValidateUser);

  fastify.register(assetsRoutes, { prefix: "/assets" });
  fastify.register(profileRoutes, { prefix: "/profile" });
  done();
};
