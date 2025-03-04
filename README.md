# Blockmetric Analytics

Blockmetric is a powerful, privacy-focused web analytics platform designed to provide detailed insights into website traffic and user behavior while maintaining data sovereignty and compliance.

## Technology Stack

### Backend
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **MySQL** - Primary database
- **TypeScript** - Type-safe programming language

### Frontend
- **React** - UI library
- **Vite** - Build tool and development server
- **TypeScript** - Type-safe programming language
- **Redux Toolkit** - State management

### SDKs
- **Web SDK** (JavaScript)
- **Desktop SDK** (Electron)
- **Flutter SDK** (Mobile/Cross-platform)

## Docker Setup

### Prerequisites
- Docker Engine (v20.10 or higher)
- Docker Compose (v2.0 or higher)
- Git

### Windows Server Docker Installation References
- [Installing Docker on Windows Server 2022/2019](https://www.baeldung.com/ops/docker-windows-server-configuration) 

### Container Architecture
The application is containerized using Docker with three main services:
1. **Frontend** - React application served through Nginx
2. **Backend** - Node.js API server
3. **MySQL** - Database server

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd blockmetric
   ```

2. Configure environment variables:
   - Copy example environment files for each service
   - Update configurations as needed

3. Build and start containers:
   ```bash
   docker-compose up --build
   ```

   This will:
   - Build all service images
   - Create and start containers
   - Set up the network
   - Initialize the database with schema

4. Access the services:
   - Frontend: http://localhost:5001
   - Backend API: http://localhost:3000
   - MySQL Database: localhost:3307

### Development Workflow

1. Start services in development mode:
   ```bash
   docker-compose up
   ```

2. View logs:
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f [service_name]
   ```

3. Rebuild services after changes:
   ```bash
   docker-compose up --build [service_name]
   ```

4. Stop services:
   ```bash
   docker-compose down
   ```

### Volume Management
- MySQL data persists in the `mysql_data` volume
- Source code is mounted as volumes for development
- Node modules are managed through Docker volumes

### Production Deployment

1. Build production images:
   ```bash
   docker-compose -f docker-compose.prod.yml build
   ```

2. Start production stack:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

## Local Setup (Without Docker)

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Server Setup

1. Install dependencies:
   ```bash
   cd Backend
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials and other configuration

3. Initialize database:
   ```bash
   npm run db:setup
   ```

4. Start the server:
   ```bash
   npm run start
   ```

### Client Setup

1. Install dependencies:
   ```bash
   cd Frontend
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update API endpoint and other configurations

3. Start development server:
   ```bash
   npm run dev
   ```

## SDK Integration

### Web SDK

```html
<script src="https://cdn.blockmetric.io/sdk/blockmetric.js"></script>
<script>
  window.blockmetric = new BlockmetricAnalytics('YOUR_API_KEY');
</script>
```

### Desktop SDK

```javascript
const BlockmetricAnalytics = require('@blockmetric/desktop');

const analytics = new BlockmetricAnalytics('YOUR_API_KEY');
```

### Flutter SDK

```dart
import 'package:blockmetric/blockmetric.dart';

final analytics = await BlockmetricAnalytics.initialize(
  apiKey: 'YOUR_API_KEY'
);
```