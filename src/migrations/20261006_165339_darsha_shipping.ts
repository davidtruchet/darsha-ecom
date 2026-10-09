import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "shipping_rates" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "max_weight_grams" numeric NOT NULL,
    "montevideo_price" numeric NOT NULL,
    "interior_price" numeric NOT NULL
  );

  CREATE TABLE "shipping" (
    "id" serial PRIMARY KEY NOT NULL,
    "packaging_weight_grams" numeric,
    "source_u_r_l" varchar,
    "reviewed_at" timestamp(3) with time zone,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  ALTER TABLE "products" ADD COLUMN "shipping_weight_grams" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_shipping_weight_grams" numeric;
  ALTER TABLE "shipping_rates" ADD CONSTRAINT "shipping_rates_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."shipping"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "shipping_rates_order_idx" ON "shipping_rates" USING btree ("_order");
  CREATE INDEX "shipping_rates_parent_id_idx" ON "shipping_rates" USING btree ("_parent_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "shipping_rates" CASCADE;
  DROP TABLE "shipping" CASCADE;
  ALTER TABLE "products" DROP COLUMN "shipping_weight_grams";
  ALTER TABLE "_products_v" DROP COLUMN "version_shipping_weight_grams";`)
}
