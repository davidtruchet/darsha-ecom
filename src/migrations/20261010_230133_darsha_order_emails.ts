import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_order_emails_state" AS ENUM('pending', 'sending', 'sent', 'failed', 'review', 'skipped');
  CREATE TYPE "public"."enum_orders_fulfillment_status" AS ENUM('unfulfilled', 'ready-for-pickup', 'shipped');
  CREATE TABLE "order_emails" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "order_id" integer NOT NULL,
    "event" varchar NOT NULL,
    "recipient" varchar NOT NULL,
    "reply_to" varchar NOT NULL,
    "subject" varchar NOT NULL,
    "html" varchar NOT NULL,
    "text" varchar NOT NULL,
    "state" "enum_order_emails_state" DEFAULT 'pending' NOT NULL,
    "attempts" numeric DEFAULT 0 NOT NULL,
    "next_attempt_at" timestamp(3) with time zone NOT NULL,
    "first_attempt_at" timestamp(3) with time zone,
    "lease_until" timestamp(3) with time zone,
    "lease_token" varchar,
    "sent_at" timestamp(3) with time zone,
    "message_i_d" varchar,
    "last_error" varchar,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "order_email_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "enabled" boolean DEFAULT true,
    "seller_email" varchar DEFAULT 'davidmt04@gmail.com' NOT NULL,
    "reply_to" varchar DEFAULT 'pedidos@espaciodarsha.com' NOT NULL,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "orders" ADD COLUMN "fulfillment_status" "enum_orders_fulfillment_status" DEFAULT 'unfulfilled';
  ALTER TABLE "orders" ADD COLUMN "tracking_number" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "order_emails_id" integer;
  ALTER TABLE "order_emails" ADD CONSTRAINT "order_emails_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "order_emails_key_idx" ON "order_emails" USING btree ("key");
  CREATE INDEX "order_emails_order_idx" ON "order_emails" USING btree ("order_id");
  CREATE INDEX "order_emails_updated_at_idx" ON "order_emails" USING btree ("updated_at");
  CREATE INDEX "order_emails_created_at_idx" ON "order_emails" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_order_emails_fk" FOREIGN KEY ("order_emails_id") REFERENCES "public"."order_emails"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_order_emails_id_idx" ON "payload_locked_documents_rels" USING btree ("order_emails_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "order_emails" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "order_email_settings" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_order_emails_fk";
  DROP TABLE "order_emails" CASCADE;
  DROP TABLE "order_email_settings" CASCADE;

  DROP INDEX "payload_locked_documents_rels_order_emails_id_idx";
  ALTER TABLE "orders" DROP COLUMN "fulfillment_status";
  ALTER TABLE "orders" DROP COLUMN "tracking_number";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "order_emails_id";
  DROP TYPE "public"."enum_order_emails_state";
  DROP TYPE "public"."enum_orders_fulfillment_status";`)
}
