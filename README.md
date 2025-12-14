<a href="https://www.toite.ee/" target="_blank" rel="noopener">
  <img src="docs/logo.png" alt="Toite Logo" width="150">
</a>

## Restaurant Management Backend API

A modern, scalable backend for restaurant management built with NestJS and Fastify

<a href="https://github.com/Toite-app/backend/blob/main/LICENSE"><img src="https://img.shields.io/github/license/Toite-app/backend" alt="License"/></a>
<a href="https://github.com/Toite-app/backend/commits/main"><img src="https://img.shields.io/github/last-commit/Toite-app/backend" alt="Last Commit"/></a>
<a href="https://sonarcloud.io/summary/new_code?id=Toite-app_backend"><img src="https://sonarcloud.io/api/project_badges/measure?project=Toite-app_backend&metric=security_rating" alt="Security Rating"/></a>
<a href="https://sonarcloud.io/summary/new_code?id=Toite-app_backend"><img src="https://sonarcloud.io/api/project_badges/measure?project=Toite-app_backend&metric=sqale_rating" alt="Maintainability Rating"/></a>
<a href="https://sonarcloud.io/summary/new_code?id=Toite-app_backend"><img src="https://sonarcloud.io/api/project_badges/measure?project=Toite-app_backend&metric=bugs" alt="Bugs"/></a>
<a href="https://hub.docker.com/r/toite/backend"><img src="https://img.shields.io/docker/pulls/toite/backend" alt="Docker Pulls"/></a>

---

## 🥔 Live Demo

See live demo with seed data on <https://demo.toite.ee/>. Use Credentials:

- **Username:** `admin`
- **Password:** `123456`

<a href="https://demo.toite.ee/api/docs">
  <img src="docs/frontend-dispatcher.png" alt="Swagger API Documentation" width="800">
</a>

All data are shared across everyone but don't worry, I will integrate something better in future.

---

## ⭐ Features

- **Restaurant Management** - Create and manage multiple restaurants with customizable settings
- **Worker/Staff Management** - Handle employees, roles, and permissions
- **Order Management** - Real-time order processing with WebSocket support
- **Menu & Dish Management** - Flexible menu system with categories, modifiers, and pricing
- **Guest Management** - Track and manage customer information
- **Workshift Management** - Schedule and track employee shifts and payments
- **Discount System** - Configurable discounts and promotions
- **Multi-language Support** - Internationalization (i18n) ready
- **File Storage** - S3-compatible file uploads and management

---

## 🔧 Tech Stack

| Category           | Technology                                                                                                                          |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**      | [NestJS](https://nestjs.com/) + [Fastify](https://fastify.dev/)                                                                     |
| **Databases**      | [PostgreSQL](https://www.postgresql.org/) (Drizzle ORM), [MongoDB](https://www.mongodb.com/) (Mongoose), [Redis](https://redis.io/) |
| **Authentication** | JWT + Cookie-based sessions                                                                                                         |
| **Queue**          | [BullMQ](https://bullmq.io/)                                                                                                        |
| **Storage**        | S3-compatible (AWS S3, MinIO, etc.)                                                                                                 |
| **Real-time**      | [Socket.io](https://socket.io/)                                                                                                     |
| **Validation**     | [Zod](https://zod.dev/) + class-validator                                                                                           |
| **Documentation**  | [Swagger/OpenAPI](https://swagger.io/)                                                                                              |

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 22+ (see `.nvmrc`)
- [Yarn](https://yarnpkg.com/) package manager
- [Docker](https://www.docker.com/) (for databases)
- PostgreSQL, MongoDB, and Redis instances

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/Toite-app/backend.git
cd backend
```

2. **Install dependencies**

```bash
yarn install
```

3. **Configure environment**

```bash
cp .example.env .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables)).

4. **Run database migrations**

```bash
yarn db:migrate
```

5. **Start the development server**

```bash
yarn start:dev
```

The API will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/docs`.

---

## Environment Variables

Create a `.env` file based on `.example.env`:

| Variable                 | Description                       | Example                                                      |
| ------------------------ | --------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`               | Environment mode                  | `development`                                                |
| `PORT`                   | Server port                       | `3000`                                                       |
| **Security**             |                                   |                                                              |
| `JWT_SECRET`             | Secret key for JWT tokens         | (generate a secure string)                                   |
| `JWT_GRACE_PERIOD`       | Token grace period in seconds     | `60`                                                         |
| `JWT_REFRESH_INTERVAL`   | Token refresh interval in seconds | `900`                                                        |
| `JWT_EXPIRES_IN`         | Token expiration in seconds       | `2678400`                                                    |
| `CSRF_SECRET`            | CSRF protection secret            | (generate a secure string)                                   |
| `COOKIES_SECRET`         | Cookie signing secret             | (generate a secure string)                                   |
| `INITIAL_ADMIN_PASSWORD` | Initial admin password            | (secure password)                                            |
| **Databases**            |                                   |                                                              |
| `POSTGRESQL_URL`         | PostgreSQL connection string      | `postgresql://user:pass@localhost:5432/toite`                |
| `MONGO_URL`              | MongoDB connection string         | `mongodb://user:pass@localhost:27017/toite?authSource=admin` |
| `REDIS_URL`              | Redis connection string           | `redis://:password@localhost:6379`                           |
| **External APIs**        |                                   |                                                              |
| `DADATA_API_TOKEN`       | DaData API token                  | (your token)                                                 |
| `GOOGLE_MAPS_API_KEY`    | Google Maps API key               | (your key)                                                   |
| **S3 Storage**           |                                   |                                                              |
| `S3_ACCESS_KEY_ID`       | S3 access key                     | `minioadmin`                                                 |
| `S3_SECRET_ACCESS_KEY`   | S3 secret key                     | `minioadmin`                                                 |
| `S3_BUCKET_NAME`         | S3 bucket name                    | `toite`                                                      |
| `S3_ENDPOINT`            | S3 endpoint URL                   | `http://localhost:9000`                                      |
| `S3_REGION`              | S3 region                         | `us-east-1`                                                  |

---

## Available Scripts

| Command            | Description                              |
| ------------------ | ---------------------------------------- |
| `yarn start:dev`   | Start development server with hot reload |
| `yarn start:debug` | Start with debugger attached             |
| `yarn build`       | Build for production                     |
| `yarn start:prod`  | Start production server                  |
| `yarn lint`        | Lint and fix code                        |
| `yarn format`      | Format code with Prettier                |
| `yarn test`        | Run unit tests                           |
| `yarn test:e2e`    | Run end-to-end tests                     |
| `yarn test:cov`    | Run tests with coverage                  |
| `yarn db:generate` | Generate database migrations             |
| `yarn db:migrate`  | Run database migrations                  |
| `yarn db:push`     | Push schema changes to database          |
| `yarn db:studio`   | Open Drizzle Studio                      |
| `yarn bench`       | Run k6 benchmarks                        |

---

## Docker

### Using Pre-built Image

Pull and run the official Docker image from [Docker Hub](https://hub.docker.com/r/toite/backend):

```bash
docker pull toite/backend:latest

docker run -d \
  --name toite-backend \
  -p 3000:3000 \
  -e POSTGRESQL_URL="postgresql://..." \
  -e MONGO_URL="mongodb://..." \
  -e REDIS_URL="redis://..." \
  -e JWT_SECRET="your-secret" \
  -e CSRF_SECRET="your-csrf-secret" \
  -e COOKIES_SECRET="your-cookies-secret" \
  -e INITIAL_ADMIN_PASSWORD="your-admin-password" \
  -e DADATA_API_TOKEN="your-token" \
  -e GOOGLE_MAPS_API_KEY="your-key" \
  -e S3_ACCESS_KEY_ID="your-key" \
  -e S3_SECRET_ACCESS_KEY="your-secret" \
  -e S3_BUCKET_NAME="toite" \
  -e S3_ENDPOINT="http://minio:9000" \
  -e S3_REGION="us-east-1" \
  toite/backend:latest
```

### Building Locally

```bash
docker build -t toite-backend .
docker run -d --name toite-backend -p 3000:3000 --env-file .env toite-backend
```

---

## API Documentation

Interactive API documentation is available via Swagger UI:

- **Development:** `http://localhost:3000/docs`
- **Live Demo:** [demo.toite.ee/api/docs](https://demo.toite.ee/api/docs)

The API is organized into the following main sections:

- `auth` - Authentication endpoints
- `workers` - Staff management
- `restaurants` - Restaurant operations
- `guests` - Customer management
- `orders` - Order processing
- `dishes` - Menu items
- `workshifts` - Shift management

---

## Project Structure

```
src/
├── @base/              # Base infrastructure modules
│   ├── audit-logs/     # Activity logging
│   ├── cache/          # Caching layer
│   ├── drizzle/        # Database ORM & migrations
│   ├── encryption/     # Encryption utilities
│   ├── redis/          # Redis utilities
│   ├── redlock/        # Distributed locking
│   ├── s3/             # File storage
│   └── snapshots/      # Data snapshots
├── @core/              # Core utilities & config
├── @socket/            # WebSocket gateway
├── auth/               # Authentication module
├── dishes/             # Dish management
├── dish-categories/    # Dish categories
├── dishes-menus/       # Menu management
├── discounts/          # Discount system
├── files/              # File handling
├── guests/             # Guest management
├── orders/             # Order processing
├── payment-methods/    # Payment methods
├── restaurants/        # Restaurant management
├── timezones/          # Timezone utilities
├── workers/            # Staff management
├── workshifts/         # Workshift management
├── i18n/               # Internationalization
├── app.module.ts       # Root module
└── main.ts             # Application entry
```

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code:

- Passes all tests (`yarn test`)
- Follows the existing code style (`yarn lint`)
- Includes appropriate documentation

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Made by <a href="https://www.yefro.dev/">Yefrosynii Kolenko</a>
</p>
