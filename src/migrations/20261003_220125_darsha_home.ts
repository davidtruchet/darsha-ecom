import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_darsha_contact_items_kind" AS ENUM('phone', 'location', 'whatsapp');
  CREATE TYPE "public"."enum__pages_v_blocks_darsha_contact_items_kind" AS ENUM('phone', 'location', 'whatsapp');
  CREATE TABLE "pages_blocks_darsha_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"label" varchar,
  	"url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"url" varchar,
  	"badge" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_image_text_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"image_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_testimonials_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"author" varchar,
  	"quote" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_contact_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"kind" "enum_pages_blocks_darsha_contact_items_kind",
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "pages_blocks_darsha_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"image_id" integer,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_cards_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"image_id" integer,
  	"url" varchar,
  	"badge" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_cards" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"intro" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_image_text_paragraphs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"text" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_image_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"image_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_testimonials_reviews" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"author" varchar,
  	"quote" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_testimonials" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_contact_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"kind" "enum__pages_v_blocks_darsha_contact_items_kind",
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_darsha_contact" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  ALTER TABLE "pages_blocks_darsha_hero" ADD CONSTRAINT "pages_blocks_darsha_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_hero" ADD CONSTRAINT "pages_blocks_darsha_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_cards_cards" ADD CONSTRAINT "pages_blocks_darsha_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_cards_cards" ADD CONSTRAINT "pages_blocks_darsha_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_darsha_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_cards" ADD CONSTRAINT "pages_blocks_darsha_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_image_text_paragraphs" ADD CONSTRAINT "pages_blocks_darsha_image_text_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_darsha_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_image_text" ADD CONSTRAINT "pages_blocks_darsha_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_image_text" ADD CONSTRAINT "pages_blocks_darsha_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_testimonials_reviews" ADD CONSTRAINT "pages_blocks_darsha_testimonials_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_darsha_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_testimonials" ADD CONSTRAINT "pages_blocks_darsha_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_contact_items" ADD CONSTRAINT "pages_blocks_darsha_contact_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_darsha_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_contact" ADD CONSTRAINT "pages_blocks_darsha_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_hero" ADD CONSTRAINT "_pages_v_blocks_darsha_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_hero" ADD CONSTRAINT "_pages_v_blocks_darsha_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_cards_cards" ADD CONSTRAINT "_pages_v_blocks_darsha_cards_cards_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_cards_cards" ADD CONSTRAINT "_pages_v_blocks_darsha_cards_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_darsha_cards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_cards" ADD CONSTRAINT "_pages_v_blocks_darsha_cards_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_image_text_paragraphs" ADD CONSTRAINT "_pages_v_blocks_darsha_image_text_paragraphs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_darsha_image_text"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_image_text" ADD CONSTRAINT "_pages_v_blocks_darsha_image_text_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_image_text" ADD CONSTRAINT "_pages_v_blocks_darsha_image_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_testimonials_reviews" ADD CONSTRAINT "_pages_v_blocks_darsha_testimonials_reviews_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_darsha_testimonials"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_testimonials" ADD CONSTRAINT "_pages_v_blocks_darsha_testimonials_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_contact_items" ADD CONSTRAINT "_pages_v_blocks_darsha_contact_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_darsha_contact"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_contact" ADD CONSTRAINT "_pages_v_blocks_darsha_contact_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_darsha_hero_order_idx" ON "pages_blocks_darsha_hero" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_hero_parent_id_idx" ON "pages_blocks_darsha_hero" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_hero_path_idx" ON "pages_blocks_darsha_hero" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_hero_image_idx" ON "pages_blocks_darsha_hero" USING btree ("image_id");
  CREATE INDEX "pages_blocks_darsha_cards_cards_order_idx" ON "pages_blocks_darsha_cards_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_cards_cards_parent_id_idx" ON "pages_blocks_darsha_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_cards_cards_image_idx" ON "pages_blocks_darsha_cards_cards" USING btree ("image_id");
  CREATE INDEX "pages_blocks_darsha_cards_order_idx" ON "pages_blocks_darsha_cards" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_cards_parent_id_idx" ON "pages_blocks_darsha_cards" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_cards_path_idx" ON "pages_blocks_darsha_cards" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_image_text_paragraphs_order_idx" ON "pages_blocks_darsha_image_text_paragraphs" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_image_text_paragraphs_parent_id_idx" ON "pages_blocks_darsha_image_text_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_image_text_order_idx" ON "pages_blocks_darsha_image_text" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_image_text_parent_id_idx" ON "pages_blocks_darsha_image_text" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_image_text_path_idx" ON "pages_blocks_darsha_image_text" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_image_text_image_idx" ON "pages_blocks_darsha_image_text" USING btree ("image_id");
  CREATE INDEX "pages_blocks_darsha_testimonials_reviews_order_idx" ON "pages_blocks_darsha_testimonials_reviews" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_testimonials_reviews_parent_id_idx" ON "pages_blocks_darsha_testimonials_reviews" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_testimonials_order_idx" ON "pages_blocks_darsha_testimonials" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_testimonials_parent_id_idx" ON "pages_blocks_darsha_testimonials" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_testimonials_path_idx" ON "pages_blocks_darsha_testimonials" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_contact_items_order_idx" ON "pages_blocks_darsha_contact_items" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_contact_items_parent_id_idx" ON "pages_blocks_darsha_contact_items" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_contact_order_idx" ON "pages_blocks_darsha_contact" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_contact_parent_id_idx" ON "pages_blocks_darsha_contact" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_contact_path_idx" ON "pages_blocks_darsha_contact" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_hero_order_idx" ON "_pages_v_blocks_darsha_hero" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_hero_parent_id_idx" ON "_pages_v_blocks_darsha_hero" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_hero_path_idx" ON "_pages_v_blocks_darsha_hero" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_hero_image_idx" ON "_pages_v_blocks_darsha_hero" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_darsha_cards_cards_order_idx" ON "_pages_v_blocks_darsha_cards_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_cards_cards_parent_id_idx" ON "_pages_v_blocks_darsha_cards_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_cards_cards_image_idx" ON "_pages_v_blocks_darsha_cards_cards" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_darsha_cards_order_idx" ON "_pages_v_blocks_darsha_cards" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_cards_parent_id_idx" ON "_pages_v_blocks_darsha_cards" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_cards_path_idx" ON "_pages_v_blocks_darsha_cards" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_paragraphs_order_idx" ON "_pages_v_blocks_darsha_image_text_paragraphs" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_paragraphs_parent_id_idx" ON "_pages_v_blocks_darsha_image_text_paragraphs" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_order_idx" ON "_pages_v_blocks_darsha_image_text" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_parent_id_idx" ON "_pages_v_blocks_darsha_image_text" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_path_idx" ON "_pages_v_blocks_darsha_image_text" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_image_text_image_idx" ON "_pages_v_blocks_darsha_image_text" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_darsha_testimonials_reviews_order_idx" ON "_pages_v_blocks_darsha_testimonials_reviews" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_testimonials_reviews_parent_id_idx" ON "_pages_v_blocks_darsha_testimonials_reviews" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_testimonials_order_idx" ON "_pages_v_blocks_darsha_testimonials" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_testimonials_parent_id_idx" ON "_pages_v_blocks_darsha_testimonials" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_testimonials_path_idx" ON "_pages_v_blocks_darsha_testimonials" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_contact_items_order_idx" ON "_pages_v_blocks_darsha_contact_items" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_contact_items_parent_id_idx" ON "_pages_v_blocks_darsha_contact_items" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_contact_order_idx" ON "_pages_v_blocks_darsha_contact" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_contact_parent_id_idx" ON "_pages_v_blocks_darsha_contact" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_contact_path_idx" ON "_pages_v_blocks_darsha_contact" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_darsha_hero" CASCADE;
  DROP TABLE "pages_blocks_darsha_cards_cards" CASCADE;
  DROP TABLE "pages_blocks_darsha_cards" CASCADE;
  DROP TABLE "pages_blocks_darsha_image_text_paragraphs" CASCADE;
  DROP TABLE "pages_blocks_darsha_image_text" CASCADE;
  DROP TABLE "pages_blocks_darsha_testimonials_reviews" CASCADE;
  DROP TABLE "pages_blocks_darsha_testimonials" CASCADE;
  DROP TABLE "pages_blocks_darsha_contact_items" CASCADE;
  DROP TABLE "pages_blocks_darsha_contact" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_hero" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_cards_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_cards" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_image_text_paragraphs" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_image_text" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_testimonials_reviews" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_testimonials" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_contact_items" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_contact" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_darsha_contact_items_kind";
  DROP TYPE "public"."enum__pages_v_blocks_darsha_contact_items_kind";`)
}
