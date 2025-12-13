import { ProductGstMapping } from "../../../controllers";

export const Create = (
  {
    profile_id,
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
      const mapping = await ProductGstMapping.Insert(profile_id, {
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
        is_active: true,
      });

      resolve({
        message: "Product GST mapping has been created successfully",
        data: {
          mapping_id: mapping?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
