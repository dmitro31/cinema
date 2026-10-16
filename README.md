# Cinema

A full-stack movie ticket booking platform. Users browse the schedule, pick seats on an interactive hall map, create an order and pay online. Admins manage movies, halls and screening sessions.

**Live demo:** https://cinema-8595-delta.vercel.app

> **Note about payments:** payments use LiqPay in demo mode and work end to end. On the live demo the backend runs on a free Render plan, so the LiqPay payment page may loop or time out because of free-tier hosting limits. This does not happen when the project runs locally.

## Features

### Users

- Registration and login, plus sign-in with Google
- Refresh-token flow that keeps the session alive without random 401/403 errors
- Now-showing schedule with sessions listed by day, a hall filter and a "Buy ticket" button
- "Coming soon" page with a poster grid, premiere dates and trailer links
- Interactive seat selection for a session
- Order page and online payment through LiqPay (demo mode)
- Burger menu and a footer that match the site pages

### Admins

- Two roles: `USER` and `ADMIN`
- Admin panel for managing screening sessions
- Catalog management: genres, movies, halls, sessions

### Backend

- Modular NestJS architecture on the Fastify adapter
- Seat booking with seat holds, orders and tickets
- Rate limiting
- Scheduled cleanup of expired refresh tokens
- Automated tests with Vitest

## Tech Stack

| Layer    | Technologies                                       |
| -------- | -------------------------------------------------- |
| Backend  | NestJS, Fastify, PostgreSQL, Redis                 |
| Frontend | Next.js (App Router), Tailwind CSS                 |
| Payments | LiqPay (demo mode)                                 |
| Quality  | Vitest, Oxlint, ESLint                             |
| Language | TypeScript                                         |

## Project Structure

```
back-end/    NestJS API
front-end/   Next.js app (src/app)
```

The two folders are independent projects without a monorepo wrapper.

## Getting Started

### Requirements

- Node.js 18+
- PostgreSQL
- Redis

### Backend

```bash
cd back-end
npm install
cp .env.example .env
npm run start:dev
```

Fill in `.env` with the database and Redis connection settings, JWT secrets, Google OAuth credentials and LiqPay keys.

### Frontend

```bash
cd front-end
npm install
cp .env.example .env.local
npm run dev
```

Set the backend API URL in `.env.local`.

### Tests

```bash
cd back-end
npm run test
```

## Author

Dmytro Abramiak - https://github.com/dmitro31
