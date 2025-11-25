import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const List = async (params, session, fastify) => {
  try {
    const result = await ConsolidatedGstMaster.GetAll({
      ...params,
      length: 1000,
    }); // Large limit for dropdown
    return { data: result.rows };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
