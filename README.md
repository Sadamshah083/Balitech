# Bali Tech Pvt. Ltd — Website

Professional outsourcing landing page with admin panel for leads and campaign management.

## Tech Stack

- **Next.js 16** (App Router)
- **Tailwind CSS 4**
- **Prisma + MySQL** (XAMPP)
- **JWT authentication** for admin

## Prerequisites

- **XAMPP** with MySQL running (Apache not required for dev)
- Node.js 18+

## Getting Started

1. Start **MySQL** in the XAMPP Control Panel.

2. Create the database (if it does not exist):

```bash
C:\xampp\mysql\bin\mysql.exe -u root -e "CREATE DATABASE IF NOT EXISTS balitech;"
```

3. Install and set up the project:

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the website.

## Admin Panel

- URL: [http://localhost:3000/admin](http://localhost:3000/admin)
  - Not logged in → redirects to login
  - Logged in → redirects to leads dashboard
- Login: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
- Default credentials (from `.env`):
  - Email: `admin@balitech.com`
  - Password: `admin123`

### Admin Features

- **Leads** — View and manage contact form submissions
- **Campaigns** — Create, edit, delete strategic campaigns shown on the homepage

## Environment Variables

Copy `.env.example` to `.env` and update as needed:

```
DATABASE_URL="mysql://root@localhost:3306/balitech"
JWT_SECRET="your-secret-key"
ADMIN_EMAIL="admin@balitech.com"
ADMIN_PASSWORD="admin123"
```

If your XAMPP MySQL has a password, use:

```
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/balitech"
```

## Project Structure

```
src/
  app/              # Pages and API routes
  components/
    landing/        # Homepage sections
    admin/          # Admin dashboard components
  lib/              # Auth, Prisma, utilities
prisma/
  schema.prisma     # Database models
  seed.ts           # Default admin & campaigns
```
