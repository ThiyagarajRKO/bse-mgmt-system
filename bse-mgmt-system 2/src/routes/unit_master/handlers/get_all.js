import { Op } from "sequelize";
import * as UnitMaster from "../../../controllers/unit_master";

// Return data in DataTables-friendly format so the route wrapper can pick result.data
export const GetAll = async (params = {}, session, fastify) => {
  try {
    const start = Number(params.start || params["start"] || 0) || 0;
    const length = Number(params.length || params["length"] || 10) || 10;
    const search = params.search || params["search[value]"] || "";

    const result = await UnitMaster.GetAll({
      start,
      length,
      unit_code: params.unit_code,
      unit_name: params.unit_name,
      unit_type: params.unit_type,
      company_id: params.company_id,
      search,
    });

    if (!result || typeof result.count !== "number") {
      throw new Error("Failed to fetch units from database");
    }

    // Normalize rows to plain objects to avoid serialization issues
    const rows = (result.rows || []).map((r) => {
      try {
        if (r && typeof r.toJSON === "function") return r.toJSON();
        return r;
      } catch (e) {
        return r;
      }
    });

    return {
      rows,
      count: result.count || 0,
    };
  } catch (err) {
    fastify &&
      fastify.log &&
      fastify.log &&
      fastify.log.error &&
      fastify.log.error(err);
    return {
      rows: [],
      count: 0,
      error: err.message,
    };
  }
};
