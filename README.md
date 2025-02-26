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

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MySQL (v8.0 or higher)
- npm or yarn package manager

### Server Setup

1. Clone the repository (requires authentication)
2. Install dependencies:
   ```bash
   cd server
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update database credentials and other configuration

4. Initialize database:
   ```bash
   npm run db:setup
   ```

5. Start the server:
   ```bash
   npm run start
   ```

### Client Setup

1. Install dependencies:
   ```bash
   cd src
   npm install
   ```

2. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update API endpoint and other configurations

3. Start development server:
   ```bash
   npm run dev
   ```

### SDK Integration

#### Web SDK

```html
<script src="https://cdn.blockmetric.io/sdk/blockmetric.js"></script>
<script>
  window.blockmetric = new BlockmetricAnalytics('YOUR_API_KEY');
</script>
```

#### Desktop SDK

```javascript
const BlockmetricAnalytics = require('@blockmetric/desktop');

const analytics = new BlockmetricAnalytics('YOUR_API_KEY');
```

#### Flutter SDK

```dart
import 'package:blockmetric/blockmetric.dart';

final analytics = await BlockmetricAnalytics.initialize(
  apiKey: 'YOUR_API_KEY'
);
```

## Environment Configuration

### Server Environment Variables
```
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=blockmetric
JWT_SECRET=your_jwt_secret
PORT=5002
```

### Client Environment Variables
```
VITE_API_URL=http://localhost:5002
VITE_APP_NAME=Blockmetric
```

## License

**PROPRIETARY AND CONFIDENTIAL**

This software and its documentation are proprietary and confidential. Unauthorized copying, distribution, modification, public display, or public performance of this software, or creating derivative works from it, is strictly prohibited. All rights reserved.

Copyright © 2024 Blockmetric Analytics. All rights reserved.

## Support

For technical support or inquiries about licensing, please contact:
- Email: support@blockmetric.io
- Documentation: https://docs.blockmetric.io