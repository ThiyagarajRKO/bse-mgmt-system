import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const Update = async (params, session, fastify) => {
  try {
    const gst_master_data = params.consolidated_gst_master_data || params;
    const result = await ConsolidatedGstMaster.Update(
      params.profile_id,
      params.id,
      gst_master_data
    );
    return result;
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
