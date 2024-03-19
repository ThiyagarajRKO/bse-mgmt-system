import { Users, UserProfiles } from "../../../../controllers";

export const ReActivateUser = ({ profile_id }) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!profile_id) {
        return reject({ message: "Client User Id must not be empty" });
      }

      let user_data = await UserProfiles.Get({
        id: profile_id,
        userType: "Admin",
      });

      if (!user_data?.id) {
        return reject({ message: "Invalid User!" });
      }

      if (user_data?.dataValues?.User?.dataValues?.user_status == "1") {
        return reject({ message: "Account is already in active state" });
      }

      let deleted_status = await Users.Update(
        user_data?.dataValues?.User?.dataValues?.id,
        {
          user_status: "1",
          user_reactivated_at: new Date(),
        }
      );

      if (deleted_status?.[0] > 0) {
        resolve({
          message: "This account has been reactivated successfully",
        });
      } else {
        reject({
          message: `Account isn't reactivated. Please check the user id`,
        });
      }
    } catch (err) {
      reject(err);
    }
  });
};
