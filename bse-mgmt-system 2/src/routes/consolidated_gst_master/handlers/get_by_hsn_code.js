import * as ConsolidatedGstMaster from "../../../controllers/consolidated_gst_master";

export const GetByHsnCode = async (params, session, fastify) => {
  try {
    const result = await ConsolidatedGstMaster.GetByHsnCode(params.hsn_code);

    return {
      success: true,
      message: "GST rate retrieved successfully",
      data: result,
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
