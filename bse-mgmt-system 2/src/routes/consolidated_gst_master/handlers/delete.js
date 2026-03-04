import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const Delete = async (params, session, fastify) => {
  try {
    const result = await ConsolidatedGstMaster.Delete(
      params.profile_id,
      params.id
    );
    return result;
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
