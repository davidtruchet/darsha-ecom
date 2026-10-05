# Darsha migration

The `pages` collection owns the page order. The home page uses the Darsha hero, cards, image/text, testimonials, and contact blocks. Editors may add, remove, and reorder these blocks. Header and footer remain shared globals. The older template blocks remain available for existing content.

## Initial home import

Set `POSTGRES_URL`, `PAYLOAD_SECRET`, and `BLOB_READ_WRITE_TOKEN` in the target environment. The committed migrations contain the template baseline followed by the Darsha home blocks. Run `pnpm payload migrate` on a new database, then `pnpm import:darsha-home`. The import uploads the source images from `public/darsha`, creates the published `home` page, and sets header/footer links. If a page with slug `home` already exists, the script exits without changing content. `migrate:fresh` deletes all existing database content; use it only when intentionally resetting a disposable database.

The reset removes admin users. Open `/admin` to create the first administrator after a fresh migration and import.

Local development can omit `BLOB_READ_WRITE_TOKEN`, in which case media uses local storage. Vercel deployments must provide it so uploaded files persist. Frontend media URLs use Next.js Image and permit Vercel Blob's public hostname, allowing normal Vercel image optimization.

The old demo seed endpoint is destructive and must not be used for Darsha content.

## Servicios import

The `servicios` page uses a gradient intro, two treatment accordion blocks, and a booking call-to-action. Treatment text and the original price strings are editable within the page blocks. The section-level “Mostrar precios de tratamientos” option is off by default, so prices stay hidden until an editor enables it. Treatment booking continues to link to WhatsApp; products use the separate shop checkout.

Run `pnpm payload migrate` to add the Servicios block tables, then `pnpm import:darsha-services`. The import uploads the two treatment photos from `public/darsha` and publishes `/servicios`. Decorative curves are served from the same local asset directory. Rerunning the script skips an existing `servicios` page rather than overwriting edits.
