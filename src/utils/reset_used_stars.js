import schedule from "node-schedule";
import { UserProfiles } from "../controllers";

export const ResetDailyStars = () => {
  try {
    schedule.scheduleJob("00 00 * * *", async () => {
      let result = await UserProfiles.ResetDailyStars();
      console.log(`Daily stars limits has been reset for ${result[0]} users`);
    });
  } catch (err) {
    console.error(new Date().toISOString() + " : " + err?.message || err);
  }
};
