# PROTINUT Foods Frontend Bug Audit

## 1. Project overview and scope

This audit covered the existing React/Vite storefront and admin dashboard; it did not create a backend or introduce API calls. The repository inventory contained 282 tracked files. The source/style scan covered 89 files, reviewed in customer-commerce, admin, and application-shell/public-UI passes.

The app currently keeps important account, cart, order, and admin state in browser storage. This is useful for frontend development but is not server-side authentication, authorization, payment processing, or durable multi-user order storage.

## 2. Confirmed bugs

All findings below were confirmed in the existing frontend implementation and fixed. “Before” describes the behavior before the audit fix.

### BUG-01 — Logout retained another user's commerce state
- **Affected file / feature:** `src/App.jsx`; logout, cart, wishlist, and orders
- **Severity:** High
- **Root cause:** Logout cleared authentication but did not reset the shared in-memory commerce state.
- **Reproduce:** Sign in, populate cart/wishlist/order state, then log out or switch users.
- **Expected:** The next signed-in user must not inherit the previous user's in-memory state.
- **Actual before fix:** Cart, orders, or wishlist could remain visible until a reload.

### BUG-02 — Tracking route was not protected
- **Affected file / feature:** `src/App.jsx`; order tracking route
- **Severity:** High
- **Root cause:** The route did not require a signed-in user.
- **Reproduce:** Open an order tracking URL while signed out.
- **Expected:** Redirect to sign-in; do not render order details.
- **Actual before fix:** Tracking content could be reached without the route-level authentication check.

### BUG-03 — Order detail and tracking did not consistently check ownership
- **Affected files / feature:** `src/pages/OrderDetailPage.jsx`, `src/pages/TrackingPage.jsx`; order privacy
- **Severity:** High
- **Root cause:** A selected order was not consistently matched to the signed-in user's email/identifier.
- **Reproduce:** Sign in as one user and open another user's order URL.
- **Expected:** Do not display another user's order or delivery address.
- **Actual before fix:** The lookup could render an order based on its ID without a consistent owner check.

### BUG-04 — Orders could be shown when the signed-in user had no email
- **Affected file / feature:** `src/pages/OrdersPage.jsx`; My Orders
- **Severity:** High
- **Root cause:** An absent identity value was not treated as an invalid owner lookup.
- **Reproduce:** Sign in with an account lacking an email and open My Orders.
- **Expected:** Show no orders until a valid owner identity is available.
- **Actual before fix:** The missing identity could weaken the filter and expose unrelated local orders.

### BUG-05 — Wildcard homepage route omitted the Buy Now callback
- **Affected file / feature:** `src/App.jsx`; product purchase navigation
- **Severity:** Medium
- **Root cause:** The fallback route rendered the homepage without forwarding the existing `onBuyNow` handler.
- **Reproduce:** Reach the homepage through an unmatched URL and select Buy Now on a product.
- **Expected:** Use the same purchase flow as the normal homepage route.
- **Actual before fix:** The callback was unavailable on the fallback-rendered homepage.

### BUG-06 — “Remember me” did not select the persistence lifetime
- **Affected files / feature:** `src/AuthContext.jsx`, `src/AuthModal.jsx`; authentication UI
- **Severity:** Medium
- **Root cause:** The remember-me choice was not consistently used to select local versus session storage, and logout did not clear both locations.
- **Reproduce:** Sign in with remember-me off, close/reopen the browser, then sign out.
- **Expected:** Session-only login ends with the session; logout removes persisted login state.
- **Actual before fix:** Login lifetime could ignore the choice, and stale user data could remain in the other storage area.

### BUG-07 — Password visibility controls were not keyboard accessible
- **Affected file / feature:** `src/AuthModal.jsx`; login and registration accessibility
- **Severity:** Low
- **Root cause:** Visibility toggles were not reliably reachable/operable by keyboard users.
- **Reproduce:** Navigate the authentication form using only Tab and Enter/Space.
- **Expected:** Reach and activate the visibility toggle with the keyboard.
- **Actual before fix:** The control was not properly keyboard-focusable.

### BUG-08 — Order state could report success before persistence succeeded
- **Affected file / feature:** `src/OrderContext.jsx`; shared order writes
- **Severity:** High
- **Root cause:** State updates were not consistently gated on successful browser-storage writes, and persistence failure was not propagated to callers.
- **Reproduce:** Make an order/status/cancellation write fail, then inspect the UI and reload.
- **Expected:** Do not show a successful update unless persistence succeeds; surface failure to the caller.
- **Actual before fix:** In-memory state could look updated while a refresh lost the change.

### BUG-09 — Cancellation could be repeated or applied to an invalid order
- **Affected file / feature:** `src/OrderContext.jsx`; order cancellation
- **Severity:** Medium
- **Root cause:** The shared cancellation operation did not reject missing, already-cancelled, or otherwise non-cancellable orders consistently.
- **Reproduce:** Cancel an order, then attempt to cancel the same order again, or pass an invalid order ID.
- **Expected:** Apply cancellation once, retain the reason, and reject invalid/repeated updates.
- **Actual before fix:** The shared update path could accept an invalid or repeated cancellation attempt.

### BUG-10 — Cancellation dialog closed even if the update failed
- **Affected file / feature:** `src/CancelOrderModal.jsx`; cancellation confirmation
- **Severity:** Medium
- **Root cause:** The modal closed on confirmation without requiring a successful shared-store update.
- **Reproduce:** Force cancellation persistence to fail and confirm the dialog.
- **Expected:** Keep the dialog open and communicate failure so the user can retry.
- **Actual before fix:** The dialog could disappear despite the order remaining unchanged.

### BUG-11 — Successful cart checkout left purchased items in the cart
- **Affected file / feature:** `src/pages/CheckoutPage.jsx`; checkout
- **Severity:** Medium
- **Root cause:** Successful cart checkout did not clear the purchased cart items; the Buy Now flow also needed to preserve unrelated cart contents.
- **Reproduce:** Place an order from the cart and return to the cart.
- **Expected:** Clear cart items used for checkout, while preserving the cart for Buy Now.
- **Actual before fix:** Purchased items could remain and appear ready to order again.

### BUG-12 — Free-delivery message disagreed with the pricing threshold
- **Affected file / feature:** `src/pages/CartPage.jsx`; delivery charge messaging
- **Severity:** Low
- **Root cause:** The banner used a different boundary from the existing `subtotal > 499` pricing rule.
- **Reproduce:** Set the cart subtotal to exactly ₹499.
- **Expected:** Show the amount still needed to meet the existing free-delivery condition.
- **Actual before fix:** The banner could claim free delivery at the boundary, or show no remaining amount, while pricing still charged delivery.

### BUG-13 — COD order success used refund-oriented wording
- **Affected file / feature:** `src/pages/OrderSuccessPage.jsx`; order summary
- **Severity:** Low
- **Root cause:** A generic payment label was misleading for Cash on Delivery.
- **Reproduce:** Place a COD order and inspect the success page.
- **Expected:** Use neutral wording that does not imply payment or refund has occurred.
- **Actual before fix:** The total label could imply prepaid/refund semantics for an unpaid COD order.

### BUG-14 — Customer account exposed a destructive testing reset
- **Affected file / feature:** `src/pages/AccountPage.jsx`; account UI
- **Severity:** High
- **Root cause:** A testing-only state reset was exposed in the customer-facing account page.
- **Reproduce:** Open the account page and activate the reset control.
- **Expected:** A customer must not be able to erase application data through a test utility.
- **Actual before fix:** The destructive reset was available in the customer UI.

### BUG-15 — New reviews were labeled verified without verification
- **Affected file / feature:** `src/ProductReviewSection.jsx`; reviews
- **Severity:** Medium
- **Root cause:** The frontend assigned a verified-purchase label without checking purchase history.
- **Reproduce:** Submit a review from an account with no matching completed purchase.
- **Expected:** Only verified purchases receive a verified label.
- **Actual before fix:** A newly submitted review could be presented as verified without evidence.

### BUG-16 — Review photo action did not provide a validated local preview
- **Affected file / feature:** `src/ProductReviewSection.jsx`; review attachments
- **Severity:** Low
- **Root cause:** The photo action did not reliably load an image for preview or enforce safe type/size limits.
- **Reproduce:** Select a review photo, including a non-image or oversized file.
- **Expected:** Preview only valid image files within the 5 MB limit and explain invalid selections.
- **Actual before fix:** The action did not provide that validated local-preview behavior.

### BUG-17 — Newsletter form claimed an enrollment/coupon without a service
- **Affected file / feature:** `src/Footer.jsx`; newsletter
- **Severity:** Medium
- **Root cause:** The frontend reported a successful subscription/coupon despite having no connected signup service.
- **Reproduce:** Submit an email in the footer form.
- **Expected:** Do not claim enrollment or coupon issuance unless it actually occurs.
- **Actual before fix:** The UI showed a success-shaped response without saving a subscription.

### BUG-18 — Admin order status could claim success after persistence failure
- **Affected file / feature:** `src/pages/admin/AdminDashboardPage.jsx`; admin order status
- **Severity:** Medium
- **Root cause:** The UI reported a status change without checking the shared order update result.
- **Reproduce:** Make the order update fail and change an order status in admin.
- **Expected:** Show success only after the update is persisted; otherwise show failure.
- **Actual before fix:** The admin UI could report success while a reload reverted the status.

### BUG-19 — Admin status chart omitted other order statuses
- **Affected file / feature:** `src/pages/admin/AdminDashboardPage.jsx`; status donut
- **Severity:** Low
- **Root cause:** The chart only accounted for a subset of statuses.
- **Reproduce:** Add an order with a valid status outside the chart's listed categories.
- **Expected:** Include that order in a visible “Other” category.
- **Actual before fix:** The chart silently omitted it from the displayed distribution.

### BUG-20 — Admin search had no explicit accessible name
- **Affected file / feature:** `src/pages/admin/AdminLayout.jsx`; admin navigation
- **Severity:** Low
- **Root cause:** The search control lacked an explicit accessible label.
- **Reproduce:** Inspect the admin page with a screen reader or accessibility tree.
- **Expected:** Search has a programmatic name independent of placeholder text.
- **Actual before fix:** The control was not explicitly named for assistive technology.

## 3. Potential and unresolved issues

These are not included in the 20 confirmed fixes above.

| ID | Issue | Severity | Status / next step |
|---|---|---|---|
| RISK-01 | Customer/admin authentication and order ownership are client-controlled. Browser storage and frontend checks can be modified or bypassed. | High | Backend must authenticate users and authorize every order/admin operation server-side before production. |
| RISK-02 | Orders, cancellations, reviews, and admin updates use frontend persistence; they are not durable or synchronized across devices/users. | High | Add server-backed persistence when the backend is ready. Do not treat localStorage as a database. |
| RISK-03 | Online payment is simulated, and the frontend does not issue refunds. | High | Integrate a payment provider with server-side verification, idempotency, and refund reconciliation. |
| RISK-04 | State-wise/admin revenue depends on available frontend order data; the business definition of net revenue and actual refunds remains unverified. | Medium | Define gross/net treatment and calculate from authoritative server payment/refund records. |
| RISK-05 | `npm audit` reported one high and one moderate development-tool advisory involving Vite 5.4.21/esbuild; `npm audit --omit=dev` reported no production dependency advisories. | High (development toolchain) | Review the advisory details and plan a compatible toolchain update. No dependency upgrade was made during this frontend-only audit. |
| RISK-06 | The production build reports a main chunk around 622 kB, and the page loads Tailwind via CDN, which emitted a production-use warning. | Medium | Evaluate code splitting and a production Tailwind build pipeline. |
| RISK-07 | The project has no configured automated test or lint scripts. | Medium | Add focused automated tests and linting as a separate, approved tooling change. |
| RISK-08 | Real driver GPS/live delivery movement is not available from the frontend alone. | Medium | A backend/driver app must provide authenticated location updates; the UI must continue to label non-live route estimates accurately. |

## 4. Files changed for this audit

The audit-specific code changes were made in:

- `src/App.jsx`
- `src/AuthContext.jsx`
- `src/AuthModal.jsx`
- `src/CancelOrderModal.jsx`
- `src/Footer.jsx`
- `src/OrderContext.jsx`
- `src/ProductReviewSection.jsx`
- `src/pages/AccountPage.jsx`
- `src/pages/CartPage.jsx`
- `src/pages/CheckoutPage.jsx`
- `src/pages/OrderDetailPage.jsx`
- `src/pages/OrderSuccessPage.jsx`
- `src/pages/OrdersPage.jsx`
- `src/pages/TrackingPage.jsx`
- `src/pages/admin/AdminDashboardPage.jsx`
- `src/pages/admin/AdminLayout.jsx`

The worktree already contained changes from earlier feature requests. Those unrelated changes were left intact and are not listed above as audit fixes.

## 5. Validation results

- **Production build:** `npm run build` passed. Vite emitted the existing large-chunk warning.
- **Whitespace/diff check:** `git diff --check` passed.
- **Focused logic checks:** COD, successful prepaid, failed/pending payment refund eligibility, and the exact free-delivery boundary passed.
- **Browser checks:** unauthenticated tracking redirected to sign-in; an order-owner mismatch did not expose the order address; logout cleared in-memory/persisted commerce state.
- **Cancellation checks:** COD, successful prepaid, failed/pending payment, cancellation persistence after refresh, and repeat-cancellation prevention were checked with temporary data.
- **Checkout smoke:** completed a temporary COD checkout using the displayed verification code; one order was created with `Order Placed` / `Unpaid` status and the cart cleared. Temporary test order, user, address, cart, wishlist, and customer fixture data were removed afterward.
- **Browser console:** no page errors were found during the final checkout smoke. The Tailwind CDN production warning remains.
- **Automated tests/lint:** not run; no test or lint scripts are configured.

## 6. Final counts and manual testing

- **Tracked files inventoried:** 282
- **Source/style files in audit scan:** 89
- **Confirmed bugs fixed:** 20
- **Confirmed bugs left unfixed:** 0
- **Critical confirmed bugs:** 0
- **High-severity unresolved release risks:** authentication/authorization, server persistence, and payment/refund verification (see RISK-01 through RISK-03).

Manual QA is still needed on real devices for responsive layouts, accessibility with assistive technology, payment-provider flows, backend authorization, database persistence, and real delivery tracking. No real payment, refund, backend, or multi-user persistence test was possible because those services are not connected.
