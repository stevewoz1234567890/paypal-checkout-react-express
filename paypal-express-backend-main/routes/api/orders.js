const express = require('express');
const router = express.Router();
const axios = require("axios");
const qs = require('qs');

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_CLIENT_EMAIL, BASE_URL } = process.env;

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }

        const response = await axios(
            {
                method: "POST",
                url: `${BASE_URL}/v1/oauth2/token`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Access-Control-Allow-Credentials': true
                },
                data: qs.stringify({
                    grant_type: 'client_credentials'
                }),
                auth: {
                    username: PAYPAL_CLIENT_ID,
                    password: PAYPAL_CLIENT_SECRET
                }
            });

        const data = await response.data;
        return data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
    }
};

/**
 * Create an order to start the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_create
 */
const createOrder = async (purchase_info) => {
    // purchased information information passed from the front-end to calculate the purchase unit details
    console.log(
        "purchased information passed from the frontend createOrder() callback:",
        purchase_info,
    );

    const accessToken = await generateAccessToken();
    const url = `${BASE_URL}/v2/checkout/orders`;

    let payload = {};
    if (purchase_info.paymentmethod === '_deposit') {
        payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: purchase_info.amount,
                    },
                },
            ],
        };
    } else if (purchase_info.paymentmethod === '_withdraw') {
        payload = {
            intent: "CAPTURE",
            payment_source: {
                paypal: {
                    email_address: PAYPAL_CLIENT_EMAIL,
                    password: 'P!q9Z<5g',
                    account_id: "WV9P4RFREDQBU",
                    account_status: "VERIFIED",
                    name: {
                        given_name: "John",
                        surname: "Doe"
                    },
                    address: {
                        country_code: "US"
                    }
                }
            },
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: purchase_info.amount,
                    },
                    payee: {
                        email_address: purchase_info.email
                    }
                },
            ],
            // payer: {
            //     email_address: PAYPAL_CLIENT_EMAIL
            // },
        };
    }

    const response = await axios(
        {
            url: url,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
                // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                // "PayPal-Mock-Response": '{"mock_application_codes": "MISSING_REQUIRED_PARAMETER"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "PERMISSION_DENIED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
            },
            method: "POST",
            data: payload
        });
    return handleResponse(response);
};


/**
 * Capture payment for the created order to complete the transaction.
 * @see https://developer.paypal.com/docs/api/orders/v2/#orders_capture
 */
const captureOrder = async (orderID) => {
    const accessToken = await generateAccessToken();
    const url = `${BASE_URL}/v2/checkout/orders/${orderID}/capture`;

    const response = await axios(
        {
            url: url,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${accessToken}`,
                // Uncomment one of these to force an error for negative testing (in sandbox mode only). Documentation:
                // https://developer.paypal.com/tools/sandbox/negative-testing/request-headers/
                // "PayPal-Mock-Response": '{"mock_application_codes": "INSTRUMENT_DECLINED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "TRANSACTION_REFUSED"}'
                // "PayPal-Mock-Response": '{"mock_application_codes": "INTERNAL_SERVER_ERROR"}'
            },
        });

    return handleResponse(response);
};

async function handleResponse(response) {
    try {
        const jsonResponse = await response.data;
        return {
            jsonResponse,
            httpStatusCode: response.status,
        };
    } catch (err) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }
}

router.post("/", async (req, res) => {
    try {
        // use the purchase information passed from the front-end to calculate the order amount detals
        const { purchase_info } = req.body;
        const { jsonResponse, httpStatusCode } = await createOrder(purchase_info);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to create order." });
    }
});

router.post("/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        res.status(500).json({ error: "Failed to capture order." });
    }
});

module.exports = router;