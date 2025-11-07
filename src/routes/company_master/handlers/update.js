import * as CompanyMaster from "../../../controllers/company_master";

export const Update = (
  { profile_id, company_master_id, company_master_data },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const updated_data = await CompanyMaster.Update(
        profile_id,
        company_master_id,
        company_master_data
      );

      if (updated_data?.[0] > 0) {
        return resolve({
          message: "company master has been updated successfully",
        });
      }

      resolve({
        statusCode: 420,
        message: "company master didn't update",
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
