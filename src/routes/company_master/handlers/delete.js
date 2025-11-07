import * as CompanyMaster from "../../../controllers/company_master";

export const Delete = ({ profile_id, company_master_id }, session, fastify) => {
  return new Promise(async (resolve, reject) => {
    try {
      const company_master = await CompanyMaster.Delete({
        profile_id,
        id: company_master_id,
      });

      if (company_master > 0) {
        return resolve({
          message: "company master has been deleted successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "company master didn't delete",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
