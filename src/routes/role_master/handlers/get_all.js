import { RoleMasters } from "../../../controllers";

export const GetAll = (
  { start, length, "search[value]": search },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Creating User
      let role_master = await RoleMasters.GetAll({ start, length, search });

      if (!role_master) {
        return reject({
          message: "No roles found!",
        });
      }

      resolve({
        data: role_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
