# Salesverse Backend

A robust backend service built with Node.js, Express, TypeScript, and MongoDB.

## 🚀 Features

- TypeScript-based Express.js server
- MongoDB with Mongoose ORM
- JWT Authentication with Passport.js
- Swagger API Documentation
- Comprehensive testing setup
- Structured logging with Winston
- Security middleware with Helmet
- CORS support
- Environment-based configuration
- Docker support (coming soon)

## 📁 Project Structure

```
src/
├── app.ts                     # Main application class
├── index.ts                   # Entry point
├── common/                    # Shared utilities and components
│   ├── constants/            # Application constants
│   ├── dto/                  # Data Transfer Objects
│   ├── enums/                # Enumerations
│   ├── exceptions/           # Custom exceptions
│   ├── guards/               # Route guards
│   ├── interfaces/           # Shared interfaces
│   ├── middleware/           # Shared middleware
│   ├── pipes/                # Validation pipes
│   ├── schemas/              # Validation schemas
│   └── utils/                # Utility functions
├── config/                   # Configuration files
├── controllers/              # Base controllers
├── database/                 # Database configuration
├── interfaces/               # Application interfaces
├── middleware/               # Application middleware
├── models/                   # Database models
├── modules/                  # Feature modules
├── providers/               # Service providers
├── services/                # Base services
└── validations/             # Validation schemas
```

## 🛠 Prerequisites

- Node.js (v18 or higher)
- pnpm (v10.11.0 or higher)
- MongoDB (v6 or higher)
- TypeScript knowledge

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd salesverse-be
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit the `.env` file with your configuration.

4. **Start development server**
   ```bash
   pnpm dev
   ```
   The server will start on http://localhost:3000 (or your configured port)

## 🔧 Available Scripts

- `pnpm build` - Build the project using SWC
- `pnpm start` - Start the production server
- `pnpm dev` - Start development server with hot-reload
- `pnpm test` - Run tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report
- `pnpm format` - Format code using Prettier
- `pnpm lint` - Lint code using ESLint
- `pnpm lint:fix` - Fix linting issues
- `pnpm type-check` - Check TypeScript types

## 🧪 Testing

The project uses Jest for testing. Tests are located in the `tests` directory.

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 🔍 Development Guidelines

### Code Style

- We use ESLint and Prettier for code formatting
- Follow the TypeScript strict mode guidelines
- Use absolute imports with `@/` prefix
- Follow SOLID principles
- Write unit tests for new features

### Git Workflow

1. Create a feature branch from `main`

   ```bash
   git checkout -b feature/your-feature
   ```

2. Make your changes and commit using conventional commits

   ```bash
   git commit -m "feat: add new feature"
   ```

3. Push and create a Pull Request

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or modifying tests
- `chore:` - Maintenance tasks

## 📚 API Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## 🔐 Environment Variables

Required environment variables:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/salesverse
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1d
```
