import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_darsha_treatments_section_id" AS ENUM('faciales', 'corporales');
  CREATE TYPE "public"."enum_pages_blocks_darsha_treatments_image_side" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum_pages_blocks_darsha_treatments_background" AS ENUM('beige', 'warmWhite');
  CREATE TYPE "public"."enum__pages_v_blocks_darsha_treatments_section_id" AS ENUM('faciales', 'corporales');
  CREATE TYPE "public"."enum__pages_v_blocks_darsha_treatments_image_side" AS ENUM('right', 'left');
  CREATE TYPE "public"."enum__pages_v_blocks_darsha_treatments_background" AS ENUM('beige', 'warmWhite');
  CREATE TABLE "pages_blocks_darsha_services_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "intro" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_darsha_treatments_treatments" (
    "_order" integer NOT NULL,
    "_parent_id" varchar NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "duration" varchar,
    "frequency" varchar,
    "price" varchar
  );

  CREATE TABLE "pages_blocks_darsha_treatments" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "section_id" "enum_pages_blocks_darsha_treatments_section_id",
    "heading" varchar,
    "intro" varchar,
    "image_id" integer,
    "image_side" "enum_pages_blocks_darsha_treatments_image_side" DEFAULT 'right',
    "background" "enum_pages_blocks_darsha_treatments_background" DEFAULT 'beige',
    "show_prices" boolean DEFAULT false,
    "booking_label" varchar,
    "booking_u_r_l" varchar,
    "block_name" varchar
  );

  CREATE TABLE "pages_blocks_darsha_booking_c_t_a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "heading" varchar,
    "booking_label" varchar,
    "booking_u_r_l" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_services_intro" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "intro" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_treatments_treatments" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "title" varchar,
    "description" varchar,
    "duration" varchar,
    "frequency" varchar,
    "price" varchar,
    "_uuid" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_treatments" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "section_id" "enum__pages_v_blocks_darsha_treatments_section_id",
    "heading" varchar,
    "intro" varchar,
    "image_id" integer,
    "image_side" "enum__pages_v_blocks_darsha_treatments_image_side" DEFAULT 'right',
    "background" "enum__pages_v_blocks_darsha_treatments_background" DEFAULT 'beige',
    "show_prices" boolean DEFAULT false,
    "booking_label" varchar,
    "booking_u_r_l" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_darsha_booking_c_t_a" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "_path" text NOT NULL,
    "id" serial PRIMARY KEY NOT NULL,
    "heading" varchar,
    "booking_label" varchar,
    "booking_u_r_l" varchar,
    "_uuid" varchar,
    "block_name" varchar
  );

  ALTER TABLE "pages_blocks_darsha_services_intro" ADD CONSTRAINT "pages_blocks_darsha_services_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_treatments_treatments" ADD CONSTRAINT "pages_blocks_darsha_treatments_treatments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_darsha_treatments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_treatments" ADD CONSTRAINT "pages_blocks_darsha_treatments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_treatments" ADD CONSTRAINT "pages_blocks_darsha_treatments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_darsha_booking_c_t_a" ADD CONSTRAINT "pages_blocks_darsha_booking_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_services_intro" ADD CONSTRAINT "_pages_v_blocks_darsha_services_intro_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_treatments_treatments" ADD CONSTRAINT "_pages_v_blocks_darsha_treatments_treatments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_darsha_treatments"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ADD CONSTRAINT "_pages_v_blocks_darsha_treatments_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ADD CONSTRAINT "_pages_v_blocks_darsha_treatments_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_darsha_booking_c_t_a" ADD CONSTRAINT "_pages_v_blocks_darsha_booking_c_t_a_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_darsha_services_intro_order_idx" ON "pages_blocks_darsha_services_intro" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_services_intro_parent_id_idx" ON "pages_blocks_darsha_services_intro" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_services_intro_path_idx" ON "pages_blocks_darsha_services_intro" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_treatments_treatments_order_idx" ON "pages_blocks_darsha_treatments_treatments" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_treatments_treatments_parent_id_idx" ON "pages_blocks_darsha_treatments_treatments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_treatments_order_idx" ON "pages_blocks_darsha_treatments" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_treatments_parent_id_idx" ON "pages_blocks_darsha_treatments" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_treatments_path_idx" ON "pages_blocks_darsha_treatments" USING btree ("_path");
  CREATE INDEX "pages_blocks_darsha_treatments_image_idx" ON "pages_blocks_darsha_treatments" USING btree ("image_id");
  CREATE INDEX "pages_blocks_darsha_booking_c_t_a_order_idx" ON "pages_blocks_darsha_booking_c_t_a" USING btree ("_order");
  CREATE INDEX "pages_blocks_darsha_booking_c_t_a_parent_id_idx" ON "pages_blocks_darsha_booking_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_darsha_booking_c_t_a_path_idx" ON "pages_blocks_darsha_booking_c_t_a" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_services_intro_order_idx" ON "_pages_v_blocks_darsha_services_intro" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_services_intro_parent_id_idx" ON "_pages_v_blocks_darsha_services_intro" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_services_intro_path_idx" ON "_pages_v_blocks_darsha_services_intro" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_treatments_order_idx" ON "_pages_v_blocks_darsha_treatments_treatments" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_treatments_parent_id_idx" ON "_pages_v_blocks_darsha_treatments_treatments" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_order_idx" ON "_pages_v_blocks_darsha_treatments" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_parent_id_idx" ON "_pages_v_blocks_darsha_treatments" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_path_idx" ON "_pages_v_blocks_darsha_treatments" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_darsha_treatments_image_idx" ON "_pages_v_blocks_darsha_treatments" USING btree ("image_id");
  CREATE INDEX "_pages_v_blocks_darsha_booking_c_t_a_order_idx" ON "_pages_v_blocks_darsha_booking_c_t_a" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_darsha_booking_c_t_a_parent_id_idx" ON "_pages_v_blocks_darsha_booking_c_t_a" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_darsha_booking_c_t_a_path_idx" ON "_pages_v_blocks_darsha_booking_c_t_a" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "pages_blocks_darsha_services_intro" CASCADE;
  DROP TABLE "pages_blocks_darsha_treatments_treatments" CASCADE;
  DROP TABLE "pages_blocks_darsha_treatments" CASCADE;
  DROP TABLE "pages_blocks_darsha_booking_c_t_a" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_services_intro" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_treatments_treatments" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_treatments" CASCADE;
  DROP TABLE "_pages_v_blocks_darsha_booking_c_t_a" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_darsha_treatments_section_id";
  DROP TYPE "public"."enum_pages_blocks_darsha_treatments_image_side";
  DROP TYPE "public"."enum_pages_blocks_darsha_treatments_background";
  DROP TYPE "public"."enum__pages_v_blocks_darsha_treatments_section_id";
  DROP TYPE "public"."enum__pages_v_blocks_darsha_treatments_image_side";
  DROP TYPE "public"."enum__pages_v_blocks_darsha_treatments_background";`)
}
