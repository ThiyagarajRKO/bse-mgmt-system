import { RoleMasters } from "../../../controllers";

export const GetAll = ({ identity, password, role_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let role_masters = await RoleMasters.GetAll();

      if (!role_masters) {
        return reject({
          message: "No roles found!",
        });
      }

      resolve({
        data: role_masters,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
