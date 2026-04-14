# PayPal Express API

Express server for PayPal **Orders v2** (create + capture) and optional user auth backed by MongoDB.

## Setup

```bash
cp .env.example .env
npm install
npm start
```

See the [root README](../README.md) for environment variables and how to run with the React app.

## Routes

- `GET /` — health text  
- `POST /api/orders` — create order (`purchase_info`: `_deposit` or `_withdraw`, amount, and for withdraw payee `email`)  
- `POST /api/orders/:orderID/capture` — capture order  
- `POST /api/auth/register` · `POST /api/auth/login` — require `MONGODB_URI` + `JWT_SECRET`  
- `GET /api/user` · `POST /api/user/updatebalance` — require auth + MongoDB  

## Dev

```bash
npm run server   # nodemon (if installed globally / via npx)
```

Default port: **5000** (`PORT` in `.env`).
