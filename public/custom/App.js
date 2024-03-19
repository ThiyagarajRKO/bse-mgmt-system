/** @format */

App = (() => {
  // const endpoint = "http://localhost:4000/api/v1";
  const endpoint = "http://www.evoting.ga:4000/api/v1";
  return {
    login: (Inputusername, InputPassword, InputuserType) => {
      let input_params = {
        username: Inputusername,
        usertype: InputuserType,
        password: InputPassword,
      };
      $.ajax({
        url: endpoint + "/users/login",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: function (data) {
          if (data.role == "Admin") {
            window.location.href = "AdminMain";
          } else {
            window.location.href = "citizenMain";
          }
          sessionStorage.setItem("AccessToken", data.access_token);
          sessionStorage.setItem("username", Inputusername);
          sessionStorage.setItem("state_id", data["payload"]["state_id"]);
        },
        error: function (jqXhr, textStatus, errorThrown) {
          if (errorThrown == "Forbidden") {
            toastr["warning"]("Credential did NOT match");
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
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
    // add parties ajax
    addparties: () => {
      let input_params = {
        party_name: $("#name").val(),
        party_logo_id: $("#party_logo_txt").select2("data")[0].sourceid,
        contact_name: $("#Contactname").val(),
        state_id: $("#state").val(),
        mobile: $("#phno").val(),
        email: $("#email").val(),
        gender: $("#male").is(":checked") == true ? "Male" : "Female",
      };
      $.ajax({
        url: endpoint + "/parties/addparty",
        method: "post",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          $("#name").val("");
          $("#party_logo_txt").val("");
          $("#Contactname").val("");
          $("#phno").val("");
          $("#email").val("");

          toastr["success"]("New Nominee details Inserted successfully");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    // add parties ajax
    editparties: () => {
      let input_params = {
        party_name: $("#name").val(),
        party_logo_id: $("#party_logo_txt").select2("data")[0].sourceid,
        contact_name: $("#Contactname").val(),
        state_id: $("#state").val(),
        mobile: $("#phno").val(),
        email: $("#email").val(),
        gender: $("#Male").is(":checked") == true ? "Male" : "Female",
      };
      $.ajax({
        url: endpoint + "/parties/updateparty",
        method: "post",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          $("#name").val("") &&
            $("#party_logo_txt").val("") &&
            $("#Contactname").val("") &&
            $("#phno").val("") &&
            $("#email").val("");

          toastr["success"]("New Nominee details updated successfully");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          toastr["error"](jqXhr["responseJSON"]);
        },
      });
    },
    // searchparties ajax yet to finish
    searchparties: () => {
      let input_params = {
        mobile: $("#searchResult").val(),
      };
      $.ajax({
        url: endpoint + "/parties/getparty",
        method: "post",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        data: JSON.stringify(input_params),
        contentType: "Application/json",
        crossDomain: true,
        processData: false,
        success: function (data) {
          console.log(data);
          if (data != "") {
            $("#name").val(data.party_name);
            var dataSelect2 = {
              id: data["party_symbol"]["party_logo_name"],
              text: data["party_symbol"]["name"],
            };

            var newOption = new Option(
              dataSelect2.text,
              dataSelect2.id,
              false,
              false
            );
            $("#party_logo_txt").append(newOption).trigger("change");
            $("#party_logo_txt")
              .val(data.party_symbol.party_logo_name)
              .trigger("change");
            $("#Contactname").val(data.contact_name);
            $("#state").val(data.state_id).trigger("change");
            $("#phno").val(data.mobile);
            $("#email").val(data.email);
            $("input").removeAttr("readonly");
            $("input").removeAttr("disabled");
            if (data.gender == "Male") {
              $("#Male").prop("checked", true);
            } else {
              $("#Female").prop("checked", true);
            }
          }
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    // parties
    deleteparty: () => {
      let input_params = {
        mobile: $("#searchResult").val(),
      };
      $.ajax({
        url: endpoint + "/parties/deleteparty",
        method: "post",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: function (data) {
          console.log(data);
          if (data) {
            $("#name").val("");
            $("#party_logo_txt").val("").trigger("change");
            $("#Contactname").val("");
            $("#phno").val("");
            $("#email").val("");
            $("input:ratio[name=gender]").is(":checked") = false;
            toastr["success"]("Nominee successfully deleted");
          }
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },

    getPartiesLogo: () => {
      $.ajax({
        url: endpoint + "/parties/getpartieslogo",
        method: "GET",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        crossDomain: true,
        processData: false,
        success: (data) => {
          $("#party_logo_txt").select2({
            placeholder: "Select Nominee Symbol",
            allowClear: true,
            data,
          });
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    getstate: () => {
      $.ajax({
        url: endpoint + "/state/viewstates",
        method: "POST",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        crossDomain: true,
        processData: false,
        success: (data) => {
          $("#state")
            .select2({
              placeholder: "Select your state",
              allowClear: true,
              data,
            })
            .trigger("change");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    addCitizen: () => {
      let input_params = {
        voterid: $("#voterid").val(),
        name: $("#name").val(),
        dob: $("#password").val(),
        email: $("#email").val(),
        mobile: $("#phno").val(),
        state_id: $("#state").val(),
        gender: $("#radio[name=Male]").is(":checked") ? "Male" : "Female",
      };
      $.ajax({
        url: endpoint + "/citizens/addcitizen",
        method: "POST",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          $("#username").val("");
          $("#voterid").val("");
          $("#phno").val("");
          $("#email").val("");
          $("#name").val("");

          toastr["success"]("New Citizen details Inserted successfully");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    searchCitizen: () => {
      let input_params = {
        voterid: $("#searchResult").val(),
      };
      $.ajax({
        url: endpoint + "/citizens/viewCitizen",
        method: "post",
        headers: {
          Authorization: App.getToken(),
        },
        data: JSON.stringify(input_params),
        contentType: "Application/json",
        crossDomain: true,
        processData: false,
        success: function (data) {
          console.log(data);
          if (data != "") {
            $("#name").val(data.name);
            $("#email").val(data.email);
            $("#username").val(data.username);
            $("#phno").val(data.mobile);
            $("#state").val(data.state_id).trigger("change");

            // $('input:radio[name="optradio"]').val(data.gender);

            $("input").removeAttr("readonly");
            $('input:radio[name="optradio"]').removeAttr("disabled");
            if (data.gender == "Male") {
              $("#Male").prop("checked", true);
            } else {
              $("#Female").prop("checked", true);
            }
          }
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    editCitizen: () => {
      let input_params = {
        name: $("#name").val(),
        username: $("#searchResult").val(),
        voterid: $("#username").val(),
        state_id: $("#state").val(),
        dob: $("#password").val(),
        email: $("#email").val(),
        mobile: $("#phno").val(),
        gender: $("#Male").is(":checked") == true ? "Male" : "Female",
      };
      $.ajax({
        url: endpoint + "/citizens/editCitizen",
        method: "POST",
        dataType: "json",
        headers: {
          Authorization: App.getToken(),
        },
        contentType: "application/json",
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          toastr["success"]("New Citizen details Updated successfully");
          $("input[type=text]").val("");
          $("input[type=date]").val("");
          $("#phno").val("");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    sendResult: () => {
      let input_params = {
        phoneNo: $("#phno").val(),
      };
      $.ajax({
        url: endpoint + "sendResult/editCitizen",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        headers: {
          Authorization: App.getToken(),
        },
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          toastr["success"]("New Citizen details Inserted successfully");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    citizenMain: () => {
      let input_params = {
        Party: $("#radio[name='']").is(":checked") ? "Male" : "Female",
      };
      $.ajax({
        url: endpoint + "sendResult/editCitizen",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        headers: {
          Authorization: App.getToken(),
        },
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          toastr["success"]("New Citizen details Inserted successfully");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    viewresult: (state) => {
      let params = {
        state_id: state,
      };

      //

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

    voting: () => {
      let input_params = {
        party_id: $("#partyTable .pSelect:checked").attr("party_id").trim(),
        username: sessionStorage.getItem("username"),
        state_id: sessionStorage.state_id,
      };

      $.ajax({
        url: endpoint + "/citizens/addvote",
        method: "POST",
        dataType: "json",
        contentType: "application/json",
        headers: {
          Authorization: App.getToken(),
        },
        data: JSON.stringify(input_params),
        crossDomain: true,
        processData: false,
        success: (data) => {
          toastr["success"]("Your vote has been summitted successfully");
          sessionStorage.getItem("username");
        },
        error: (jqXhr, textStatus, errorThrown) => {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    sendotp: function (type, receiver) {
      $.ajax({
        url: endpoint + "/request/send_otp",
        type: "POST",
        headers: {
          Authorization: App.getToken(),
        },
        data: {
          // The key is 'mobile'. This will be the same key in $_POST[] that holds the mobile number value.
          receiver,
          type,
        },
        success: function (msg) {
          $("#send").val("Resend");
          $("#verifydiv").removeAttr("hidden");
          toastr["success"]("OTP has been sent successfully");
          // $("input").removeAttr("readonly");
        },
        error: function (jqXhr, textStatus, errorThrown) {
          $("#send").val("Send");
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    verifyotp: (type, otp, receiver) => {
      $.ajax({
        url: endpoint + "/request/verify_otp",
        type: "POST",
        headers: {
          Authorization: App.getToken(),
        },
        data: {
          // The key is 'mobile'. This will be the same key in $_POST[] that holds the mobile number value.
          type,
          receiver,
          otp,
        },
        success: function (msg) {
          $("#otp").prop("hidden", true);
          $("#verify").prop("hidden", true);
          $("#voterid").removeAttr("hidden");

          $("#credential").val(msg.message.toUpperCase());
        },
        error: function (jqXhr, textStatus, errorThrown) {
          if (jqXhr["status"] == 420) {
            toastr["warning"](jqXhr["responseJSON"]["message"]);
          } else {
            toastr["error"](jqXhr["responseJSON"]["message"]);
          }
        },
      });
    },
    checkToken: () => {
      if (
        sessionStorage.AccessToken != "" &&
        sessionStorage.AccessToken != null
      ) {
        return true;
      } else {
        App.logout();
      }
    },
    logout: () => {
      sessionStorage.clear();
      window.location.href = "/index";
    },
    getToken: () => {
      return sessionStorage.getItem("AccessToken");
    },
  };
})();
