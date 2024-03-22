import { UserProfiles } from "../../../controllers";

export const GetProfileInfo = (
  { profile_id, current_profile_id, type },
  session
) => {
  return new Promise(async (resolve, reject) => {
    try {
      let user_result = await UserProfiles.Get({
        id: profile_id,
        current_profile_id,
      });

      if (!user_result) {
        return reject({ message: "User doesn't exists" });
      }

      resolve({ data: user_result });
    } catch (err) {
      reject(err);
    }
  });
};
