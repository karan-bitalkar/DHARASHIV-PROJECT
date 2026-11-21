# PROTINUT Foods - Corrected Backend Final Architecture

**Document purpose:** Final backend requirement, API, database, integration and development-plan review. No backend or frontend implementation is included.

**Source evidence:** [PROTINUT_BACKEND_REQUIREMENT_ANALYSIS.md](PROTINUT_BACKEND_REQUIREMENT_ANALYSIS.md) and the complete frontend under [src](src).

**Technology baseline:** Java 17, Spring Boot, Spring Data JPA/Hibernate, MySQL, Spring Security, JWT and Maven.

## 1. Scope correction

The original 109-endpoint design mixed:

- features currently visible in the React UI;
- browser-only behavior that must become durable;
- payment and tracking systems that are not currently functional;
- speculative enhancements that have no frontend control.

This corrected design separates an MVP from future enhancements.

### MVP definition

The MVP is the smallest backend that replaces the real working frontend flows:

- customer and admin authentication;
- customer and admin profiles;
- public product, category and product-image reads;
- server-backed cart and wishlist;
- saved checkout address;
- server-calculated checkout;
- COD order placement;
- owned order history and order details;
- order cancellation;
- order status timeline tracking;
- review submission, review reads and helpful votes;
- admin products, customers, orders, inventory, dashboard and analytics;
- website settings and banners.

### Future enhancements

Deferred work includes:

- password reset;
- customer profile editing and password change;
- address default/delete management;
- server-generated invoice PDF;
- delivery-agent login and GPS;
- courier tracking and map/route APIs;
- Razorpay and prepaid payment/refund flows;
- return and refund workflow;
- notifications;
- newsletter;
- contact-message persistence;
- social login;
- sales export.

## 2. Individually reconciled API count

The original report contains 109 unique method/path rows. Each row was retained or moved below according to actual frontend implementation.

### 2.1 Final count

| Scope | GET | POST | PUT | PATCH | DELETE | Total |
|---|---:|---:|---:|---:|---:|---:|
| MVP | 31 | 17 | 3 | 7 | 9 | **67** |
| Future | 14 | 15 | 3 | 6 | 4 | **42** |
| **Complete architecture** | **45** | **32** | **6** | **13** | **13** | **109** |

### 2.2 MVP endpoint IDs

These 67 endpoints are part of the initial backend:

#### Authentication and customer

- `AUTH-01`: `POST /api/v1/auth/register`
- `AUTH-02`: `POST /api/v1/auth/login`
- `AUTH-03`: `POST /api/v1/admin/auth/login`
- `AUTH-04`: `POST /api/v1/auth/refresh`
- `AUTH-05`: `POST /api/v1/auth/logout`
- `CUST-01`: `GET /api/v1/customers/me`

#### Products and categories

- `PROD-01`: `GET /api/v1/products`
- `PROD-02`: `GET /api/v1/products/{productId}`
- `CAT-01`: `GET /api/v1/categories`
- `IMG-01`: `GET /api/v1/products/{productId}/images`
- `IMG-02`: `POST /api/v1/admin/products/{productId}/images`
- `IMG-03`: `PATCH /api/v1/admin/products/{productId}/images/{imageId}/primary`
- `IMG-04`: `DELETE /api/v1/admin/products/{productId}/images/{imageId}`

#### Cart and wishlist

- `CART-01`: `GET /api/v1/cart`
- `CART-02`: `POST /api/v1/cart/items`
- `CART-03`: `PATCH /api/v1/cart/items/{cartItemId}`
- `CART-04`: `DELETE /api/v1/cart/items/{cartItemId}`
- `CART-05`: `DELETE /api/v1/cart`
- `WISH-01`: `GET /api/v1/wishlist`
- `WISH-02`: `POST /api/v1/wishlist/items`
- `WISH-03`: `DELETE /api/v1/wishlist/items/{productId}`
- `WISH-04`: `DELETE /api/v1/wishlist`

#### Addresses, checkout and COD orders

- `ADDR-01`: `GET /api/v1/addresses`
- `ADDR-02`: `POST /api/v1/addresses`
- `ADDR-03`: `PUT /api/v1/addresses/{addressId}`
- `CHECK-01`: `POST /api/v1/checkout/preview`
- `CHECK-02`: `POST /api/v1/checkout/orders`
- `ORDER-01`: `GET /api/v1/orders`
- `ORDER-02`: `GET /api/v1/orders/{orderId}`
- `CAN-01`: `GET /api/v1/orders/{orderId}/cancellation-eligibility`
- `CAN-02`: `POST /api/v1/orders/{orderId}/cancel`
- `TRACK-01`: `GET /api/v1/orders/{orderId}/tracking`

#### Reviews

- `REV-01`: `GET /api/v1/products/{productId}/reviews`
- `REV-02`: `POST /api/v1/products/{productId}/reviews`
- `REV-03`: `POST /api/v1/reviews/{reviewId}/helpful`
- `REV-04`: `DELETE /api/v1/reviews/{reviewId}/helpful`

#### Admin dashboard

- `ADM-DASH-01`: `GET /api/v1/admin/dashboard/summary`
- `ADM-DASH-02`: `GET /api/v1/admin/dashboard/recent-orders`
- `ADM-DASH-03`: `GET /api/v1/admin/dashboard/top-products`
- `ADM-DASH-04`: `GET /api/v1/admin/dashboard/low-stock`

#### Admin products

- `ADM-PROD-01`: `GET /api/v1/admin/products`
- `ADM-PROD-02`: `GET /api/v1/admin/products/{productId}`
- `ADM-PROD-03`: `POST /api/v1/admin/products`
- `ADM-PROD-04`: `PUT /api/v1/admin/products/{productId}`
- `ADM-PROD-05`: `PATCH /api/v1/admin/products/{productId}/stock`
- `ADM-PROD-06`: `DELETE /api/v1/admin/products/{productId}`

#### Admin customers

- `ADM-CUST-01`: `GET /api/v1/admin/customers`
- `ADM-CUST-02`: `GET /api/v1/admin/customers/{customerId}`
- `ADM-CUST-03`: `POST /api/v1/admin/customers`
- `ADM-CUST-05`: `DELETE /api/v1/admin/customers/{customerId}`

#### Admin orders

- `ADM-ORDER-01`: `GET /api/v1/admin/orders`
- `ADM-ORDER-02`: `GET /api/v1/admin/orders/{orderId}`
- `ADM-ORDER-03`: `PATCH /api/v1/admin/orders/{orderId}/status`
- `ADM-ORDER-04`: `PATCH /api/v1/admin/orders/{orderId}/tracking`

#### Inventory

- `INV-01`: `GET /api/v1/admin/inventory`
- `INV-02`: `GET /api/v1/admin/inventory/low-stock`
- `INV-03`: `PATCH /api/v1/admin/inventory/{variantId}`

#### Analytics

- `ANALYTICS-01`: `GET /api/v1/admin/analytics/summary`
- `ANALYTICS-02`: `GET /api/v1/admin/analytics/sales-by-state`
- `ANALYTICS-03`: `GET /api/v1/admin/analytics/status-distribution`
- `ANALYTICS-04`: `GET /api/v1/admin/analytics/payment-summary`

#### Website settings and banners

- `CMS-01`: `GET /api/v1/settings`
- `CMS-02`: `PUT /api/v1/admin/settings`
- `CMS-03`: `GET /api/v1/admin/banners`
- `CMS-04`: `POST /api/v1/admin/banners`
- `CMS-05`: `PATCH /api/v1/admin/banners/{bannerId}`
- `CMS-06`: `DELETE /api/v1/admin/banners/{bannerId}`

### 2.3 Future endpoint IDs

The 42 future endpoints are:

- `AUTH-06`, `AUTH-07`
- `CUST-02`, `CUST-03`
- `CAT-02`
- `ADDR-04`, `ADDR-05`
- `ORDER-03`
- `TRACK-02`, `TRACK-03`, `TRACK-04`
- `PAY-01`, `PAY-02`, `PAY-03`, `PAY-04`, `PAY-05`
- `REF-01`, `REF-02`, `REF-03`, `REF-04`, `REF-05`
- `RET-01`, `RET-02`, `RET-03`, `RET-04`
- `REV-05`, `REV-06`
- `NOTIF-01`, `NOTIF-02`, `NOTIF-03`, `NOTIF-04`
- `NEWS-01`, `NEWS-02`
- `CONTACT-01`
- `ADM-CUST-04`
- `AGENT-01`, `AGENT-02`, `AGENT-03`, `AGENT-04`, `AGENT-05`, `AGENT-06`
- `REPORT-01`

### 2.4 Removed from the MVP

The following original endpoint concepts are not required for a backend MVP:

- default-address and delete-address APIs;
- server invoice API;
- delivery-agent APIs;
- online payment APIs;
- refund APIs;
- return-request APIs;
- notification delivery APIs;
- newsletter APIs;
- contact-message API;
- social/OAuth APIs;
- sales CSV export;
- profile update/password-change APIs.

No coupon endpoints are included because there is no coupon UI or coupon calculation in the frontend.

## 3. Real frontend features versus proposed features

| Area | Real frontend feature | MVP backend handling | Future/proposed |
|---|---|---|---|
| Registration/login | Login and registration UI, remember-me, browser logout | JWT, role, refresh-token and BCrypt | Social login, OTP login, real password reset |
| Account | Profile display and account navigation | Read-only profile | Profile editing/password change |
| Products | Search, sort, category, variants, detail and stock state | Public catalog and admin CRUD | Advanced promotions |
| Cart/wishlist | Quantity, clear, remove, limit and wishlist | Server-backed entities | Saved-cart synchronization enhancements |
| Address | One saved checkout address | Address CRUD needed by checkout | Address book/default/delete |
| Checkout | Address and payment selection, COD captcha | Server preview and COD order | Online payment gateway |
| Orders | Owned history/detail/cancellation | Owned order APIs | Invoice export from server |
| Tracking | Status timeline and route display | Order timeline/status only | Agent GPS, courier, map and route |
| Reviews | Submit, read and helpful vote UI | Backend persistence and vote uniqueness | Moderation and review image CDN |
| Returns/refunds | Admin status shells and cancellation refund wording | Admin status is future-only if no real workflow | Real return/refund state machines |
| Admin | Dashboard, product/customer/order/inventory/analytics/CMS | Backend parity | Report export |
| Newsletter/contact | Newsletter explicitly says not connected; contact is local-only | Not in MVP | Email integration |
| Notifications | Static preference UI and toast bell | Not in MVP | Real customer/admin notification store |

## 4. External integrations

### 4.1 Final integration classification

| Integration | Classification | MVP decision | Trigger |
|---|---|---|---|
| MySQL | Required initial backend infrastructure | Required | All persisted data |
| Object storage for product/review/banner images | Required only for persisted image uploads | Conditional MVP requirement | Required as soon as file upload replaces URL/static assets |
| Razorpay | Required only when prepaid payment is enabled | Future | UPI/card/net-banking checkout |
| Transactional email | Required only for a particular feature | Future for MVP password reset/order email | Password reset, order confirmation, return/refund notices |
| Courier/shipping | Required only for real shipment tracking | Future | AWB and courier event synchronization |
| Google Maps/Routes/Geocoding | Required only for live route feature | Future | Address coordinates, road routes and map display |
| SMS/OTP | Optional future integration | Not required | Mobile verification/OTP |
| WhatsApp Business | Optional future integration | Not required | Order/status notifications |
| Newsletter provider | Optional future integration | Not required | Real newsletter campaigns |
| Push notifications | Optional future integration | Not required | Browser/mobile alerts |
| Google/Facebook OAuth | Optional future integration | Not required | Real social login |

This means the complete 10-integration review is:

- **Required by core initial backend infrastructure:** MySQL plus the Spring application itself.
- **External-service integrations required for initial backend:** zero, because a COD-only MVP can operate without a third-party API.
- **Required when enabling a feature:** object storage, Razorpay, email, courier, and maps/routing.
- **Optional future integrations:** SMS/OTP, WhatsApp, newsletter, push and OAuth.

Object storage is not an external API requirement when the MVP continues to serve existing static image URLs. It becomes required once the admin/product/review/banner file-upload controls need durable storage.

### 4.2 Credentials and secrets

No third-party credential is mandatory solely to launch a COD/status MVP.

| Feature enabled | Credential required |
|---|---|
| Razorpay prepaid/refunds | Razorpay key ID, key secret and webhook secret |
| Product/review/banner object storage | One cloud-provider credential set; exact values depend on provider |
| Email | One SMTP username/password or provider API key plus verified sender |
| Courier | One courier account/API credential set and optional webhook secret |
| Maps/Routes/Geocoding | One server-side provider key and, only if used in-browser, a restricted browser key |
| SMS/OTP | One SMS-provider credential set |
| WhatsApp | Meta app credentials, permanent token, phone-number ID and webhook verification value |
| Newsletter | One newsletter-provider API key or domain credential |
| Push | One Firebase service-account credential set |
| Social OAuth | One client ID/secret pair per provider |

Secrets must remain in Spring configuration, environment variables or a secret manager. They must not be placed in Vite variables or browser JavaScript.

## 5. Database architecture

### 5.1 MVP tables

The MVP needs 21 tables:

| Table | Why it is required |
|---|---|
| `users` | Customer/admin identity |
| `roles` | Role names |
| `user_roles` | Many-to-many role assignment |
| `refresh_tokens` | JWT refresh-token rotation/revoke |
| `categories` | Product category filtering |
| `products` | Product master data |
| `product_variants` | 550gm, 1kg and combo variants |
| `product_images` | Product galleries and primary image |
| `inventory` | Variant stock and reservations |
| `carts` | One cart per customer |
| `cart_items` | Cart line items |
| `wishlists` | One wishlist per customer |
| `wishlist_items` | Wishlist products |
| `addresses` | Saved checkout address and ownership |
| `orders` | Order header and immutable pricing/status |
| `order_items` | Order line snapshots |
| `reviews` | Product review and purchase-verification field |
| `review_images` | Optional review photos |
| `review_helpful_votes` | One helpful vote per customer/review |
| `website_settings` | Public CMS settings |
| `banners` | Hero and offer banners |

The MVP has 20 JPA entities. `user_roles` is a join table and is not a separate JPA entity.

### 5.2 Future tables

The future architecture adds 10 tables:

| Future table | Added when |
|---|---|
| `password_reset_tokens` | Password reset is enabled |
| `payments` | Razorpay/prepaid payments are enabled |
| `refunds` | Refund processing is enabled |
| `return_requests` | Customer/admin return workflow is enabled |
| `notifications` | Store/customer notification delivery is enabled |
| `newsletter_subscribers` | Footer newsletter becomes functional |
| `contact_messages` | Contact form is backend-connected |
| `delivery_agents` | Real delivery-agent accounts are enabled |
| `shipments` | Courier/shipment tracking is enabled |
| `tracking_locations` | GPS updates are enabled |

These ten future tables correspond to ten future JPA entities.

**Complete database:** 31 tables, including `user_roles`, and 30 JPA entities.

### 5.3 Key relationships

- One-to-one: `users` -> `carts`; `users` -> `wishlists`; `product_variants` -> `inventory`.
- One-to-many: `users` -> addresses/orders/reviews; `products` -> variants/images/reviews; `orders` -> order items.
- Many-to-many: `users` <-> `roles` through `user_roles`.
- Future: `orders` -> payments/refunds/return requests/shipments.

### 5.4 Complexity removed from MVP

- no coupon table;
- no social-login/provider table;
- no newsletter table;
- no notification table;
- no contact-message table;
- no shipment/GPS tables;
- no payment/refund/return tables.

These omissions do not reduce required COD, cart, product, review or status-tracking functionality.

## 6. COD and prepaid payment design

### 6.1 COD MVP flow

1. Backend validates the customer, address and active cart or Buy Now item.
2. Backend recalculates subtotal, discount, 2.5% CGST, 2.5% SGST and delivery charge.
3. Backend reserves inventory and creates the order atomically.
4. The order stores `paymentMethod=COD` and `paymentStatus=UNPAID`.
5. No `payments` row is created in the MVP.
6. Cart items are removed after the transaction succeeds.

### 6.2 COD cancellation

- Cancellation is allowed only for an eligible order status.
- The order becomes `Cancelled`.
- Payment remains `UNPAID`.
- No refund row or refund amount is created.
- `TRACK-01` rejects the cancelled order and cannot return live tracking data.

### 6.3 Prepaid future flow

1. Frontend requests a gateway order for the server-calculated amount.
2. Backend creates a pending order and payment record.
3. Gateway payment success is verified only by signature/webhook/provider status.
4. Backend marks the payment `CAPTURED` and order `PAID`.
5. Failed, pending and abandoned payments never become successful from frontend state.

### 6.4 Prepaid cancellation

- Cancellation is allowed only for a permitted status.
- A successful captured payment creates refund eligibility.
- Eligible prepaid refund equals captured amount minus any already recorded refunded amount.
- Refund completion requires a provider refund reference and reconciled refund status.

### 6.5 Cancelled tracking

The tracking endpoint must enforce:

```text
authenticated owner
AND order exists
AND order.status != Cancelled
AND order.status is active or delivered
```

The frontend must also hide or disable tracking controls for cancelled orders. The backend remains authoritative and must reject direct tracking API requests for cancelled or foreign orders.

## 7. Authorization protection

The frontend ownership checks are not security controls.

### Required backend rules

- every customer endpoint loads the authenticated principal;
- order/address/cart/wishlist/review/refund APIs compare ownership to `customerId`;
- no endpoint accepts an owner ID as the only authorization source;
- cancelled and foreign orders return `404` or a non-disclosing `403`;
- admin endpoints require `ROLE_ADMIN`;
- customer endpoints reject `ROLE_ADMIN` unless a separate admin read API is used;
- delivery endpoints require `ROLE_DELIVERY_AGENT` and assigned-shipment ownership;
- payment webhooks validate provider signatures and are not user authenticated;
- JWT claims contain identity and role, not browser/localStorage state;
- refresh tokens are stored only as hashes and rotated on use;
- passwords use BCrypt.

Customer account and order summary APIs must be calculated server-side for the authenticated customer. No frontend count or browser filter is authoritative.

## 8. Controller, service and repository reconciliation

### 8.1 Full architecture count

The original report had 27 listed controllers. The complete architecture needs one additional report controller, for 28 controllers.

The 28 full controllers are:

1. `AuthController`
2. `CustomerController`
3. `ProductController`
4. `CategoryController`
5. `ProductImageController`
6. `CartController`
7. `WishlistController`
8. `AddressController`
9. `CheckoutController`
10. `OrderController`
11. `CancellationController`
12. `TrackingController`
13. `PaymentController`
14. `RefundController`
15. `ReturnRequestController`
16. `ReviewController`
17. `NotificationController`
18. `NewsletterController`
19. `ContactController`
20. `AdminDashboardController`
21. `AdminProductController`
22. `AdminCustomerController`
23. `AdminOrderController`
24. `InventoryController`
25. `AnalyticsController`
26. `ContentController`
27. `DeliveryAgentController`
28. `ReportController`

**MVP controller count:** 20.

The 20 MVP controllers are numbers 1-12 except payment/refund/return, plus 16 and 20-26. They are:

`Auth`, `Customer`, `Product`, `Category`, `ProductImage`, `Cart`, `Wishlist`, `Address`, `Checkout`, `Order`, `Cancellation`, `Tracking`, `Review`, `AdminDashboard`, `AdminProduct`, `AdminCustomer`, `AdminOrder`, `Inventory`, `Analytics`, `Content`.

**Future controllers:** 8:

`Payment`, `Refund`, `ReturnRequest`, `Notification`, `Newsletter`, `Contact`, `DeliveryAgent`, `Report`.

### 8.2 Services

- MVP services: 20, one primary service per MVP controller.
- Future services: 8, one primary service per future controller.
- Full architecture: 28 primary services.

### 8.3 Repositories

- MVP repositories: 20, one repository per MVP JPA entity.
- Future repositories: 10, one repository per future JPA entity.
- Full architecture: 30 repositories.
- `user_roles` is handled by the `Role` and `User` mappings and does not require a repository.

### 8.4 Entities

The 20 MVP entities are:

1. `User`
2. `Role`
3. `RefreshToken`
4. `Category`
5. `Product`
6. `ProductVariant`
7. `ProductImage`
8. `Inventory`
9. `Cart`
10. `CartItem`
11. `Wishlist`
12. `WishlistItem`
13. `Address`
14. `Order`
15. `OrderItem`
16. `Review`
17. `ReviewImage`
18. `ReviewHelpfulVote`
19. `WebsiteSetting`
20. `Banner`

The ten future entities are:

1. `PasswordResetToken`
2. `Payment`
3. `Refund`
4. `ReturnRequest`
5. `Notification`
6. `NewsletterSubscriber`
7. `ContactMessage`
8. `DeliveryAgent`
9. `Shipment`
10. `TrackingLocation`

### 8.5 DTO correction

The previous estimate of 106 DTO classes was not reconciled and is too broad for the MVP.

The MVP DTO baseline has 66 genuinely needed DTO types:

1. `ApiErrorResponse`
2. `ApiSuccessResponse`
3. `PageResponse`
4. `RegisterRequest`
5. `LoginRequest`
6. `RefreshTokenRequest`
7. `LogoutRequest`
8. `AuthResponse`
9. `CustomerResponse`
10. `CategoryResponse`
11. `ProductSummaryResponse`
12. `ProductDetailResponse`
13. `ProductVariantResponse`
14. `ProductImageResponse`
15. `ProductRequest`
16. `ProductAdminResponse`
17. `CartResponse`
18. `CartItemResponse`
19. `AddCartItemRequest`
20. `UpdateCartQuantityRequest`
21. `WishlistResponse`
22. `WishlistItemResponse`
23. `WishlistItemRequest`
24. `AddressRequest`
25. `AddressResponse`
26. `CheckoutPreviewRequest`
27. `CheckoutPreviewResponse`
28. `PriceBreakdownResponse`
29. `PlaceOrderRequest`
30. `OrderSummaryResponse`
31. `OrderDetailResponse`
32. `OrderItemResponse`
33. `AddressSnapshotResponse`
34. `CancellationEligibilityResponse`
35. `CancelOrderRequest`
36. `CancelOrderResponse`
37. `TrackingResponse`
38. `TrackingTimelineEntryResponse`
39. `TrackingLocationSummaryResponse`
40. `ReviewSummaryResponse`
41. `ReviewResponse`
42. `SubmitReviewRequest`
43. `HelpfulVoteRequest`
44. `HelpfulVoteResponse`
45. `AdminDashboardSummaryResponse`
46. `AdminRecentOrderResponse`
47. `AdminTopProductResponse`
48. `AdminLowStockResponse`
49. `AdminProductRequest`
50. `AdminProductResponse`
51. `AdminCustomerSummaryResponse`
52. `AdminCustomerDetailResponse`
53. `AdminCustomerCreateRequest`
54. `AdminOrderSummaryResponse`
55. `AdminOrderDetailResponse`
56. `UpdateOrderStatusRequest`
57. `UpdateTrackingRequest`
58. `InventoryResponse`
59. `InventoryAdjustmentRequest`
60. `AnalyticsSummaryResponse`
61. `StateSalesResponse`
62. `StatusDistributionResponse`
63. `PaymentSummaryResponse`
64. `WebsiteSettingsResponse`
65. `UpdateWebsiteSettingsRequest`
66. `BannerResponse`

The 66 types are genuinely needed by MVP API responses or requests. `CreateBannerRequest` and `UpdateBannerRequest` can be represented by one `BannerRequest` or handled as variants of `BannerResponse`; no extra mandatory DTO is counted.

Future DTO classes are not counted as MVP. They become necessary with password reset, payment, refund, return, notification, newsletter, contact, delivery agent and report endpoints.

## 9. Live tracking architecture

### MVP tracking

The MVP tracking API returns:

- owned order status;
- status timeline;
- pickup location;
- customer address snapshot;
- tracking ID when manually entered;
- estimated route/ETA only if backend has verified route data.

The frontend must not claim live GPS until it is supplied by a real driver.

### Future live tracking

When enabled:

- courier/shipping integration supplies AWB status;
- Google Maps Platform supplies map tiles and route data;
- server-side route and geocoding APIs calculate coordinates;
- delivery agents authenticate separately;
- GPS updates are posted only by assigned agents;
- tracking polling every 5-15 seconds is the first implementation;
- WebSocket or SSE is an optional later enhancement;
- cancelled, delivered or foreign orders are not GPS-visible.

## 10. Development order

| Phase | Scope |
|---|---|
| 1 | Spring/Maven setup, MySQL, migrations, security foundation and API conventions |
| 2 | Customer/admin authentication, JWT, refresh tokens, users, roles and ownership |
| 3 | Categories, products, variants, images and inventory |
| 4 | Cart and wishlist |
| 5 | Saved address and checkout preview |
| 6 | COD order creation, order snapshots, cancellation and status timeline |
| 7 | Reviews, helpful votes and purchase-verification foundation |
| 8 | Admin dashboard, customers, orders and inventory |
| 9 | Analytics and website settings/banners |
| 10 | Password reset and email |
| 11 | Razorpay, payment verification and prepaid cancellation/refunds |
| 12 | Returns and refund workflow |
| 13 | Notifications, newsletter and contact |
| 14 | Courier and delivery-agent tracking |
| 15 | Maps, geocoding, routes and live GPS/polling |

## 11. Technical risks

- The frontend payment simulator is not a real provider integration.
- The frontend review data is static/local and does not prove purchase verification.
- Browser `localStorage` order/customer data can be modified and is not authoritative.
- Revenue analytics must exclude cancelled/refunded orders according to backend accounting rules.
- Stock must be reserved and released atomically.
- Invoice and PDF data should not be generated only in browser JavaScript when legal/GST invoice persistence is required.
- Real tracking requires authorized agent location updates and a courier source.
- Object-storage credentials must be server-only.
- Email, SMS and WhatsApp credentials must not be stored in the frontend.
- Exact third-party pricing must be verified with each provider.

## 12. Final counts

| Item | MVP | Future | Complete |
|---|---:|---:|---:|
| API endpoints | 67 | 42 | 109 |
| Database tables | 21 | 10 | 31 |
| JPA entities | 20 | 10 | 30 |
| Controllers | 20 | 8 | 28 |
| Services | 20 | 8 | 28 |
| Repositories | 20 | 10 | 30 |
| MVP DTO types | 66 | — | — |

External integrations:

- **External integrations required solely for the core COD MVP:** 0.
- **External integrations required when enabling specific features:** 5 feature integrations: object storage, Razorpay, email, courier and maps/routing/geocoding.
- **Optional future integrations:** 5: SMS/OTP, WhatsApp, newsletter, push and OAuth.

The endpoint, table, entity, controller, service and repository counts above are reconciled against the individually enumerated MVP and future lists.
