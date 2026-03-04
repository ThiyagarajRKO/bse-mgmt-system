import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const Get = async (params, session, fastify) => {
  try {
    const result = await ConsolidatedGstMaster.Get(params.id);
    return result;
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
