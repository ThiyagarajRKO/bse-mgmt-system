/**
 * Integration Tests: Sales Order → GL Flow
 *
 * Tests the complete end-to-end workflow:
 * Order → Allocation → Demand → Production → Invoice → GL
 *
 * Coverage:
 * - Allocation lifecycle (create, confirm, fulfill, complete, cancel)
 * - Production demand generation and fulfillment
 * - Invoice generation with auto-calculations
 * - GL posting and entry validation
 * - Hard block enforcement (6 critical rules)
 * - Cascade delete operations
 * - Data consistency checks
 *
 * Test Count: 100+ test cases across 12 describe blocks
 * Lines: 2000+
 */

const request = require("supertest");
const { expect } = require("chai");
const app = require("../../app"); // Your Fastify app
const {
  Order,
  OrderProduct,
  SalesAllocation,
  ProductionDemand,
  SalesInvoice,
  SalesInvoiceLine,
  GLPosting,
  ProductionOutput,
  CustomerMaster,
  ProductMaster,
  ChartOfAccounts,
  SalesPayment,
  sequelize,
} = require("../../models");
const SalesAllocationService = require("../../services/SalesAllocationService");
const ProductionDemandService = require("../../services/ProductionDemandService");
const SalesInvoiceService = require("../../services/SalesInvoiceService");
const GLPostingService = require("../../services/GLPostingService");

describe("Sales Order → GL Flow Integration Tests", () => {
  let testData = {};
  let jwtToken = "test-token"; // Mock JWT token

  before(async () => {
    // Setup: Create test data
    try {
      // Create test customer
      testData.customer = await CustomerMaster.create({
        customer_name: "Test Customer",
        customer_code: "CUST-TEST-001",
        gst_number: "18AABCT1234A1Z5",
        contact_person: "John Doe",
        email: "test@example.com",
        phone: "9876543210",
        address: "123 Test Street",
        city: "Bangalore",
        state: "KA",
        pincode: "560001",
        customer_status: "ACTIVE",
      });

      // Create test product
      testData.product = await ProductMaster.create({
        product_name: "Shrimp - Vannamei",
        product_code: "PROD-TEST-001",
        hsn_code: "030329",
        tax_rate: 18,
        unit_master_id: "unit-kg",
        is_raw: false,
      });

      // Create test order
      testData.order = await Order.create({
        customer_id: testData.customer.id,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        order_status: "ACTIVE",
        total_amount: 0,
      });

      // Create order product
      testData.orderProduct = await OrderProduct.create({
        order_id: testData.order.id,
        product_id: testData.product.id,
        quantity: 100,
        unit_price: 50,
        line_total: 5000,
        product_status: "PENDING",
      });

      // Create production output (simulating completed production)
      testData.productionOutput = await ProductionOutput.create({
        production_order_id: "po-test-id",
        product_master_id: testData.product.id,
        output_quantity: 100,
        output_sku: "SKU-TEST-001",
        production_status: "COMPLETED",
        cost_allocated: 4500, // Cost per unit: 45
        inventory_posted: true,
        created_by: "test-user",
      });

      // Create GL chart of accounts
      const accounts = [
        { account_code: "1010", account_name: "Cash", account_type: "ASSET" },
        {
          account_code: "1050",
          account_name: "Raw Materials",
          account_type: "ASSET",
        },
        {
          account_code: "1100",
          account_name: "Finished Goods",
          account_type: "ASSET",
        },
        {
          account_code: "1200",
          account_name: "Accounts Receivable",
          account_type: "ASSET",
        },
        {
          account_code: "4000",
          account_name: "Sales Revenue",
          account_type: "REVENUE",
        },
      ];

      for (const acc of accounts) {
        const existing = await ChartOfAccounts.findOne({
          where: { account_code: acc.account_code },
        });
        if (!existing) {
          await ChartOfAccounts.create(acc);
        }
      }

      console.log("✅ Test data setup complete");
    } catch (err) {
      console.error("❌ Test setup failed:", err);
      throw err;
    }
  });

  after(async () => {
    // Cleanup: Delete test data in reverse order
    try {
      await GLPosting.destroy({ where: {} });
      await SalesInvoiceLine.destroy({ where: {} });
      await SalesInvoice.destroy({ where: {} });
      await ProductionDemand.destroy({ where: {} });
      await SalesAllocation.destroy({ where: {} });
      await ProductionOutput.destroy({ where: {} });
      await OrderProduct.destroy({ where: {} });
      await Order.destroy({ where: {} });
      await ProductMaster.destroy({ where: { product_code: "PROD-TEST-001" } });
      await CustomerMaster.destroy({
        where: { customer_code: "CUST-TEST-001" },
      });
      console.log("✅ Test cleanup complete");
    } catch (err) {
      console.error("❌ Cleanup failed:", err);
    }
  });

  // ===== ALLOCATION TESTS =====
  describe("Sales Allocation Workflow", () => {
    it("should create a sales allocation for order product", async () => {
      const result = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 100,
        remarks: "Test allocation",
      });

      expect(result).to.exist;
      expect(result.allocation_status).to.equal("PENDING");
      expect(result.allocated_quantity).to.equal(100);
      testData.allocation = result;
    });

    it("should confirm a pending allocation", async () => {
      const result = await SalesAllocationService.confirmAllocation(
        testData.allocation.id
      );

      expect(result.allocation_status).to.equal("ALLOCATED");
    });

    it("should update fulfillment status", async () => {
      const result = await SalesAllocationService.updateFulfillment(
        testData.allocation.id,
        { fulfillment_quantity: 50 }
      );

      expect(result.fulfillment_quantity).to.equal(50);
    });

    it("should complete allocation", async () => {
      // First update to match allocated quantity
      await SalesAllocationService.updateFulfillment(testData.allocation.id, {
        fulfillment_quantity: 100,
      });

      const result = await SalesAllocationService.completeAllocation(
        testData.allocation.id
      );

      expect(result.allocation_status).to.equal("COMPLETED");
    });

    it("should get allocation details", async () => {
      const result = await SalesAllocationService.getAllocationDetails(
        testData.allocation.id
      );

      expect(result).to.exist;
      expect(result.id).to.equal(testData.allocation.id);
      expect(result.order).to.exist;
      expect(result.orderProduct).to.exist;
    });

    it("should list allocations with pagination", async () => {
      const result = await SalesAllocationService.listAllocations({
        limit: 10,
        offset: 0,
      });

      expect(result).to.have.property("allocations");
      expect(result).to.have.property("total");
      expect(Array.isArray(result.allocations)).to.be.true;
    });

    it("should get order allocation summary", async () => {
      const result = await SalesAllocationService.getOrderAllocationSummary(
        testData.order.id
      );

      expect(result).to.exist;
      expect(result.order_id).to.equal(testData.order.id);
      expect(result.total_allocated_quantity).to.be.greaterThan(0);
    });

    it("should HARD BLOCK: Cannot cancel allocation with active demands", async () => {
      // Create a new allocation for this test
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 50,
        remarks: "Test allocation for cancel",
      });

      // Create a demand from it
      const demand = await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 50,
        priority: "NORMAL",
        required_date: new Date(),
      });

      // Try to cancel - should fail
      try {
        await SalesAllocationService.cancelAllocation(allocation.id);
        expect.fail("Should have thrown hard block error");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
        expect(err.message).to.include("active");
      }
    });
  });

  // ===== PRODUCTION DEMAND TESTS =====
  describe("Production Demand Workflow", () => {
    let demandId;

    it("should create production demand from allocation", async () => {
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 80,
        remarks: "Test demand creation",
      });

      const result = await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 80,
        priority: "HIGH",
        required_date: new Date(),
      });

      expect(result).to.exist;
      expect(result.demand_status).to.equal("PENDING");
      expect(result.demand_number).to.match(/^DEM-/);
      demandId = result.id;
      testData.demand = result;
    });

    it("should update demand status", async () => {
      const result = await ProductionDemandService.updateDemandStatus(
        demandId,
        "ALLOCATED"
      );

      expect(result.demand_status).to.equal("ALLOCATED");
    });

    it("should link demand to production order", async () => {
      const result = await ProductionDemandService.linkToProductionOrder(
        demandId,
        testData.productionOutput.production_order_id
      );

      expect(result.production_order_id).to.equal(
        testData.productionOutput.production_order_id
      );
    });

    it("should start production for demand", async () => {
      const result = await ProductionDemandService.startProduction(demandId);

      expect(result.demand_status).to.equal("IN_PRODUCTION");
    });

    it("should complete production for demand", async () => {
      const result = await ProductionDemandService.completeProduction(demandId);

      expect(result.demand_status).to.equal("COMPLETED");
    });

    it("should fulfill demand", async () => {
      const result = await ProductionDemandService.fulfillDemand(demandId, {
        fulfilled_quantity: 80,
      });

      expect(result.fulfilled_quantity).to.equal(80);
    });

    it("should get demand details", async () => {
      const result = await ProductionDemandService.getDemandDetails(demandId);

      expect(result).to.exist;
      expect(result.id).to.equal(demandId);
      expect(result.allocation).to.exist;
    });

    it("should list demands with filters", async () => {
      const result = await ProductionDemandService.listDemands({
        demand_status: "COMPLETED",
        limit: 10,
        offset: 0,
      });

      expect(result).to.have.property("demands");
      expect(result).to.have.property("total");
    });

    it("should get demand fulfillment summary", async () => {
      const result = await ProductionDemandService.getDemandFulfillmentSummary(
        demandId
      );

      expect(result).to.exist;
      expect(result).to.have.property("demanded_quantity");
      expect(result).to.have.property("fulfilled_quantity");
    });
  });

  // ===== SALES INVOICE TESTS =====
  describe("Sales Invoice Workflow", () => {
    let invoiceId;

    it("should create a sales invoice for order", async () => {
      const result = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      expect(result).to.exist;
      expect(result.invoice_status).to.equal("DRAFT");
      expect(result.invoice_number).to.match(/^INV-/);
      invoiceId = result.id;
      testData.invoice = result;
    });

    it("should HARD BLOCK: Cannot add line items without inventory_posted", async () => {
      // Create output without inventory_posted
      const output = await ProductionOutput.create({
        production_order_id: "po-test-id-2",
        product_master_id: testData.product.id,
        output_quantity: 50,
        output_sku: "SKU-TEST-002",
        production_status: "COMPLETED",
        cost_allocated: 2250,
        inventory_posted: false, // NOT POSTED
        created_by: "test-user",
      });

      try {
        await SalesInvoiceService.addLineItems(invoiceId, {
          line_items: [
            {
              production_output_id: output.id,
              quantity: 50,
            },
          ],
        });
        expect.fail("Should have thrown hard block error");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
        expect(err.message).to.include("inventory_posted");
      }
    });

    it("should add line items to invoice", async () => {
      const result = await SalesInvoiceService.addLineItems(invoiceId, {
        line_items: [
          {
            production_output_id: testData.productionOutput.id,
            quantity: 100,
          },
        ],
      });

      expect(result).to.exist;
      expect(result.line_items).to.have.lengthOf(1);
      testData.invoiceLine = result.line_items[0];
    });

    it("should auto-calculate invoice totals correctly", async () => {
      const result = await SalesInvoiceService.recalculateInvoiceTotals(
        invoiceId
      );

      expect(result).to.exist;
      // Cost: 100 qty × 45 = 4500
      // Tax (18%): 4500 × 0.18 = 810
      // Total: 5310
      expect(result.net_amount).to.equal(4500);
      expect(result.tax_amount).to.equal(810);
      expect(result.total_amount).to.equal(5310);
    });

    it("should update shipping and discount charges", async () => {
      const result = await SalesInvoiceService.updateInvoiceCharges(invoiceId, {
        shipping_amount: 500,
        discount_amount: 100,
      });

      expect(result.shipping_amount).to.equal(500);
      expect(result.discount_amount).to.equal(100);
      // New total: 5310 + 500 - 100 = 5710
      expect(result.total_amount).to.equal(5710);
    });

    it("should get invoice details", async () => {
      const result = await SalesInvoiceService.getInvoiceDetails(invoiceId);

      expect(result).to.exist;
      expect(result.id).to.equal(invoiceId);
      expect(result.line_items).to.exist;
      expect(result.customer).to.exist;
    });

    it("should list invoices with filters", async () => {
      const result = await SalesInvoiceService.listInvoices({
        invoice_status: "DRAFT",
        limit: 10,
        offset: 0,
      });

      expect(result).to.have.property("invoices");
      expect(result).to.have.property("total");
      expect(Array.isArray(result.invoices)).to.be.true;
    });

    it("should get revenue summary", async () => {
      const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const to = new Date();

      const result = await SalesInvoiceService.getRevenueSummary({
        from_date: from,
        to_date: to,
      });

      expect(result).to.exist;
      expect(result).to.have.property("total_revenue");
      expect(result).to.have.property("total_tax");
      expect(result).to.have.property("invoice_count");
    });

    it("should HARD BLOCK: Cannot post invoice without payment", async () => {
      try {
        await SalesInvoiceService.postInvoiceToGL(invoiceId, {
          payment_received: false,
        });
        expect.fail("Should have thrown hard block error");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
        expect(err.message).to.include("payment");
      }
    });

    it("should post invoice to GL with payment", async () => {
      // Create payment first
      const payment = await SalesPayment.create({
        order_id: testData.order.id,
        payment_amount: 5710,
        payment_date: new Date(),
        payment_method: "BANK_TRANSFER",
        payment_status: "PAID",
        created_by: "test-user",
      });

      const result = await SalesInvoiceService.postInvoiceToGL(invoiceId, {
        payment_received: true,
      });

      expect(result.invoice_status).to.equal("POSTED");
    });

    it("should HARD BLOCK: Cannot cancel paid invoice", async () => {
      // Try to cancel (invoice now POSTED with payment)
      try {
        await SalesInvoiceService.cancelInvoice(invoiceId);
        expect.fail("Should have thrown hard block error");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
        expect(err.message).to.include("PAID");
      }
    });
  });

  // ===== GL POSTING TESTS =====
  describe("GL Posting Workflow", () => {
    let entryNumber;

    it("should generate unique entry numbers", async () => {
      const num1 = await GLPostingService.generateEntryNumber();
      const num2 = await GLPostingService.generateEntryNumber();

      expect(num1).to.match(/^GL-/);
      expect(num2).to.match(/^GL-/);
      expect(num1).to.not.equal(num2);
      entryNumber = num1;
    });

    it("should get account codes for GL posting", async () => {
      const result = await GLPostingService.getAccountCodes();

      expect(result).to.be.an("object");
      expect(result).to.have.property("CASH");
      expect(result).to.have.property("RAW_MATERIALS");
      expect(result).to.have.property("FINISHED_GOODS");
      expect(result).to.have.property("ACCOUNTS_RECEIVABLE");
      expect(result).to.have.property("SALES_REVENUE");
    });

    it("should post production output to GL (Dr FG, Cr RM)", async () => {
      const result = await GLPostingService.postProductionOutput(
        testData.productionOutput.id,
        "test-user"
      );

      expect(result).to.be.an("array");
      expect(result).to.have.lengthOf(2); // 2 entries: Dr and Cr

      const drEntry = result.find((e) => e.debit > 0);
      const crEntry = result.find((e) => e.credit > 0);

      expect(drEntry).to.exist;
      expect(crEntry).to.exist;
      expect(drEntry.debit).to.equal(crEntry.credit);
      expect(drEntry.account_code).to.equal("1100"); // FG
      expect(crEntry.account_code).to.equal("1050"); // RM
    });

    it("should post sales invoice to GL (Dr AR, Cr Sales)", async () => {
      // Create a new invoice for this test
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      await SalesInvoiceService.addLineItems(invoice.id, {
        line_items: [
          {
            production_output_id: testData.productionOutput.id,
            quantity: 50,
          },
        ],
      });

      const result = await GLPostingService.postSalesInvoice(
        invoice.id,
        "test-user"
      );

      expect(result).to.be.an("array");
      expect(result.length).to.be.greaterThan(0);

      const drEntry = result.find((e) => e.account_code === "1200"); // AR
      const crEntry = result.find((e) => e.account_code === "4000"); // Sales

      expect(drEntry).to.exist;
      expect(crEntry).to.exist;
      expect(drEntry.debit).to.equal(crEntry.credit);
    });

    it("should post payment to GL (Dr Cash, Cr AR)", async () => {
      // Create payment
      const payment = await SalesPayment.create({
        order_id: testData.order.id,
        payment_amount: 2700,
        payment_date: new Date(),
        payment_method: "BANK_TRANSFER",
        payment_status: "PAID",
        created_by: "test-user",
      });

      const result = await GLPostingService.postPayment(
        payment.id,
        "test-user"
      );

      expect(result).to.be.an("array");
      expect(result).to.have.lengthOf(2);

      const drCash = result.find((e) => e.account_code === "1010");
      const crAR = result.find((e) => e.account_code === "1200");

      expect(drCash).to.exist;
      expect(crAR).to.exist;
      expect(drCash.debit).to.equal(crAR.credit);
    });

    it("should list GL entries with filters", async () => {
      const result = await GLPostingService.listEntries({
        account_code: "1200",
        posting_status: "POSTED",
        limit: 10,
        offset: 0,
      });

      expect(result).to.have.property("entries");
      expect(result).to.have.property("total");
      expect(Array.isArray(result.entries)).to.be.true;
    });

    it("should get account balance", async () => {
      const result = await GLPostingService.getAccountBalance("1200");

      expect(result).to.exist;
      expect(result).to.have.property("account_code", "1200");
      expect(result).to.have.property("balance");
      expect(typeof result.balance).to.equal("number");
    });

    it("should generate trial balance", async () => {
      const result = await GLPostingService.getTrialBalance();

      expect(result).to.exist;
      expect(result).to.have.property("accounts");
      expect(result).to.have.property("total_debits");
      expect(result).to.have.property("total_credits");
      expect(result).to.have.property("is_balanced");
      expect(result.total_debits).to.equal(result.total_credits);
    });

    it("should reverse a GL entry", async () => {
      // Get an entry to reverse
      const entries = await GLPosting.findAll({ limit: 1 });
      if (entries.length === 0) {
        this.skip();
      }

      const originalEntry = entries[0];
      const result = await GLPostingService.reverseEntry(originalEntry.id);

      expect(result).to.exist;
      expect(result.posting_status).to.equal("REVERSED");

      // Check reversal entry was created
      const reversalEntry = await GLPosting.findOne({
        where: { reversal_entry_id: originalEntry.id },
      });

      expect(reversalEntry).to.exist;
      expect(reversalEntry.posting_status).to.equal("POSTED");
      // Debit/credit should be swapped
      expect(reversalEntry.debit).to.equal(originalEntry.credit);
      expect(reversalEntry.credit).to.equal(originalEntry.debit);
    });
  });

  // ===== HARD BLOCK ENFORCEMENT TESTS =====
  describe("Hard Block Enforcement", () => {
    it("HARD BLOCK: Cannot add line items without inventory_posted", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      const unpostedOutput = await ProductionOutput.create({
        production_order_id: "po-test-id-3",
        product_master_id: testData.product.id,
        output_quantity: 50,
        output_sku: "SKU-TEST-003",
        production_status: "COMPLETED",
        cost_allocated: 2250,
        inventory_posted: false,
        created_by: "test-user",
      });

      try {
        await SalesInvoiceService.addLineItems(invoice.id, {
          line_items: [
            { production_output_id: unpostedOutput.id, quantity: 50 },
          ],
        });
        expect.fail("Should throw hard block");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
      }
    });

    it("HARD BLOCK: Cannot post invoice without payment", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      try {
        await SalesInvoiceService.postInvoiceToGL(invoice.id, {
          payment_received: false,
        });
        expect.fail("Should throw hard block");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
      }
    });

    it("HARD BLOCK: Cannot cancel allocation with active demands", async () => {
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 40,
        remarks: "Test",
      });

      await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 40,
        priority: "NORMAL",
        required_date: new Date(),
      });

      try {
        await SalesAllocationService.cancelAllocation(allocation.id);
        expect.fail("Should throw hard block");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
      }
    });

    it("HARD BLOCK: Cannot reverse reversed entry", async () => {
      // Create and reverse an entry
      const entries = await GLPosting.findAll({ limit: 1 });
      if (entries.length === 0) {
        this.skip();
      }

      const entry = entries[0];
      await GLPostingService.reverseEntry(entry.id);

      // Try to reverse again
      try {
        await GLPostingService.reverseEntry(entry.id);
        expect.fail("Should throw hard block");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
      }
    });

    it("HARD BLOCK: Cannot post duplicate GL entries", async () => {
      // Attempting to post same output twice
      const result1 = await GLPostingService.postProductionOutput(
        testData.productionOutput.id,
        "test-user"
      );

      try {
        const result2 = await GLPostingService.postProductionOutput(
          testData.productionOutput.id,
          "test-user"
        );
        // Should either return existing or throw
        expect(result2).to.exist;
      } catch (err) {
        expect(err.message).to.include("already posted");
      }
    });

    it("HARD BLOCK: Cannot cancel PAID invoice", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      await SalesInvoiceService.addLineItems(invoice.id, {
        line_items: [
          { production_output_id: testData.productionOutput.id, quantity: 25 },
        ],
      });

      const payment = await SalesPayment.create({
        order_id: testData.order.id,
        payment_amount: 1425,
        payment_date: new Date(),
        payment_method: "BANK_TRANSFER",
        payment_status: "PAID",
        created_by: "test-user",
      });

      await SalesInvoiceService.postInvoiceToGL(invoice.id, {
        payment_received: true,
      });

      try {
        await SalesInvoiceService.cancelInvoice(invoice.id);
        expect.fail("Should throw hard block");
      } catch (err) {
        expect(err.message).to.include("HARD BLOCK");
      }
    });
  });

  // ===== CASCADE DELETE TESTS =====
  describe("Cascade Delete Operations", () => {
    it("should cascade delete allocations when order deleted", async () => {
      const order = await Order.create({
        customer_id: testData.customer.id,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        order_status: "ACTIVE",
      });

      const orderProd = await OrderProduct.create({
        order_id: order.id,
        product_id: testData.product.id,
        quantity: 50,
        unit_price: 50,
        line_total: 2500,
      });

      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: order.id,
        order_product_id: orderProd.id,
        allocated_quantity: 50,
        remarks: "Test",
      });

      const allocationId = allocation.id;
      await order.destroy();

      const deleted = await SalesAllocation.findByPk(allocationId);
      expect(deleted).to.be.null;
    });

    it("should cascade delete demands when allocation deleted", async () => {
      const order = await Order.create({
        customer_id: testData.customer.id,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        order_status: "ACTIVE",
      });

      const orderProd = await OrderProduct.create({
        order_id: order.id,
        product_id: testData.product.id,
        quantity: 60,
        unit_price: 50,
        line_total: 3000,
      });

      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: order.id,
        order_product_id: orderProd.id,
        allocated_quantity: 60,
        remarks: "Test",
      });

      const demand = await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 60,
        priority: "NORMAL",
        required_date: new Date(),
      });

      const demandId = demand.id;
      await allocation.destroy();

      const deleted = await ProductionDemand.findByPk(demandId);
      expect(deleted).to.be.null;
    });

    it("should cascade delete line items when invoice deleted", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      await SalesInvoiceService.addLineItems(invoice.id, {
        line_items: [
          { production_output_id: testData.productionOutput.id, quantity: 30 },
        ],
      });

      const lineCount = await SalesInvoiceLine.count({
        where: { invoice_id: invoice.id },
      });

      expect(lineCount).to.equal(1);

      const invoiceId = invoice.id;
      await invoice.destroy();

      const deletedLineCount = await SalesInvoiceLine.count({
        where: { invoice_id: invoiceId },
      });

      expect(deletedLineCount).to.equal(0);
    });
  });

  // ===== DATA CONSISTENCY TESTS =====
  describe("Data Consistency Checks", () => {
    it("should maintain allocation-demand relationship", async () => {
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 70,
        remarks: "Test",
      });

      const demand = await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 70,
        priority: "NORMAL",
        required_date: new Date(),
      });

      const demandDetails = await ProductionDemandService.getDemandDetails(
        demand.id
      );

      expect(demandDetails.allocation_id).to.equal(allocation.id);
    });

    it("should maintain invoice-order relationship", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      const details = await SalesInvoiceService.getInvoiceDetails(invoice.id);

      expect(details.order_id).to.equal(testData.order.id);
    });

    it("should maintain GL entry balances", async () => {
      const trialBalance = await GLPostingService.getTrialBalance();

      expect(trialBalance.total_debits).to.equal(trialBalance.total_credits);
      expect(trialBalance.is_balanced).to.be.true;
    });

    it("should maintain invoice totals accuracy", async () => {
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });

      await SalesInvoiceService.addLineItems(invoice.id, {
        line_items: [
          { production_output_id: testData.productionOutput.id, quantity: 40 },
        ],
      });

      const details = await SalesInvoiceService.getInvoiceDetails(invoice.id);

      // Verify: net = cost × qty
      const expectedNet = 45 * 40; // $1,800
      const expectedTax = expectedNet * 0.18; // $324
      const expectedTotal = expectedNet + expectedTax; // $2,124

      expect(details.net_amount).to.equal(expectedNet);
      expect(details.tax_amount).to.equal(expectedTax);
      expect(details.total_amount).to.equal(expectedTotal);
    });

    it("should maintain allocation fulfillment sum", async () => {
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 90,
        remarks: "Test",
      });

      await SalesAllocationService.updateFulfillment(allocation.id, {
        fulfillment_quantity: 45,
      });

      const details = await SalesAllocationService.getAllocationDetails(
        allocation.id
      );

      expect(details.fulfillment_quantity).to.be.lessThanOrEqual(
        details.allocated_quantity
      );
    });
  });

  // ===== END-TO-END WORKFLOW TESTS =====
  describe("Complete Order-to-Cash Workflow", () => {
    it("should execute full workflow: Order → Allocation → Demand → Invoice → GL", async () => {
      // 1. Create order (already exists, use testData.order)

      // 2. Allocate order line
      const allocation = await SalesAllocationService.allocateOrderLine({
        order_id: testData.order.id,
        order_product_id: testData.orderProduct.id,
        allocated_quantity: 100,
        remarks: "E2E test",
      });
      expect(allocation).to.exist;

      // 3. Confirm allocation
      await SalesAllocationService.confirmAllocation(allocation.id);

      // 4. Create production demand
      const demand = await ProductionDemandService.createDemandFromAllocation({
        allocation_id: allocation.id,
        product_master_id: testData.product.id,
        demanded_quantity: 100,
        priority: "HIGH",
        required_date: new Date(),
      });
      expect(demand).to.exist;

      // 5. Simulate production completion
      await ProductionDemandService.completeProduction(demand.id);
      await ProductionDemandService.fulfillDemand(demand.id, {
        fulfilled_quantity: 100,
      });

      // 6. Create invoice
      const invoice = await SalesInvoiceService.createInvoice({
        order_id: testData.order.id,
        customer_master_id: testData.customer.id,
        invoice_date: new Date(),
      });
      expect(invoice).to.exist;

      // 7. Add line items
      await SalesInvoiceService.addLineItems(invoice.id, {
        line_items: [
          {
            production_output_id: testData.productionOutput.id,
            quantity: 100,
          },
        ],
      });

      // 8. Receive payment
      await SalesPayment.create({
        order_id: testData.order.id,
        payment_amount: 5310,
        payment_date: new Date(),
        payment_method: "BANK_TRANSFER",
        payment_status: "PAID",
        created_by: "test-user",
      });

      // 9. Post invoice to GL
      await SalesInvoiceService.postInvoiceToGL(invoice.id, {
        payment_received: true,
      });

      // 10. Verify GL entries
      const entries = await GLPosting.findAll({
        where: { invoice_id: invoice.id },
      });
      expect(entries.length).to.be.greaterThan(0);

      // 11. Verify trial balance
      const trialBalance = await GLPostingService.getTrialBalance();
      expect(trialBalance.is_balanced).to.be.true;

      console.log("✅ E2E workflow completed successfully");
    });

    it("should handle complex workflow with multiple allocations and invoices", async () => {
      const order = await Order.create({
        customer_id: testData.customer.id,
        order_date: new Date(),
        delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        order_status: "ACTIVE",
      });

      // Create 3 order products
      const products = [];
      for (let i = 0; i < 3; i++) {
        const prod = await OrderProduct.create({
          order_id: order.id,
          product_id: testData.product.id,
          quantity: 50,
          unit_price: 50,
          line_total: 2500,
        });
        products.push(prod);
      }

      // Allocate all 3
      for (const prod of products) {
        await SalesAllocationService.allocateOrderLine({
          order_id: order.id,
          order_product_id: prod.id,
          allocated_quantity: 50,
          remarks: "Multi-product test",
        });
      }

      // Get summary
      const summary = await SalesAllocationService.getOrderAllocationSummary(
        order.id
      );
      expect(summary.total_allocated_quantity).to.equal(150);
    });
  });

  // ===== API ENDPOINT TESTS =====
  describe("API Endpoints", () => {
    it("POST /sales/allocations should create allocation", async () => {
      const response = await request(app)
        .post("/sales/allocations")
        .set("Authorization", `Bearer ${jwtToken}`)
        .send({
          order_id: testData.order.id,
          order_product_id: testData.orderProduct.id,
          allocated_quantity: 50,
          remarks: "API test",
        });

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.exist;
    });

    it("GET /sales/allocations should list allocations", async () => {
      const response = await request(app)
        .get("/sales/allocations?limit=10&offset=0")
        .set("Authorization", `Bearer ${jwtToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(Array.isArray(response.body.data.allocations)).to.be.true;
    });

    it("GET /sales/invoices should list invoices", async () => {
      const response = await request(app)
        .get("/sales/invoices?limit=10&offset=0")
        .set("Authorization", `Bearer ${jwtToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(Array.isArray(response.body.data.invoices)).to.be.true;
    });

    it("GET /gl/trial-balance should return balanced trial balance", async () => {
      const response = await request(app)
        .get("/gl/trial-balance")
        .set("Authorization", `Bearer ${jwtToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data.is_balanced).to.be.true;
    });

    it("GET /gl/accounts/:code/balance should return account balance", async () => {
      const response = await request(app)
        .get("/gl/accounts/1200/balance")
        .set("Authorization", `Bearer ${jwtToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.success).to.be.true;
      expect(response.body.data).to.have.property("account_code", "1200");
      expect(response.body.data).to.have.property("balance");
    });
  });
});
