import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_checkout_attempts_method" AS ENUM('mercadopago', 'bank-transfer', 'cash');
  CREATE TYPE "public"."enum_checkout_attempts_state" AS ENUM('initializing', 'pending', 'paid', 'expired', 'cancelled', 'review');
  CREATE TYPE "public"."enum_checkout_attempts_reservation" AS ENUM('held', 'consumed', 'released');
  CREATE TYPE "public"."enum_orders_payment_state" AS ENUM('pending', 'paid', 'review', 'cancelled');
  CREATE TABLE "checkout_attempts" (
    "id" serial PRIMARY KEY NOT NULL,
    "reference" varchar NOT NULL,
    "cart_id" integer NOT NULL,
    "customer_id" integer,
    "transaction_id" integer,
    "order_id" integer,
    "method" "enum_checkout_attempts_method" NOT NULL,
    "state" "enum_checkout_attempts_state" NOT NULL,
    "reservation" "enum_checkout_attempts_reservation" NOT NULL,
    "amount" numeric NOT NULL,
    "snapshot" jsonb NOT NULL,
    "fingerprint" varchar NOT NULL,
    "access_hash" varchar NOT NULL,
    "preference_i_d" varchar,
    "checkout_u_r_l" varchar,
    "payment_i_d" varchar,
    "expires_at" timestamp(3) with time zone NOT NULL,
    "manual_payment_received" boolean,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "orders" ADD COLUMN "checkout_reference" varchar;
  ALTER TABLE "orders" ADD COLUMN "payment_state" "enum_orders_payment_state";
  ALTER TABLE "orders" ADD COLUMN "payment_provider" varchar;
  ALTER TABLE "orders" ADD COLUMN "delivery_details" jsonb;
  ALTER TABLE "orders" ADD COLUMN "shipping_amount" numeric;
  ALTER TABLE "orders" ADD COLUMN "purchase_snapshot" jsonb;
  ALTER TABLE "transactions" ADD COLUMN "payment_provider" varchar;
  ALTER TABLE "transactions" ADD COLUMN "payment_reference" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "checkout_attempts_id" integer;
  ALTER TABLE "shipping" ADD COLUMN "unpaid_pickup_hours" numeric DEFAULT 48;
  ALTER TABLE "shipping" ADD COLUMN "bank_transfer_instructions" varchar;
  ALTER TABLE "checkout_attempts" ADD CONSTRAINT "checkout_attempts_cart_id_carts_id_fk" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checkout_attempts" ADD CONSTRAINT "checkout_attempts_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checkout_attempts" ADD CONSTRAINT "checkout_attempts_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "checkout_attempts" ADD CONSTRAINT "checkout_attempts_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "checkout_attempts_reference_idx" ON "checkout_attempts" USING btree ("reference");
  CREATE INDEX "checkout_attempts_cart_idx" ON "checkout_attempts" USING btree ("cart_id");
  CREATE INDEX "checkout_attempts_customer_idx" ON "checkout_attempts" USING btree ("customer_id");
  CREATE INDEX "checkout_attempts_transaction_idx" ON "checkout_attempts" USING btree ("transaction_id");
  CREATE INDEX "checkout_attempts_order_idx" ON "checkout_attempts" USING btree ("order_id");
  CREATE UNIQUE INDEX "checkout_attempts_payment_i_d_idx" ON "checkout_attempts" USING btree ("payment_i_d");
  CREATE INDEX "checkout_attempts_updated_at_idx" ON "checkout_attempts" USING btree ("updated_at");
  CREATE INDEX "checkout_attempts_created_at_idx" ON "checkout_attempts" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_checkout_attempts_fk" FOREIGN KEY ("checkout_attempts_id") REFERENCES "public"."checkout_attempts"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "orders_checkout_reference_idx" ON "orders" USING btree ("checkout_reference");
  CREATE UNIQUE INDEX "transactions_payment_reference_idx" ON "transactions" USING btree ("payment_reference");
  CREATE INDEX "payload_locked_documents_rels_checkout_attempts_id_idx" ON "payload_locked_documents_rels" USING btree ("checkout_attempts_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "checkout_attempts" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_checkout_attempts_fk";
  DROP TABLE "checkout_attempts" CASCADE;

  DROP INDEX "orders_checkout_reference_idx";
  DROP INDEX "transactions_payment_reference_idx";
  DROP INDEX "payload_locked_documents_rels_checkout_attempts_id_idx";
  ALTER TABLE "orders" DROP COLUMN "checkout_reference";
  ALTER TABLE "orders" DROP COLUMN "payment_state";
  ALTER TABLE "orders" DROP COLUMN "payment_provider";
  ALTER TABLE "orders" DROP COLUMN "delivery_details";
  ALTER TABLE "orders" DROP COLUMN "shipping_amount";
  ALTER TABLE "orders" DROP COLUMN "purchase_snapshot";
  ALTER TABLE "transactions" DROP COLUMN "payment_provider";
  ALTER TABLE "transactions" DROP COLUMN "payment_reference";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "checkout_attempts_id";
  ALTER TABLE "shipping" DROP COLUMN "unpaid_pickup_hours";
  ALTER TABLE "shipping" DROP COLUMN "bank_transfer_instructions";
  DROP TYPE "public"."enum_checkout_attempts_method";
  DROP TYPE "public"."enum_checkout_attempts_state";
  DROP TYPE "public"."enum_checkout_attempts_reservation";
  DROP TYPE "public"."enum_orders_payment_state";`)
}
