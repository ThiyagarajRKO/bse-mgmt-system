// routes/derivative_gst_mapping/handlers/get_by_species.js
import models from "../../../models";

export const GetBySpecies = async ({ species_master_id }, session, fastify) => {
  try {
    if (!species_master_id) {
      throw { statusCode: 400, message: "species_master_id is required" };
    }

    // Verify species exists
    const species = await models.SpeciesMaster.findByPk(species_master_id);
    if (!species) {
      throw { statusCode: 404, message: "Species not found" };
    }

    // Get all mappings for this species
    const mappings = await models.DerivativeGstMapping.findAll({
      where: {
        species_master_id,
        is_active: true,
      },
      include: [
        {
          model: models.DerivativeMaster,
          as: "derivative",
          attributes: ["id", "derivative_name"],
          required: false,
        },
        {
          model: models.ConsolidatedGstMaster,
          as: "gst_master",
          attributes: [
            "id",
            "hsn_code",
            "gst_name",
            "cgst_rate",
            "sgst_rate",
            "igst_rate",
          ],
        },
      ],
      order: [["processing_state", "ASC"]],
      paranoid: true,
    });

    return {
      statusCode: 200,
      message: "Mappings retrieved successfully",
      data: {
        species_name: species.species_name,
        species_id: species.id,
        mappings,
        count: mappings.length,
      },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
