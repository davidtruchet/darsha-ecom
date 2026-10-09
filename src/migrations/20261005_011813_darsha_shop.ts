import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "pages_blocks_darsha_shop_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "intro" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_darsha_shop_promotion" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_u_r_l" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_darsha_product_catalog" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar DEFAULT 'Nuestros productos',
    "page_size" numeric DEFAULT 12,
    "empty_message" varchar DEFAULT 'Pronto encontrarás aquí nuestros productos para el cuidado de tu piel.',
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_shop_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "intro" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_shop_promotion" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "description" varchar,
    "link_label" varchar,
    "link_u_r_l" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_product_catalog" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar DEFAULT 'Nuestros productos',
    "page_size" numeric DEFAULT 12,
    "empty_message" varchar DEFAULT 'Pronto encontrarás aquí nuestros productos para el cuidado de tu piel.',
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "brands" (
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar NOT NULL,
    "generate_slug" boolean DEFAULT true,
    "slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'UYU';
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'UYU';
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'UYU';
  ALTER TABLE "variants" ADD COLUMN "price_in_u_y_u_enabled" boolean;
  ALTER TABLE "variants" ADD COLUMN "price_in_u_y_u" numeric;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_u_y_u_enabled" boolean;
  ALTER TABLE "_variants_v" ADD COLUMN "version_price_in_u_y_u" numeric;
  ALTER TABLE "products" ADD COLUMN "brand_id" integer;
  ALTER TABLE "products" ADD COLUMN "size" varchar;
  ALTER TABLE "products" ADD COLUMN "short_description" varchar;
  ALTER TABLE "products" ADD COLUMN "compare_at_price_in_u_y_u" numeric;
  ALTER TABLE "products" ADD COLUMN "source_u_r_l" varchar;
  ALTER TABLE "products" ADD COLUMN "source_s_k_u" varchar;
  ALTER TABLE "products" ADD COLUMN "source_captured_at" timestamp(3) with time zone;
  ALTER TABLE "products" ADD COLUMN "price_in_u_y_u_enabled" boolean;
  ALTER TABLE "products" ADD COLUMN "price_in_u_y_u" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_brand_id" integer;
  ALTER TABLE "_products_v" ADD COLUMN "version_size" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_short_description" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_compare_at_price_in_u_y_u" numeric;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_u_r_l" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_s_k_u" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_source_captured_at" timestamp(3) with time zone;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_u_y_u_enabled" boolean;
  ALTER TABLE "_products_v" ADD COLUMN "version_price_in_u_y_u" numeric;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brands_id" integer;
  ALTER TABLE "pages_blocks_darsha_shop_intro" ADD CONSTRAINT "pages_blocks_darsha_shop_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_shop_promotion" ADD CONSTRAINT "pages_blocks_darsha_shop_promotion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_product_catalog" ADD CONSTRAINT "pages_blocks_darsha_product_catalog_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_shop_intro" ADD CONSTRAINT "_pages_v_blocks_darsha_shop_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_shop_promotion" ADD CONSTRAINT "_pages_v_blocks_darsha_shop_promotion_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_product_catalog" ADD CONSTRAINT "_pages_v_blocks_darsha_product_catalog_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_darsha_shop_intro_order_idx" ON "pages_blocks_darsha_shop_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_shop_intro_parent_id_idx" ON "pages_blocks_darsha_shop_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_shop_intro_path_idx" ON "pages_blocks_darsha_shop_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_shop_promotion_order_idx" ON "pages_blocks_darsha_shop_promotion" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_shop_promotion_parent_id_idx" ON "pages_blocks_darsha_shop_promotion" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_shop_promotion_path_idx" ON "pages_blocks_darsha_shop_promotion" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_product_catalog_order_idx" ON "pages_blocks_darsha_product_catalog" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_product_catalog_parent_id_idx" ON "pages_blocks_darsha_product_catalog" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_product_catalog_path_idx" ON "pages_blocks_darsha_product_catalog" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_shop_intro_order_idx" ON "_pages_v_blocks_darsha_shop_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_shop_intro_parent_id_idx" ON "_pages_v_blocks_darsha_shop_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_shop_intro_path_idx" ON "_pages_v_blocks_darsha_shop_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_shop_promotion_order_idx" ON "_pages_v_blocks_darsha_shop_promotion" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_shop_promotion_parent_id_idx" ON "_pages_v_blocks_darsha_shop_promotion" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_shop_promotion_path_idx" ON "_pages_v_blocks_darsha_shop_promotion" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_product_catalog_order_idx" ON "_pages_v_blocks_darsha_product_catalog" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_product_catalog_parent_id_idx" ON "_pages_v_blocks_darsha_product_catalog" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_product_catalog_path_idx" ON "_pages_v_blocks_darsha_product_catalog" USING btree ("_path");
  CREATE UNIQUE INDEX "brands_slug_idx" ON "brands" USING btree ("slug");
  CREATE INDEX "brands_updated_at_idx" ON "brands" USING btree ("updated_at");
  CREATE INDEX "brands_created_at_idx" ON "brands" USING btree ("created_at");
  ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_products_v" ADD CONSTRAINT "_products_v_version_brand_id_brands_id_fk" FOREIGN KEY ("version_brand_id") REFERENCES "public"."brands"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brands_fk" FOREIGN KEY ("brands_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand_id");
  CREATE INDEX "_products_v_version_version_brand_idx" ON "_products_v" USING btree ("version_brand_id");
  CREATE INDEX "payload_locked_documents_rels_brands_id_idx" ON "payload_locked_documents_rels" USING btree ("brands_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_darsha_shop_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_darsha_shop_promotion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_darsha_product_catalog" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_darsha_shop_intro" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_darsha_shop_promotion" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_darsha_product_catalog" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brands" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_darsha_shop_intro" CASCADE;
  DROP TABLE "pages_blocks_darsha_shop_promotion" CASCADE;
  DROP TABLE "pages_blocks_darsha_product_catalog" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_shop_intro" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_shop_promotion" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_product_catalog" CASCADE;
  ALTER TABLE "products" DROP CONSTRAINT "products_brand_id_brands_id_fk";
  ALTER TABLE "_products_v" DROP CONSTRAINT "_products_v_version_brand_id_brands_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brands_fk";
  DROP TABLE "brands" CASCADE;






  ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
  ALTER TABLE "transactions" ALTER COLUMN "currency" SET DEFAULT 'USD';
  DROP INDEX "products_brand_idx";
  DROP INDEX "_products_v_version_version_brand_idx";
  DROP INDEX "payload_locked_documents_rels_brands_id_idx";
  ALTER TABLE "variants" DROP COLUMN "price_in_u_y_u_enabled";
  ALTER TABLE "variants" DROP COLUMN "price_in_u_y_u";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_u_y_u_enabled";
  ALTER TABLE "_variants_v" DROP COLUMN "version_price_in_u_y_u";
  ALTER TABLE "products" DROP COLUMN "brand_id";
  ALTER TABLE "products" DROP COLUMN "size";
  ALTER TABLE "products" DROP COLUMN "short_description";
  ALTER TABLE "products" DROP COLUMN "compare_at_price_in_u_y_u";
  ALTER TABLE "products" DROP COLUMN "source_u_r_l";
  ALTER TABLE "products" DROP COLUMN "source_s_k_u";
  ALTER TABLE "products" DROP COLUMN "source_captured_at";
  ALTER TABLE "products" DROP COLUMN "price_in_u_y_u_enabled";
  ALTER TABLE "products" DROP COLUMN "price_in_u_y_u";
  ALTER TABLE "_products_v" DROP COLUMN "version_brand_id";
  ALTER TABLE "_products_v" DROP COLUMN "version_size";
  ALTER TABLE "_products_v" DROP COLUMN "version_short_description";
  ALTER TABLE "_products_v" DROP COLUMN "version_compare_at_price_in_u_y_u";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_u_r_l";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_s_k_u";
  ALTER TABLE "_products_v" DROP COLUMN "version_source_captured_at";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_u_y_u_enabled";
  ALTER TABLE "_products_v" DROP COLUMN "version_price_in_u_y_u";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brands_id";`)
}
