/**
 * GST Calculator Service
 * Handles GST calculations with CGST/SGST/IGST breakup, intra-state vs inter-state logic,
 * and proper rounding per Indian GST rules.
 */

class GSTCalculator {
  /**
   * Standard GST rates for seafood products in India
   * Reference: HSN 0302 (Fish & Crustaceans) typically 5% GST
   */
  static GST_RATES = {
    ZERO: 0, // Export, SEZ supplies
    FIVE: 5, // Seafood (primary)
    TWELVE: 12, // Processed/Value-Added
    EIGHTEEN: 18, // Luxury items, processed
    TWENTY_EIGHT: 28, // Luxury
  };

  /**
   * Determine if two states are the same (intra-state = CGST + SGST)
   * or different (inter-state = IGST)
   * @param {string} supplierState - State code (e.g., "TN", "KA")
   * @param {string} buyerState - State code (e.g., "TN", "KA")
   * @returns {string} "INTRA" or "INTER"
   */
  static determineSupplyType(supplierState, buyerState) {
    if (!supplierState || !buyerState) {
      throw new Error("Both supplierState and buyerState are required");
    }
    const normalizedSupplier = String(supplierState).toUpperCase().trim();
    const normalizedBuyer = String(buyerState).toUpperCase().trim();
    return normalizedSupplier === normalizedBuyer ? "INTRA" : "INTER";
  }

  /**
   * Calculate GST breakdown for an amount
   * @param {Object} params - { amount, gst_rate, supply_type, buyer_state, supplier_state }
   * @returns {Object} GST breakup with proper rounding
   */
  static calculateGST({
    amount,
    gst_rate = 5,
    supply_type = null,
    buyer_state = null,
    supplier_state = null,
  }) {
    const cleanAmount = parseFloat(amount || 0);
    const cleanRate = parseFloat(gst_rate || 0);

    if (cleanAmount < 0) {
      throw new Error("Amount cannot be negative");
    }

    if (cleanRate < 0 || cleanRate > 28) {
      throw new Error("GST rate must be between 0 and 28");
    }

    // Export or zero-rated supplies
    if (cleanRate === 0) {
      return {
        taxable_amount: cleanAmount,
        cgst_rate: 0,
        cgst_amount: 0,
        sgst_rate: 0,
        sgst_amount: 0,
        igst_rate: 0,
        igst_amount: 0,
        cess_rate: 0,
        cess_amount: 0,
        total_gst: 0,
        invoice_amount: cleanAmount,
        gst_type: "ZERO_RATED",
        rounding_adjustment: 0,
      };
    }

    let supplyMode = supply_type;

    // Auto-detect supply type if states provided
    if (!supplyMode && supplier_state && buyer_state) {
      supplyMode = this.determineSupplyType(supplier_state, buyer_state);
    }

    if (supplyMode === "INTRA") {
      // Intra-state: CGST = SGST = GST_RATE / 2
      const halfRate = cleanRate / 2;
      const cgstAmount = (cleanAmount * halfRate) / 100;
      const sgstAmount = (cleanAmount * halfRate) / 100;

      // Round each component to nearest paisa (0.01)
      const cgstRounded = Math.round(cgstAmount * 100) / 100;
      const sgstRounded = Math.round(sgstAmount * 100) / 100;
      const totalGST = cgstRounded + sgstRounded;

      // Calculate rounding adjustment (should be negligible)
      const theoreticalTotal =
        Math.round(((cleanAmount * cleanRate) / 100) * 100) / 100;
      const roundingAdjustment =
        Math.round((theoreticalTotal - totalGST) * 10000) / 10000;

      return {
        taxable_amount: cleanAmount,
        cgst_rate: halfRate,
        cgst_amount: cgstRounded,
        sgst_rate: halfRate,
        sgst_amount: sgstRounded,
        igst_rate: 0,
        igst_amount: 0,
        cess_rate: 0,
        cess_amount: 0,
        total_gst: totalGST,
        invoice_amount: Math.round((cleanAmount + totalGST) * 100) / 100,
        gst_type: "INTRA_STATE",
        rounding_adjustment: roundingAdjustment,
      };
    } else if (supplyMode === "INTER" || supplyMode === "IGST") {
      // Inter-state: IGST = GST_RATE (no CGST/SGST)
      const igstAmount = (cleanAmount * cleanRate) / 100;
      const igstRounded = Math.round(igstAmount * 100) / 100;

      return {
        taxable_amount: cleanAmount,
        cgst_rate: 0,
        cgst_amount: 0,
        sgst_rate: 0,
        sgst_amount: 0,
        igst_rate: cleanRate,
        igst_amount: igstRounded,
        cess_rate: 0,
        cess_amount: 0,
        total_gst: igstRounded,
        invoice_amount: Math.round((cleanAmount + igstRounded) * 100) / 100,
        gst_type: "INTER_STATE",
        rounding_adjustment: 0,
      };
    } else {
      throw new Error(
        `Invalid supply_type: ${supplyMode}. Must be "INTRA", "INTER", or "IGST"`,
      );
    }
  }

  /**
   * Calculate GST for multiple line items and provide summary
   * @param {Array} lineItems - Array of { amount, gst_rate, [supply_type] }
   * @param {Object} invoiceContext - { supplier_state, buyer_state }
   * @returns {Object} Aggregated GST summary
   */
  static calculateBulkGST(lineItems = [], invoiceContext = {}) {
    if (!Array.isArray(lineItems)) {
      throw new Error("lineItems must be an array");
    }

    const summary = {
      lines: [],
      total_taxable: 0,
      total_cgst: 0,
      total_sgst: 0,
      total_igst: 0,
      total_cess: 0,
      total_gst: 0,
      invoice_total: 0,
      line_count: 0,
    };

    for (const item of lineItems) {
      const gstBreakup = this.calculateGST({
        amount: item.amount,
        gst_rate: item.gst_rate || 5,
        supply_type: item.supply_type,
        buyer_state: invoiceContext.buyer_state,
        supplier_state: invoiceContext.supplier_state,
      });

      summary.lines.push({
        ...item,
        ...gstBreakup,
      });

      summary.total_taxable += gstBreakup.taxable_amount;
      summary.total_cgst += gstBreakup.cgst_amount;
      summary.total_sgst += gstBreakup.sgst_amount;
      summary.total_igst += gstBreakup.igst_amount;
      summary.total_cess += gstBreakup.cess_amount;
      summary.total_gst += gstBreakup.total_gst;
      summary.invoice_total += gstBreakup.invoice_amount;
      summary.line_count++;
    }

    // Round all totals to nearest paisa
    summary.total_taxable = Math.round(summary.total_taxable * 100) / 100;
    summary.total_cgst = Math.round(summary.total_cgst * 100) / 100;
    summary.total_sgst = Math.round(summary.total_sgst * 100) / 100;
    summary.total_igst = Math.round(summary.total_igst * 100) / 100;
    summary.total_cess = Math.round(summary.total_cess * 100) / 100;
    summary.total_gst = Math.round(summary.total_gst * 100) / 100;
    summary.invoice_total = Math.round(summary.invoice_total * 100) / 100;

    return summary;
  }

  /**
   * Reverse GST calculation: given invoice amount (inclusive), extract taxable amount
   * @param {Object} params - { invoice_amount, gst_rate, supply_type }
   * @returns {Object} GST breakup in reverse
   */
  static reverseGST({ invoice_amount, gst_rate = 5, supply_type = "INTRA" }) {
    const cleanAmount = parseFloat(invoice_amount || 0);
    const cleanRate = parseFloat(gst_rate || 0);

    if (cleanRate === 0) {
      return {
        invoice_amount: cleanAmount,
        taxable_amount: cleanAmount,
        cgst_rate: 0,
        cgst_amount: 0,
        sgst_rate: 0,
        sgst_amount: 0,
        igst_rate: 0,
        igst_amount: 0,
        total_gst: 0,
      };
    }

    if (supply_type === "INTRA") {
      // INTRA: invoice_amount = taxable_amount * (1 + gst_rate/100)
      // taxable_amount = invoice_amount / (1 + gst_rate/100)
      const divisor = 1 + cleanRate / 100;
      const taxableAmount = cleanAmount / divisor;
      const halfRate = cleanRate / 2;
      const cgstAmount = (taxableAmount * halfRate) / 100;
      const sgstAmount = (taxableAmount * halfRate) / 100;

      return {
        invoice_amount: cleanAmount,
        taxable_amount: Math.round(taxableAmount * 100) / 100,
        cgst_rate: halfRate,
        cgst_amount: Math.round(cgstAmount * 100) / 100,
        sgst_rate: halfRate,
        sgst_amount: Math.round(sgstAmount * 100) / 100,
        igst_rate: 0,
        igst_amount: 0,
        total_gst: Math.round((cgstAmount + sgstAmount) * 100) / 100,
      };
    } else if (supply_type === "INTER" || supply_type === "IGST") {
      const divisor = 1 + cleanRate / 100;
      const taxableAmount = cleanAmount / divisor;
      const igstAmount = (taxableAmount * cleanRate) / 100;

      return {
        invoice_amount: cleanAmount,
        taxable_amount: Math.round(taxableAmount * 100) / 100,
        cgst_rate: 0,
        cgst_amount: 0,
        sgst_rate: 0,
        sgst_amount: 0,
        igst_rate: cleanRate,
        igst_amount: Math.round(igstAmount * 100) / 100,
        total_gst: Math.round(igstAmount * 100) / 100,
      };
    } else {
      throw new Error(
        `Invalid supply_type: ${supply_type}. Must be "INTRA", "INTER", or "IGST"`,
      );
    }
  }

  /**
   * Validate GST calculation for compliance
   * @param {Object} gstBreakup - GST calculation result
   * @returns {Object} Validation result with status and messages
   */
  static validateGSTBreakup(gstBreakup) {
    const messages = [];
    let isValid = true;

    if (!gstBreakup) {
      return { isValid: false, messages: ["GST breakup is null or undefined"] };
    }

    // Check: Total invoice amount = taxable + total_gst
    const calculatedTotal = gstBreakup.taxable_amount + gstBreakup.total_gst;
    const expectedTotal = gstBreakup.invoice_amount;
    if (Math.abs(calculatedTotal - expectedTotal) > 0.01) {
      messages.push(
        `Invoice amount mismatch: calculated ${calculatedTotal}, expected ${expectedTotal}`,
      );
      isValid = false;
    }

    // Check: No negative values
    if (
      gstBreakup.taxable_amount < 0 ||
      gstBreakup.cgst_amount < 0 ||
      gstBreakup.sgst_amount < 0 ||
      gstBreakup.igst_amount < 0
    ) {
      messages.push("Negative tax amounts detected");
      isValid = false;
    }

    // Check: Intra-state or inter-state consistency
    if (
      gstBreakup.gst_type === "INTRA_STATE" &&
      (gstBreakup.igst_amount > 0 ||
        gstBreakup.cgst_amount === 0 ||
        gstBreakup.sgst_amount === 0)
    ) {
      messages.push("Intra-state GST must have CGST and SGST, no IGST");
      isValid = false;
    }

    if (
      gstBreakup.gst_type === "INTER_STATE" &&
      (gstBreakup.cgst_amount > 0 ||
        gstBreakup.sgst_amount > 0 ||
        gstBreakup.igst_amount === 0)
    ) {
      messages.push("Inter-state GST must have IGST only, no CGST/SGST");
      isValid = false;
    }

    return { isValid, messages };
  }

  /**
   * Get applicable GST rate for a product based on HSN and category
   * @param {Object} params - { hsn_code, product_category, is_processed }
   * @returns {number} Recommended GST rate
   */
  static getApplicableRate({
    hsn_code,
    product_category,
    is_processed = false,
  }) {
    // Primary seafood (HSN 0302, 0303, 0304, 0305)
    if (
      hsn_code &&
      ["0302", "0303", "0304", "0305"].some((code) =>
        String(hsn_code).startsWith(code),
      )
    ) {
      return is_processed ? 12 : 5; // 5% for raw, 12% for processed
    }

    // Frozen seafood (HSN 0306-0309)
    if (
      hsn_code &&
      ["0306", "0307", "0308", "0309"].some((code) =>
        String(hsn_code).startsWith(code),
      )
    ) {
      return 5;
    }

    // Default for seafood category
    if (product_category === "SEAFOOD" || product_category === "AQUATIC") {
      return is_processed ? 12 : 5;
    }

    // Fallback to 18% for processed/value-added items
    return 18;
  }
}

module.exports = GSTCalculator;
