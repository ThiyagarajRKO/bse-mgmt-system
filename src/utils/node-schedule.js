import schedule from "node-schedule";
import { SchedulerMeta } from "../controllers";
import { PublishPost } from "../routes/admin/posts/handlers/upload";

export let ScheduledJobsObj = {};

export const SchedulePublish = ({ id, execution_at, timezone, meta_data }) => {
  return new Promise((resolve, reject) => {
    try {
      if (!id) {
        return reject({
          type: "warning",
          message: "Scheduler id must not be empty",
        });
      }

      if (!execution_at || !timezone || !meta_data) {
        return reject({
          type: "warning",
          message: "Fill all the required for scheduled post publish",
        });
      }

      const job = schedule.scheduleJob(new Date(execution_at), async () => {
        let schedule_result = await SchedulerMeta.Get({
          profile_id: meta_data?.created_by,
          id,
        });

        if (!schedule_result) {
          console.log("Invalid scheduler id");
          return;
        }

        if (schedule_result.is_executed || schedule_result.post_id) {
          console.log("Schedule is already published");
          return;
        }

        let post_result = await PublishPost(meta_data);
        SchedulerMeta.Update({
          profile_id: meta_data?.created_by,
          id,
          scheduler_data: {
            post_id: post_result?.id,
            is_executed: true,
          },
        }).catch(console.log);

        delete ScheduledJobsObj[id];
        console.log("Post has been uploaded successfully");
      });

      ScheduledJobsObj[id] = job;

      resolve(job);
    } catch (err) {
      reject(err);
    }
  });
};

export const RefreshSchedules = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let SchedulerData = await SchedulerMeta.GetAll({});

      await Promise.all(
        SchedulerData?.rows?.map((data) => {
          SchedulePublish({
            id: data?.dataValues?.id,
            execution_at: data?.dataValues?.execution_at,
            timezone: data?.dataValues?.timezone,
            meta_data: data?.dataValues?.meta_data,
          }).catch(console.log);
        })
      );

      console.log("Refreshed scheduled jobs :", SchedulerData?.count);

      resolve();

      RunMissingSchedules();
    } catch (err) {
      reject(err);
    }
  });
};

export const RunMissingSchedules = () => {
  return new Promise(async (resolve, reject) => {
    try {
      let SchedulerData = await SchedulerMeta.GetAllMissed({});

      await Promise.all(
        SchedulerData?.rows?.map(async (data) => {
          try {
            let post_result = await PublishPost(data?.meta_data);
            SchedulerMeta.Update({
              profile_id: data?.meta_data?.created_by,
              id: data?.id,
              scheduler_data: {
                post_id: post_result?.id,
                is_executed: true,
              },
            }).catch(console.log);

            delete ScheduledJobsObj[data?.id];
          } catch (err) {
            console.log(err);
          }
        })
      );

      console.log("Posted missing scheduled jobs :", SchedulerData?.count);

      resolve();
    } catch (err) {
      reject(err);
    }
  });
};
