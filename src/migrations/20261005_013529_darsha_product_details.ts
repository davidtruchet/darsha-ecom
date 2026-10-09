import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "benefits" varchar;
  ALTER TABLE "products" ADD COLUMN "usage_instructions" varchar;
  ALTER TABLE "products" ADD COLUMN "ingredients" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_benefits" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_usage_instructions" varchar;
  ALTER TABLE "_products_v" ADD COLUMN "version_ingredients" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "benefits";
  ALTER TABLE "products" DROP COLUMN "usage_instructions";
  ALTER TABLE "products" DROP COLUMN "ingredients";
  ALTER TABLE "_products_v" DROP COLUMN "version_benefits";
  ALTER TABLE "_products_v" DROP COLUMN "version_usage_instructions";
  ALTER TABLE "_products_v" DROP COLUMN "version_ingredients";`)
}
