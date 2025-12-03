import models from "../../../../models";
import categorySizeRulesLoader from "../../../utils/categorySizeRulesLoader";

/**
 * Get sizes appropriate for a specific species type
 *
 * @param {Object} params - Request parameters
 * @param {string} params.species_master_id - Species master ID to fetch parent_category_type
 * @param {Sequelize} params.sequelize - Database connection
 * @returns {Promise<Object>} Sizes appropriate for the species
 */
export const GetSizesBySpecies = async ({ species_master_id, sequelize }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!species_master_id) {
        return reject({
          statusCode: 420,
          message: "Species master ID must not be empty!",
        });
      }

      if (!sequelize) {
        return reject({
          statusCode: 500,
          message: "Database connection not available",
        });
      }

      // Fetch the species to get parent_category_type
      const species = await models.SpeciesMaster.findOne({
        where: {
          id: species_master_id,
          is_active: true,
        },
        attributes: ["id", "species_name", "parent_category_type"],
        raw: true,
      });

      if (!species) {
        return reject({
          statusCode: 404,
          message: "Species not found",
        });
      }

      console.log(
        `[GetSizesBySpecies] Fetching sizes for species: ${species.species_name} (${species.parent_category_type})`
      );

      // Get allowed sizes for this species type from species_size_mapping
      const allowedSizeUnits =
        await categorySizeRulesLoader.getSizesForSpeciesType(
          sequelize,
          species.parent_category_type
        );

      console.log(
        `[GetSizesBySpecies] Allowed units for ${species.parent_category_type}:`,
        allowedSizeUnits
      );

      if (!allowedSizeUnits || allowedSizeUnits.length === 0) {
        return reject({
          statusCode: 404,
          message: `No sizes configured for species type: ${species.parent_category_type}`,
        });
      }

      // Fetch sizes from size_master that match allowed units
      const sizes = await models.SizeMaster.findAll({
        where: {
          unit_of_measure: {
            [sequelize.Sequelize.Op.in]: allowedSizeUnits,
          },
          is_active: true,
        },
        attributes: ["id", "size", "unit_of_measure"],
        order: [
          ["unit_of_measure", "ASC"],
          ["size", "ASC"],
        ],
        raw: true,
      });

      console.log(
        `[GetSizesBySpecies] Retrieved ${sizes.length} sizes for species type: ${species.parent_category_type}`
      );

      // Format response
      const rows = sizes.map((size) => ({
        id: size.id,
        size: size.size,
        unit_of_measure: size.unit_of_measure,
      }));

      resolve({
        statusCode: 200,
        message: "Sizes fetched successfully",
        data: {
          rows,
          count: rows.length,
          species: {
            id: species.id,
            name: species.species_name,
            type: species.parent_category_type,
          },
        },
      });
    } catch (err) {
      console.error("[GetSizesBySpecies] Error:", err.message);
      reject(err);
    }
  });
};
