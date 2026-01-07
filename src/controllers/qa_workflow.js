import models from "../../models";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isValidUuid = (id) => typeof id === "string" && UUID_PATTERN.test(id);

/**
 * Approve batch through QA
 * Transition: READY_FOR_QA -> QA_APPROVED
 * Records QA test results and approves batch
 */
export const ApproveQA = async (profile_id, qa_data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { batch_id, overall_status, test_results, packing_list_id } =
        qa_data;

      if (!isValidUuid(batch_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Batch ID format",
        });
      }

      // Get batch
      const batch = await models.BatchMaster.findOne({
        where: { id: batch_id, is_active: true },
      });

      if (!batch) {
        return reject({
          statusCode: 404,
          message: "Batch not found",
        });
      }

      if (
        batch.batch_status !== "YIELD_RECORDED" &&
        batch.batch_status !== "QA_PENDING"
      ) {
        return reject({
          statusCode: 409,
          message: `Batch must be in YIELD_RECORDED or QA_PENDING status, currently ${batch.batch_status}`,
        });
      }

      // Create QA checklist record
      const qaRecordNo = `QA-${Date.now()}`;
      const qaChecklist = await models.QAChecklist.create({
        qa_record_no: qaRecordNo,
        batch_id,
        packing_list_id: packing_list_id || null,
        test_parameter_1: test_results?.parameter_1?.name,
        test_result_1: test_results?.parameter_1?.result,
        test_parameter_2: test_results?.parameter_2?.name,
        test_result_2: test_results?.parameter_2?.result,
        test_parameter_3: test_results?.parameter_3?.name,
        test_result_3: test_results?.parameter_3?.result,
        microbiological_test: test_results?.microbiological?.test,
        microbiological_result: test_results?.microbiological?.result,
        overall_status,
        qa_remarks: qa_data.remarks,
        qa_performed_by: profile_id,
        qa_performed_date: new Date(),
        is_active: true,
        created_by: profile_id,
      });

      // Update batch status based on QA result
      let newBatchStatus = "QA_APPROVED";
      let newOrderStatus = "QA_APPROVED";

      if (overall_status === "FAILED") {
        newBatchStatus = "QA_REJECTED";
        newOrderStatus = "READY_FOR_QA"; // Rollback to QA pending
      }

      await batch.update(
        {
          batch_status: newBatchStatus,
          updated_by: profile_id,
        },
        { profile_id }
      );

      // Find related order and update
      const allocation = await models.AllocationMaster.findOne({
        where: { packing_id: batch.packing_id || null },
      });

      if (allocation) {
        const order = await models.Orders.findOne({
          where: { id: allocation.order_id },
        });

        if (order && order.order_status === "READY_FOR_QA") {
          await order.update(
            {
              order_status: newOrderStatus,
              updated_by: profile_id,
            },
            { profile_id }
          );

          // Log status transition
          await models.OrderStatusLog.create({
            order_id: allocation.order_id,
            from_status: "READY_FOR_QA",
            to_status: newOrderStatus,
            transition_date: new Date(),
            transition_reason: `QA ${overall_status}: ${qa_data.remarks}`,
            metadata: { qa_record_id: qaChecklist.id },
            created_by: profile_id,
          });
        }
      }

      resolve({
        statusCode: 201,
        message: `QA record created - Status: ${overall_status}`,
        data: qaChecklist,
      });
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Get QA history for batch
 */
export const GetQAHistory = async (batch_id) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (!isValidUuid(batch_id)) {
        return reject({
          statusCode: 422,
          message: "Invalid Batch ID format",
        });
      }

      const qaRecords = await models.QAChecklist.findAll({
        where: { batch_id, is_active: true },
        include: [
          {
            model: models.UserProfiles,
            as: "performer",
            attributes: ["id", "user_full_name"],
          },
          {
            model: models.UserProfiles,
            as: "approver",
            attributes: ["id", "user_full_name"],
          },
        ],
        order: [["qa_performed_date", "DESC"]],
      });

      resolve({
        statusCode: 200,
        data: qaRecords,
      });
    } catch (err) {
      reject(err);
    }
  });
};

export default {
  ApproveQA,
  GetQAHistory,
};
