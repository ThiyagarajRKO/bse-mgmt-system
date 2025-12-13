import { ProductGstMapping } from "../../../controllers";

export const Update = (
  {
    profile_id,
    id,
    product_id,
    tax_code_id,
    gst_master_id,
    supply_type,
    cgst_rate,
    sgst_rate,
    igst_rate,
    effective_from,
    effective_to,
    note,
  },
  session,
  fastify
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await ProductGstMapping.Update(profile_id, id, {
        product_id,
        tax_code_id,
        gst_master_id,
        supply_type,
        cgst_rate,
        sgst_rate,
        igst_rate,
        effective_from,
        effective_to,
        note,
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
