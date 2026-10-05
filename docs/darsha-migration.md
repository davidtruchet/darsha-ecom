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

## Shop landing and sample catalog

The `/shop` route reads the `shop` document in Pages. Authors can arrange shop introduction, optional promotional banner and product catalog blocks. The catalog supports Spanish search, category and brand filters, sorting and pagination; only published products appear publicly. Authenticated Pages preview also shows product drafts.

Brands are a separate collection from shared product categories. UYU is the default currency on the server and client; native ecommerce amounts use centésimos (UYU 1 = 100). Existing USD fields and historical currencies are preserved. `priceInUYU` is the actual selling price; optional `compareAtPriceInUYU` displays the previous price and must exceed the selling price. Payments are deferred to a later phase.

Run `pnpm payload migrate`, then `pnpm import:darsha-shop` to create the reviewed 12-product sample from `docs/catalog-research/sample.json`. This idempotent importer preserves existing products and page edits, uploads images to Vercel Blob and creates products as drafts with zero inventory. Public supplier prices are editable starting values, not automatic synchronization. Lidherma items remain unpriced until configured. The landing page itself is published with an empty-state message; no promotional offers are invented. Review price, category and Darsha stock before publishing products.

The UYU enum migration runs separately so PostgreSQL commits enum values before the following schema migration uses them as defaults.

## Product detail pages

Product pages use Darsha typography, explicit palette colors and the shared container. The gallery supports accessible image buttons and variant-specific images, with a placeholder when no image exists. Product information includes brand, presentation, short description, UYU pricing and the optional promotional comparison price. Description, benefits, usage instructions and ingredients appear in native accordions; empty sections are hidden. Related products are chosen in Payload and follow publication access rules.

The quantity selector is capped by inventory minus units already in the cart for that product/variant. Missing prices, unavailable stock, unselected variants and draft products disable purchasing. Imported stock remains zero until an author confirms Darsha inventory. The cart provider may silently resolve after an API failure, so success feedback checks the resulting cart quantity. Draft product pages stay out of search indexes; structured product data uses UYU units and omits unknown prices.

Focused checks: `pnpm exec vitest run tests/int/product-purchase.int.spec.ts tests/int/add-to-cart.int.spec.ts`. These cover unknown and disabled prices, stock limits, variant selection, cart quantities and success/failure confirmation. Payment integration remains deferred.

## Next phase: cart

Continue on `codex/darsha-shop-landing` with the cart interface: Darsha styling and Spanish labels, UYU item prices and totals, quantity changes/removal, empty state, persistence and clear stock/API error feedback. The shop and product detail pages are ready for review; the 12 imported sample products are still drafts with zero confirmed stock, and Lidherma prices remain unset. Test purchases require published products with a configured UYU price and Darsha inventory. Payment integration stays outside this next phase.
