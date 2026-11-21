# PROTINUT Foods - Final Approved Backend Architecture

**Status:** Final architecture approval. No backend code is created and no frontend file is changed.

**Technology:** Java 17, Spring Boot, Spring Data JPA/Hibernate, MySQL, Spring Security, JWT and Maven.

## 1. Approved scope

The MVP replaces the frontend's browser-backed commerce state with a server-backed COD store. It includes:

- customer and admin authentication;
- customer profile read;
- products, categories, variants and product images;
- cart and wishlist;
- addresses;
- server-calculated COD checkout;
- owned orders and cancellation;
- order status history and basic tracking;
- reviews and helpful votes;
- admin products, customers, orders and inventory;
- dashboard and sales analytics;
- website settings and banners.

The MVP is COD-only. Razorpay, refund APIs, customer returns, notifications, newsletter, contact persistence, social login, courier and live-GPS features remain future work.

## 2. API consistency

### 2.1 Base convention

- Base path: `/api/v1`
- Resource names are plural: `customers`, `products`, `orders`, `addresses`, `banners`, `reviews`
- Admin detail customer endpoint: `GET /api/v1/admin/customers/{customerId}`
- All `/cart`, `/wishlist`, `/addresses`, `/orders` and `/customers/me` mutations derive the customer from the JWT principal
- Plural `customers` is the only approved customer collection/detail form

This corrects the singular `/admin/customer/{customerId}` inconsistency.

### 2.2 Final MVP endpoint count

| Method | MVP count |
|---|---:|
| GET | 31 |
| POST | 17 |
| PUT | 3 |
| PATCH | 7 |
| DELETE | 9 |
| **Total** | **67** |

Future endpoints: 42.

Complete architecture: 109 endpoints.

**Recount verification:** All 67 individually listed MVP table rows use
unique IDs. They reconcile to 31 GET, 17 POST, 3 PUT, 7 PATCH and 9 DELETE
for a total of 67. The missing `ADM-CUST-04` sequence value is reserved for
future admin customer updating and does not indicate an omitted MVP endpoint.

### 2.3 Individually enumerated MVP endpoints

#### Authentication and customer

| ID | Method | URL | Purpose |
|---|---|---|---|
| AUTH-01 | POST | `/api/v1/auth/register` | Register customer |
| AUTH-02 | POST | `/api/v1/auth/login` | Customer login |
| AUTH-03 | POST | `/api/v1/admin/auth/login` | Admin login |
| AUTH-04 | POST | `/api/v1/auth/refresh` | Rotate refresh token |
| AUTH-05 | POST | `/api/v1/auth/logout` | Revoke refresh token |
| CUST-01 | GET | `/api/v1/customers/me` | Read current customer |

#### Products and images

| ID | Method | URL | Purpose |
|---|---|---|---|
| PROD-01 | GET | `/api/v1/products` | Catalog search/filter/sort |
| PROD-02 | GET | `/api/v1/products/{productId}` | Product detail |
| CAT-01 | GET | `/api/v1/categories` | Public categories |
| IMG-01 | GET | `/api/v1/products/{productId}/images` | Read product images |
| IMG-02 | POST | `/api/v1/admin/products/{productId}/images` | Upload/attach product image |
| IMG-03 | PATCH | `/api/v1/admin/products/{productId}/images/{imageId}/primary` | Set primary image |
| IMG-04 | DELETE | `/api/v1/admin/products/{productId}/images/{imageId}` | Delete product image |

#### Cart and wishlist

| ID | Method | URL | Purpose |
|---|---|---|---|
| CART-01 | GET | `/api/v1/cart` | Read cart |
| CART-02 | POST | `/api/v1/cart/items` | Add cart variant |
| CART-03 | PATCH | `/api/v1/cart/items/{cartItemId}` | Change quantity |
| CART-04 | DELETE | `/api/v1/cart/items/{cartItemId}` | Remove cart item |
| CART-05 | DELETE | `/api/v1/cart` | Clear cart |
| WISH-01 | GET | `/api/v1/wishlist` | Read wishlist |
| WISH-02 | POST | `/api/v1/wishlist/items` | Add wishlist product |
| WISH-03 | DELETE | `/api/v1/wishlist/items/{productId}` | Remove wishlist product |
| WISH-04 | DELETE | `/api/v1/wishlist` | Clear wishlist |

#### Addresses and checkout

| ID | Method | URL | Purpose |
|---|---|---|---|
| ADDR-01 | GET | `/api/v1/addresses` | List saved addresses |
| ADDR-02 | POST | `/api/v1/addresses` | Create address |
| ADDR-03 | PUT | `/api/v1/addresses/{addressId}` | Replace address |
| CHECK-01 | POST | `/api/v1/checkout/preview` | Recalculate server-side total |
| CHECK-02 | POST | `/api/v1/checkout/orders` | Place COD order |

#### Orders and tracking

| ID | Method | URL | Purpose |
|---|---|---|---|
| ORDER-01 | GET | `/api/v1/orders` | List owned orders |
| ORDER-02 | GET | `/api/v1/orders/{orderId}` | Read owned order |
| CAN-01 | GET | `/api/v1/orders/{orderId}/cancellation-eligibility` | Check cancellation eligibility |
| CAN-02 | POST | `/api/v1/orders/{orderId}/cancel` | Cancel owned COD order |
| TRACK-01 | GET | `/api/v1/orders/{orderId}/tracking` | Read status timeline for active or delivered owned order |

#### Reviews

| ID | Method | URL | Purpose |
|---|---|---|---|
| REV-01 | GET | `/api/v1/products/{productId}/reviews` | Read published reviews |
| REV-02 | POST | `/api/v1/products/{productId}/reviews` | Submit one multipart review |
| REV-03 | POST | `/api/v1/reviews/{reviewId}/helpful` | Set helpful vote |
| REV-04 | DELETE | `/api/v1/reviews/{reviewId}/helpful` | Remove helpful vote |

#### Admin dashboard

| ID | Method | URL | Purpose |
|---|---|---|---|
| ADM-DASH-01 | GET | `/api/v1/admin/dashboard/summary` | Store KPI summary |
| ADM-DASH-02 | GET | `/api/v1/admin/dashboard/recent-orders` | Recent orders |
| ADM-DASH-03 | GET | `/api/v1/admin/dashboard/top-products` | Top-selling products |
| ADM-DASH-04 | GET | `/api/v1/admin/dashboard/low-stock` | Low-stock products |

#### Admin products

| ID | Method | URL | Purpose |
|---|---|---|---|
| ADM-PROD-01 | GET | `/api/v1/admin/products` | Manage/list products |
| ADM-PROD-02 | GET | `/api/v1/admin/products/{productId}` | Read product for edit |
| ADM-PROD-03 | POST | `/api/v1/admin/products` | Create product |
| ADM-PROD-04 | PUT | `/api/v1/admin/products/{productId}` | Replace product |
| ADM-PROD-05 | PATCH | `/api/v1/admin/products/{productId}/stock` | Adjust product stock |
| ADM-PROD-06 | DELETE | `/api/v1/admin/products/{productId}` | Delete product |

#### Admin customers

| ID | Method | URL | Purpose |
|---|---|---|---|
| ADM-CUST-01 | GET | `/api/v1/admin/customers` | List customers |
| ADM-CUST-02 | GET | `/api/v1/admin/customers/{customerId}` | Read customer detail |
| ADM-CUST-03 | POST | `/api/v1/admin/customers` | Create customer record |
| ADM-CUST-05 | DELETE | `/api/v1/admin/customers/{customerId}` | Soft-delete/deactivate customer |

`ADM-CUST-04` is intentionally not allocated to MVP. It corresponds to the
future `PUT /api/v1/admin/customers/{customerId}` profile-update operation,
but the current frontend provides customer creation, viewing and deletion only.
No customer update control or required update workflow exists in the MVP UI,
so no new endpoint is added.

#### Admin orders

| ID | Method | URL | Purpose |
|---|---|---|---|
| ADM-ORDER-01 | GET | `/api/v1/admin/orders` | List all orders |
| ADM-ORDER-02 | GET | `/api/v1/admin/orders/{orderId}` | Read order detail |
| ADM-ORDER-03 | PATCH | `/api/v1/admin/orders/{orderId}/status` | Update status |
| ADM-ORDER-04 | PATCH | `/api/v1/admin/orders/{orderId}/tracking` | Set tracking ID/status |

#### Inventory

| ID | Method | URL | Purpose |
|---|---|---|---|
| INV-01 | GET | `/api/v1/admin/inventory` | Read inventory |
| INV-02 | GET | `/api/v1/admin/inventory/low-stock` | Read low-stock list |
| INV-03 | PATCH | `/api/v1/admin/inventory/{variantId}` | Adjust stock |

#### Analytics

| ID | Method | URL | Purpose |
|---|---|---|---|
| ANALYTICS-01 | GET | `/api/v1/admin/analytics/summary` | Sales summary |
| ANALYTICS-02 | GET | `/api/v1/admin/analytics/sales-by-state` | State sales |
| ANALYTICS-03 | GET | `/api/v1/admin/analytics/status-distribution` | Status distribution |
| ANALYTICS-04 | GET | `/api/v1/admin/analytics/payment-summary` | COD/payment method summary |

#### Settings and banners

| ID | Method | URL | Purpose |
|---|---|---|---|
| CMS-01 | GET | `/api/v1/settings` | Read public settings |
| CMS-02 | PUT | `/api/v1/admin/settings` | Replace website settings |
| CMS-03 | GET | `/api/v1/admin/banners` | Manage banners |
| CMS-04 | POST | `/api/v1/admin/banners` | Upload/create banner |
| CMS-05 | PATCH | `/api/v1/admin/banners/{bannerId}` | Update/toggle banner |
| CMS-06 | DELETE | `/api/v1/admin/banners/{bannerId}` | Delete banner |

## 3. Local image storage

### 3.1 Initial implementation

Images are stored on the application server filesystem, not in MySQL.

Recommended configuration:

- base directory: `/var/protinut/uploads`
- product directory: `/var/protinut/uploads/products`
- review directory: `/var/protinut/uploads/reviews`
- banner directory: `/var/protinut/uploads/banners`
- public URL prefix: `/uploads`

No image is stored as base64 or in a database blob.

### 3.2 Storage interface

An application storage port is required:

- interface: `ImageStorageService`
- initial adapter: `LocalImageStorageService`
- future adapter: `CloudObjectStorageService`

The service contract should expose upload, delete and public URL operations. Spring configuration selects the active adapter. Cloud migration changes configuration and adapter selection, not controllers or database column design.

### 3.3 Storage flow

1. `IMG-02`, `REV-02` or `CMS-04` receives an image through multipart data.
2. Validate MIME type, size and extension.
3. Generate an unpredictable server filename.
4. Store the file under the allowed type directory.
5. Store only the relative or public URL in `product_images`, `review_images` or `banners`.
6. Return the URL in the relevant DTO.
7. Delete orphaned files after successful database or entity deletion.

Recommended limits:

- product and banner: provider-approved JPEG/PNG/WEBP, maximum 5 MB;
- review: JPEG/PNG/WEBP, maximum 5 MB per file;
- maximum 5 review images per review.

Static serving must remain outside Spring Security authorization only for public published images. Internal original directories must not be exposed through filesystem paths.

## 4. Review moderation

The final MVP rule is **auto-publish**:

- a submitted review is stored with status `PUBLISHED` by default;
- it is returned by `REV-01` immediately after validation;
- public review counts and rating distributions include published reviews;
- only delivered purchases can receive `purchaseVerified=true`;
- a customer may submit at most one review per product and delivered order;
- helpful votes apply only to published reviews;
- review text and image files pass server validation;
- no admin moderation endpoint is included in MVP.

If admin approval or removal workflows are added later, they require future moderation endpoints and must not change the 67-endpoint MVP count. The existing frontend can display published reviews without a moderation workflow.

## 5. Database design

### 5.1 MVP tables

The MVP requires 22 tables:

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

JPA entities: 21 MVP entities, because `user_roles` is a join table.

### 5.2 Status history

`order_status_history` is required and stores:

- order ID;
- status;
- status index;
- description;
- changed by user ID;
- changed timestamp;
- optional tracking ID.

Admin updates append history. Cancellation appends a cancelled event. `orders.status` remains the current state for efficient queries.

### 5.3 Future tables

The future 10 tables remain separate:

`password_reset_tokens`, `payments`, `refunds`, `return_requests`, `notifications`, `newsletter_subscribers`, `contact_messages`, `delivery_agents`, `shipments`, `tracking_locations`.

Complete architecture: 32 tables and 31 JPA entities.

## 6. Entity, repository and controller consistency

### 6.1 MVP entities

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

### 6.2 MVP controllers and primary services

| Controller | Primary service |
|---|---|
| `AuthController` | `AuthService` |
| `CustomerController` | `CustomerService` |
| `ProductController` | `ProductService` |
| `CategoryController` | `CategoryService` |
| `ProductImageController` | `ProductImageService` |
| `CartController` | `CartService` |
| `WishlistController` | `WishlistService` |
| `AddressController` | `AddressService` |
| `CheckoutController` | `CheckoutService`, `OrderService` |
| `OrderController` | `OrderService` |
| `CancellationController` | `CancellationService`, `InventoryService` |
| `TrackingController` | `TrackingService`, `OrderService` |
| `ReviewController` | `ReviewService`, `ImageStorageService` |
| `AdminDashboardController` | `DashboardService` |
| `AdminProductController` | `AdminProductService`, `InventoryService` |
| `AdminCustomerController` | `AdminCustomerService` |
| `AdminOrderController` | `AdminOrderService`, `OrderStatusService` |
| `InventoryController` | `InventoryService` |
| `AnalyticsController` | `AnalyticsService` |
| `ContentController` | `SettingsService`, `BannerService`, `ImageStorageService` |

There are 20 MVP controllers and 20 primary domain services. Shared services do not create duplicate controllers or repositories.

### 6.3 MVP repositories

The MVP repository set has 21 repositories, one for each JPA entity:

`UserRepository`, `RoleRepository`, `RefreshTokenRepository`, `CategoryRepository`, `ProductRepository`, `ProductVariantRepository`, `ProductImageRepository`, `InventoryRepository`, `CartRepository`, `CartItemRepository`, `WishlistRepository`, `WishlistItemRepository`, `AddressRepository`, `OrderRepository`, `OrderItemRepository`, `OrderStatusHistoryRepository`, `ReviewRepository`, `ReviewImageRepository`, `ReviewHelpfulVoteRepository`, `WebsiteSettingRepository`, `BannerRepository`.

Future repositories: 10.

Complete repository count: 31.

## 7. COD-only transaction flows

### 7.1 COD checkout

1. Authenticate and derive the customer ID from JWT.
2. Validate address ownership.
3. Resolve server cart or Buy Now variant.
4. Check active product and variant availability.
5. Recalculate subtotal, MRP discount, 2.5% CGST, 2.5% SGST and delivery charge.
6. Create order and immutable item snapshots.
7. Reserve inventory atomically.
8. Create `Order Placed` status history.
9. Set `paymentMethod=COD` and `paymentStatus=UNPAID`.
10. Clear the cart or consume Buy Now state.
11. Commit all writes together.

The frontend never creates online-payment success state in COD MVP.

### 7.2 COD cancellation

1. Lock/order-fetch and verify ownership.
2. Reject missing, already cancelled or non-cancellable orders.
3. Append `Cancelled` status history.
4. Set current status to `Cancelled` and `canCancel=false`.
5. Restore inventory exactly once.
6. Commit atomically.
7. Show no refund amount because COD is unpaid.

### 7.3 Inventory rules

- stock is checked on preview and again on order placement;
- reservation is part of the COD order transaction;
- cart quantity may not exceed the configured five-jar limit;
- cancellation releases reservation exactly once;
- optimistic locking or transaction isolation prevents overselling;
- inventory changes are audited.

## 8. Tracking authorization

`TRACK-01` must deny tracking unless all conditions are true:

```text
JWT customer owns the order
AND order exists
AND order.status != CANCELLED
AND order.status is ACTIVE or DELIVERED
```

Cancelled orders return `404` or a non-disclosing `403`. The frontend must not show Track Order Live for cancelled orders.

The MVP response contains:

- status;
- status history;
- pickup location;
- delivery address snapshot;
- optional admin tracking ID;
- no simulated GPS;
- no claim of live vehicle position without real GPS data.

## 9. DTO consistency

The following 68 DTO types are the approved MVP baseline:

1. `ApiErrorResponse`
2. `ApiSuccessResponse`
3. `PageResponse<T>`
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
68. `BannerRequest/Response`

The 68th entry is one banner DTO family. Create and update fields may use one request DTO, while a separate response DTO may be used for public/admin responses without changing the API count.

DTO conventions:

- `PageResponse<T>` serves products, orders, customers and inventory;
- `SubmitReviewRequest` is multipart and contains rating, title, text and image files;
- `ReviewResponse` contains only public fields and public image URLs;
- `OrderDetailResponse` includes immutable order item and address snapshots;
- no DTO exposes passwords, password hashes or refresh-token values.

## 10. External integrations

The COD MVP requires no mandatory online payment, map, courier or SMS API.

Feature-specific integrations:

- local server storage is MVP;
- cloud object storage is a future migration adapter;
- no cloud credential is required for initial local storage;
- Razorpay remains future;
- courier/maps/geocoding remain future;
- email/SMS/WhatsApp/newsletter/push/social OAuth remain future.

## 11. Final approved counts

| Item | MVP | Future | Complete |
|---|---:|---:|---:|
| API endpoints | 67 | 42 | 109 |
| Database tables | 22 | 10 | 32 |
| JPA entities | 21 | 10 | 31 |
| Controllers | 20 | 8 | 28 |
| Primary services | 20 | 8 | 28 |
| Repositories | 21 | 10 | 31 |
| DTO baseline | 68 | excluded | 68 MVP types |

Future endpoint IDs remain excluded from MVP implementation.
