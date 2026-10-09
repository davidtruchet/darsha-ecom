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

## Cart

The header drawer and `/cart` page share a Spanish cart view with Darsha styling, optimized product images, brand/presentation/variant information, UYU unit and line prices, subtotal, quantity controls and removal. Increasing quantities respects inventory; unavailable or unpriced items remain removable. Unknown prices are excluded from a clearly labeled partial subtotal. Guest carts use Payload's local-storage persistence. Cart population explicitly includes price, publication and variant fields so refreshes preserve the display. Restoring or modifying a cart fetches current product data; failed provider mutations are detected from the resulting quantities. Error recovery reloads the page so Payload restores guest carts with their access token; its manual refresh method omits that token in the installed version.

The primary action is “Continuar comprando”; checkout and payment integration are deferred. Delivery charges are not calculated yet.

For development testing, the user authorized publication of all 12 sample products and 10 test units for each of the six priced Germaine products. This was applied to the configured database. Lidherma products remain unpriced and cannot be purchased. `src/scripts/prepare-darsha-test-catalog.ts` records this explicit development setup; rerunning it resets priced sample stock to 10. Replace test stock with confirmed real inventory before launch.

Focused checks: `pnpm exec vitest run tests/int/cart.int.spec.ts tests/int/product-purchase.int.spec.ts tests/int/add-to-cart.int.spec.ts`.

## Shipping estimates

The cart drawer and `/cart` include a delivery/pickup estimator backed by `POST /api/shipping/quote`. The server authenticates access to the cart (including guest secret), reads current published products and the Shipping global, and calculates in integer grams and UYU centésimos. Browser-submitted prices or weights are never used. Estimates are discarded when the cart or destination changes.

Products have an optional “Peso para envío (gramos)” field. Enter actual product-plus-container weight; for variants use the greatest weight. Under Globals → Envíos, set packaging weight and edit Xpres home-delivery weight bands. Product and packaging weights were intentionally left blank. Missing weights prevent paid national delivery estimates, while store pickup and local delivery in Punta del Este/Maldonado cities remain free. The first version assumes one parcel per order and does not book carrier shipments.

The additive `20261006_165339_darsha_shipping` migration and initial tariff import were applied to the configured database. `pnpm exec tsx src/scripts/import-darsha-shipping.ts` imports the observed Xpres rates only when no tariff rows exist, preserving editorial changes. Rates are estimates pending origin/tax/coverage confirmation; no Mercado Pago preference or binding shipping selection is created in this phase. The payment implementation must validate the full address and recalculate shipping before saving its transaction snapshot.

### Temporary shipping test values

On 2026-10-06 the user authorized filling the 12 sample products with temporary shipping weights to continue testing. `src/scripts/prepare-darsha-test-shipping.ts` fills only unset fields and preserves existing editorial weights. The test values range from 60 to 350 g per product and use 200 g of packaging per parcel. These are development estimates, not measured supplier specifications. Replace them with actual packed-product and packaging weights before launch. A 200 g cream yields 400 g for one unit and 2,200 g for ten units, exercising the 2 kg and 5 kg tariff bands.

## Guest checkout and payments

Checkout supports guest contact details, Darsha pickup or Uruguay home delivery, and a server-verified UYU order summary. Shipping selection carries over from the cart. Delivery uses Mercado Pago Checkout Pro; pickup additionally offers bank transfer and cash at pickup. Manual orders remain unpaid until an administrator marks “Pago recibido” in the Pagos de pedidos collection. Cancelling an unpaid manual order in Orders releases its reserved stock. Pickup readiness/contact are manual operations in this phase; no email adapter or automatic notification was configured.

`checkout-attempts` stores immutable order/contact/delivery/price snapshots, secure receipt access hashes, provider IDs and reservation state. Checkout reserves stock atomically in PostgreSQL. Online preferences expire after 20 minutes; unpaid pickup reservations currently default to 48 hours, editable under Envíos. Pickup orders clear ordered items immediately; later payment confirmation leaves new cart additions intact. Mercado Pago settlement removes only the matching purchased cart-line units. Duplicate requests and concurrent settlement retries reuse the existing attempt/order and never decrement reserved stock a second time.

Stripe packages, runtime adapters, payment form, confirmation component, environment examples, CLI command, admin guidance and Stripe-specific template payment E2E scenarios were removed. Historical migration/schema columns remain available as hidden legacy fields so this cleanup does not erase past transaction data. The additive `20261006_222330_darsha_checkout` migration was applied.

Required server variables for Mercado Pago test verification:

- `MERCADO_PAGO_ACCESS_TOKEN`: credentials for the appropriate Uruguay test seller/application.
- `MERCADO_PAGO_WEBHOOK_SECRET`: webhook signing secret.
- `MERCADO_PAGO_COLLECTOR_ID`: expected seller ID.
- `MERCADO_PAGO_MODE=test`: production is explicit and checks provider live mode.
- `CHECKOUT_PUBLIC_URL`: stable public HTTPS origin for checkout return and webhook URLs.

Register payment notifications at `/api/checkout/webhook`. The handler verifies HMAC signatures, retrieves the payment using the server SDK and compares approved status, reference, amount, UYU currency, collector and environment with the saved attempt. A browser return cannot mark an order paid without this verification. Online checkout stays unavailable until configuration exists, without reserving stock.

Expired reservations are reconciled/released during checkout and authorized receipt checks. `/api/checkout/expire` also supports administrator POST or scheduled GET/POST with `Authorization: Bearer CRON_SECRET`. Configure an appropriate scheduler before launch so expiry does not depend on customer activity; no scheduler has been deployed in this phase. Approved payments discovered after reservation release and refunds/chargebacks enter review; they do not silently allocate unavailable stock or restock goods. Operational refund/fulfillment decisions are manual.

Bank transfer instructions are editable under Envíos and appear only in authorized transfer receipts. Until entered, the receipt says Darsha will send instructions. Never collect card details or bank passwords in Darsha checkout.

Verification: focused payment-signature, immutable-price, delivery, guest-access and cart tests; `src/scripts/verify-darsha-checkout.ts` also verifies real development-DB reservations, idempotent retries, admin manual confirmation and concurrent settlement. It cancels its synthetic orders and restores only their reserved units. Real Mercado Pago test purchases were verified through a temporary Cloudflare HTTPS tunnel, including approved orders, shipping-total correction, review-order recovery, repeat reconciliation and a signed webhook resend returning HTTP 200. The local credentials and tunnel URL are excluded from Git. Production still requires production credentials, a stable HTTPS origin, verified tariffs/weights, and an expiry scheduler.

Pickup address and hours are editable under Envíos and shown at checkout when configured; their additive migration is `20261006_223720_darsha_pickup_details`. They remain blank pending the user's values. Cart lines are kept in a reusable active cart after online settlement so the installed ecommerce provider can continue shopping. Purchase history lives in Orders/Transactions rather than freezing that reusable cart.
