# Leo Exam - Police Sergeant Exam Practice Application

## Overview

Leo Exam is a minimalist, Instagram-style web application designed for Thai police sergeant exam preparation. The application provides a single-user exam simulation platform with 150 questions across multiple categories within a 3-hour time limit. It features a clean, mobile-first design with comprehensive admin functionality for content management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React.js with TypeScript for type safety
- **Styling**: Tailwind CSS with a minimalist design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query for server state and local React state for UI
- **Font**: Sarabun for Thai language support
- **Color Scheme**: White (#F5F5F5) background, blue (#60A5FA) primary, gray (#D1D5DB) secondary
- **Responsive Design**: Mobile-first approach with Instagram-style aesthetics

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript for both client and server
- **API Design**: RESTful endpoints with JSON responses
- **Data Validation**: Zod schemas for request/response validation
- **File Upload**: Multer middleware for CSV import functionality
- **Session Management**: Express sessions for admin authentication
- **Build System**: Vite for development and production builds

### Data Storage Solutions
- **Database**: PostgreSQL configured through Drizzle ORM
- **ORM**: Drizzle with TypeScript-first schema definitions
- **Migrations**: Drizzle Kit for database schema management
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Questions table (text, options array, correct answer, metadata) and Scores table (performance tracking, category breakdown)
- **Fallback**: In-memory storage implementation for development/testing

### Authentication and Authorization
- **Admin Access**: Simple username/password authentication (admin/leo2568)
- **Session-based**: No complex user management - single admin user
- **Route Protection**: Admin endpoints protected by login verification
- **Client Security**: Form validation and CSRF protection through session management

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting
- **Connection Pooling**: Built-in connection management through @neondatabase/serverless

### Development and Build Tools
- **Vite**: Fast development server and build tool with HMR
- **TypeScript**: Static typing across the entire stack
- **ESBuild**: Fast bundling for production server builds
- **PostCSS**: CSS processing with Tailwind and Autoprefixer

### UI and Styling Libraries
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first styling framework
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Type-safe component variants
- **React Hook Form**: Form state management with validation

### Data Management
- **TanStack Query**: Server state synchronization and caching
- **Drizzle ORM**: Type-safe database queries and migrations
- **Zod**: Runtime type validation and schema definitions

### Deployment and Hosting
- **Replit Integration**: Development environment with live preview
- **Static Assets**: Vite-based build pipeline for optimized delivery
- **Environment Variables**: Database URL and configuration management