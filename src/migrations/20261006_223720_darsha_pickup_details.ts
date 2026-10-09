import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shipping" ADD COLUMN "pickup_address" varchar;
  ALTER TABLE "shipping" ADD COLUMN "pickup_hours" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "shipping" DROP COLUMN "pickup_address";
  ALTER TABLE "shipping" DROP COLUMN "pickup_hours";`)
}
