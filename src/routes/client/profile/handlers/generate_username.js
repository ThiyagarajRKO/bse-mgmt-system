import { UserProfiles } from "../../../../controllers";

export const GenerateUsername = () => {
  return new Promise(async (resolve, reject) => {
    try {
      await UserProfiles.GenUsername();

      resolve({ message: "Username generated successfully" });
    } catch (err) {
      reject(err);
    }
  });
};
