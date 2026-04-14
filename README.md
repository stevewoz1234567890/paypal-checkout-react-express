# PayPal checkout (React + Express)

Demo integration: a **React** checkout page using the [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/reference/) and an **Express** backend that creates and captures orders with the [PayPal REST API](https://developer.paypal.com/docs/api/orders/v2/).

## Repository layout

| Folder | Role |
|--------|------|
| [`paypal-express-backend-main/`](paypal-express-backend-main/) | Express API: orders + optional MongoDB auth |
| [`paypal-react-frontend-main/`](paypal-react-frontend-main/) | CRA app: checkout UI (query-string driven) |

## Prerequisites

- **Node.js** 18+ recommended  
- A **PayPal developer** [sandbox application](https://developer.paypal.com/dashboard/applications/sandbox) (REST client ID and secret)

## Quick start

### 1. Backend

```bash
cd paypal-express-backend-main
cp .env.example .env
```

Edit `.env` and set at least:

| Variable | Description |
|----------|-------------|
| `PAYPAL_CLIENT_ID` | Sandbox (or live) client ID |
| `PAYPAL_CLIENT_SECRET` | Matching secret |
| `BASE_URL` | `https://api-m.sandbox.paypal.com` for sandbox, or `https://api-m.paypal.com` for live |
| `PORT` | Optional; default `5000` |

```bash
npm install
npm start
```

API root: `http://localhost:5000` (or your `PORT`).

**MongoDB** is optional. If `MONGODB_URI` is not set, PayPal order routes still work. For `/api/auth` and `/api/user` you also need `MONGODB_URI` and `JWT_SECRET`.

### 2. Frontend

```bash
cd paypal-react-frontend-main
cp .env.example .env
```

| Variable | Example | Description |
|----------|---------|-------------|
| `REACT_APP_BASE_URL` | `http://localhost:5000` | Backend origin (no trailing slash) |
| `REACT_APP_PAYPAL_CLIENT_ID` | same as PayPal app | Must match the app used on the server |

```bash
npm install
npm start
```

### 3. Open checkout URLs

| Flow | Example URL |
|------|-------------|
| Simple payment | `http://localhost:3000/?method=_deposit&amount=10.00` |
| Payee on purchase unit | `http://localhost:3000/?method=_withdraw&amount=5.00&email=payee@example.com` |

For withdraw, the payee can be passed as `email` or `name`.

## API (backend)

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/orders` | Create PayPal order (JSON body: `{ "purchase_info": { ... } }`) |
| `POST` | `/api/orders/:orderID/capture` | Capture after buyer approves in the PayPal button |

Validation errors return **400** with `{ "error": "..." }` before any PayPal call.

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| Backend | `npm start` | Run API (`node server`) |
| Frontend | `npm start` | Dev server (port 3000) |
| Frontend | `npm run build` | Production build → `build/` |
| Frontend | `npm test` | Jest tests (`CI=true` for CI) |

## Security

- Do not commit `.env` files or production secrets.  
- Use **sandbox** credentials until you deliberately switch `BASE_URL` and keys to **live**.

## More detail

- Backend: [`paypal-express-backend-main/README.md`](paypal-express-backend-main/README.md)  
- Frontend: [`paypal-react-frontend-main/README.md`](paypal-react-frontend-main/README.md)
