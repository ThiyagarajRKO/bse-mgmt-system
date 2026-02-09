import models from "../../../../models";
import { Update } from "./update";

export const ApprovePurchaseRequest = async (
  {
    profile_id,
    id,
    status = "Approved",
    procurement_price,
    supplier_master_id,
    ...params
  },
  session,
  fastify,
) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("ApprovePurchaseRequest handler called with id:", id);

      // First, get the procurement product details
      const procurementProduct = await models.ProcurementProducts.findByPk(id, {
        include: [
          {
            model: models.ProductMaster,
            as: "ProductMaster",
          },
          {
            model: models.SupplierMaster,
          },
        ],
      });

      if (!procurementProduct) {
        return reject({
          statusCode: 404,
          message: "Purchase request not found",
        });
      }

      // Prepare update data with new price and supplier if provided
      const updateData = {
        status,
        approver_name: session?.user?.first_name,
      };

      if (procurement_price !== undefined) {
        updateData.procurement_price = procurement_price;
      }

      if (supplier_master_id !== undefined) {
        updateData.supplier_master_id = supplier_master_id;
      }

      console.log(
        "ApprovePurchaseRequest - Updating procurement product with data:",
        updateData,
      );
      console.log(
        "ApprovePurchaseRequest - supplier_master_id param:",
        supplier_master_id,
      );
      console.log(
        "ApprovePurchaseRequest - updateData.supplier_master_id:",
        updateData.supplier_master_id,
      );

      // Update the procurement product status to Approved
      const updateResult = await Update(
        {
          profile_id,
          procurement_product_id: id,
          procurement_product_data: updateData,
        },
        session,
        fastify,
      );

      // Use the price from the request or from the existing procurement product
      const finalPrice =
        procurement_price !== undefined
          ? procurement_price
          : procurementProduct.procurement_price || 0;

      // Use the supplier from the request or from the existing procurement product
      const finalSupplier =
        supplier_master_id || procurementProduct.supplier_master_id;

      // Create a record in purchase_inventory table
      const purchaseInventoryRecord = await models.PurchaseInventory.create({
        product_master_id: procurementProduct.product_master_id,
        procurement_product_id: id,
        supplier_master_id: finalSupplier,
        quantity_ordered: procurementProduct.procurement_quantity,
        quantity_received: 0, // Will be updated when goods are received
        unit_price: finalPrice,
        total_amount: finalPrice * procurementProduct.procurement_quantity,
        status: "Pending", // Pending receipt
        created_by: profile_id,
        is_active: true,
      });

      console.log(
        "Purchase inventory record created:",
        purchaseInventoryRecord.id,
      );

      resolve({
        message:
          "Purchase request approved successfully and added to purchase inventory",
        data: {
          procurement_product_id: id,
          purchase_inventory_id: purchaseInventoryRecord.id,
          status: "Approved",
        },
      });
    } catch (err) {
      fastify.log.error("Error in ApprovePurchaseRequest:", err);
      reject(err);
    }
  });
};
