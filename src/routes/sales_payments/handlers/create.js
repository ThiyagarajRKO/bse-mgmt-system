import { SalesPayments } from "../../../controllers";
import { ApplyJournalTemplateInternal } from "../../../controllers/accounting/template";

export const Create = (
  {
    profile_id,
    transaction_id,
    payment_date,
    customer_master_id,
    order_id,
    payment_method,
    discount,
    total_paid,
    net_amount,
    penalty,
    tax_percentage,
    tax_amount,
    due_amount,
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      const sales_payment = await SalesPayments.Insert(profile_id, {
        transaction_id,
        payment_date,
        customer_master_id,
        order_id,
        payment_method,
        discount,
        total_paid,
        net_amount,
        penalty,
        tax_percentage,
        tax_amount,
        due_amount,
        is_active: true,
      });

      // Trigger automatic journal entry for CUSTOMER_PAYMENT
      try {
        const paymentAmount = total_paid || net_amount;
        await ApplyJournalTemplateInternal({
          event_type: "CUSTOMER_PAYMENT",
          reference_type: "SALES_ORDER",
          reference_id: order_id,
          amount: paymentAmount,
          description: `Customer payment received for order ${order_id}`,
          created_by: profile_id,
        });
      } catch (journalError) {
        console.warn(
          "Journal entry creation failed for CUSTOMER_PAYMENT (non-blocking):",
          journalError.message,
        );
        // Don't fail the payment creation if journal entry fails
      }

      resolve({
        message: "Sales Payment has been inserted successfully",
        data: {
          id: sales_payment?.id,
        },
      });
    } catch (err) {
      fastify.log.error(err);
      reject(err);
    }
  });
};
