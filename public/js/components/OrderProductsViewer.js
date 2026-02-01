/**
 * OrderProductsViewer Component
 * Displays order products in a DataTable with server-side processing
 */
class OrderProductsViewer {
  constructor(containerId, orderId) {
    this.containerId = containerId;
    this.orderId = orderId;
    this.table = null;
    this.init();
  }

  init() {
    this.render();
    this.initializeDataTable();
  }

  render() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`Container with ID ${this.containerId} not found`);
      return;
    }

    container.innerHTML = `
      <div class="order-products-section">
        <div class="section-header">
          <h4><i class="fas fa-boxes"></i> Order Products</h4>
          <p class="text-muted">View and manage products for this order</p>
        </div>

        <div class="table-responsive">
          <table id="orderProductsTable" class="table table-striped table-bordered" style="width:100%">
            <thead class="table-dark">
              <tr>
                <th>ID</th>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Discount</th>
                <th>Total Price</th>
                <th>Description</th>
                <th>Delivery Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody></tbody>
          </table>
        </div>
      </div>
    `;
  }

  initializeDataTable() {
    const self = this;

    this.table = $("#orderProductsTable").DataTable({
      serverSide: true,
      processing: true,
      ajax: {
        url: `/order/product`,
        type: "GET",
        data: function (d) {
          return {
            order_id: self.orderId,
            start: d.start,
            length: d.length,
            draw: d.draw,
            "search[value]": d.search.value,
          };
        },
        error: function (xhr, error, thrown) {
          console.error("DataTable AJAX error:", error, thrown);
          toastr.error("Failed to load order products data");
        },
      },
      columns: [
        { data: "id", visible: false },
        {
          data: "ProductMaster.product_name",
          defaultContent: "N/A",
          render: function (data, type, row) {
            return data || "N/A";
          },
        },
        {
          data: "quantity",
          render: function (data, type, row) {
            return data ? data.toLocaleString() : "0";
          },
        },
        {
          data: "price",
          render: function (data, type, row) {
            return data
              ? "₹" +
                  data.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
              : "₹0.00";
          },
        },
        {
          data: "discount",
          render: function (data, type, row) {
            return data
              ? "₹" +
                  data.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
              : "₹0.00";
          },
        },
        {
          data: "total_price",
          render: function (data, type, row) {
            if (data) {
              return (
                "₹" +
                data.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })
              );
            }
            // Calculate total if not provided
            const quantity = row.quantity || 0;
            const price = row.price || 0;
            const total = quantity * price;
            return (
              "₹" +
              total.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            );
          },
        },
        {
          data: "description",
          defaultContent: "",
          render: function (data, type, row) {
            return data || "-";
          },
        },
        {
          data: "delivery_status",
          render: function (data, type, row) {
            const status = data || "Pending";
            let badgeClass = "badge-secondary";

            switch (status.toLowerCase()) {
              case "delivered":
                badgeClass = "badge-success";
                break;
              case "in_transit":
              case "shipped":
                badgeClass = "badge-info";
                break;
              case "pending":
                badgeClass = "badge-warning";
                break;
              case "cancelled":
                badgeClass = "badge-danger";
                break;
            }

            return `<span class="badge ${badgeClass}">${status}</span>`;
          },
        },
        {
          data: "created_at",
          render: function (data, type, row) {
            if (data) {
              return new Date(data).toLocaleString("en-IN");
            }
            return "-";
          },
        },
      ],
      pageLength: 10,
      lengthMenu: [
        [10, 25, 50, 100],
        [10, 25, 50, 100],
      ],
      order: [[8, "desc"]], // Sort by created_at descending
      responsive: true,
      language: {
        processing: '<i class="fas fa-spinner fa-spin"></i> Loading...',
        emptyTable: "No order products found",
        zeroRecords: "No matching products found",
      },
      initComplete: function () {
        // Add custom styling
        $(".dataTables_wrapper").addClass("order-products-wrapper");
      },
    });
  }

  refresh() {
    if (this.table) {
      this.table.ajax.reload();
    }
  }

  destroy() {
    if (this.table) {
      this.table.destroy();
      this.table = null;
    }
  }
}

// Export for use in other files
window.OrderProductsViewer = OrderProductsViewer;
