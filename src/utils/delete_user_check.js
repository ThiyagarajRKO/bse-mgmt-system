var CronJob = require("cron").CronJob;
import { Users } from "../controllers";

//To delete user after 30 days
export const job = new CronJob("0 */24 * * *", function () {
  return new Promise(async (resolve, reject) => {
    try {
      let result = await Users.DeleteUser();
      resolve(result);
    } catch (err) {
      console.error(new Date().toISOString() + " : " + err?.message || err);
      reject(err);
    }
  });
});
