import * as CompanyMaster from "../../../controllers/company_master";

export const Get = ({ company_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      let company_master = await CompanyMaster.Get({
        id: company_master_id,
      });

      if (!company_master) {
        return reject({
          statusCode: 420,
          message: "No data found!",
        });
      }

      resolve({
        data: company_master,
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
