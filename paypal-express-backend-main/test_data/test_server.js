const qs = require('qs');
// const paypal = require('paypal-rest-sdk');
const paypal = require('@paypal/checkout-server-sdk');
const axios = require("axios");

// // PayPal OAuth 2.0 configuration
// const PAYPAL_REDIRECT_URI = 'http://localhost:5000/callback'; // Update with your redirect URI
// const PAYPAL_AUTHORIZATION_URL = 'https://api.paypal.com/v1/oauth2/token';
const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_CLIENT_EMAIL } = process.env;

// // Route for initiating the OAuth 2.0 authorization flow
// app.get('/login', (req, res) => {
//   const queryParams = qs.stringify({
//     client_id: PAYPAL_CLIENT_ID,
//     response_type: 'code',
//     scope: `'openid profile email'`, // Update with the scopes your application requires
//     redirect_uri: PAYPAL_REDIRECT_URI
//   });
//   res.redirect(`https://www.paypal.com/signin/authorize?${queryParams}`);
// });

// // Route for handling the callback from PayPal after user authentication
// app.get('/callback', async (req, res) => {
//   const code = req.query.code;

//   // Exchange authorization code for access token
//   try {
//     console.log("!!!!!!!!!!!!!!!!", code);
//     const response = await axios.post(PAYPAL_AUTHORIZATION_URL, qs.stringify({
//       grant_type: 'authorization_code',
//       code: code,
//       redirect_uri: PAYPAL_REDIRECT_URI
//     }), {
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded'
//       },
//       auth: {
//         username: PAYPAL_CLIENT_ID,
//         password: PAYPAL_CLIENT_SECRET
//       }
//     });
//     console.log("~~~~~~~~~~~~~", response);
//     // Handle successful response
//     const accessToken = response.data.access_token;
//     res.send(`Access Token: ${accessToken}`);
//   } catch (error) {
//     // Handle error
//     console.error('Error exchanging authorization code for access token:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });
//-------------------------------------------------
// Set up PayPal SDK with your credentials
// paypal.configure({
//     mode: 'sandbox', // Change to 'live' for production
//     client_id: PAYPAL_CLIENT_ID,
//     client_secret: PAYPAL_CLIENT_SECRET
// });

// // OAuth 2.0 Authorization endpoint
// app.get('/authorize', (req, res) => {
//     // Redirect the business account to PayPal's authorization endpoint
//     res.redirect(`https://www.paypal.com/oauth2/authorize?client_id=${paypal.client_id}&response_type=code&scope=openid profile`);
// });

// // Callback route to handle authorization code
// app.get('/callback', async (req, res) => {
//     const code = req.query.code;

//     // Exchange authorization code for an access token
//     const tokenResponse = await paypal.authorization.getToken({ code });
//     console.log("~~~~~~~~~~~", tokenResponse);
//     // Make API request to send funds
//     const paymentResponse = await paypal.payment.create({
//         intent: 'sale',
//         payer: {
//             payment_method: 'paypal'
//         },
//         transactions: [{
//             amount: {
//                 total: '10.00',
//                 currency: 'USD'
//             },
//             description: 'Sending funds to recipient'
//         }],
//         redirect_urls: {
//             return_url: 'https://your-app.com/success',
//             cancel_url: 'https://your-app.com/cancel'
//         }
//     }, { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenResponse.access_token}` });

//     // Handle payment response
//     console.log(paymentResponse);
//     res.send(paymentResponse);
// });
// ---------------------------

// PayPal SDK configuration
const clientId = PAYPAL_CLIENT_ID;
const clientSecret = PAYPAL_CLIENT_SECRET;

const environment = new paypal.core.SandboxEnvironment(clientId, clientSecret);
const client = new paypal.core.PayPalHttpClient(environment);

const loginToPayPal = async () => {
    try {
        const response = await axios.post('https://api.paypal.com/auth/login', {
            // Add any required data for authentication, such as client_id, client_secret, etc.
            // Make sure to replace 'YOUR_CLIENT_ID' and 'YOUR_CLIENT_SECRET' with your actual credentials.
            client_id: PAYPAL_CLIENT_ID,
            client_secret: PAYPAL_CLIENT_SECRET,
            grant_type: 'client_credentials',
        });

        // Handle successful authentication
        console.log('Authentication successful:', response.data);

        // Now you can use the access token provided in the response for further API requests
        const accessToken = response.data.access_token;
        return accessToken;
    } catch (error) {
        // Handle errors
        console.error('Error logging in to PayPal:', error.response ? error.response.data : error.message);
        throw error;
    }
};

// Route to initiate payment
app.post('/send-funds', async (req, res) => {
    try {
        // Example usage
        loginToPayPal()
            .then((accessToken) => {
                // Do something with the access token, such as making authenticated API requests
                console.log('Access Token:', accessToken);
            })
            .catch((error) => {
                // Handle any errors
                console.error('Failed to obtain access token:', error);
            });

        // // Automatically log in to the business account
        // const loginResponse = await axios.post('https://api.paypal.com/auth/login', {
        //     username: process.env.BUSINESS_ACCOUNT_USERNAME,
        //     password: process.env.BUSINESS_ACCOUNT_PASSWORD
        // });

        // // Extract authentication token from the response
        // const authToken = loginResponse.data.token;

        // // Set authentication token in PayPal SDK
        // client.setBearerToken(authToken);

        // // Create payment request
        // const request = new paypal.orders.OrdersCreateRequest();
        // request.prefer('return=representation');
        // request.requestBody({
        //     intent: 'CAPTURE',
        //     purchase_units: [{
        //         amount: {
        //             currency_code: 'USD',
        //             value: '100.00'
        //         },
        //         // payee: {
        //         //     email_address: 'sb-lkfwy30168318@personal.example.com'
        //         // }
        //     }]
        // });

        // // Send payment request
        // const response = await client.execute(request);

        // // Handle successful response
        // res.json(response.result);
    } catch (error) {
        // Handle errors
        console.error('Error sending funds:', error);
        res.status(500).json({ error: 'Failed to send funds' });
    }
});
