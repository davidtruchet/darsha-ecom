import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

// The white enum value must be committed by the preceding migration before use.
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'white';
    ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'white';
    UPDATE "pages_blocks_darsha_treatments" SET "background" = 'white'
      WHERE "section_id" = 'faciales' AND "background" = 'beige'
      AND "_parent_id" IN (SELECT "id" FROM "pages" WHERE "slug" = 'servicios');
    UPDATE "_pages_v_blocks_darsha_treatments" SET "background" = 'white'
      WHERE "section_id" = 'faciales' AND "background" = 'beige'
      AND "_parent_id" IN (SELECT "id" FROM "_pages_v" WHERE "version_slug" = 'servicios');
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige';
    ALTER TABLE "_pages_v_blocks_darsha_treatments" ALTER COLUMN "background" SET DEFAULT 'beige';
    UPDATE "pages_blocks_darsha_treatments" SET "background" = 'beige'
      WHERE "section_id" = 'faciales' AND "background" = 'white'
      AND "_parent_id" IN (SELECT "id" FROM "pages" WHERE "slug" = 'servicios');
    UPDATE "_pages_v_blocks_darsha_treatments" SET "background" = 'beige'
      WHERE "section_id" = 'faciales' AND "background" = 'white'
      AND "_parent_id" IN (SELECT "id" FROM "_pages_v" WHERE "version_slug" = 'servicios');
  `)
}
