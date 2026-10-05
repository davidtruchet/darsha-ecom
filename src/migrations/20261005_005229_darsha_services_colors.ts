import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_pages_blocks_darsha_treatments_background" ADD VALUE 'white' BEFORE 'beige';
  ALTER TYPE "public"."enum__pages_v_blocks_darsha_treatments_background" ADD VALUE 'white' BEFORE 'beige';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   UPDATE "pages_blocks_darsha_treatments" SET "background" = 'beige' WHERE "background" = 'white';
  UPDATE "_pages_v_blocks_darsha_treatments" SET "background" = 'beige' WHERE "background" = 'white';
  ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DATA TYPE text;
  ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige'::text;
  DROP TYPE "public"."enum_pages_blocks_darsha_treatments_background";
  CREATE TYPE "public"."enum_pages_blocks_darsha_treatments_background" AS ENUM('beige', 'warmWhite');
  ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige'::"public"."enum_pages_blocks_darsha_treatments_background";
  ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DATA TYPE "public"."enum_pages_blocks_darsha_treatments_background" USING "background"::"public"."enum_pages_blocks_darsha_treatments_background";
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DATA TYPE text;
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige'::text;
  DROP TYPE "public"."enum__pages_v_blocks_darsha_treatments_background";
  CREATE TYPE "public"."enum__pages_v_blocks_darsha_treatments_background" AS ENUM('beige', 'warmWhite');
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige'::"public"."enum__pages_v_blocks_darsha_treatments_background";
  ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DATA TYPE "public"."enum__pages_v_blocks_darsha_treatments_background" USING "background"::"public"."enum__pages_v_blocks_darsha_treatments_background";`)
}
