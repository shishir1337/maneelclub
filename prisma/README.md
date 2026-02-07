# Database (Prisma)

This project uses a **single baseline migration** so the database always matches `schema.prisma`. No migration drift.

## First time / after clone

```bash
# 1. Copy env and set DATABASE_URL
cp .env.example .env.local
# Edit .env.local with your PostgreSQL URL

# 2. Generate Prisma client
pnpm prisma generate

# 3. Apply migrations (creates all tables)
pnpm prisma migrate deploy

# 4. Seed defaults (settings, attributes, categories, sample products)
pnpm db:seed
```

## Full reset (drop DB, recreate, seed)

Use this when you want a clean database or after pulling schema changes:

```bash
pnpm db:reset
```

This runs `prisma migrate reset --force`: drops the database, applies the baseline migration, then runs the seed automatically.

## Commands

| Command        | Description                                      |
|----------------|--------------------------------------------------|
| `pnpm prisma generate` | Regenerate client after schema changes (run after pull if schema changed). |
| `pnpm prisma migrate deploy` | Apply pending migrations (e.g. on deploy).     |
| `pnpm db:seed` | Seed settings, attributes, categories, products. |
| `pnpm db:reset` | **Full reset**: drop DB, migrate, seed.          |
| `pnpm db:studio` | Open Prisma Studio.                             |

## Schema changes

1. Edit `prisma/schema.prisma`.
2. Create a new migration: `pnpm prisma migrate dev --name describe_your_change`.
3. Commit the new folder under `prisma/migrations/`.

Do **not** use `db push` for production; use migrations only.
