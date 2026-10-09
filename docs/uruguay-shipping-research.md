# Uruguay shipping research

Reviewed 2026-10-06. Research only; no carrier API calls, account registrations, messages, or checkout changes made.

## Agreed requirements

- Uruguay domestic delivery nationwide, subject to selected carrier service/address coverage.
- Free local delivery for the cities of Punta del Este and Maldonado. Do not interpret this as the entire Maldonado department. Exact locality/boundary rules and nearby suburbs need confirmation before launch.
- Pickup at Darsha supported separately from carrier pickup locations; propose zero charge, subject to confirmation.
- Mercado Pago test-account configuration waits until shipping is defined.

## Carrier findings

### UES: preferred first candidate

UES states that it reaches all localities through home distribution and pickup/Xpres locations. The official UES Shopify listing explicitly advertises dynamic rate calculation, address validation, automatic shipments and label printing. This proves rate capability in that integration, not unrestricted API availability for Next.js/Payload. No usable public custom-integration rate contract or current rate sheet was found. Request access/documentation and commercial terms before implementation. The indexed api.ues.com.uy documentation result is Tomcat documentation, not a shipping API specification.

Sources:
- https://ues.com.uy/faq.html
- https://www.ues.com.uy/
- https://apps.shopify.com/ues-envios

### DAC: alternative pending commercial/API confirmation

DAC's DACommerce fulfillment brochure describes API order intake. That is evidence of integration support, not a confirmed standalone rate endpoint for merchants who retain stock. Its public tariff page has a simulator and says prices are approximate; it notes a 10% postal charge excluded from displayed tariffs and separate delivery/collection fees. Extracted package rows include unresolved placeholders, so do not import them as reliable prices. Ask DAC for a current agreed tariff and custom-site quote API. Its manual shipping flow supports agency or home delivery.

Sources:
- https://dacommerce.dac.com.uy/DACommerceFulfillment.pdf
- https://www.dac.com.uy/tarifas
- https://soporte.dac.com.uy/articulos/envios/120/como-realizar-despachos-web

### Correo Uruguayo / Ahíva: documented integration and tariff-table option

Official SOAP documentation exposes test/production shipment creation, labels and tracking. The national `cargaMasiva` call pre-admits shipments and returns generated labels and estimated costs; credit-note submissions can return zero cost. It is not an independent quote call in the reviewed specification. Do not create shipments merely to price abandoned checkouts. Credit accounts require commercial approval; cash/test setup is described in the docs. Confirm current HTTPS endpoints, delivery conditions and account rates with Correo.

Published cash tariff effective 2025-11-01 lists Ahíva parcels up to 2 kg at UYU 195, 2.001–5 kg at 220, and 5.001–10 kg at 275. These are published reference bands, not confirmed Darsha customer quotes or negotiated rates. A versioned tariff table could calculate checkout prices after applicable service/add-ons are confirmed.

Sources:
- https://www.correo.com.uy/servicios-web/-/asset_publisher/KOZQzJts06ds/content/servicios-ahiva
- https://www.correo.com.uy/documents/20182/32359/ServAhiva_paquete_nacional.pdf/46a3ae9b-104e-4f4f-b82f-6e406851300f
- https://www.correo.com.uy/tarifas/-/asset_publisher/QPpkRS5gHXgr/content/tarifas-nacionales-e-internacionales
- https://www.correo.com.uy/documents/20182/1974816/tarifario%2B2025%2BF-1-15.pdf/c21b62cd-9ae1-46e0-a3d3-cbf47464e2f6

### Plaza eCommerce: publicly documented quote API

The provider publishes `POST /api/cotizador/envios/`, authenticated with an account user and derived verifier. It returns account prices by department/region in UYU. Also documents shipment creation, status and active pickups. Example prices are illustrative and must not be imported. No package-weight parameter appears in the documented quote request; confirm package limits, destination coverage, tariff inclusions, origin support and current API support before selecting it.

Source: https://plazaecommerce.com/api.html

## Proposed implementation after carrier choice

Use a shared server shipping service with three outcomes: Darsha pickup, free local delivery, or paid national delivery. Structured country/department/locality fields and carrier IDs should prevent free-delivery eligibility being based only on a free-text city or department.

Quote nationally using the agreed carrier API or a versioned carrier tariff stored in Payload. Keep carrier credentials server-only. Store actual product weight (grams), package dimensions and packaging weight; cosmetic volume is not shipment weight. Choose parcel profiles and calculate total packed weight/number of parcels, including any carrier volumetric rules.

Bind a quote to cart contents, address, service, currency and expiry. Revalidate server-side before creating a Mercado Pago preference. Persist the shipping amount/service and tariff/quote reference with the payment snapshot. Failed quote calls must not silently become free shipping; use an explicitly approved valid tariff fallback or block payment until a quote is available.

Quote calculation and shipment booking are separate. Create carrier shipments only after verified payment (or a separately agreed fulfillment workflow); manual booking is a reasonable first release while rates are automated. Later add idempotent labels/tracking synchronization.

## Questions to send to UES and DAC (draft only)

- Can a custom Next.js/Payload store access an authenticated rate API before creating a shipment?
- Provide current API docs, test credentials/environment, locality/service IDs, labels and tracking interfaces.
- Can Darsha dispatch from Punta del Este/Maldonado, and is collection available there?
- What are account setup requirements, minimum volumes and current contract tariffs?
- What inputs determine rate: weight, volumetric dimensions, parcel count, destination, home versus branch?
- Are taxes/postal fees, collection, insurance, rural deliveries and surcharges included?
- Which addresses have home delivery versus carrier pickup only, and what are the retry/return charges?

No outreach is authorized yet. User may send this draft or explicitly authorize contacting a carrier.

## UES Xpres follow-up — 2026-10-06

The user supplied https://xpres.com.uy/. Browser inspection confirms its public tariff tables are rendered as HTML tables after page data loads. Extracted all four service/zone rows and seven weight bands into `docs/shipping-research/xpres-public-tariffs.json`, with raw rows and provenance. Prices are stored in centésimos. This is reference data only and has not been activated in checkout or imported into the database.

For packages up to 2/5/10 kg respectively, home delivery lists Montevideo UYU 285/331/412 and Interior 311/346/473. Xpres-point delivery lists Montevideo 182/214/233 and Interior 257/288/349. The page labels tariffs tax-inclusive but also shows an IVA/postal-tax note: preserve displayed prices and confirm tax treatment rather than adding taxes automatically. No effective date was visible. The tariff rows do not explicitly specify origin applicability, so confirm rates for dispatch from Maldonado. Do not infer origin pricing from the separate delivery-time matrix.

The terms state a maximum package weight of 50 kg and dimensions 150 × 100 × 100 cm. Packaging must protect the contents; fragile glass requires particular attention. The displayed home-delivery Interior prices for both the 20 kg and 30 kg bands are UYU 803; retained exactly, without correction or inference.

Clicking Crear envío leads to a login prompt. No account was created, credentials entered, shipment submitted or payment initiated. The FAQ's business option directs merchants to a contact form. Login access would allow a later comparison with real quotes, but it is unnecessary to capture the public table and does not establish a supported API integration.

Proposed starting approach: reviewed editable Payload tariff table; free Darsha-local rules take precedence; server calculates a weight-band price after destination validation; no scraper in the checkout request path. Periodic extraction should validate headers/zones/band counts and show differences for review, retaining the last approved version until replacement. Keep shipment creation manual initially. Confirm origin, tax inclusion, weight/dimension rules and coverage before charging these rates to customers.

Sources: https://xpres.com.uy/section-servicios and https://xpres.com.uy/faq (observed in browser).

## Mercado Envíos / WooSync follow-up — 2026-10-06

Reviewed the user-supplied WooSync article. Its current contents are dated 2026-06-11 and describe Mercado Libre marketplace logistics plus synchronization of marketplace listings/orders with WooCommerce. That is not documentation of a standalone Uruguay shipping service for orders placed in a custom Payload storefront. Its mention of Mercado Pago/logistics aggregators does not establish that integration or Uruguay eligibility.

Official Mercado Libre developer material confirms ME2 support in Uruguay and describes configuring shipping on a marketplace item, seller shipping methods, and costs tied to marketplace items/purchases. No supported direct integration for arbitrary Darsha website orders was verified. Therefore keep Mercado Pago Checkout Pro (payment) separate from carrier selection; do not assume paying through Mercado Pago makes a Darsha order eligible for Mercado Envíos.

Recommendation: retain the Xpres tariff-table starting plan. Consider Mercado Envíos if Darsha later sells through Mercado Libre, or if Mercado Libre supplies explicit documentation/approval for an external-store shipping service in Uruguay. Do not reuse marketplace-specific shipping prices or free-shipping subsidies as Darsha carrier rates.

Sources:
- https://www.woosync.io/blog/mercado-envios-desembarca-en-uruguay/
- https://developers.mercadolibre.com.uy/mercadoenvios-modo-2
- https://developers.mercadolibre.com.uy/costos-de-envios
