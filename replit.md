# SportsCRM - Sports Organization Lead Generation & CRM System

## Overview

SportsCRM is a B2B lead generation and customer relationship management system designed for sports organizations in Brazil. The application helps users search, manage, and track leads from various sports organizations including soccer (society, futsal, campo), schools, clubs, and associations. Key features include organization search with advanced filtering, lead pipeline management, meeting scheduling, interaction tracking, and performance reporting dashboards.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming (light/dark mode support)
- **Build Tool**: Vite with React plugin
- **Design System**: Material/Fluent hybrid approach optimized for data-heavy interfaces

The frontend follows a page-based structure with reusable components. Pages include Dashboard, Search, Leads, Meetings, and Reports. Custom components handle business-specific UI elements like sport badges, status badges, and metric cards.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Pattern**: RESTful JSON API
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod integration
- **Session Management**: Express sessions with PostgreSQL store (connect-pg-simple)

The server uses a modular structure with routes defined in `server/routes.ts` and storage abstraction in `server/storage.ts`. The storage layer currently implements an in-memory storage class (`MemStorage`) that can be swapped for database-backed implementation.

### Data Models
Core entities defined in `shared/schema.ts`:
- **Users**: Authentication and user management
- **Organizations**: Sports organizations with type, sport category, and contact info
- **Leads**: Sales pipeline entries linked to organizations with status tracking
- **Meetings**: Scheduled meetings with leads (virtual/in-person)
- **Interactions**: Activity log for leads (emails, calls, notes, meetings)

### Build and Development
- Development server runs via `tsx` for TypeScript execution
- Production build uses esbuild for server bundling and Vite for client
- Database migrations managed via Drizzle Kit

## External Dependencies

### Database
- **PostgreSQL**: Primary database accessed via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema defined in `shared/schema.ts`, migrations output to `/migrations`

### UI/Component Libraries
- **Radix UI**: Comprehensive primitive components (dialog, dropdown, tabs, etc.)
- **shadcn/ui**: Pre-styled component system using Radix primitives
- **Lucide React**: Icon library
- **Recharts**: Data visualization for reports page
- **Embla Carousel**: Carousel component
- **date-fns**: Date formatting and manipulation (with Portuguese locale)

### Form and Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation shared between frontend and backend

### Third-Party Integrations (bundled for production)
- **Stripe**: Payment processing capability
- **OpenAI / Google Generative AI**: AI integration support
- **Nodemailer**: Email sending
- **Multer**: File upload handling
- **XLSX**: Excel file processing