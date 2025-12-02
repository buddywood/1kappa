# Archived SQL Migrations

This directory contains the original raw SQL migration files that were used before migrating to Sequelize.

## Why Archived?

As of December 2025, we migrated from raw SQL migrations to Sequelize migrations. These files are preserved for historical reference but are no longer used in the migration system.

## Current Migration System

- **Fresh databases**: Use `schema.sql` to create the initial schema
- **Schema changes**: Use Sequelize migrations in `sequelize-migrations/`
- **Reference data**: Use Sequelize seeders in `seeders/`

## Migration History

These 44 SQL migrations (001-044) represent the evolution of the database schema from the initial implementation through January 2025. The final state of all these migrations is captured in:

- `schema.sql` - Complete current schema for fresh databases
- `sequelize-migrations/` - All future schema changes

## Files

- `001_add_chapters_status_chartered.sql` through `044_ensure_stewards_fraternity_member_id.sql`

These files are kept for:

- Historical reference
- Understanding schema evolution
- Debugging if needed

**Do not modify or delete these files** - they represent a historical record of the database schema changes.
