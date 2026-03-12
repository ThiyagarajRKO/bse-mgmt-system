import { GlAccountMaster } from "../../../controllers";

export const GetAll = (params, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await GlAccountMaster.GetAll(params);

      resolve({
        message: "GL accounts retrieved successfully",
        data: result.data,
        recordsTotal: result.recordsTotal,
        recordsFiltered: result.recordsFiltered,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
