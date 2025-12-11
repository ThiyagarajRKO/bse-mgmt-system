import { TaxCodeMaster } from "../../../controllers";

export const Update = (
  { profile_id, id, tax_code, tax_code_name, gst_rate_id, description },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await TaxCodeMaster.Update(profile_id, id, {
        tax_code,
        tax_code_name,
        gst_rate_id,
        description,
      });

      resolve({
        message: result.message,
        data: {},
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
