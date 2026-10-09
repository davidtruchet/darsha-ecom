# Mercado Pago Checkout Pro proposal

Implemented and tested 2026-10-06. Checkout Pro, guest checkout, manual pickup payments, shipping quotes and Stripe runtime cleanup are included. The reference findings below record the original design research; current behavior and setup appear later in this document.

## Reference findings

The supplied example uses `MercadoPagoConfig` with a server access token, `Preference.create` to create a hosted checkout, and redirects to `init_point`. Its webhook retrieves the payment with `Payment.get` and persists a result only for approved payments. It demonstrates the flow using a JSON file and message metadata, not a production order ledger. Darsha will use Payload/Postgres instead of filesystem persistence on Vercel.

References:
- https://github.com/goncy/next-mercadopago/blob/main/integraciones/checkout-pro/README.md
- https://github.com/goncy/next-mercadopago/blob/main/integraciones/checkout-pro/src/api.ts
- https://github.com/goncy/next-mercadopago/blob/main/integraciones/checkout-pro/src/app/api/mercadopago/route.ts
- https://www.mercadopago.com.uy/developers/es/docs/checkout-pro-preferences/overview
- https://www.mercadopago.com.uy/developers/es/docs/checkout-pro-preferences/additional-content/notifications/webhooks
- https://payloadcms.com/docs/ecommerce/payments

## Proposed Stripe cleanup

Remove server/client Stripe adapters, three direct Stripe packages and their lockfile entries, environment examples and webhook CLI script. Retire the unused Stripe payment form, confirmation component and payment-specific template E2E scenarios. Preserve `/checkout` with a Spanish temporary unavailable state and cart link until the approved checkout is ready; the old confirmation route must not attempt Stripe confirmation. Remove Stripe setup guidance from the admin dashboard and Stripe transaction fixtures from the template seeder. Regenerate Payload types.

Keep applied migrations immutable. Preserve historical database columns/data during code cleanup. Review removal of obsolete columns in a new migration alongside the Mercado Pago transaction fields, rather than modifying historical migrations or dropping data now. Do not edit or print private `.env` credentials.

Automatic approval review rejected the combined cleanup because it deleted checkout components/tests before this scope had been agreed. Working tree remained unchanged after that rejection. Approval of this concrete cleanup scope is needed before proceeding.

## Proposed checkout flow

1. Spanish checkout page collects contact details and the agreed delivery/pickup information. Support guests unless the user chooses account-only purchases.
2. Server authenticates cart ownership/guest secret and reloads published products/variants, configured prices, quantities and stock. It calculates all amounts itself in integer centésimos; convert to UYU units only at the Mercado Pago boundary.
3. Persist an immutable pending transaction snapshot with customer, items, unit prices, delivery charges, total, currency and opaque reference. Define reservation expiry and pending-payment policy before enabling payment methods that can settle later.
4. Create a preference through the server SDK with UYU items, opaque external reference, fixed trusted return URLs and HTTPS notification URL. Return the hosted checkout URL to the frontend. Repeated checkout initiation should reuse a matching active attempt or intentionally expire/replace it.
5. Signed webhook retrieves the actual payment from Mercado Pago and validates approved status, amount, currency, reference, merchant and environment against the saved attempt. Do not trust redirect query parameters, browser-submitted amounts or webhook status alone.
6. A shared transaction-safe settlement service creates exactly one order, links its payment, updates the cart and handles stock once. Webhook delivery, browser return and reconciliation retries must converge on the same order. Pending, rejected and cancelled attempts do not appear paid. Refund/chargeback updates need an explicit state policy.
7. Return page displays verified paid/pending/failed status through an authorized lookup and tolerates webhook delays. Clear only the purchased cart; unrelated additions after checkout must survive.

## Payload version constraint

Installed `@payloadcms/plugin-ecommerce` is 3.89.0. Its local ConfirmOrder type has no `finalizeOrder` callback. Its confirmation endpoint decrements inventory after an adapter returns a transaction ID, without the atomic settlement behavior described in the currently published docs. Do not assume those docs match this installation. Plan a custom Mercado Pago adapter for initiation plus a shared settlement endpoint/service that owns idempotency and inventory, or evaluate a separately approved compatible Payload upgrade. Avoid combining custom stock updates with the installed core's automatic decrement.

## Setup and validation

Need a Uruguay merchant application, appropriate test buyer/seller setup for the selected Checkout Pro flow, server-only access token, webhook signing secret and a stable publicly reachable HTTPS testing URL on Vercel. Use the current Uruguay dashboard/docs to confirm test credential requirements; do not copy the example's Argentina-specific setup blindly. A redirect-only flow does not require embedding card fields or a browser payment SDK.

Before launch test approved, pending, rejected, cancelled and abandoned attempts; changed stock/prices; duplicate and concurrent webhooks; invalid signatures; wrong amount/currency/reference/merchant; guest access; browser return before webhook and no browser return; retries and database failures; cart edits while checkout is open. No live payments as part of implementation verification.

## Decisions before implementation

- Pickup, delivery, or both; geographic coverage and delivery pricing.
- Guest checkout recommendation versus mandatory accounts.
- Pending/offline payment support and stock reservation expiry.
- Whether the Uruguay Mercado Pago application and test credentials already exist.
- Approval of the Stripe cleanup scope above.

## Shipping decisions recorded 2026-10-06

Support Darsha pickup and nationwide Uruguay delivery. Local delivery is free for Punta del Este and Maldonado cities; carrier selection, rates and exact boundaries remain to be defined. See [shipping research](./uruguay-shipping-research.md). Mercado Pago test-account setup is deferred until shipping is settled.

## Implementation started 2026-10-06

The user approved guest checkout and the Stripe cleanup. Runtime cleanup is applied; historical data is preserved. Pickup additionally supports manually confirmed bank transfer and cash. See `docs/darsha-migration.md` for implemented endpoints, reservation behavior, environment setup and outstanding external verification. The earlier automatic-review rejection is resolved by the user’s explicit approval.

## Local HTTPS testing

The reference sample recommends Cloudflare Tunnel or VS Code Dev Tunnels. For Cloudflare,
run the local app with `pnpm dev`, then start:

```sh
cloudflared tunnel --url http://localhost:3000 --no-autoupdate
```

Save the returned HTTPS origin as `CHECKOUT_PUBLIC_URL` in the ignored `.env`.
Next's `allowedDevOrigins` permits only this configured hostname for development assets.
Register `<HTTPS origin>/api/checkout/webhook` for Mercado Pago payment notifications,
and save the signing secret as `MERCADO_PAGO_WEBHOOK_SECRET`. This secret is separate
from the Access Token and test-user login verification code.

Browse the shop and begin checkout through the HTTPS tunnel, including when testing
as a guest: the receipt access cookie must belong to the same origin as the return URL.
Keep both the development server and tunnel running. Quick-tunnel URLs change when
restarted; update `.env` and the Mercado Pago webhook URL each time.

Use the Uruguay test buyer separately from the seller, in an incognito browser, with
Mercado Pago's documented test cards. Verify approved and rejected purchases, signed
webhook delivery, exact UYU totals including shipping, order creation, stock reserved
only once, duplicate callbacks, and abandoned checkout expiration. Public key and
seller login credentials are not needed by this redirect-based server integration.

Checkout Pro test-account verification: a real test purchase returned `live_mode: true` while `/users/me` confirmed the seller has the `test_user` tag. Reconciliation therefore verifies the authenticated merchant ID and account type for `MERCADO_PAGO_MODE=test`; production requires a non-test merchant and `live_mode: true`. Amount, UYU currency, collector ID and external reference remain mandatory.

Shipping test correction: an actual delivery payment omitted `shipments.cost` and paid only the product subtotal. Shipping is now a separate UYU preference item, and the real-preference smoke check asserts the summed items equal the saved total. Authentic approved payments with mismatched totals create a review order and commit its already-reserved stock to that order for manual resolution. Purchased cart quantities are removed once so the reusable cart can start another checkout. Repeated notifications preserve new additions. Browser authentication requests use relative API URLs so public tunnel sessions do not call localhost.
