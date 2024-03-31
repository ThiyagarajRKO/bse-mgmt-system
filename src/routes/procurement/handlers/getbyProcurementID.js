export const Get = ({ procurement_id }, session, fastify) => {
    return new Promise(async (resolve, reject) => {
        try {
            // Construct the URL with procurement_lot as a query parameter
            let url = "/api/v1/procurement/getbyProcurementID";
            let data = { procurement_lot: procurement_id }; // Adjust parameter name here

            // Make the AJAX request with the constructed URL and data
            $.ajax({
                url: url,
                method: 'GET',
                data: data,
                success: function (procurement) {
                    if (!procurement) {
                        return reject({
                            statusCode: 420,
                            message: "No roles found!",
                        });
                    }
                    resolve({
                        data: procurement,
                    });
                },
                error: function (xhr, status, error) {
                    console.error('Error fetching procurement data:', error);
                    reject(error);
                }
            });
        } catch (err) {
            fastify.log.error(err);
            reject(err);
        }
    });
};
