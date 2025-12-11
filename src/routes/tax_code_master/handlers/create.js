import { TaxCodeMaster } from "../../../controllers";

export const Create = (
  { profile_id, tax_code, tax_code_name, gst_rate_id, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const taxCode = await TaxCodeMaster.Insert(profile_id, {
        tax_code,
        tax_code_name,
        gst_rate_id,
        description,
        is_active: true,
      });

      resolve({
        message: "Tax code has been created successfully",
        data: {
          tax_code_id: taxCode?.tax_code_id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
