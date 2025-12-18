import { Op } from "sequelize";
const models = require("../../models");
const { UnitMaster, CompanyMaster, LocationMaster } = models;

/**
 * INSERT UNIT
 */
export const Insert = async (profile_id, data) => {
  if (!profile_id) throw { statusCode: 420, message: "User ID required!" };
  if (!data || typeof data !== "object")
    throw { statusCode: 420, message: "Unit data required!" };

  if (!data.unit_name)
    throw { statusCode: 420, message: "Unit name required!" };
  if (!data.unit_type)
    throw { statusCode: 420, message: "Unit type required!" };
  if (!data.location_master_id)
    throw { statusCode: 420, message: "Location ID required!" };
  if (!data.company_id)
    throw { statusCode: 420, message: "Company ID required!" };

  return await UnitMaster.create({ ...data }, { profile_id });
};

/**
 * UPDATE UNIT
 */
export const Update = async (profile_id, id, data) => {
  if (!id) throw { statusCode: 420, message: "Unit ID required!" };
  if (!profile_id) throw { statusCode: 420, message: "User ID required!" };
  if (!data || typeof data !== "object")
    throw { statusCode: 420, message: "Unit data required!" };
  if (!data.company_id)
    throw { statusCode: 420, message: "Company ID required!" };

  return await UnitMaster.update(
    { ...data },
    {
      where: { id, is_active: true },
      individualHooks: true,
      profile_id,
    }
  );
};

/**
 * GET ONE
 */
export const Get = async ({ id }) => {
  if (!id) throw { statusCode: 420, message: "Unit ID required!" };

  return await UnitMaster.findOne({
    where: { id, is_active: true },
    include: [
      {
        model: CompanyMaster,
        as: "company",
        attributes: ["id", "company_name"],
      },
      { model: LocationMaster, attributes: ["id", "location_name"] },
    ],
  });
};

/**
 * GET ALL (DATATABLE)
 */
export const GetAll = async ({
  unit_code,
  unit_name,
  unit_type,
  location_master_name,
  company_id,
  start = 0,
  length = 10,
  search,
}) => {
  try {
    let where = { is_active: true };
    let locationWhere = { is_active: true };

    if (unit_code) where.unit_code = { [Op.iLike]: `%${unit_code}%` };
    if (unit_name) where.unit_name = { [Op.iLike]: `%${unit_name}%` };
    if (unit_type) where.unit_type = unit_type;

    // ADD company filter
    if (company_id) where.company_id = company_id;

    if (location_master_name)
      locationWhere.location_name = { [Op.iLike]: `%${location_master_name}%` };

    if (search) {
      where[Op.or] = [
        { unit_code: { [Op.iLike]: `%${search}%` } },
        { unit_name: { [Op.iLike]: `%${search}%` } },
        { "$LocationMaster.location_name$": { [Op.iLike]: `%${search}%` } },
      ];
    }

    const result = await UnitMaster.findAndCountAll({
      where,
      include: [
        {
          model: CompanyMaster,
          as: "company",
          attributes: ["id", "company_name"],
          required: false,
        },
        {
          model: LocationMaster,
          attributes: ["id", "location_name"],
          required: false,
        },
      ],
      offset: Number(start),
      limit: Number(length),
      order: [["updated_at", "DESC"]],
    });

    return result;
  } catch (err) {
    throw err;
  }
};

/**
 * DELETE
 */
export const Delete = async ({ profile_id, id }) => {
  if (!id) throw { statusCode: 420, message: "Unit ID required!" };
  if (!profile_id) throw { statusCode: 420, message: "User ID required!" };

  return await UnitMaster.destroy({
    where: { id, is_active: true, created_by: profile_id },
    individualHooks: true,
    profile_id,
  });
};

/**
 * GET DISPATCH DESTINATIONS (Peeling Centers for a Procurement Lot)
 */
export const GetDispatches = async ({
  procurement_lot_id,
  start = 0,
  length = 100,
}) => {
  try {
    if (!procurement_lot_id) {
      throw { statusCode: 420, message: "Procurement lot ID required!" };
    }

    // Get all active peeling centers (unit_type = 'Peeling Center')
    const result = await UnitMaster.findAndCountAll({
      where: {
        is_active: true,
        unit_type: "Peeling Center",
      },
      attributes: ["id", "unit_name", "unit_code", "unit_type"],
      include: [
        {
          model: LocationMaster,
          attributes: ["id", "location_name"],
          required: false,
        },
        {
          model: CompanyMaster,
          as: "company",
          attributes: ["id", "company_name"],
          required: false,
        },
      ],
      offset: Number(start),
      limit: Number(length),
      order: [["unit_name", "ASC"]],
    });

    return result;
  } catch (err) {
    throw err;
  }
};
