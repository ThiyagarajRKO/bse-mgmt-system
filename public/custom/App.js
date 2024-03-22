App = (() => {
  return {
    loadParties: () => {
      let params = {
        state_id: sessionStorage["state_id"],
      };

      $("#partyTable").dataTable({
        serverSide: true,
        searching: false,
        destroy: true,
        sorting: false,
        ajax: {
          url: endpoint + "/parties/allparties",
          type: "POST",
          data: params,
          headers: {
            Authorization: App.getToken(),
          },
        },
        columns: [{ data: null }, { data: "party_name" }, { data: null }],
        columnDefs: [
          {
            targets: [0],
            render: function (data, type, row) {
              return (
                "<i class='fa fa-" +
                data["party_symbol"]["party_logo_name"] +
                " fa-2x my-auto'></i>"
              );
            },
          },
          {
            targets: [2],
            render: function (data, type, row) {
              return (
                "<input type='radio' class = 'pSelect " +
                row["party_name"] +
                "' party_id = " +
                row["id"] +
                " name='select' style='cursor:pointer'/>"
              );
            },
          },
        ],
        drawCallback: function () {},
      });
    },
    viewresult: (state) => {
      let params = {
        state_id: state,
      };

      if (state) {
        $("#viewTable").dataTable({
          serverSide: true,
          destroy: true,
          searching: false,
          sorting: false,
          ajax: {
            url: endpoint + "/result/getresults",
            type: "POST",
            data: params,
            headers: {
              Authorization: App.getToken(),
            },
          },
          columns: [{ data: null }, { data: "party_name" }, { data: "count" }],
          columnDefs: [
            {
              targets: [0],
              class: "noExl",
              render: function (data, type, row) {
                return (
                  "<i class='fa fa-" +
                  data["party_symbol"]["party_logo_name"] +
                  " fa-2x my-auto'></i>"
                );
              },
            },
          ],
        });
      } else {
        $("#viewTable tbody").empty();
      }
    },
    checkToken: () => {
      if (!sessionStorage?.AccessToken) {
        return true;
      } else {
        App.logout();
      }
    },
    checkAccess: () => {
      $.ajax({
        url: "/api/v1/auth/ping",
        method: "GET",
        dataType: "json",
        contentType: "application/json",
        crossDomain: true,
        processData: false,
        error: function () {
          window.location.href = "/";
        },
      });
    },
    logout: () => {
      $.ajax({
        url: "/api/v1/auth/signout",
        method: "GET",
        dataType: "json",
        contentType: "application/json",
        crossDomain: true,
        processData: false,
        success: function () {
          window.location.href = "/";
        },
        error: function (jqXhr, textStatus, errorThrown) {
          if (errorThrown == "Forbidden") {
            toastr["warning"]("Logout Failed!");
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
  };
})();
