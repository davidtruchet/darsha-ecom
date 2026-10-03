# Darsha migration

The `pages` collection owns the page order. The home page uses the Darsha hero, cards, image/text, testimonials, and contact blocks. Editors may add, remove, and reorder these blocks. Header and footer remain shared globals. The older template blocks remain available for existing content.

## Initial home import

Set `POSTGRES_URL`, `PAYLOAD_SECRET`, and `BLOB_READ_WRITE_TOKEN` in the target environment. The committed migrations contain the template baseline followed by the Darsha home blocks. Run `pnpm payload migrate` on a new database, then `pnpm import:darsha-home`. The import uploads the source images from `public/darsha`, creates the published `home` page, and sets header/footer links. If a page with slug `home` already exists, the script exits without changing content. `migrate:fresh` deletes all existing database content; use it only when intentionally resetting a disposable database.

The reset removes admin users. Open `/admin` to create the first administrator after a fresh migration and import.

Local development can omit `BLOB_READ_WRITE_TOKEN`, in which case media uses local storage. Vercel deployments must provide it so uploaded files persist. Frontend media URLs use Next.js Image and permit Vercel Blob's public hostname, allowing normal Vercel image optimization.

The old demo seed endpoint is destructive and must not be used for Darsha content.
