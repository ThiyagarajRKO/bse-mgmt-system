import models from "../../models";
import PackingCalculationsService from "./packing_calculations.js";
import YieldCalculationService from "./yield_calculation.js";

const { PackingList, Order, OrderProduct } = models;

/**
 * Packing List Service
 * Handles packing list generation from sales orders
 */
export class PackingListService {
  /**
   * Generate packing list from sales order
   * @param {Object} params - { sales_order_id, profile_id }
   * @returns {Object} - Generated packing list
   */
  static async generatePackingList({ sales_order_id, profile_id }) {
    try {
      // Get sales order details
      const salesOrder = await Order.findOne({
        where: {
          id: sales_order_id,
          is_active: true,
        },
        include: [
          {
            model: OrderProduct,
            as: "orderProducts",
            where: { is_active: true },
            required: false,
          },
        ],
      });

      if (!salesOrder) {
        throw new Error("Sales order not found");
      }

      if (!salesOrder.orderProducts || salesOrder.orderProducts.length === 0) {
        throw new Error("No products found in sales order");
      }

      // Generate packing list number
      const packing_list_no = await this.generatePackingListNumber();

      // Process each order product to get packing details
      const packingDetails = [];

      for (const orderProduct of salesOrder.orderProducts) {
        // Get packing calculations for this product
        const packingCalc =
          await PackingCalculationsService.calculateCompletePacking({
            product_id: orderProduct.species_id,
            market: salesOrder.market || "DOMESTIC",
            quantity: orderProduct.quantity,
          });

        packingDetails.push({
          order_product_id: orderProduct.id,
          product_details: packingCalc,
        });
      }

      // Aggregate packing details for the entire order
      const aggregatedPacking = this.aggregatePackingDetails(
        packingDetails,
        salesOrder
      );

      // Create packing list record
      const packingList = await PackingList.create({
        packing_list_no,
        sales_order_id,
        species: aggregatedPacking.species,
        grade: aggregatedPacking.grade,
        size: aggregatedPacking.size,
        primary_pack: aggregatedPacking.primary_pack,
        units_per_carton: aggregatedPacking.units_per_carton,
        total_cartons: aggregatedPacking.total_cartons,
        net_weight_kg: aggregatedPacking.net_weight_kg,
        gross_weight_kg: aggregatedPacking.gross_weight_kg,
        cbm: aggregatedPacking.cbm,
        pallets: aggregatedPacking.pallets,
        market: salesOrder.market || "DOMESTIC",
        status: "DRAFT",
        created_by: profile_id,
        updated_by: profile_id,
      });

      return {
        packing_list_id: packingList.id,
        packing_list_no: packingList.packing_list_no,
        ...aggregatedPacking,
        status: packingList.status,
        created_at: packingList.created_at,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate unique packing list number
   * @returns {string} - Packing list number
   */
  static async generatePackingListNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");

      // Get the last packing list number for this month
      const lastPackingList = await PackingList.findOne({
        where: {
          packing_list_no: {
            [models.Sequelize.Op.like]: `PL/${currentYear}%`,
          },
          is_active: true,
        },
        order: [["packing_list_no", "DESC"]],
      });

      let sequenceNumber = 1;
      if (lastPackingList) {
        const lastSequence = parseInt(
          lastPackingList.packing_list_no.split("/").pop()
        );
        sequenceNumber = lastSequence + 1;
      }

      return `PL/${currentYear}/${String(sequenceNumber).padStart(5, "0")}`;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aggregate packing details from multiple products
   * @param {Array} packingDetails - Array of packing calculation results
   * @param {Object} salesOrder - Sales order object
   * @returns {Object} - Aggregated packing details
   */
  static aggregatePackingDetails(packingDetails, salesOrder) {
    try {
      // For simplicity, use the first product's details
      // In a real implementation, this would aggregate across all products
      const firstProduct = packingDetails[0];

      if (!firstProduct || !firstProduct.product_details) {
        throw new Error("No valid packing details found");
      }

      const packing = firstProduct.product_details.packaging;
      const calculations = firstProduct.product_details.calculations;

      return {
        species: packing.species_name || "Mixed Products",
        grade: packing.grade || "Mixed",
        size: packing.size || "Mixed",
        primary_pack: packing.primary_packaging_type || "MIXED",
        units_per_carton: calculations.units_per_carton || 10,
        total_cartons: calculations.total_cartons || 1,
        net_weight_kg:
          calculations.total_cartons * (calculations.units_per_carton * 0.1), // Rough estimate
        gross_weight_kg:
          calculations.total_cartons * (calculations.units_per_carton * 0.12), // Rough estimate with packaging
        cbm: calculations.total_cbm || 1.0,
        pallets: calculations.pallet_info
          ? calculations.pallet_info.total_pallets
          : 0,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve packing list (makes it immutable)
   * @param {Object} params - { packing_list_id, profile_id }
   * @returns {Object} - Approved packing list
   */
  static async approvePackingList({ packing_list_id, profile_id }) {
    try {
      const packingList = await PackingList.findOne({
        where: {
          id: packing_list_id,
          status: "DRAFT",
          is_active: true,
        },
      });

      if (!packingList) {
        throw new Error("Packing list not found or not in DRAFT status");
      }

      // Update status to APPROVED
      await packingList.update({
        status: "APPROVED",
        approved_at: new Date(),
        approved_by: profile_id,
        updated_by: profile_id,
      });

      return {
        packing_list_id: packingList.id,
        packing_list_no: packingList.packing_list_no,
        status: packingList.status,
        approved_at: packingList.approved_at,
        approved_by: packingList.approved_by,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Lock packing list (final step before invoicing)
   * @param {Object} params - { packing_list_id, profile_id }
   * @returns {Object} - Locked packing list
   */
  static async lockPackingList({ packing_list_id, profile_id }) {
    try {
      const packingList = await PackingList.findOne({
        where: {
          id: packing_list_id,
          status: "APPROVED",
          is_active: true,
        },
      });

      if (!packingList) {
        throw new Error("Packing list not found or not in APPROVED status");
      }

      // Update status to LOCKED
      await packingList.update({
        status: "LOCKED",
        locked_at: new Date(),
        locked_by: profile_id,
        updated_by: profile_id,
      });

      // Automatically capture yield after locking
      try {
        await YieldCalculationService.captureYield({
          packing_list_id,
          profile_id,
        });
        console.log(
          `Yield captured for packing list ${packingList.packing_list_no}`
        );
      } catch (yieldError) {
        console.error("Error capturing yield:", yieldError);
        // Don't fail the locking if yield capture fails
      }

      return {
        packing_list_id: packingList.id,
        packing_list_no: packingList.packing_list_no,
        status: packingList.status,
        locked_at: packingList.locked_at,
        locked_by: packingList.locked_by,
        yield_captured: true,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get packing list details
   * @param {string} packing_list_id - Packing list ID
   * @returns {Object} - Packing list details
   */
  static async getPackingList(packing_list_id) {
    try {
      const packingList = await PackingList.findOne({
        where: {
          id: packing_list_id,
          is_active: true,
        },
        include: [
          {
            model: Order,
            as: "salesOrder",
            attributes: ["id", "order_no", "customer_id", "market"],
          },
        ],
      });

      if (!packingList) {
        throw new Error("Packing list not found");
      }

      return {
        id: packingList.id,
        packing_list_no: packingList.packing_list_no,
        sales_order: packingList.salesOrder,
        species: packingList.species,
        grade: packingList.grade,
        size: packingList.size,
        primary_pack: packingList.primary_pack,
        units_per_carton: packingList.units_per_carton,
        total_cartons: packingList.total_cartons,
        net_weight_kg: packingList.net_weight_kg,
        gross_weight_kg: packingList.gross_weight_kg,
        cbm: packingList.cbm,
        pallets: packingList.pallets,
        market: packingList.market,
        status: packingList.status,
        approved_at: packingList.approved_at,
        approved_by: packingList.approved_by,
        locked_at: packingList.locked_at,
        locked_by: packingList.locked_by,
        created_at: packingList.created_at,
        updated_at: packingList.updated_at,
      };
    } catch (error) {
      throw error;
    }
  }
}

export default PackingListService;
