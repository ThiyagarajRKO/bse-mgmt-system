import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const Create = async (params, session, fastify) => {
  try {
    const result = await ConsolidatedGstMaster.Insert(
      params.profile_id,
      params
    );
    return result;
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
