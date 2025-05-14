# GhostliAI API Documentation

## Cryptocurrency Payment API Endpoints

### Authentication

Most endpoints require JWT authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_token>
```

### User Wallets

#### Get All User Wallets

```
GET /api/crypto/wallets
```

Returns all cryptocurrency wallets associated with the authenticated user.

**Response Example:**
```json
{
  "success": true,
  "wallets": [
    {
      "id": 1,
      "cryptoType": "bitcoin",
      "walletAddress": "bc1q...",
      "isActive": true,
      "balance": "0.00000000",
      "lastChecked": "2025-05-13T20:00:00.000Z"
    },
    {
      "id": 2,
      "cryptoType": "solana",
      "walletAddress": "9xj7...",
      "isActive": true,
      "balance": "0.00000000",
      "lastChecked": "2025-05-13T20:00:00.000Z"
    }
  ]
}
```

#### Get Wallet by ID

```
GET /api/crypto/wallets/:walletId
```

Returns details for a specific wallet by ID.

**Response Example:**
```json
{
  "success": true,
  "wallet": {
    "id": 1,
    "cryptoType": "bitcoin",
    "walletAddress": "bc1q...",
    "isActive": true,
    "balance": "0.00000000",
    "lastChecked": "2025-05-13T20:00:00.000Z"
  }
}
```

#### Get Wallet by Cryptocurrency Type

```
GET /api/crypto/wallets/type/:cryptoType
```

Returns the wallet for a specific cryptocurrency type (bitcoin, solana, usdt_erc20, usdt_trc20).

**Response Example:**
```json
{
  "success": true,
  "wallet": {
    "id": 1,
    "cryptoType": "bitcoin",
    "walletAddress": "bc1q...",
    "isActive": true,
    "balance": "0.00000000",
    "lastChecked": "2025-05-13T20:00:00.000Z"
  }
}
```

#### Setup Wallets

```
POST /api/crypto/wallets/setup
```

Creates cryptocurrency wallets for all supported cryptocurrencies for the authenticated user.

**Response Example:**
```json
{
  "success": true,
  "message": "Crypto wallets setup complete",
  "wallets": [
    {
      "id": 1,
      "cryptoType": "bitcoin",
      "walletAddress": "bc1q...",
      "isActive": true
    },
    {
      "id": 2,
      "cryptoType": "solana",
      "walletAddress": "9xj7...",
      "isActive": true
    }
  ]
}
```

### Payment Management

#### Create Payment Request

```
POST /api/crypto/payment/request
```

**Request Body:**
```json
{
  "planId": 1,
  "cryptoType": "bitcoin"
}
```

Creates a payment request for a subscription plan using the specified cryptocurrency.

**Response Example:**
```json
{
  "success": true,
  "paymentInfo": {
    "walletAddress": "bc1q...",
    "cryptoType": "bitcoin",
    "amountCrypto": "0.00450000",
    "amountUsd": "199.99",
    "expiresAt": "2025-05-14T22:00:00.000Z",
    "referenceId": "a1b2c3d4e5f6"
  }
}
```

#### Verify Payment

```
POST /api/crypto/payment/verify
```

**Request Body:**
```json
{
  "transactionHash": "0x123...",
  "cryptoType": "bitcoin",
  "walletId": 1
}
```

Verifies a cryptocurrency payment transaction.

**Response Example:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "transactionHash": "0x123...",
    "cryptoType": "bitcoin",
    "amount": "0.00450000",
    "status": "confirmed",
    "confirmations": 6
  },
  "status": "confirmed",
  "confirmations": 6,
  "message": "Transaction confirmed and payment processed"
}
```

#### Get Pending Payment

```
GET /api/crypto/payment/pending
```

Returns any pending payment request for the authenticated user.

**Response Example:**
```json
{
  "success": true,
  "hasPendingPayment": true,
  "payment": {
    "id": 1,
    "planId": 1,
    "cryptoType": "bitcoin",
    "walletAddress": "bc1q...",
    "amountCrypto": "0.00450000",
    "amountUsd": "199.99",
    "expiresAt": "2025-05-14T22:00:00.000Z",
    "status": "pending"
  }
}
```

### Transaction History

#### Get User Transactions

```
GET /api/crypto/transactions
```

Returns the transaction history for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of transactions to return (default: 20)
- `offset` (optional): Pagination offset (default: 0)

**Response Example:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": 1,
      "cryptoType": "bitcoin",
      "transactionHash": "0x123...",
      "amount": "0.00450000",
      "amountUsd": "199.99",
      "status": "confirmed",
      "confirmations": 6,
      "blockHeight": 800000,
      "blockTime": "2025-05-13T21:30:00.000Z",
      "createdAt": "2025-05-13T21:25:00.000Z"
    }
  ],
  "total": 1
}
```

#### Get Transaction by ID

```
GET /api/crypto/transactions/:transactionId
```

Returns details for a specific transaction by ID.

**Response Example:**
```json
{
  "success": true,
  "transaction": {
    "id": 1,
    "cryptoType": "bitcoin",
    "transactionHash": "0x123...",
    "amount": "0.00450000",
    "amountUsd": "199.99",
    "status": "confirmed",
    "confirmations": 6,
    "blockHeight": 800000,
    "blockTime": "2025-05-13T21:30:00.000Z",
    "createdAt": "2025-05-13T21:25:00.000Z"
  }
}
```

### Webhook API

#### Payment Notification Webhook

```
POST /api/crypto/webhook/payment-notification
```

**Request Headers:**
```
X-Webhook-Secret: your_webhook_secret
```

**Request Body:**
```json
{
  "transactionHash": "0x123...",
  "cryptoType": "bitcoin",
  "walletAddress": "bc1q...",
  "amount": "0.00450000",
  "confirmations": 6,
  "blockHeight": 800000,
  "blockTime": 1715607300,
  "gatewayProvider": "blockchair"
}
```

Processes cryptocurrency payment notifications from external services or blockchain monitors.

**Response Example:**
```json
{
  "success": true,
  "message": "Payment notification processed successfully",
  "transactionId": 1
}
```

### Admin Only

#### Update Exchange Rates

```
POST /api/crypto/exchange-rates/update
```

Updates the exchange rates for all supported cryptocurrencies. Requires admin role.

**Response Example:**
```json
{
  "success": true,
  "message": "Exchange rates updated",
  "rates": [
    {
      "cryptoType": "bitcoin",
      "rateUsd": "54321.87000000",
      "lastUpdated": "2025-05-13T22:30:00.000Z"
    },
    {
      "cryptoType": "solana",
      "rateUsd": "178.50000000",
      "lastUpdated": "2025-05-13T22:30:00.000Z"
    }
  ]
}
```