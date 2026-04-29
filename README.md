# Multi-tenant POS Backend

Express + TypeScript + Knex bootstrap with DDD structure.

## Requirements

- Node.js 18+
- pnpm

## Setup

1. Install dependencies:
   - `pnpm install`
2. Copy environment file:
   - `cp .env.example .env`
3. Adjust database env for your environment.

## Run

- Local dev: `pnpm run dev:local`
- Remote dev: `pnpm run dev:remote`
- Build: `pnpm run build`
- Start: `pnpm run start`

## Health Check

- `GET /v1/health`

## Notes

- Database migrations/seeds are configured but not used in this repo.
