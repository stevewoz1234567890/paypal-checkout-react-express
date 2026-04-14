# PayPal checkout (React)

Create React App front end for PayPal Smart Payment Buttons. The checkout **method**, **amount**, and optional **payee** come from the URL query string (handy for WebViews or deep links).

## Setup

```bash
cp .env.example .env
npm install
npm start
```

Configure:

- `REACT_APP_BASE_URL` — Express API origin, e.g. `http://localhost:5000`  
- `REACT_APP_PAYPAL_CLIENT_ID` — same PayPal **client ID** as the backend app  

Full instructions and example URLs: [root README](../README.md).

## Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Development server (http://localhost:3000) |
| `npm run build` | Optimized production build |
| `npm test` | Run tests (`CI=true npm test -- --watchAll=false` in CI) |

## Query parameters

| Param | Required | Description |
|-------|----------|-------------|
| `method` | Yes | `_deposit` or `_withdraw` |
| `amount` | Yes | Decimal amount (e.g. `10.00`) |
| `email` or `name` | For `_withdraw` | Payee PayPal email |

## Learn more

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). CRA docs: [https://facebook.github.io/create-react-app/docs/getting-started](https://facebook.github.io/create-react-app/docs/getting-started).
