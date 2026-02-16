// routes/derivative_gst_mapping/handlers/create.js
import models from "../../../models";

export const Create = async (
  {
    profile_id,
    species_master_id,
    derivative_master_id,
    processing_state,
    gst_master_id,
    hsn_code_override,
    effective_from,
    effective_to,
  },
  session,
  fastify,
) => {
  try {
    // Validate required fields
    if (!species_master_id) {
      throw { statusCode: 400, message: "species_master_id is required" };
    }
    if (!processing_state) {
      throw {
        statusCode: 400,
        message: "processing_state is required (RAW or PROCESSED)",
      };
    }
    if (!gst_master_id) {
      throw { statusCode: 400, message: "gst_master_id is required" };
    }

    // Validate species exists
    const species = await models.SpeciesMaster.findByPk(species_master_id);
    if (!species) {
      throw { statusCode: 404, message: "Species not found" };
    }

    // Validate derivative exists (if provided)
    if (derivative_master_id) {
      const derivative =
        await models.DerivativeMaster.findByPk(derivative_master_id);
      if (!derivative) {
        throw { statusCode: 404, message: "Derivative not found" };
      }
    }

    // Validate GST master exists
    const gstMaster =
      await models.ConsolidatedGstMaster.findByPk(gst_master_id);
    if (!gstMaster) {
      throw { statusCode: 404, message: "GST master not found" };
    }

    // Check for duplicate mapping
    const existing = await models.DerivativeGstMapping.findOne({
      where: {
        species_master_id,
        derivative_master_id: derivative_master_id || null,
        processing_state,
        is_active: true,
      },
      paranoid: false,
    });

    if (existing) {
      throw {
        statusCode: 409,
        message: `Mapping already exists for this species-derivative-state combination`,
      };
    }

    // Create the mapping
    const mapping = await models.DerivativeGstMapping.create(
      {
        species_master_id,
        derivative_master_id: derivative_master_id || null,
        processing_state,
        gst_master_id,
        hsn_code_override: hsn_code_override || null,
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        is_active: true,
      },
      { profile_id },
    );

    return {
      statusCode: 201,
      message: "Derivative GST mapping created successfully",
      data: {
        id: mapping.id,
        species_master_id: mapping.species_master_id,
        derivative_master_id: mapping.derivative_master_id,
        processing_state: mapping.processing_state,
        gst_master_id: mapping.gst_master_id,
      },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
