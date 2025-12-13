import { Op } from "sequelize";
import models from "../../models";

/**
 * CREATE GL ACCOUNT
 */
export const Insert = async (profile_id, gl_account_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!gl_account_data)
    throw {
      statusCode: 420,
      message: "gl account data must not be empty!",
    };

  if (!gl_account_data?.account_code)
    throw { statusCode: 420, message: "account code must not be empty!" };

  if (!gl_account_data?.account_name)
    throw { statusCode: 420, message: "account name must not be empty!" };

  if (!gl_account_data?.account_type)
    throw { statusCode: 420, message: "account type must not be empty!" };

  try {
    const company_id = gl_account_data.company_id || null;

    // Check unique account_code
    const existing = await models.GlAccountMaster.findOne({
      where: {
        account_code: gl_account_data.account_code,
        is_active: true,
      },
    });
    if (existing)
      throw {
        statusCode: 420,
        message: "account code already exists",
      };

    // Validate parent_account_code exists if provided
    if (gl_account_data.parent_account_code) {
      const parent = await models.GlAccountMaster.findOne({
        where: {
          account_code: gl_account_data.parent_account_code,
          is_active: true,
        },
      });
      if (!parent)
        throw {
          statusCode: 420,
          message: "parent account code does not exist",
        };
    }

    return await models.GlAccountMaster.create({
      ...gl_account_data,
      company_id,
      created_by: profile_id,
    });
  } catch (err) {
    if (err?.name === "SequelizeUniqueConstraintError") {
      throw { statusCode: 420, message: "account code already exists!" };
    }
    throw err;
  }
};

/**
 * UPDATE GL ACCOUNT
 */
export const Update = async (profile_id, id, gl_account_data) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!id) throw { statusCode: 420, message: "id must not be empty!" };

  if (!gl_account_data)
    throw {
      statusCode: 420,
      message: "gl account data must not be empty!",
    };

  try {
    const glAccount = await models.GlAccountMaster.findByPk(id);
    if (!glAccount)
      throw { statusCode: 404, message: "GL Account not found" };

    // Check unique account_code (excluding current record)
    if (gl_account_data.account_code) {
      const existing = await models.GlAccountMaster.findOne({
        where: {
          account_code: gl_account_data.account_code,
          id: { [Op.ne]: id },
          is_active: true,
        },
      });
      if (existing)
        throw {
          statusCode: 420,
          message: "account code already exists",
        };
    }

    // Validate parent_account_code exists if provided
    if (gl_account_data.parent_account_code) {
      const parent = await models.GlAccountMaster.findOne({
        where: {
          account_code: gl_account_data.parent_account_code,
          is_active: true,
        },
      });
      if (!parent)
        throw {
          statusCode: 420,
          message: "parent account code does not exist",
        };
    }

    await glAccount.update({
      ...gl_account_data,
      updated_by: profile_id,
    });

    return glAccount;
  } catch (err) {
    throw err;
  }
};

/**
 * GET GL ACCOUNT BY ID
 */
export const Get = async (id) => {
  if (!id) throw { statusCode: 420, message: "id must not be empty!" };

  try {
    const glAccount = await models.GlAccountMaster.findByPk(id, {
      include: [
        {
          model: models.GlAccountMaster,
          as: "parent",
          attributes: ["account_code", "account_name"],
        },
        {
          model: models.CompanyMaster,
          as: "company",
          attributes: ["company_name"],
        },
      ],
    });

    if (!glAccount)
      throw { statusCode: 404, message: "GL Account not found" };

    return glAccount;
  } catch (err) {
    throw err;
  }
};

/**
 * GET ALL GL ACCOUNTS (DATATABLES)
 */
export const GetAll = async (query) => {
  try {
    const {
      draw = 1,
      start = 0,
      length = 10,
      search = {},
      order = [],
      columns = [],
    } = query;

    const whereClause = {
      is_active: true,
    };

    // Search functionality
    if (search?.value) {
      whereClause[Op.or] = [
        { account_code: { [Op.iLike]: `%${search.value}%` } },
        { account_name: { [Op.iLike]: `%${search.value}%` } },
        { account_type: { [Op.iLike]: `%${search.value}%` } },
        { account_group: { [Op.iLike]: `%${search.value}%` } },
      ];
    }

    // Ordering
    let orderClause = [["created_at", "DESC"]];
    if (order?.length > 0 && columns?.length > 0) {
      const orderCol = order[0];
      const columnIndex = orderCol.column;
      const column = columns[columnIndex];
      const dir = orderCol.dir || "asc";

      if (column?.data) {
        orderClause = [[column.data, dir]];
      }
    }

    const { count, rows } = await models.GlAccountMaster.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: models.GlAccountMaster,
          as: "parent",
          attributes: ["account_code", "account_name"],
          required: false,
        },
        {
          model: models.CompanyMaster,
          as: "company",
          attributes: ["company_name"],
          required: false,
        },
      ],
      order: orderClause,
      limit: parseInt(length),
      offset: parseInt(start),
      distinct: true,
    });

    return {
      draw: parseInt(draw),
      recordsTotal: count,
      recordsFiltered: count,
      data: rows,
    };
  } catch (err) {
    throw err;
  }
};

/**
 * DELETE GL ACCOUNT (SOFT DELETE)
 */
export const Delete = async (profile_id, id) => {
  if (!profile_id)
    throw { statusCode: 420, message: "user id must not be empty!" };

  if (!id) throw { statusCode: 420, message: "id must not be empty!" };

  try {
    const glAccount = await models.GlAccountMaster.findByPk(id);
    if (!glAccount)
      throw { statusCode: 404, message: "GL Account not found" };

    // Check if account has children
    const children = await models.GlAccountMaster.findAll({
      where: {
        parent_account_code: glAccount.account_code,
        is_active: true,
      },
    });

    if (children.length > 0)
      throw {
        statusCode: 420,
        message: "Cannot delete account with child accounts",
      };

    await glAccount.update({
      is_active: false,
      deleted_by: profile_id,
    });

    return { message: "GL Account deleted successfully" };
  } catch (err) {
    throw err;
  }
};