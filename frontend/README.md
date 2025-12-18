# Password Manager Frontend

Progressive Web Application (PWA) built with Next.js 14+, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod
- **Local Storage**: Dexie.js (IndexedDB)
- **PWA**: @ducanh2912/next-pwa

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes (login, register)
│   ├── (app)/             # Authenticated app routes (vault, generator, etc.)
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── layout/           # Layout components (Header, Sidebar, etc.)
│   └── ui/               # Reusable UI components
├── lib/                   # Utilities and configurations
│   ├── config.ts         # Environment configuration
│   ├── db.ts             # Dexie.js database setup
│   └── validations.ts    # Zod validation schemas
└── stores/               # Zustand state stores
    ├── authStore.ts      # Authentication state
    ├── vaultStore.ts     # Vault data state
    └── uiStore.ts        # UI state (theme, notifications, etc.)
```

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`.

## Environment Variables

See `.env.example` for all available configuration options:

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_SESSION_TIMEOUT_MS`: Session timeout in milliseconds
- `NEXT_PUBLIC_CLIPBOARD_TIMEOUT_MS`: Clipboard auto-clear timeout
- `NEXT_PUBLIC_PBKDF2_ITERATIONS`: PBKDF2 iterations for key derivation

## State Management

### Zustand Stores

- **authStore**: User authentication and session management
- **vaultStore**: Vault data (credentials, folders, tags, notes)
- **uiStore**: UI state (theme, sidebar, notifications, online status)

### IndexedDB (Dexie.js)

Local encrypted storage for offline support:

- `credentials`: Encrypted password entries
- `folders`: Folder organization
- `tags`: Tag management
- `secureNotes`: Encrypted notes
- `syncQueue`: Offline sync queue
- `settings`: User preferences

## Form Validation

All forms use React Hook Form with Zod schemas for type-safe validation:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@/lib/validations';

const form = useForm({
  resolver: zodResolver(loginSchema)
});
```

## PWA Configuration

The app is configured as a Progressive Web App:

- Service Worker for offline support
- Web App Manifest for installation
- Caching strategies for static assets
- Background sync for offline operations

## Development

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Routes

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/register` - User registration

### Protected Routes (requires authentication)
- `/vault` - Password vault
- `/generator` - Password generator
- `/security` - Security dashboard
- `/settings` - User settings

## Next Steps

This foundation is ready for implementing:
1. Authentication UI and logic
2. Vault management features
3. Password generator
4. Security analysis
5. Sync functionality
6. Offline support

See the main project README and design documents for detailed implementation plans.
