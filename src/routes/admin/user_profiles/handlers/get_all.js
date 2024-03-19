import { UserProfiles } from "../../../../controllers";

export const getAllProfiles = ({
  profile_id,
  search_key,
  start = 0,
  length = 5,
}) => {
  return new Promise(async (resolve, reject) => {
    try {
      let data = await UserProfiles.GetAll({
        type: "admin",
        profile_id,
        search: search_key,
        offset: start * length,
        limit: length,
      });

      resolve({ data: data });
    } catch (err) {
      reject(err);
    }
  });
};
