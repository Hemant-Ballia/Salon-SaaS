# SaaS Appointment Booking Platform API

A production-grade backend for a multi-tenant SaaS appointment booking system. Built with Node.js, Express, Prisma, and PostgreSQL.

## Features & Architecture

### 1. Multi-Tenant Architecture (Business Isolation)
The system strictly enforces data isolation at the ORM/Controller level. `BUSINESS` users can only view, manage, and report on their own customers, staff, queues, appointments, and payments. A `STAFF` user has restricted access within their assigned business. Only `ADMIN` users can access platform-wide analytics and aggregate data.

### 2. Comprehensive Role-Based Access Control (RBAC)
There are exactly 4 immutable roles:
- `ADMIN`: Platform owner. Manages businesses, platform settings, and platform-wide queues.
- `BUSINESS`: Business owner. Manages their own staff, services, appointments, and payments.
- `STAFF`: Employee at a specific business. Can call/serve queue entries and view their schedule.
- `CUSTOMER`: End-user. Books appointments and joins queues. Can only see their own private data.

### 3. Authentication & Security
- **JWT (HTTP-Only Cookies)**: State-less, secure authentication using access and refresh tokens.
- **OTP Verification**: Built-in verification for email/phone. Handled natively within the auth flow.
- **Strict Validations**: Input payloads and query parameters are aggressively validated using `zod`.
- **Idempotency**: All webhook and payment-related transitions are designed to handle duplicate events safely.
- **Zero Secrets**: Configured strictly to NEVER return password hashes or secrets in any API response, nor log them in audit logs.

### 4. Real-time Queue System (Socket.IO)
- Integrates a real-time ticketing system for walk-ins.
- Employs strict business-level room isolation (`business:<uuid>`) so events are never leaked to other tenants.
- Calculates estimated wait times using a 10-entry rolling average of completion durations.
- Token generation is thread-safe and atomic via Prisma's `$transaction` and `MAX() + 1` logic.

### 5. Payments & Subscriptions
- Integrates **Razorpay** for order creation, verification, and refunds.
- Webhook processor uses strict HMAC SHA256 signature verification over raw request payloads (`express.raw()`).
- Prevents price tampering by computing the required amount strictly server-side from `appointment.totalAmount`.
- Includes a SaaS Subscription engine managing `FREE/BASIC/PRO/PREMIUM` plans and `ACTIVE/TRIAL/PAST_DUE` lifecycle states.

### 6. Background Jobs & Graceful Fallbacks (BullMQ + Redis)
- Background processing for emails, notifications, queue cleanups, and payment reconciliations.
- Designed with **Optional Redis Degradation**: If Redis is unreachable during local development, the API wraps BullMQ to fail gracefully, dropping the job but keeping the core HTTP API alive without crashing.

### 7. Notifications & QR Codes
- Users can subscribe/unsubscribe via detailed notification preferences.
- Secure QR code generation via randomly generated tokens to prevent ID enumeration.

## Setup & Execution

### Prerequisites
- Node.js v18+
- PostgreSQL database
- (Optional) Redis (for BullMQ)

### 1. Environment Variables
Create a `.env` file in the root directory:
```env
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"

# Auth
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"

# Redis (Optional — backend won't crash if missing)
REDIS_URL="redis://localhost:6379"

# Razorpay (Optional — backend stubs responses if missing)
RAZORPAY_KEY_ID=""
RAZORPAY_KEY_SECRET=""
RAZORPAY_WEBHOOK_SECRET=""
```

### 2. Database Initialization
```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 3. Running the Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 4. Health Check
```bash
curl http://localhost:5000/api/v1/health
```

## API Structure

The application is structured into domain-specific modules inside `src/modules/`:
- **Auth**: `/api/v1/auth` (Login, Register, OTP, Password Reset)
- **Businesses**: `/api/v1/businesses` (CRUD, Dashboard)
- **Staff**: `/api/v1/staff`
- **Customers**: `/api/v1/customers`
- **Services**: `/api/v1/services`
- **Appointments**: `/api/v1/appointments`
- **Queues**: `/api/v1/queues`
- **Payments**: `/api/v1/payments` (Razorpay creation, Verification, Webhook)
- **Subscriptions**: `/api/v1/subscriptions`
- **Notifications**: `/api/v1/notifications`
- **QR**: `/api/v1/qr`
- **Admin**: `/api/v1/admin` (Platform-wide data retrieval, Audit logs)
