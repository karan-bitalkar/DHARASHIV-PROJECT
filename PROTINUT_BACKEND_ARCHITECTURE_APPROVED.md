# PROTINUT Foods - Approved Backend Architecture

**Status:** Architecture review complete; implementation must not begin until this document is approved.

**Scope:** Backend planning only. This document does not implement backend code and does not modify the React/Vite frontend.

**Technology baseline:** Java 17, Spring Boot, Spring Data JPA/Hibernate, MySQL, Spring Security, JWT and Maven.

## 1. Source evidence

The review uses the frontend implementation as the source of truth:

- routes and providers: [src/App.jsx](src/App.jsx)
- authentication: [src/AuthContext.jsx](src/AuthContext.jsx), [src/AuthModal.jsx](src/AuthModal.jsx)
- protected routes: [src/ProtectedRoute.jsx](src/ProtectedRoute.jsx), [src/AdminProtectedRoute.jsx](src/AdminProtectedRoute.jsx)
- cart and wishlist: [src/CartContext.jsx](src/CartContext.jsx), [src/pages/CartPage.jsx](src/pages/CartPage.jsx), [src/pages/WishlistPage.jsx](src/pages/WishlistPage.jsx)
- product/catalog: [src/OurRange.jsx](src/OurRange.jsx), [src/pages/ProductsPage.jsx](src/pages/ProductsPage.jsx), [src/pages/ProductDetailPage.jsx](src/pages/ProductDetailPage.jsx)
- checkout: [src/pages/CheckoutPage.jsx](src/pages/CheckoutPage.jsx)
- orders and cancellation: [src/OrderContext.jsx](src/OrderContext.jsx), [src/CancelOrderModal.jsx](src/CancelOrderModal.jsx), [src/orderCancellation.js](src/orderCancellation.js)
- ownership: [src/orderOwnership.js](src/orderOwnership.js)
- tracking: [src/pages/TrackingPage.jsx](src/pages/TrackingPage.jsx), [src/trackingConfig.js](src/trackingConfig.js)
- reviews: [src/ProductReviewSection.jsx](src/ProductReviewSection.jsx)
- admin: [src/pages/admin/AdminDashboardPage.jsx](src/pages/admin/AdminDashboardPage.jsx), [src/pages/admin/AdminLayout.jsx](src/pages/admin/AdminLayout.jsx)
- settings and banners: [src/GlobalSettingsContext.jsx](src/GlobalSettingsContext.jsx)
- state-wise analytics: [src/pages/admin/StateWiseSalesAnalytics.jsx](src/pages/admin/StateWiseSalesAnalytics.jsx), [src/pages/admin/stateWiseSales.js](src/pages/admin/stateWiseSales.js)

Browser `localStorage` and `sessionStorage` are temporary frontend state. They are not authentication, authorization or database controls.

## 2. Final approved API counts

### 2.1 API count by scope

| Scope | GET | POST | PUT | PATCH | DELETE | Total |
|---|---:|---:|---:|---:|---:|---:|
| MVP | 31 | 17 | 3 | 7 | 9 | **67** |
| Future | 14 | 15 | 3 | 6 | 4 | **42** |
| **Complete architecture** | **45** | **32** | **6** | **13** | **13** | **109** |

### 2.2 Individually enumerated MVP endpoint IDs

There are 67 MVP endpoint IDs. The count is valid; no endpoint is missing from the approved MVP list.

#### Authentication and customer - 6

1. `AUTH-01` - `POST /api/v1/auth/register`
2. `AUTH-02` - `POST /api/v1/auth/login`
3. `AUTH-03` - `POST /api/v1/admin/auth/login`
4. `AUTH-04` - `POST /api/v1/auth/refresh`
5. `AUTH-05` - `POST /api/v1/auth/logout`
6. `CUST-01` - `GET /api/v1/customers/me`

#### Products and categories - 7

7. `PROD-01` - `GET /api/v1/products`
8. `PROD-02` - `GET /api/v1/products/{productId}`
9. `CAT-01` - `GET /api/v1/categories`
10. `IMG-01` - `GET /api/v1/products/{productId}/images`
11. `IMG-02` - `POST /api/v1/admin/products/{productId}/images`
12. `IMG-03` - `PATCH /api/v1/admin/products/{productId}/images/{imageId}/primary`
13. `IMG-04` - `DELETE /api/v1/admin/products/{productId}/images/{imageId}`

#### Cart - 5

14. `CART-01` - `GET /api/v1/cart`
15. `CART-02` - `POST /api/v1/cart/items`
16. `CART-03` - `PATCH /api/v1/cart/items/{cartItemId}`
17. `CART-04` - `DELETE /api/v1/cart/items/{cartItemId}`
18. `CART-05` - `DELETE /api/v1/cart`

#### Wishlist - 4

19. `WISH-01` - `GET /api/v1/wishlist`
20. `WISH-02` - `POST /api/v1/wishlist/items`
21. `WISH-03` - `DELETE /api/v1/wishlist/items/{productId}`
22. `WISH-04` - `DELETE /api/v1/wishlist`

#### Address and checkout - 7

23. `ADDR-01` - `GET /api/v1/addresses`
24. `ADDR-02` - `POST /api/v1/addresses`
25. `ADDR-03` - `PUT /api/v1/addresses/{addressId}`
26. `CHECK-01` - `POST /api/v1/checkout/preview`
27. `CHECK-02` - `POST /api/v1/checkout/orders`
28. `ORDER-01` - `GET /api/v1/orders`
29. `ORDER-02` - `GET /api/v1/orders/{orderId}`

#### Cancellation and tracking - 3

30. `CAN-01` - `GET /api/v1/orders/{orderId}/cancellation-eligibility`
31. `CAN-02` - `POST /api/v1/orders/{orderId}/cancel`
32. `TRACK-01` - `GET /api/v1/orders/{orderId}/tracking`

#### Reviews - 4

33. `REV-01` - `GET /api/v1/products/{productId}/reviews`
34. `REV-02` - `POST /api/v1/products/{productId}/reviews`
35. `REV-03` - `POST /api/v1/reviews/{reviewId}/helpful`
36. `REV-04` - `DELETE /api/v1/reviews/{reviewId}/helpful`

#### Admin dashboard - 4

37. `ADM-DASH-01` - `GET /api/v1/admin/dashboard/summary`
38. `ADM-DASH-02` - `GET /api/v1/admin/dashboard/recent-orders`
39. `ADM-DASH-03` - `GET /api/v1/admin/dashboard/top-products`
40. `ADM-DASH-04` - `GET /api/v1/admin/dashboard/low-stock`

#### Admin products - 6

41. `ADM-PROD-01` - `GET /api/v1/admin/products`
42. `ADM-PROD-02` - `GET /api/v1/admin/products/{productId}`
43. `ADM-PROD-03` - `POST /api/v1/admin/products`
44. `ADM-PROD-04` - `PUT /api/v1/admin/products/{productId}`
45. `ADM-PROD-05` - `PATCH /api/v1/admin/products/{productId}/stock`
46. `ADM-PROD-06` - `DELETE /api/v1/admin/products/{productId}`

#### Admin customers - 4

47. `ADM-CUST-01` - `GET /api/v1/admin/customers`
48. `ADM-CUST-02` - `GET /api/v1/admin/customer/{customerId}`
49. `ADM-CUST-03` - `POST /api/v1/admin/customers`
50. `ADM-CUST-05` - `DELETE /api/v1/admin/customers/{customerId}`

`ADM-CUST-04` is intentionally excluded from MVP; profile editing is a future endpoint.

#### Admin orders - 4

51. `ADM-ORDER-01` - `GET /api/v1/admin/orders`
52. `ADM-ORDER-02` - `GET /api/v1/admin/orders/{orderId}`
53. `ADM-ORDER-03` - `PATCH /api/v1/admin/orders/{orderId}/status`
54. `ADM-ORDER-04` - `PATCH /api/v1/admin/orders/{orderId}/tracking`

#### Inventory - 3

55. `INV-01` - `GET /api/v1/admin/inventory`
56. `INV-02` - `GET /api/v1/admin/inventory/low-stock`
57. `INV-03` - `PATCH /api/v1/admin/inventory/{variantId}`

#### Analytics - 4

58. `ANALYTICS-01` - `GET /api/v1/admin/analytics/summary`
59. `ANALYTICS-02` - `GET /api/v1/admin/analytics/sales-by-state`
60. `ANALYTICS-03` - `GET /api/v1/admin/analytics/status-distribution`
61. `ANALYTICS-04` - `GET /api/v1/admin/analytics/payment-summary`

#### Website settings and banners - 6

62. `CMS-01` - `GET /api/v1/settings`
63. `CMS-02` - `PUT /api/v1/admin/settings`
64. `CMS-03` - `GET /api/v1/admin/banners`
65. `CMS-04` - `POST /api/v1/admin/banners`
66. `CMS-05` - `PATCH /api/v1/admin/banners/{bannerId}`
67. `CMS-06` - `DELETE /api/v1/admin/banners/{bannerId}`

The approved count is 67: 31 GET, 17 POST, 3 PUT, 7 PATCH and 9 DELETE.

### 2.3 Future-only endpoint IDs

The 42 future endpoints remain separate:

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

The original 109 API design is unchanged. The MVP and future counts do not overlap.

## 3. Order status timeline persistence

The MVP must persist order status history.

The approved MVP adds `order_status_history`, with:

| Column | Type | Key/nullability | Purpose |
|---|---|---|---|
| `id` | BIGINT | Primary key, NOT NULL | History row |
| `order_id` | BIGINT | Foreign key to `orders.id`, NOT NULL | Associated order |
| `status` | VARCHAR | NOT NULL | Status name |
| `status_index` | TINYINT | NOT NULL | Timeline position |
| `description` | VARCHAR | NOT NULL | Status description |
| `changed_by_user_id` | BIGINT | Foreign key to `users.id`, nullable | Admin or customer/system actor |
| `changed_at` | DATETIME | NOT NULL | Exact status update time |
| `tracking_id` | VARCHAR | Nullable | Optional tracking identifier |

Unique constraint: `(order_id, status, changed_at)` or a service-generated unique event ID. The first constraint is a data-integrity guard, not a substitute for the database table.

Reasons this table is required:

- the frontend shows a timeline with five stages;
- status updates must survive refresh;
- admin updates need an auditable actor and timestamp;
- cancellation must leave a persisted cancellation event;
- future courier/status updates should not overwrite history.

The table is a separate JPA entity named `OrderStatusHistory`, a repository and no additional public controller.

`order_status_history` is included in the MVP. Storing a JSON timeline on `orders` alone would be less reliable and does not provide the required audit or query semantics.

## 4. Review image upload storage flow

The actual frontend supports selecting an image up to 5 MB and previews it locally using `FileReader` in [src/ProductReviewSection.jsx](src/ProductReviewSection.jsx). It does not currently persist the image.

Approved MVP flow:

1. `REV-02` accepts `multipart/form-data`, not a base64 JSON field.
2. Request fields are rating, title, text and optional image files.
3. Backend authentication obtains the customer ID.
4. Backend validates:
   - rating from 1 to 5;
   - title and text are present;
   - zero or more image files;
   - image MIME type;
   - maximum five files;
   - maximum 5 MB per file;
   - product exists and is active.
5. Backend verifies purchase ownership before setting `purchaseVerified=true`.
6. Backend creates the review as pending or approved according to the moderation rule.
7. Each accepted image is uploaded to the configured server storage service.
8. `review_images` stores review ID, public/storage URL, alt text, type, size and sort order.
9. The review response returns image URLs, not raw base64 data.

Object storage is required for review image durability when review photos are enabled. It can be implemented as Amazon S3, Cloudinary or a private mounted object store. The MVP does not require a separate review-image upload endpoint.

`REV-02` is the only review image API. Product image upload remains under `IMG-02`.

The frontend must be updated later to send multipart data rather than storing a Data URL; that frontend integration change is outside this architecture document.

## 5. MVP frontend feature support matrix

| MVP frontend feature | Required API | Required database support | Status |
|---|---|---|---|
| Customer registration | `AUTH-01` | `users`, `roles`, `user_roles` | Complete |
| Customer/admin login | `AUTH-02`, `AUTH-03`, `AUTH-04`, `AUTH-05` | `users`, `roles`, refresh tokens | Complete |
| Customer account summary | `CUST-01`, `ORDER-01`, cart/wishlist APIs | User, orders, cart, wishlist | Complete |
| Product list/search/filter/sort | `PROD-01`, `CAT-01` | Products, categories, variants, inventory | Complete |
| Product detail | `PROD-02`, `IMG-01`, `REV-01` | Product variants/images/reviews | Complete |
| Cart | `CART-01` to `CART-05` | Cart, cart items, variants, inventory | Complete |
| Wishlist | `WISH-01` to `WISH-04` | Wishlist, wishlist items | Complete |
| Buy Now | `CHECK-01`, `CHECK-02` | Order snapshot and variant pricing | Complete |
| Checkout address | `ADDR-01` to `ADDR-03` | Addresses | Complete |
| COD checkout | `CHECK-02` | Orders, order items, inventory | Complete |
| Order history/detail | `ORDER-01`, `ORDER-02` | Orders, order items, status history | Complete |
| Cancellation | `CAN-01`, `CAN-02` | Orders, inventory, status history | Complete |
| Current status timeline | `TRACK-01`, `ADM-ORDER-03` | Orders, status history | Complete |
| Admin tracking ID | `ADM-ORDER-04` | `orders.tracking_id` | Complete |
| Review submit/read/votes | `REV-01` to `REV-04` | Reviews, review images, helpful votes | Complete |
| Admin product CRUD | `ADM-PROD-01` to `ADM-PROD-06` | Products, variants, images, inventory | Complete |
| Admin customer list/add/delete | `ADM-CUST-01`, `ADM-CUST-02`, `ADM-CUST-03`, `ADM-CUST-05` | Users/roles; soft delete policy | Complete |
| Admin order management | `ADM-ORDER-01` to `ADM-ORDER-04` | Orders, items, history | Complete |
| Inventory | `INV-01` to `INV-03`, `ADM-PROD-05` | Inventory and variants | Complete |
| Dashboard/analytics | Admin dashboard and analytics APIs | Orders, items, users, products, inventory | Complete |
| Website settings | `CMS-01`, `CMS-02` | Website settings | Complete |
| Hero/offer banners | `CMS-03` to `CMS-06` | Banners and website settings | Complete |

Future-only frontend elements are not counted as MVP support:

- real forgot/reset password;
- profile editing/password change;
- address default/delete;
- server invoice download;
- live GPS/courier tracking;
- Razorpay payments and refunds;
- customer return requests;
- backend notifications;
- newsletter/contact backend;
- review/order moderation;
- sales CSV export.

## 6. Corrected MVP database design

### 6.1 MVP tables

The MVP needs 22 tables:

1. `users`
2. `roles`
3. `user_roles`
4. `refresh_tokens`
5. `categories`
6. `products`
7. `product_variants`
8. `product_images`
9. `inventory`
10. `carts`
11. `cart_items`
12. `wishlists`
13. `wishlist_items`
14. `addresses`
15. `orders`
16. `order_items`
17. `order_status_history`
18. `reviews`
19. `review_images`
20. `review_helpful_votes`
21. `website_settings`
22. `banners`

### 6.2 Future tables

The future phase adds 10 tables:

1. `password_reset_tokens`
2. `payments`
3. `refunds`
4. `return_requests`
5. `notifications`
6. `newsletter_subscribers`
7. `contact_messages`
8. `delivery_agents`
9. `shipments`
10. `tracking_locations`

### 6.3 Total database count

- MVP: 22 tables
- Future: 10 tables
- Complete architecture: 32 tables

JPA entity counts:

- MVP: 21 entities
- Future: 10 entities
- Complete: 31 entities

The 22 MVP tables include `user_roles`, which is a join table and not a JPA entity. The 21 MVP entities are listed in Section 8.

No coupon table is included because the frontend has no coupon feature.

## 7. Controller/service/repository reconciliation

### 7.1 Corrected controller count

The complete architecture has 28 controllers.

The MVP has 20 controllers:

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
13. `ReviewController`
14. `AdminDashboardController`
15. `AdminProductController`
16. `AdminCustomerController`
17. `AdminOrderController`
18. `InventoryController`
19. `AnalyticsController`
20. `ContentController`

Future controllers:

21. `PaymentController`
22. `RefundController`
23. `ReturnRequestController`
24. `NotificationController`
25. `NewsletterController`
26. `ContactController`
27. `DeliveryAgentController`
28. `ReportController`

### 7.2 MVP controller/service/repository matrix

| Controller | Required service methods | Repository dependencies |
|---|---|---|
| `AuthController` | register, login, admin login, refresh, logout | UserRepository, RoleRepository, RefreshTokenRepository |
| `CustomerController` | get current profile | UserRepository |
| `ProductController` | list, filter, detail, related products | ProductRepository, VariantRepository, InventoryRepository |
| `CategoryController` | list categories | CategoryRepository, ProductRepository |
| `ProductImageController` | list, attach, set primary, delete | ProductImageRepository, ProductRepository, storage service |
| `CartController` | get, add, update quantity, remove, clear | CartRepository, CartItemRepository, VariantRepository, InventoryRepository |
| `WishlistController` | get, add, remove, clear | WishlistRepository, WishlistItemRepository, ProductRepository |
| `AddressController` | list, create, replace | AddressRepository, UserRepository |
| `CheckoutController` | preview, place COD order | CartRepository, VariantRepository, InventoryRepository, AddressRepository, OrderRepository, OrderItemRepository, OrderStatusHistoryRepository |
| `OrderController` | list owned, detail owned | OrderRepository, OrderItemRepository, OrderStatusHistoryRepository |
| `CancellationController` | eligibility, cancel and restore stock | OrderRepository, OrderStatusHistoryRepository, InventoryRepository |
| `TrackingController` | owned active-order tracking summary | OrderRepository, OrderStatusHistoryRepository |
| `ReviewController` | public list, submit, helpful vote, remove vote | ReviewRepository, ReviewImageRepository, HelpfulVoteRepository, OrderRepository, storage service |
| `AdminDashboardController` | summary, recent orders, top products, low stock | OrderRepository, ProductRepository, InventoryRepository, UserRepository |
| `AdminProductController` | list, detail, create, update, stock, delete | ProductRepository, VariantRepository, ProductImageRepository, InventoryRepository |
| `AdminCustomerController` | list, detail, add, soft deactivate/delete | UserRepository, RoleRepository, OrderRepository, AddressRepository |
| `AdminOrderController` | list, detail, status, tracking ID | OrderRepository, OrderItemRepository, OrderStatusHistoryRepository |
| `InventoryController` | list, low-stock, adjustment | InventoryRepository, VariantRepository, ProductRepository |
| `AnalyticsController` | summary, state sales, status, payment | OrderRepository, OrderItemRepository, AddressRepository |
| `ContentController` | public settings, update settings, banner CRUD | WebsiteSettingRepository, BannerRepository, storage service |

### 7.3 Corrected entity count

The 21 MVP JPA entities are:

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
16. `OrderStatusHistory`
17. `Review`
18. `ReviewImage`
19. `ReviewHelpfulVote`
20. `WebsiteSetting`
21. `Banner`

The 10 future entities remain:

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

### 7.4 Repository and service counts

| Scope | Services | Repositories |
|---|---:|---:|
| MVP | 20 | 21 |
| Future | 8 | 10 |
| Complete | 28 | 31 |

The repository count is 31 complete, not 30, because `OrderStatusHistoryRepository` is required.

## 8. DTO approval

The previous 106-DTO estimate is removed. A numbered baseline of 68 MVP DTO types is sufficient and traceable.

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
40. `OrderStatusHistoryResponse`
41. `ReviewSummaryResponse`
42. `ReviewResponse`
43. `ReviewImageResponse`
44. `SubmitReviewRequest`
45. `HelpfulVoteRequest`
46. `HelpfulVoteResponse`
47. `AdminDashboardSummaryResponse`
48. `AdminRecentOrderResponse`
49. `AdminTopProductResponse`
50. `AdminLowStockResponse`
51. `AdminProductRequest`
52. `AdminProductResponse`
53. `AdminCustomerSummaryResponse`
54. `AdminCustomerDetailResponse`
55. `AdminCustomerCreateRequest`
56. `AdminOrderSummaryResponse`
57. `AdminOrderDetailResponse`
58. `UpdateOrderStatusRequest`
59. `UpdateTrackingRequest`
60. `InventoryResponse`
61. `InventoryAdjustmentRequest`
62. `AnalyticsSummaryResponse`
63. `StateSalesResponse`
64. `StatusDistributionResponse`
65. `PaymentSummaryResponse`
66. `WebsiteSettingsResponse`
67. `UpdateWebsiteSettingsRequest`
68. `BannerResponse`

DTO minimization rules:

- `BannerRequest` may be used for add/update instead of separate create and update classes.
- `SubmitReviewRequest` is multipart and contains text fields plus image files.
- `ReviewResponse` includes image URLs; `ReviewImageResponse` is separate only to model image metadata.
- Generic `PageResponse<T>` can wrap product, order, customer and inventory lists.
- Generic `ApiSuccessResponse<T>` can wrap simple mutations.
- `TrackingLocationSummaryResponse` is included for the MVP order/tracking representation even though agent GPS is future.
- Future DTO classes are not included in this MVP count.

## 9. COD, inventory, cancellation and tracking integration

### 9.1 COD order creation

1. Authenticate the customer.
2. Validate address ownership and required fields.
3. Resolve Buy Now or cart item variants from server data.
4. Recalculate prices, delivery charge and 2.5% CGST/SGST in the backend.
5. Check variant availability and stock.
6. Begin one database transaction.
7. Reserve inventory with optimistic/pessimistic locking.
8. Create order and immutable order items.
9. Create initial `ORDER_PLACED` status-history row.
10. Set `paymentMethod=COD` and `paymentStatus=UNPAID`.
11. Clear the cart or remove the Buy Now session marker.
12. Commit only after every write succeeds.

The frontend must display no online-payment success for COD.

### 9.2 Inventory release on cancellation

1. Lock the order and validate ownership.
2. Reject already cancelled, shipped or otherwise non-cancellable statuses.
3. Confirm that the order is COD and unpaid or otherwise eligible.
4. Change status to `Cancelled`.
5. Insert an immutable cancelled status-history row.
6. Set `canCancel=false`.
7. Restore each reserved quantity exactly once.
8. Use an idempotency guard so repeated cancellation requests cannot double-release inventory.

### 9.3 Tracking guarantee

`TRACK-01` must execute:

```text
JWT principal = order customer
AND order exists
AND order.status != Cancelled
AND order.status is active or delivered
```

If ownership or status fails, return a non-disclosing `404` or `403`. Cancelled orders must never receive status history/timeline tracking data.

The MVP tracking response contains:

- order ID;
- current status;
- timeline from `order_status_history`;
- pickup location;
- address snapshot;
- optional tracking ID;
- no fake GPS or route claim.

Active order status updates remain accessible after refresh because they are persisted in both `orders.status` and `order_status_history`.

## 10. Authorization and ownership

For every customer API:

- derive the customer from the JWT principal;
- never trust a browser-supplied `userId`;
- filter cart/wishlist/address/order/review data by principal;
- compare owned order/address/cart IDs to the authenticated customer;
- apply ownership checks before retrieving, updating or deleting;
- reject admin-only status actions without `ROLE_ADMIN`;
- reject cancelled tracking in the service and controller;
- log admin status changes and stock adjustments.

Frontend protected routes are UX conveniences only. Backend authorization is mandatory.

## 11. External integrations

### 11.1 Initial backend

No external third-party API is mandatory to implement the COD MVP.

The MVP may use:

- MySQL;
- server-side file storage for review/product/banner uploads;
- Spring email only if confirmation/reset email is activated.

Object storage is required for durable review image uploads, but it is not required for the COD/order core if image URLs remain static and review uploads are disabled.

### 11.2 Feature-enabled integrations

| Integration | Enabled feature | Credentials |
|---|---|---|
| Object storage | Product/review/banner uploads | Provider account, API/IAM credentials, bucket/container and region |
| Razorpay | Online payment/refund | Key ID, key secret, webhook secret |
| Email | Password reset/order/return/refund email | SMTP credentials or provider API key and verified sender |
| Courier | Real shipment/AWB status | Courier account, API key/secret, optional webhook secret |
| Maps/Routes/Geocoding | Real map route/destination coordinates | Provider server key; restricted browser key if browser rendering is required |

### 11.3 Optional future integrations

| Integration | Credentials |
|---|---|
| SMS/OTP | SMS account/API key and sender/template information |
| WhatsApp Business | Meta app credentials, permanent token, phone-number ID, webhook verification |
| Newsletter | Newsletter provider API key/domain credential |
| Push notifications | Firebase service-account credential set |
| Google/Facebook OAuth | Client ID and client secret per provider |

Secrets must stay in environment variables, server configuration or a secret manager. They must not be committed to source or exposed through Vite variables.

## 12. Final approved counts

| Item | MVP | Future | Complete |
|---|---:|---:|---:|
| API endpoints | 67 | 42 | 109 |
| Database tables | 22 | 10 | 32 |
| JPA entities | 21 | 10 | 31 |
| Controllers | 20 | 8 | 28 |
| Services | 20 | 8 | 28 |
| Repositories | 21 | 10 | 31 |
| DTO types | 68 | Not included | Not included |

MVP method breakdown:

- 31 GET
- 17 POST
- 3 PUT
- 7 PATCH
- 9 DELETE

**Approved MVP external integrations:**

- 0 mandatory third-party APIs for the COD-only core;
- 1 feature-specific storage requirement for durable review/product/banner uploads;
- no payment, courier, maps, SMS, WhatsApp, newsletter or social OAuth credential is required to implement COD MVP.
