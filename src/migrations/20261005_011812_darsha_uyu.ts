import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

// Commit enum values before using them as defaults in the following migration.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`   ALTER TYPE "public"."enum_carts_currency" ADD VALUE 'UYU' BEFORE 'USD';
  ALTER TYPE "public"."enum_orders_currency" ADD VALUE 'UYU' BEFORE 'USD';
  ALTER TYPE "public"."enum_transactions_currency" ADD VALUE 'UYU' BEFORE 'USD';
`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM carts WHERE currency = 'UYU') OR EXISTS (SELECT 1 FROM orders WHERE currency = 'UYU') OR EXISTS (SELECT 1 FROM transactions WHERE currency = 'UYU') THEN
      RAISE EXCEPTION 'Cannot remove UYU while UYU commerce records exist';
    END IF;
  END $$;
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_carts_currency";
  CREATE TYPE "public"."enum_carts_currency" AS ENUM('USD');
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_carts_currency";
  ALTER TABLE "carts" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_carts_currency" USING "currency"::"public"."enum_carts_currency";
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_orders_currency";
  CREATE TYPE "public"."enum_orders_currency" AS ENUM('USD');
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_orders_currency";
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_orders_currency" USING "currency"::"public"."enum_orders_currency";
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DATA TYPE text;
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD'::text;
  DROP TYPE "public"."enum_transactions_currency";
  CREATE TYPE "public"."enum_transactions_currency" AS ENUM('USD');
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD'::"public"."enum_transactions_currency";
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DATA TYPE "public"."enum_transactions_currency" USING "currency"::"public"."enum_transactions_currency";
`)
}
