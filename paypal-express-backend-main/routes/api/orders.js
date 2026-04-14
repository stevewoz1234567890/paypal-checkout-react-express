const express = require('express');
const router = express.Router();
const axios = require("axios");
const qs = require('qs');

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, BASE_URL } = process.env;

/**
 * Generate an OAuth 2.0 access token for authenticating with PayPal REST APIs.
 * @see https://developer.paypal.com/api/rest/authentication/
 */
const generateAccessToken = async () => {
    try {
        if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
            throw new Error("MISSING_API_CREDENTIALS");
        }
        if (!BASE_URL) {
            throw new Error("MISSING_BASE_URL");
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

        return response.data.access_token;
    } catch (error) {
        console.error("Failed to generate Access Token:", error);
        throw error;
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

    let payload = {};
    if (purchase_info.paymentmethod === '_deposit') {
        payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: String(purchase_info.amount).trim(),
                    },
                },
            ],
        };
    } else if (purchase_info.paymentmethod === '_withdraw') {
        // Payout goes to payee when the customer completes checkout in the PayPal button.
        // Do not send credentials in API payloads; use sandbox accounts for testing.
        const payeeEmail = String(purchase_info.email).trim();
        payload = {
            intent: "CAPTURE",
            purchase_units: [
                {
                    amount: {
                        currency_code: "USD",
                        value: String(purchase_info.amount).trim(),
                    },
                    payee: {
                        email_address: payeeEmail,
                    },
                },
            ],
        };
    }

    const accessToken = await generateAccessToken();
    const url = `${BASE_URL}/v2/checkout/orders`;

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

function handleResponse(response) {
    return {
        jsonResponse: response.data,
        httpStatusCode: response.status,
    };
}

function badRequest(res, message) {
    return res.status(400).json({ error: message });
}

/**
 * Validates input before calling PayPal (OAuth must not run first, or clients see misleading errors).
 */
function validatePurchaseInfo(purchase_info) {
    if (!purchase_info || typeof purchase_info !== "object") {
        return "purchase_info is required.";
    }
    const { paymentmethod, amount, email } = purchase_info;
    if (paymentmethod !== "_deposit" && paymentmethod !== "_withdraw") {
        return "paymentmethod must be _deposit or _withdraw.";
    }
    if (amount === undefined || amount === null || String(amount).trim() === "") {
        return "amount is required.";
    }
    const value = String(amount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(value)) {
        return "amount must be a positive decimal with at most 2 fractional digits (e.g. 10 or 10.00).";
    }
    if (paymentmethod === "_withdraw") {
        const payee = email != null ? String(email).trim() : "";
        if (!payee) {
            return "email (payee) is required for _withdraw.";
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payee)) {
            return "email must be a valid payee email address.";
        }
    }
    return null;
}

router.post("/", async (req, res) => {
    try {
        const { purchase_info } = req.body;
        const validationError = validatePurchaseInfo(purchase_info);
        if (validationError) {
            return badRequest(res, validationError);
        }
        const { jsonResponse, httpStatusCode } = await createOrder(purchase_info);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to create order:", error);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        if (error.message === "MISSING_API_CREDENTIALS" || error.message === "MISSING_BASE_URL") {
            return res.status(500).json({ error: "Server PayPal credentials or BASE_URL are not configured." });
        }
        if (error.message === "MISSING_PAYEE_EMAIL") {
            return badRequest(res, "email (payee) is required for _withdraw.");
        }
        res.status(500).json({ error: "Failed to create order." });
    }
});

router.post("/:orderID/capture", async (req, res) => {
    try {
        const { orderID } = req.params;
        const { jsonResponse, httpStatusCode } = await captureOrder(orderID);
        res.status(httpStatusCode).json(jsonResponse);
    } catch (error) {
        console.error("Failed to capture order:", error);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ error: "Failed to capture order." });
    }
});

module.exports = router;