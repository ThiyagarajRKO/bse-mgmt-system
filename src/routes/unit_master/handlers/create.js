import {
  UnitMaster,
  LocationMaster,
  CompanyMaster,
} from "../../../controllers";

export const Create = async (
  { profile_id, unit_name, unit_type, location_master_id, company_id },
  session,
  fastify
) => {
  try {
    // 1️⃣ Choose company_id from request OR session
    const final_company_id = company_id || session?.company_id;

    if (!final_company_id) {
      throw {
        statusCode: 420,
        message: "Company ID must not be empty!",
      };
    }

    // 2️⃣ Validate location exists
    const location_count = await LocationMaster.Count({
      id: location_master_id,
    });

    if (location_count === 0) {
      throw {
        statusCode: 420,
        message: "Invalid location master id!",
      };
    }

    // 3️⃣ Validate company exists
    const company_exists = await CompanyMaster.Count({
      id: final_company_id,
    });

    if (company_exists === 0) {
      throw {
        statusCode: 420,
        message: "Invalid company id!",
      };
    }

    // 4️⃣ Insert Unit
    const unit_master = await UnitMaster.Insert(profile_id, {
      unit_name,
      unit_type,
      location_master_id,
      company_id: final_company_id,
      is_active: true,
    });

    return {
      statusCode: 200,
      message: "Unit master has been inserted successfully",
      data: {
        unit_master_id: unit_master?.id,
      },
    };
  } catch (err) {
    fastify.log.error(err);
    throw err;
  }
};
