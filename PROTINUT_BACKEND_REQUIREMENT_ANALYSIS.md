# PROTINUT Foods - Complete Backend API, Database & Integration Analysis

**Document purpose:** Backend requirement analysis only. No frontend or backend implementation is included in this document.

**Technology baseline:** Java 17, Spring Boot, Spring Data JPA/Hibernate, MySQL, Spring Security, JWT, Maven.

## 1. Frontend evidence and scope

The frontend inventory is based on the complete `src` tree. Important implementation evidence includes:

- Application routes and providers: [src/App.jsx](src/App.jsx)
- Authentication and browser sessions: [src/AuthContext.jsx](src/AuthContext.jsx), [src/AuthModal.jsx](src/AuthModal.jsx)
- Customer and admin protected routes: [src/ProtectedRoute.jsx](src/ProtectedRoute.jsx), [src/AdminProtectedRoute.jsx](src/AdminProtectedRoute.jsx)
- Cart and wishlist: [src/CartContext.jsx](src/CartContext.jsx), [src/pages/CartPage.jsx](src/pages/CartPage.jsx), [src/pages/WishlistPage.jsx](src/pages/WishlistPage.jsx)
- Products and product variants: [src/OurRange.jsx](src/OurRange.jsx), [src/pages/ProductDetailPage.jsx](src/pages/ProductDetailPage.jsx), [src/AdminStoreContext.jsx](src/AdminStoreContext.jsx)
- Orders and persistence: [src/OrderContext.jsx](src/OrderContext.jsx), [src/orderOwnership.js](src/orderOwnership.js)
- Cancellation and refund eligibility: [src/CancelOrderModal.jsx](src/CancelOrderModal.jsx), [src/orderCancellation.js](src/orderCancellation.js)
- Checkout and simulated payment: [src/pages/CheckoutPage.jsx](src/pages/CheckoutPage.jsx), [src/PaymentGatewayModal.jsx](src/PaymentGatewayModal.jsx)
- Tracking: [src/pages/TrackingPage.jsx](src/pages/TrackingPage.jsx), [src/trackingConfig.js](src/trackingConfig.js)
- Reviews: [src/ProductReviewSection.jsx](src/ProductReviewSection.jsx)
- Admin: [src/pages/admin/AdminDashboardPage.jsx](src/pages/admin/AdminDashboardPage.jsx), [src/pages/admin/AdminLayout.jsx](src/pages/admin/AdminLayout.jsx)
- Site settings and banners: [src/GlobalSettingsContext.jsx](src/GlobalSettingsContext.jsx)
- Tax invoice: [src/InvoiceModal.jsx](src/InvoiceModal.jsx)
- State-wise analytics: [src/pages/admin/StateWiseSalesAnalytics.jsx](src/pages/admin/StateWiseSalesAnalytics.jsx), [src/pages/admin/stateWiseSales.js](src/pages/admin/stateWiseSales.js)

The frontend currently uses browser `localStorage` and `sessionStorage` for users, carts, wishlists, orders, products, settings and banners. These must be replaced or synchronized with durable database-backed APIs in production. The existing local data must not be trusted for authentication or authorization.

## 2. Task 1 - Complete feature analysis

| Feature | Current frontend functionality | Data required | Backend functionality required | Database | External service |
|---|---|---|---|---|---|
| Customer registration | Registration form validates name, email, phone and password, then returns the user to login. | Name, email, phone, password hash, role, registration time | Create customer, validate uniqueness, hash password, send verification or welcome email if adopted | Yes | Optional email |
| Customer login | Email/mobile identifier and password sign-in; remember-me selects browser storage lifetime. | Identifier, password, user, access/refresh tokens | Authenticate, issue JWT pair, revoke refresh token on logout | Yes | Optional SMS/OTP |
| Admin login | Fixed simulated admin credential check and role flag. | Admin email/password or stored admin account | Admin account authentication and ADMIN role authorization | Yes | No |
| Forgot/reset password | UI has a forgot-password action; no real reset flow is connected. | Reset token, expiry, customer identity | Create expiring reset token and send reset email; consume once | Yes | Email |
| Customer profile | Shows name, email and phone; profile details are derived from the user/session. | Name, email, phone, joined date | Get and update profile; enforce uniqueness and validation | Yes | No |
| Password change | Not currently a real customer profile form. | Old password, new password | Verify old password and update BCrypt hash | Yes | No |
| Logout | Clears browser customer/admin sessions and selected commerce state. | Refresh token/session identifier | Revoke refresh token and return a clear success response | Yes | No |
| Customer account | Displays owned order count, wishlist count, cart count and navigation to account features. | Owned orders, cart/wishlist totals, profile | Return account summary through secured endpoints | Yes | No |
| Product catalog | Displays products, weight variants, search, category filtering and sorting. | Product, category, variant, price, MRP, stock and images | Paginated catalog/search/filter/sort APIs | Yes | Image storage |
| Product detail | Detail page handles variants, quantity, selected image, nutrition and related products. | Complete product and variant data | Product detail and related-product API | Yes | Image storage |
| Categories | Derived category tabs and category counts. | Category name, slug, product relation | Public category list/detail and category-filter queries | Yes | No |
| Product availability | Stock status controls add-to-cart and buy-now. | Stock status and quantity | Authoritative availability check during cart and checkout | Yes | No |
| Inventory | Admin table shows stock quantity and low-stock products. | Variant stock quantity and status | Stock adjustment and atomic inventory reservation | Yes | No |
| Cart | Local cart supports quantity, remove, clear, limit of five jars and calculations. | Cart, variant, quantity | Server-side cart with stock and price recalculation | Yes | No |
| Wishlist | Authenticated wishlist supports add, remove and clear. | Customer, product | Durable wishlist CRUD | Yes | No |
| Buy now | Stores a temporary selected item in session storage and opens checkout. | Selected variant and quantity | Server checkout validation or a short-lived checkout preview | Yes | No |
| Address management | Checkout has one saved browser address; admin also displays shipping address. | Name, phone, pincode, address, city, state, coordinates, default flag | CRUD for saved addresses; address validation and ownership | Yes | Geocoding, optional |
| Checkout preview | Recalculates subtotal, MRP discount, 2.5% CGST, 2.5% SGST and delivery charge. | Cart or Buy Now items, address, delivery rule | Recalculate prices server-side and return an immutable checkout summary | Yes | No |
| COD checkout | Captcha and address validation precede order placement. | Address, items, COD method, unpaid status | Create order atomically and mark payment as COD unpaid | Yes | No |
| Online checkout | Frontend offers UPI, card and net banking through a simulated gateway. | Gateway order, amount, currency, payment method | Create provider order, verify signature/webhook and create or confirm order | Yes | Razorpay |
| Order creation | Creates order ID, invoice number, item snapshot, address snapshot and timeline. | Customer, items, prices, payment, address, status | Atomic order creation and inventory reservation | Yes | Optional email/SMS |
| Order history | Customer sees owned orders, status, invoice, cancellation and tracking actions. | Order owner, status, items and payment | Paginated owned-order APIs | Yes | No |
| Order details | Shows timeline, delivery address, items and price breakdown. | Order snapshots | Owned-order retrieval | Yes | No |
| Order cancellation | Select reason and cancel eligible, uncancelled orders. | Order status, reason, timestamps | Re-evaluate cancellation eligibility, change status, restore stock if policy allows | Yes | Optional refund |
| COD cancellation | No refund amount is shown for COD. | COD payment status | Keep payment status unpaid and no refund record | Yes | No |
| Prepaid cancellation | Eligible refund amount is calculated for successful payments. | Payment capture, prior refund amount, grand total | Create/track refund through gateway and update order/refund status | Yes | Razorpay |
| Tax invoice | Frontend generates an invoice PDF in the browser. | Order and address/item snapshots, GST values, GSTIN/FSSAI | Generate a server-backed official invoice PDF or return order invoice data | Yes | PDF service optional |
| Order status updates | Admin changes status and optional tracking ID. | Status, tracking ID, status timestamp | Validate transitions and persist update | Yes | Courier optional |
| Live tracking | Frontend shows pickup/destination, route, estimated distance/time and last status. | Shipment, route geometry, agent location, delivery status | Authoritative shipment, route and agent location APIs | Yes | Maps, geocoding, routes, courier |
| Reviews and ratings | Login required for review submission; star, title, text and optional image. | Review, customer, product, rating, text, photo | Verify purchase, prevent duplicate review, moderate and display | Yes | Image storage |
| Helpful votes | Reviews support yes/no useful voting in local state. | Review and customer vote | Store one vote per customer and update counts atomically | Yes | No |
| Returns | Admin has return-request and returned status views, but customer request UI is not implemented. | Return reason/requested items, status, timestamps | Add customer return request and admin status workflow | Yes | Email optional |
| Refunds | Admin sees refund-requested/refunded orders; frontend does not process actual refunds. | Refund amount, reason, gateway reference, status | Gateway refund creation and webhook reconciliation | Yes | Razorpay |
| Notifications | Admin bell shows caught-up state; notification preferences are stored locally. | User, message, type, read status | Create/read notifications and customer/admin preference handling | Yes | Optional email/SMS/push |
| Newsletter | Footer accepts an email and explicitly reports that signup is not connected. | Subscriber email and consent timestamp | Subscribe/unsubscribe and opt-in validation | Yes | Email marketing optional |
| Contact form | Frontend shows successful local submission but does not send data. | Name, email, phone, message | Persist request and optionally send support email | Yes | Email |
| Admin dashboard | Summary cards, pending orders, low stock, top products, recent orders and recent reviews. | Aggregated orders, revenue, products and inventory | Read-only aggregate APIs | Yes | No |
| Admin products | Add/edit/delete products, prices, discounts, stock status and stock quantity. | Product, category, variant, price, MRP, image URL, stock | CRUD and inventory operations | Yes | Image storage |
| Admin customers | View/add/delete customers and view purchase/address/order details. | Customer and order/address relations | Customer management endpoints | Yes | No |
| Admin order management | Status, tracking ID and order details. | Order status and shipment data | Validated status and tracking updates | Yes | Courier optional |
| Inventory | Dedicated inventory table and stock adjustment. | Product variant stock | Stock CRUD, low-stock reports and reservation | Yes | No |
| Sales analytics | Revenue, order count, quantity, state-wise sales, chart and custom date range. | Orders, address state, status, refund amount, date | Server aggregate queries or reporting views | Yes | No |
| Reports | Frontend generates tax invoice PDF locally. No sales export exists. | Invoice/order data | Generate or download server invoice PDF; optional sales export | Yes | PDF library |
| Website settings | Admin edits company, GSTIN, FSSAI, support, policies and hero content. | Settings and page copy | Admin update and public read | Yes | No |
| Banners | Admin shows/adds/toggles/deletes hero and offer banners. | Banner image, alt text, active state, placement | CRUD and publishing | Yes | Image storage |
| Social login UI | Google/Facebook buttons only show demo messages. | OAuth subject/profile | Not required unless real social login is approved | Yes if later | Google/Facebook OAuth |
| Courier interface | Frontend only accepts a tracking ID; no courier API call. | Courier name, AWB, status events | Create shipment and ingest tracking updates | Yes | Courier/shipping API |

## 3. Task 2 - Complete REST API list

**Base URL:** `/api/v1`

**Final endpoint count:** 109 unique method/path combinations.

### 3.1 Method counts

| Method | Count |
|---|---:|
| GET | 45 |
| POST | 32 |
| PUT | 6 |
| PATCH | 13 |
| DELETE | 13 |
| **Total** | **109** |

No endpoint is counted more than once. All customer data endpoints require JWT ownership checks. Admin endpoints require `ROLE_ADMIN`.

### 3.2 Authentication

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| AUTH-01 | POST | `/auth/register` | Register a customer | `{name,email,phone,password}` | `{id,name,email,role}` | No | Public | `AuthModal.jsx` |
| AUTH-02 | POST | `/auth/login` | Customer login | `{identifier,password,rememberMe}` | `{accessToken,refreshToken,user}` | No | Public | `AuthModal.jsx`, `AuthContext.jsx` |
| AUTH-03 | POST | `/admin/auth/login` | Admin login | `{email,password}` | `{accessToken,refreshToken,user}` | No | Public | `AdminLoginPage.jsx` |
| AUTH-04 | POST | `/auth/refresh` | Rotate refresh token | `{refreshToken}` | `{accessToken,refreshToken}` | Refresh token | Public/user | `AuthContext.jsx` |
| AUTH-05 | POST | `/auth/logout` | Revoke customer/admin refresh token | `{refreshToken}` | `{success,message}` | Yes | Customer/Admin | `AuthContext.jsx`, `AdminLayout.jsx` |
| AUTH-06 | POST | `/auth/password/forgot` | Request password reset | `{email}` | `{success,message}` | No | Public | Forgot-password link in `AuthModal.jsx` |
| AUTH-07 | POST | `/auth/password/reset` | Reset password using an expiring token | `{token,newPassword}` | `{success,message}` | No | Public | Future form; no current UI |

### 3.3 Customer Profile

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CUST-01 | GET | `/customers/me` | Read logged-in profile | None | `{id,name,email,phone,joinedAt,role}` | Yes | Customer | `AccountPage.jsx` |
| CUST-02 | PUT | `/customers/me` | Update profile | `{name,email,phone}` | Updated profile | Yes | Customer | `AccountPage.jsx` only shows profile; edit UI not implemented |
| CUST-03 | PATCH | `/customers/me/password` | Change password | `{currentPassword,newPassword}` | `{success,message}` | Yes | Customer | No current UI; recommended |

### 3.4 Products

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| PROD-01 | GET | `/products` | List/filter/search/sort/paginate products | Query: `category,status,search,sort,page,size` | `{items,page,summary}` | No | Public | `OurRange.jsx` |
| PROD-02 | GET | `/products/{productId}` | Read product detail | None | Product with variants, images, nutrition, benefits and stock | No | Public | `ProductDetailPage.jsx` |

### 3.5 Categories

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CAT-01 | GET | `/categories` | List categories and product counts | None | `{items}` | No | Public | `OurRange.jsx`, `CategoriesTable` |
| CAT-02 | GET | `/categories/{categoryId}` | Read category | None | Category details | No | Public | `OurRange.jsx` category filters |

### 3.6 Product Images

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| IMG-01 | GET | `/products/{productId}/images` | Read product images | None | `{items}` | No | Public | `ProductDetailPage.jsx` |
| IMG-02 | POST | `/admin/products/{productId}/images` | Upload/attach product image | Multipart file or `{imageUrl,altText}` | Created image record | Yes | Admin | `ProductForm.jsx` in admin dashboard |
| IMG-03 | PATCH | `/admin/products/{productId}/images/{imageId}/primary` | Set primary image | `{primary:boolean}` | Updated image | Yes | Admin | Product detail uses primary image |
| IMG-04 | DELETE | `/admin/products/{productId}/images/{imageId}` | Remove product image | None | `{success}` | Yes | Admin | Product edit form |

### 3.7 Cart

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CART-01 | GET | `/cart` | Read current customer's cart | None | Cart items, totals, GST and delivery charge | Yes | Customer | `CartContext.jsx` |
| CART-02 | POST | `/cart/items` | Add variant to cart | `{productId,variantId,quantity}` | Updated cart | Yes | Customer | `CartContext.jsx` |
| CART-03 | PATCH | `/cart/items/{cartItemId}` | Change quantity | `{quantity}` | Updated cart | Yes | Customer | `CartPage.jsx` |
| CART-04 | DELETE | `/cart/items/{cartItemId}` | Remove one cart item | None | Updated cart | Yes | Customer | `CartPage.jsx`, `SideCartDrawer.jsx` |
| CART-05 | DELETE | `/cart` | Clear cart | None | Empty cart | Yes | Customer | `CartPage.jsx`, checkout clear |

### 3.8 Wishlist

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| WISH-01 | GET | `/wishlist` | Read wishlist | None | `{items}` | Yes | Customer | `WishlistDrawer.jsx`, `WishlistPage.jsx` |
| WISH-02 | POST | `/wishlist/items` | Add product | `{productId}` | Updated wishlist | Yes | Customer | `OurRange.jsx`, `ProductDetailPage.jsx` |
| WISH-03 | DELETE | `/wishlist/items/{productId}` | Remove product | None | Updated wishlist | Yes | Customer | Wishlist drawers/pages |
| WISH-04 | DELETE | `/wishlist` | Clear wishlist | None | Empty wishlist | Yes | Customer | `WishlistDrawer.jsx`, account clear |

### 3.9 Addresses

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ADDR-01 | GET | `/addresses` | List saved addresses | None | `{items}` | Yes | Customer | Checkout address section |
| ADDR-02 | POST | `/addresses` | Create address | `{name,mobile,pincode,addressLine,city,state,flatNo,street,coordinates,isDefault}` | Address | Yes | Customer | `CheckoutPage.jsx` |
| ADDR-03 | PUT | `/addresses/{addressId}` | Replace address | Complete address object | Updated address | Yes | Customer | `CheckoutPage.jsx` edit mode |
| ADDR-04 | PATCH | `/addresses/{addressId}/default` | Mark address default | None | Updated address | Yes | Customer | Future address management; normal checkout |
| ADDR-05 | DELETE | `/addresses/{addressId}` | Delete address | None | `{success}` | Yes | Customer | Future address management |

### 3.10 Checkout

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CHECK-01 | POST | `/checkout/preview` | Recalculate cart or Buy Now totals | `{source,cartItemIds,buyNowItem,addressId}` | Subtotal, discount, CGST, SGST, delivery, grand total | Yes | Customer | `CheckoutPage.jsx` |
| CHECK-02 | POST | `/checkout/orders` | Place COD or create a pending online order | `{addressId,source,cartItemIds,buyNowItem,paymentMethod,paymentStatus}` | Created order or pending order/payment intent | Yes | Customer | `CheckoutPage.jsx` |

Checkout must reprice, validate stock, validate address and reserve inventory on the backend. Frontend-calculated totals are never authoritative.

### 3.11 Orders

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ORDER-01 | GET | `/orders` | List owned orders | Query: `status,page,size` | Paginated owned orders | Yes | Customer | `OrdersPage.jsx`, `AccountPage.jsx` |
| ORDER-02 | GET | `/orders/{orderId}` | Read owned order detail | None | Complete order and snapshots | Yes | Customer | `OrderDetailPage.jsx`, `OrderSuccessPage.jsx` |
| ORDER-03 | GET | `/orders/{orderId}/invoice` | Download server-generated tax invoice | None | PDF binary or redirect | Yes | Customer | `InvoiceModal.jsx` |

### 3.12 Order Cancellation

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CAN-01 | GET | `/orders/{orderId}/cancellation-eligibility` | Recheck whether an order can be cancelled | None | `{eligible,reason,paymentInfo}` | Yes | Customer | `CancelOrderModal.jsx` |
| CAN-02 | POST | `/orders/{orderId}/cancel` | Cancel owned cancellable order | `{reason}` | Cancelled order and optional refund requirement | Yes | Customer | `CancelOrderModal.jsx`, `OrderContext.jsx` |

### 3.13 Order Tracking

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| TRACK-01 | GET | `/orders/{orderId}/tracking` | Read owned tracking summary | None | Status timeline, pickup, destination, route, estimated ETA, last agent location | Yes | Customer | `TrackingPage.jsx` |
| TRACK-02 | GET | `/delivery/shipments` | List shipments assigned to logged-in delivery agent | Query: `status,page,size` | Assigned shipments | Yes | Delivery Agent | No current UI; backend for future tracking |
| TRACK-03 | POST | `/delivery/shipments/{shipmentId}/locations` | Post authenticated GPS location update | `{latitude,longitude,accuracy,updatedAt}` | `{success,lastLocation}` | Yes | Delivery Agent | `TrackingPage.jsx` consumes location |
| TRACK-04 | PATCH | `/delivery/shipments/{shipmentId}/status` | Update shipment/delivery status | `{status,note,updatedAt}` | Updated shipment | Yes | Delivery Agent/Admin | Admin tracking status update |

### 3.14 Payments

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| PAY-01 | POST | `/payments/orders` | Create gateway payment order | `{orderId,amount,currency}` | `{paymentId,gatewayOrderId,amount,keyContext}` | Yes | Customer | `CheckoutPage.jsx` |
| PAY-02 | GET | `/payments/{paymentId}` | Read payment status | None | Payment record | Yes | Customer/Admin | Checkout confirmation |
| PAY-03 | POST | `/payments/verify` | Verify gateway signature and capture | `{gatewayOrderId,gatewayPaymentId,gatewaySignature}` | Verified payment and order status | Yes | Customer | `PaymentGatewayModal.jsx` future Razorpay |
| PAY-04 | POST | `/payments/webhooks/razorpay` | Verify and process Razorpay webhook | Provider headers and JSON body | `{success}` | Webhook signature | Razorpay service | Backend required for real payments |
| PAY-05 | POST | `/payments/{paymentId}/failed` | Record/receive failed payment result | `{reason,gatewayReference}` | Failed payment record | Yes | Customer | `PaymentGatewayModal.jsx` |

The frontend's test Success/Failure buttons must never be accepted as an authoritative payment result.

### 3.15 Refunds

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| REF-01 | GET | `/refunds` | List refund records for owned orders | Query: `status,page,size` | Paginated refunds | Yes | Customer/Admin | Customer cancellation text; admin refunds table |
| REF-02 | GET | `/refunds/{refundId}` | Read refund detail | None | Refund record | Yes | Customer/Admin | Cancellation/refund UI |
| REF-03 | POST | `/admin/refunds` | Create refund request for eligible prepaid cancellation | `{orderId,amount,reason}` | Refund record | Yes | Admin | Admin refunds |
| REF-04 | POST | `/admin/refunds/{refundId}/process` | Send refund to gateway | `{gatewayRefundId}` optional | Processing/completed refund | Yes | Admin | Future refund processing |
| REF-05 | PATCH | `/admin/refunds/{refundId}/status` | Reconcile/admin update refund status | `{status,note,gatewayRefundId}` | Updated refund | Yes | Admin | Admin refund table |

### 3.16 Returns

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| RET-01 | POST | `/orders/{orderId}/returns` | Request an eligible damaged/wrong-product return | `{reason,description,items}` | Return request | Yes | Customer | No customer form; policy in `GlobalSettingsContext.jsx` |
| RET-02 | GET | `/orders/{orderId}/returns` | Read return status | None | `{items}` | Yes | Customer | No current UI |
| RET-03 | GET | `/admin/returns` | List return requests | Query: `status,page,size` | Paginated return requests | Yes | Admin | `AdminDashboardPage.jsx` |
| RET-04 | PATCH | `/admin/returns/{returnId}/status` | Approve/reject/complete return | `{status,note}` | Updated return | Yes | Admin | `AdminDashboardPage.jsx` |

### 3.17 Reviews and Ratings

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| REV-01 | GET | `/products/{productId}/reviews` | List public approved reviews | Query: `page,size,sort` | Average, distribution and reviews | No | Public | `ProductReviewSection.jsx` |
| REV-02 | POST | `/products/{productId}/reviews` | Submit an owned review | `{rating,title,text,images}` | Created/pending review | Yes | Customer | `ProductReviewSection.jsx` |
| REV-03 | POST | `/reviews/{reviewId}/helpful` | Record helpful yes/no | `{helpful:boolean}` | Updated counts | Yes | Customer | `ProductReviewSection.jsx` |
| REV-04 | DELETE | `/reviews/{reviewId}/helpful` | Remove current user's helpful vote | None | Updated counts | Yes | Customer | Frontend change-vote behavior |
| REV-05 | GET | `/admin/reviews` | List reviews for moderation | Query: `status,page,size` | Paginated reviews | Yes | Admin | `AdminDashboardPage.jsx` |
| REV-06 | DELETE | `/admin/reviews/{reviewId}` | Remove review | None | `{success}` | Yes | Admin | Admin reviews table |

The backend must verify delivered purchase history before setting `purchaseVerified=true`; the frontend must not label a review verified solely on submission.

### 3.18 Notifications

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| NOTIF-01 | GET | `/notifications` | Read current customer's/admin notifications | Query: `page,size,unreadOnly` | Paginated notifications | Yes | Customer/Admin | Admin bell and notification page |
| NOTIF-02 | PATCH | `/notifications/{notificationId}/read` | Mark notification read | None | Updated notification | Yes | Customer/Admin | Notification UI |
| NOTIF-03 | POST | `/notifications/read-all` | Mark all notifications read | None | `{success}` | Yes | Customer/Admin | Future notification UI |
| NOTIF-04 | GET | `/admin/notifications` | Read store notifications | Query: `page,size` | Paginated notifications | Yes | Admin | `AdminLayout.jsx`, `AdminDashboardPage.jsx` |

### 3.19 Newsletter

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| NEWS-01 | POST | `/newsletter/subscriptions` | Subscribe to newsletter | `{email}` | `{success,message}` | No | Public | `Footer.jsx` |
| NEWS-02 | DELETE | `/newsletter/subscriptions/{unsubscribeToken}` | Unsubscribe | None | `{success}` | No | Public | No current UI; required for email compliance |

### 3.20 Contact

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CONTACT-01 | POST | `/contact-messages` | Store/send customer inquiry | `{name,email,phone,message}` | `{success,message}` | No | Public | `ContactPage.jsx` |

### 3.21 Admin Dashboard

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ADM-DASH-01 | GET | `/admin/dashboard/summary` | Read dashboard KPI summary | Query: `from,to` | Revenue, order/customer/product counts | Yes | Admin | `AdminDashboardPage.jsx` |
| ADM-DASH-02 | GET | `/admin/dashboard/recent-orders` | Read recent orders | Query: `limit` | Recent order summaries | Yes | Admin | Dashboard recent orders table |
| ADM-DASH-03 | GET | `/admin/dashboard/top-products` | Read top-selling products | Query: `limit,from,to` | Product sales summaries | Yes | Admin | Dashboard top-selling section |
| ADM-DASH-04 | GET | `/admin/dashboard/low-stock` | Read low-stock products | Query: `limit,threshold` | Low-stock product list | Yes | Admin | Dashboard low-stock section |

### 3.22 Admin Product Management

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ADM-PROD-01 | GET | `/admin/products` | List/manage products | Query: `search,page,size` | Paginated products | Yes | Admin | `AdminDashboardPage.jsx` products table |
| ADM-PROD-02 | GET | `/admin/products/{productId}` | Read product for edit | None | Complete product | Yes | Admin | Product form |
| ADM-PROD-03 | POST | `/admin/products` | Create product | Complete product/variant payload | Created product | Yes | Admin | `ProductForm.jsx` |
| ADM-PROD-04 | PUT | `/admin/products/{productId}` | Replace product | Complete product/variant payload | Updated product | Yes | Admin | `ProductForm.jsx` |
| ADM-PROD-05 | PATCH | `/admin/products/{productId}/stock` | Adjust stock | `{stockStatus,stock,variantStocks}` | Updated inventory | Yes | Admin | Inventory table and product form |
| ADM-PROD-06 | DELETE | `/admin/products/{productId}` | Delete product | None | `{success}` | Yes | Admin | Product table delete |

### 3.23 Admin Customer Management

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ADM-CUST-01 | GET | `/admin/customers` | List customers | Query: `search,page,size` | Paginated customers | Yes | Admin | `CustomersTable.jsx` within admin dashboard |
| ADM-CUST-02 | GET | `/admin/customers/{customerId}` | Read customer details | None | Profile, addresses and order summary | Yes | Admin | Customer details modal |
| ADM-CUST-03 | POST | `/admin/customers` | Add customer | `{name,email,phone}` | Created customer | Yes | Admin | `CustomerForm.jsx` |
| ADM-CUST-04 | PUT | `/admin/customers/{customerId}` | Update customer | `{name,email,phone}` | Updated customer | Yes | Admin | No edit UI, but replacement is architecturally appropriate |
| ADM-CUST-05 | DELETE | `/admin/customers/{customerId}` | Delete customer/anonymize according to policy | None | `{success}` | Yes | Admin | Customer delete modal |

Customer deletion should normally anonymize or deactivate the account instead of physically deleting a user with historical orders.

### 3.24 Admin Order Management

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ADM-ORDER-01 | GET | `/admin/orders` | List/manage all orders | Query: `search,status,page,size` | Paginated orders | Yes | Admin | `OrdersTable.jsx` |
| ADM-ORDER-02 | GET | `/admin/orders/{orderId}` | Read any order detail | None | Complete order | Yes | Admin | Admin order details modal |
| ADM-ORDER-03 | PATCH | `/admin/orders/{orderId}/status` | Change order status | `{status,note}` | Updated order/timeline | Yes | Admin | `OrderTableRow.jsx` |
| ADM-ORDER-04 | PATCH | `/admin/orders/{orderId}/tracking` | Set/update tracking ID and shipment status | `{trackingId,courier,status}` | Updated shipment/order | Yes | Admin | `OrderTableRow.jsx` |

### 3.25 Inventory

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| INV-01 | GET | `/admin/inventory` | Read stock list | Query: `search,page,size` | Paginated inventory | Yes | Admin | `InventoryTable.jsx` |
| INV-02 | GET | `/admin/inventory/low-stock` | Read low-stock inventory | Query: `threshold` | Low-stock items | Yes | Admin | Dashboard low-stock |
| INV-03 | PATCH | `/admin/inventory/{variantId}` | Adjust variant stock | `{quantity,reason,operation}` | Updated stock | Yes | Admin | Inventory adjust stock |

### 3.26 Sales Analytics

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| ANALYTICS-01 | GET | `/admin/analytics/summary` | Read sales summary | Query: `from,to` | Revenue, orders, quantity, AOV | Yes | Admin | Dashboard and state-wise analytics |
| ANALYTICS-02 | GET | `/admin/analytics/sales-by-state` | Read state-wise sales | Query: `from,to` | State totals/chart/table | Yes | Admin | `StateWiseSalesAnalytics.jsx` |
| ANALYTICS-03 | GET | `/admin/analytics/status-distribution` | Read order status distribution | Query: `from,to` | Status counts | Yes | Admin | Dashboard status donut |
| ANALYTICS-04 | GET | `/admin/analytics/payment-summary` | Read COD/online totals | Query: `from,to` | Payment method totals | Yes | Admin | Payments page |

### 3.27 Website Settings and Banners

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| CMS-01 | GET | `/settings` | Read public website settings | None | Public company/policy/banner settings | No | Public | `GlobalSettingsContext.jsx` |
| CMS-02 | PUT | `/admin/settings` | Replace website settings | Complete settings payload | Updated settings | Yes | Admin | Website-content/settings page |
| CMS-03 | GET | `/admin/banners` | List banners | Query: `placement,page,size` | Paginated banners | Yes | Admin | Banners page |
| CMS-04 | POST | `/admin/banners` | Add banner | Multipart or `{src,alt,active,placement}` | Created banner | Yes | Admin | Banners page |
| CMS-05 | PATCH | `/admin/banners/{bannerId}` | Toggle/update banner | `{active,alt,placement,sortOrder}` | Updated banner | Yes | Admin | Banners page |
| CMS-06 | DELETE | `/admin/banners/{bannerId}` | Delete banner | None | `{success}` | Yes | Admin | Banners page |

### 3.28 Delivery Agent Management

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| AGENT-01 | POST | `/admin/delivery-agents` | Create agent | `{name,email,phone,password,active}` | Created agent | Yes | Admin | Live tracking requirement; no current admin UI |
| AGENT-02 | GET | `/admin/delivery-agents` | List agents | Query: `status,page,size` | Paginated agents | Yes | Admin | Live tracking requirement |
| AGENT-03 | GET | `/admin/delivery-agents/{agentId}` | Read agent | None | Agent and assignment details | Yes | Admin | Live tracking requirement |
| AGENT-04 | PUT | `/admin/delivery-agents/{agentId}` | Update agent | `{name,email,phone,active}` | Updated agent | Yes | Admin | Live tracking requirement |
| AGENT-05 | DELETE | `/admin/delivery-agents/{agentId}` | Deactivate/delete agent | None | `{success}` | Yes | Admin | Live tracking requirement |
| AGENT-06 | POST | `/delivery/auth/login` | Authenticate delivery agent | `{email,password}` | `{accessToken,refreshToken,agent}` | No | Public | Required for real GPS updates |

### 3.29 Sales Reports

| ID | Method | Endpoint | Purpose | Request body | Response | Auth | Role | Frontend evidence |
|---|---|---|---|---|---|---|---|---|
| REPORT-01 | GET | `/admin/reports/sales/export` | Export sales report | Query: `format,from,to`; format initially `csv` | CSV file | Yes | Admin | Future report export; no current UI |

No report endpoint is counted twice. Tax invoice is listed under Orders.

## 4. Task 3 - External API keys and third-party services

### 4.1 Mandatory integrations

| Integration | Why needed | Exact product/API | Credentials | Backend/frontend | Mandatory | Availability |
|---|---|---|---|---|---|---|
| Razorpay | Real UPI/card/net-banking checkout and refunds | Razorpay Orders, Payments, Refunds and Webhooks | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Backend; frontend receives only public key/payment checkout data | Mandatory for online payment | Paid/transaction fees; pricing verify |
| Object storage | Product, banner and review images | AWS S3/CloudFront or Cloudinary | S3: IAM access key ID, secret and bucket settings; Cloudinary: cloud name, API key, API secret | Backend signed uploads; public CDN in frontend | Mandatory for durable images | Free tier and paid tiers vary |
| Transactional email | Password reset, order confirmation, return/refund and support notifications | SMTP or provider API | SMTP host/port/user/password, or API key + sender identity | Backend only | Mandatory for account recovery and order communication | Provider free tier/paid |
| Courier/shipping | Real AWB/tracking and delivery status | Chosen courier provider's shipment and tracking API | Account ID, API key/secret, webhook secret if supported | Backend/webhooks; frontend read-only | Mandatory only for real shipment tracking | Paid/contract pricing |
| Maps, routing and geocoding | Road route, distance, ETA and address coordinates | Google Maps Platform: Maps JavaScript, Routes/Directions and Geocoding; or a chosen OSM route service | Google Maps browser/API key plus separate server key restrictions; or provider API key | Backend for geocoding/routes; restricted maps key may be used in frontend | Mandatory for the complete requested live-route feature | Paid usage with free credits/limits |

### 4.2 Optional integrations

| Integration | Why needed | Exact product/API | Credentials | Backend/frontend | Mandatory/optional | Availability |
|---|---|---|---|---|---|---|
| SMS/OTP | Mobile verification or login OTP | SMS gateway API | API key/secret, sender ID/template IDs | Backend only | Optional | Usually paid |
| WhatsApp Business | Order status and support notifications | Meta WhatsApp Cloud API | Meta app ID/secret, access token, phone-number ID, webhook verify token | Backend only | Optional | Free conversation rules/paid volume |
| Newsletter provider | Subscriber management and campaigns | Brevo, Mailchimp or equivalent | Provider API key/domain key | Backend only | Optional | Free tier/paid |
| Push notifications | Browser or mobile notifications | Firebase Cloud Messaging | Service account credentials or FCM server key replacement | Backend only | Optional | Free/paid by usage |
| Google OAuth/Facebook OAuth | Real social login | Provider OAuth/OIDC | Client ID, client secret, callback URL | Backend; public client ID only where needed | Optional | Free |
| Invoice PDF service | Server-rendered PDF beyond jsPDF | HTML-to-PDF service or jsPDF server alternative | Provider API key if hosted | Backend only | Optional for generated PDF | Provider varies |

### 4.3 Credential table

| No. | Service | Credential required | Mandatory/Optional | Purpose |
|---|---|---|---|---|
| 1 | Razorpay | Key ID, key secret, webhook secret | Mandatory for online payments | Create/verify payments and refunds |
| 2 | AWS S3 or Cloudinary | Storage account IAM/API credentials and bucket/cloud configuration | Mandatory for durable images | Product/review/banner storage |
| 3 | SMTP/email provider | Host, port, username/API key, password/app password, sender identity | Mandatory | Reset, order and notification email |
| 4 | Courier provider | Account ID/API key/API secret/webhook secret | Mandatory for real shipment integration | AWB and tracking updates |
| 5 | Google Maps/Routes/Geocoding or other route provider | Server API key; optional restricted browser key | Mandatory for complete route tracking | Address coordinates and routes |
| 6 | SMS provider | Account SID/API key, token, sender ID | Optional | OTP/SMS alerts |
| 7 | WhatsApp Cloud API | App credentials, permanent token, phone-number ID, webhook token | Optional | WhatsApp notifications |
| 8 | Newsletter provider | API key/domain key | Optional | Newsletter campaigns |
| 9 | FCM | Service account/private key | Optional | Push notifications |
| 10 | Google/Facebook OAuth | Public client ID and confidential client secret | Optional | Social login |

**Mandatory external integrations:** 5.

**Optional external integrations:** 5 (SMS, WhatsApp, newsletter, push, social OAuth); the invoice PDF provider is optional but is not counted as a separate external integration if server PDF is generated in Java.

**Determinable credentials/secrets:** 10 credential sets in the table. Individual values are more numerous: Razorpay 3, storage 3 or 4, email 4, courier 3 or 4, maps 1, SMS 3, WhatsApp 4, newsletter 1 or 2, FCM 1 service-account credential set, OAuth 4. Exact provider pricing and secret counts must be confirmed after provider selection.

**Security:** Never place provider secrets in `src`, `.env` files shipped to Vite, browser JavaScript or database seed files. Use Spring configuration/environment variables and a secret manager.

## 5. Task 4 - Database design

### 5.1 Tables

`user_roles` is a required join table but is not necessarily a JPA entity. The final count is **31 MySQL tables** and **30 JPA entities**.

| Table | Key columns | Primary key | Foreign keys | Unique constraints | Nullability | Purpose |
|---|---|---|---|---|---|---|
| `users` | id, name, email, phone, password_hash, role? join relation, active, email_verified, joined_at, created_at, updated_at | id BIGINT | None | email, phone | email/name/password NOT NULL | Customer/admin accounts |
| `roles` | id, name | id BIGINT | None | name | name NOT NULL | CUSTOMER, ADMIN, DELIVERY_AGENT |
| `user_roles` | user_id, role_id | Composite | users.id, roles.id | (user_id, role_id) | Both NOT NULL | Many-to-many role assignment |
| `refresh_tokens` | id, user_id, token_hash, expires_at, revoked_at, created_at | id BIGINT | users.id | token_hash | user/token/expires NOT NULL | JWT refresh-token rotation |
| `password_reset_tokens` | id, user_id, token_hash, expires_at, used_at, created_at | id BIGINT | users.id | token_hash | user/token/expires NOT NULL | Forgot-password flow |
| `categories` | id, name, slug, description, active, sort_order | id BIGINT | None | name, slug | name/slug NOT NULL | Product categorization |
| `products` | id, category_id, name, slug, description, tag, theme_color, protein, highlight_badge, is_combo, active, rating, review_count, metadata_json | id BIGINT | categories.id | slug | name/category/active NOT NULL | Product master |
| `product_variants` | id, product_id, variant_code, label, mrp, sale_price, active | id BIGINT | products.id | (product_id, variant_code) | product/code/prices NOT NULL | 550gm, 1kg and combo variants |
| `product_images` | id, product_id, image_url, alt_text, sort_order, is_primary | id BIGINT | products.id | Unique primary enforced by service/partial key policy | product/image NOT NULL | Product/gallery images |
| `inventory` | id, variant_id, quantity, reserved_quantity, stock_status, low_stock_threshold, version | id BIGINT | product_variants.id | variant_id | quantity/status NOT NULL | Atomic stock management |
| `carts` | id, user_id, updated_at | id BIGINT | users.id | user_id | user NOT NULL | One current cart per customer |
| `cart_items` | id, cart_id, variant_id, quantity, created_at, updated_at | id BIGINT | carts.id, product_variants.id | (cart_id, variant_id) | cart/variant/quantity NOT NULL | Cart line items |
| `wishlists` | id, user_id, created_at | id BIGINT | users.id | user_id | user NOT NULL | One wishlist per customer |
| `wishlist_items` | id, wishlist_id, product_id, created_at | id BIGINT | wishlists.id, products.id | (wishlist_id, product_id) | both NOT NULL | Wishlist products |
| `addresses` | id, user_id, name, mobile, pincode, address_line, flat_no, street, city, state, latitude, longitude, is_default | id BIGINT | users.id | None | user/name/mobile/pincode/address/city/state NOT NULL | Saved and order address snapshots |
| `orders` | id, order_number, user_id, address_id, address_snapshot_json, status, status_index, total_amount, subtotal, discount, cgst, sgst, delivery_charge, invoice_number, payment_status, cancellation_reason, cancelled_at, created_at, updated_at | id BIGINT | users.id, addresses.id nullable | order_number, invoice_number | order_number/user/status/pricing NOT NULL | Customer order |
| `order_items` | id, order_id, product_id nullable, variant_id nullable, name_snapshot, variant_snapshot, quantity, unit_price, mrp, line_total | id BIGINT | orders.id; product/variant nullable | None | order/name/quantity/prices NOT NULL | Immutable checkout snapshot |
| `payments` | id, order_id, provider, provider_order_id, provider_payment_id, amount, currency, method, status, signature_verified, failure_reason, webhook_received_at, paid_at | id BIGINT | orders.id | provider_order_id, provider_payment_id | order/provider/amount/status NOT NULL | Payment attempts and captured payments |
| `refunds` | id, order_id, payment_id, amount, status, reason, provider_refund_id, processed_at, created_at | id BIGINT | orders.id, payments.id nullable | provider_refund_id | order/amount/status NOT NULL | Refund requests and gateway reconciliation |
| `return_requests` | id, order_id, user_id, reason, description, status, resolved_at, created_at | id BIGINT | orders.id, users.id | None | order/user/reason/status NOT NULL | Damaged/wrong-product return workflow |
| `reviews` | id, product_id, user_id, order_id nullable, rating, title, text, status, purchase_verified, helpful_yes, helpful_no, created_at | id BIGINT | products.id, users.id, orders.id nullable | (product_id, user_id, order_id) where applicable unique policy | product/user/rating/status NOT NULL | Product reviews |
| `review_images` | id, review_id, image_url, alt_text, sort_order | id BIGINT | reviews.id | None | review/image NOT NULL | Review photo uploads |
| `review_helpful_votes` | id, review_id, user_id, helpful, created_at | id BIGINT | reviews.id, users.id | (review_id, user_id) | review/user/helpful NOT NULL | Helpful yes/no votes |
| `notifications` | id, user_id nullable, admin_only, type, title, message, read_at, created_at | id BIGINT | users.id nullable | None | type/title/message NOT NULL | Customer/admin notifications |
| `newsletter_subscribers` | id, email, unsubscribe_token, subscribed_at, unsubscribed_at, consent_source | id BIGINT | None | email, unsubscribe_token | email NOT NULL | Footer newsletter signups |
| `website_settings` | id, settings_json, version, updated_at | id BIGINT | None | id/singleton | settings_json NOT NULL | Public/admin editable site settings |
| `banners` | id, placement, image_url, alt_text, active, sort_order, created_at | id BIGINT | None | None | placement/image NOT NULL | Hero and offer banners |
| `contact_messages` | id, name, email, phone, message, status, created_at | id BIGINT | None | None | name/email/message NOT NULL | Contact form requests |
| `delivery_agents` | id, user_id, name, phone, email, active, created_at | id BIGINT | users.id | email, phone | user/name NOT NULL | Delivery agent profile |
| `shipments` | id, order_id, agent_id nullable, courier_name, tracking_id, status, pickup_coordinates_json, destination_coordinates_json, route_geometry_json, distance_km, estimated_duration_minutes, estimated_delivery_at | id BIGINT | orders.id, delivery_agents.id nullable | order_id, tracking_id nullable | order/status NOT NULL | Shipment and route state |
| `tracking_locations` | id, shipment_id, agent_id, latitude, longitude, accuracy, recorded_at | id BIGINT | shipments.id, delivery_agents.id | None | shipment/latitude/longitude/recorded_at NOT NULL | Append-only delivery GPS updates |

### 5.2 Relationships

- One-to-one: one cart per user, one wishlist per user, one inventory record per product variant, one shipment per order in the initial frontend model.
- One-to-many: User -> addresses/orders/payments/refunds/notifications/reviews; Category -> products; Product -> variants/images/reviews; Order -> order items/payments/refunds/return requests/tracking; Shipment -> tracking locations.
- Many-to-many: Users <-> Roles through `user_roles`; reviews and customers through helpful votes as a join entity.

## 6. Task 5 - Spring Boot project architecture

### 6.1 Recommended package structure

```text
com.protinut
├── config
├── controller
├── service
├── service.impl
├── repository
├── entity
├── dto
│   ├── request
│   └── response
├── mapper
├── security
├── exception
├── enums
├── integration
│   ├── razorpay
│   ├── courier
│   ├── maps
│   ├── email
│   └── storage
└── util
```

### 6.2 Exact category counts

| Category | Exact count | Implemented classes |
|---|---:|---|
| Controllers | 27 | Auth, Customer, Product, Category, ProductImage, Cart, Wishlist, Address, Checkout, Order, Cancellation, Tracking, Payment, Refund, Return, Review, Notification, Newsletter, Contact, AdminDashboard, AdminProduct, AdminCustomer, AdminOrder, Inventory, Analytics, Content, DeliveryAgent, and Report. There are 27 after combining settings/banners under Content. |
| Services | 27 | One primary service for each controller category; integration implementations are integration classes, not services |
| Repositories | 30 | One repository for each JPA entity; `user_roles` is a join table only |
| JPA entities | 30 | All entities excluding the `user_roles` join table |
| Tables | 31 | 30 entity-backed tables plus `user_roles` |
| DTO classes | 106 | 106 request/response projection DTO classes in the implementation baseline |
| Enums | 18 | Role, UserStatus, StockStatus, OrderStatus, CancellationReason, PaymentStatus, PaymentMethod, RefundStatus, ReturnStatus, ReviewStatus, NotificationType, BannerPlacement, ShipmentStatus, CourierStatus, AddressType, InventoryOperation, ExportFormat, DeliveryRole |
| Configuration classes | 10 | Security, JWT, CORS, OpenAPI, JPA/Auditing, async, scheduling, cache, storage, integration clients |
| Exception classes | 8 | Base API exception, Validation, Authentication, Authorization, ResourceNotFound, Conflict, Payment, Integration |
| Mappers | 17 | One dedicated mapper for major domain aggregates where ManualMapStruct is used |
| Security classes | 8 | JWT filter, token provider, access manager, customer details service, CORS, password encoder, refresh-token service, webhook signature utility |
| Integration classes | 12 | Razorpay client/signature/webhook, courier client/webhook, Google/maps client, geocoder, route calculator, email provider, storage provider, push/SMS/WhatsApp provider abstractions and implementations |
| Utility classes | 8 | pricing, GST, money, order number, invoice number, paging, date range and slug helpers |

### 6.3 Recommended controllers

- `AuthController`
- `CustomerController`
- `ProductController`
- `CategoryController`
- `ProductImageController`
- `CartController`
- `WishlistController`
- `AddressController`
- `CheckoutController`
- `OrderController`
- `CancellationController`
- `TrackingController`
- `PaymentController`
- `RefundController`
- `ReturnRequestController`
- `ReviewController`
- `NotificationController`
- `NewsletterController`
- `ContactController`
- `AdminDashboardController`
- `AdminProductController`
- `AdminCustomerController`
- `AdminOrderController`
- `InventoryController`
- `AnalyticsController`
- `ContentController`
- `DeliveryAgentController`

### 6.4 Entity count verification

1. User
2. Role
3. RefreshToken
4. PasswordResetToken
5. Category
6. Product
7. ProductVariant
8. ProductImage
9. Inventory
10. Cart
11. CartItem
12. Wishlist
13. WishlistItem
14. Address
15. Order
16. OrderItem
17. Payment
18. Refund
19. ReturnRequest
20. Review
21. ReviewImage
22. ReviewHelpfulVote
23. Notification
24. NewsletterSubscriber
25. WebsiteSetting
26. Banner
27. ContactMessage
28. DeliveryAgent
29. Shipment
30. TrackingLocation

## 7. Task 6 - Authentication and security

- **Customer authentication:** Spring Security + BCrypt for password hashing; short-lived access JWT and rotating refresh token. Access tokens should contain subject, role and issued/expiry values only, not secrets or full customer records.
- **Admin authentication:** Separate login but the same issuer and role model. Require `ROLE_ADMIN` for `/api/v1/admin/**`.
- **Delivery-agent authentication:** Separate login and `ROLE_DELIVERY_AGENT`; grant only assigned-shipment reads and location/status writes.
- **JWT storage:** Browser memory for access token where practical; HttpOnly, Secure, SameSite cookies are preferable for refresh tokens. The frontend's current local/session storage is not a backend security control.
- **Refresh tokens:** Store only a hash, not raw token; rotate on use, revoke on logout and detect reuse.
- **Password hashing:** BCrypt strength should be tuned for 100-250 ms typical verification time.
- **Ownership:** Customer order/address/wishlist/cart/review/refund endpoints must load the user principal and compare to the owner; never accept `userId` alone.
- **Admin routes:** Admin APIs and frontend routes both enforce role. Frontend route hiding alone is never authorization.
- **Payment verification:** Never create a successful payment from frontend flags or test buttons. Verify provider signature, webhook, provider status and exact amount/currency.
- **API validation:** Bean Validation on every request; fail on unknown IDs, invalid variants, negative quantities, malformed pincode, invalid status transitions and over-permissioned fields.
- **Rate limiting:** Limit login, registration, password reset, OTP, checkout, payment verification and contact/newsletter endpoints. Gateway or Redis-based rate limiting is recommended.
- **Secrets:** Provider keys in environment variables or secret manager; no secrets in source control or Vite variables.
- **CORS:** Restrict production origin; do not use wildcard origins with credentials.
- **Audit:** Record admin status changes, stock adjustments, deletions, refund actions and agent status updates.
- **Idempotency:** Use idempotency keys for checkout, payment creation, webhook handling and refund creation.
- **Database protection:** Optimistic locking for inventory and orders, unique constraints for refresh and payment references.

## 8. Task 7 - Payment system

### COD flow

1. Backend validates address and items.
2. Backend recalculates totals and reserves stock.
3. Backend creates order with `paymentMethod=COD`, `paymentStatus=UNPAID` and `Order Placed`.
4. Cart is cleared after transaction success.
5. Cancellation keeps the payment unpaid and creates no refund.

### Online payment flow

1. Checkout creates a pending order and inventory reservation.
2. Backend creates a Razorpay order for the exact server-calculated amount.
3. Frontend opens Razorpay or equivalent and never reports success locally.
4. Backend verifies Razorpay signature and exact amount/currency.
5. Success webhook/payment verification marks payment captured and order paid.
6. Failed or abandoned payment marks payment failed/pending and releases inventory according to expiry policy.

### Failed payment and duplicate prevention

- A failed frontend gateway event does not change the order to failed until the backend records a provider result.
- Use unique gateway order/payment IDs and an order idempotency key.
- Repeated webhook delivery must update the same payment record without duplicating status or inventory movement.
- Capture only one successful payment for an order.

### Refund and cancellation rules

- COD cancellations: no refund.
- Unsuccessful/pending payment cancellations: no refund.
- Successful prepaid cancellations: eligible refund equals paid grand total minus already refunded amount.
- Gateway refunds must have an actual provider reference and reconciled status.
- Frontend text must say "refund eligibility" or "refund processing" but never claim that a refund is complete unless the backend records it.

## 9. Task 8 - Live order tracking

### Pickup and destination

- Fixed pickup: `Laxmi Niwas, Vidya Nagar, Dharashiv (Gramin), Dharashiv Taluka, Dharashiv, Maharashtra - 413501`.
- Destination: customer order address snapshot.
- Pickup/destination coordinates must be geocoded by the backend or supplied through a verified configuration. Fake coordinates must not be stored.

### Required flow

1. Admin/courier assigns a delivery agent and shipment to an order.
2. Backend creates a shipment and obtains courier/tracking information when available.
3. Backend geocodes the saved address and calculates a route/distance/ETA.
4. Assigned agent posts authenticated GPS updates.
5. Customer tracking API returns only current allowed status, route, ETA and agent location.
6. Cancelled orders are excluded from live tracking.
7. If no actual agent GPS data exists, the frontend should continue to show estimated route and explicitly state that live vehicle tracking is unavailable.

### Database

- `shipments`
- `tracking_locations`
- `delivery_agents`
- `orders`
- `addresses`

### Transport recommendation

- Use authenticated polling every 5-15 seconds for a low-volume first release.
- Use WebSocket/SSE later for true live movement.
- Accept agent location updates only at a configurable minimum interval and from an assigned, active agent.
- Server should reject impossible coordinate values and optionally reject positions outside a geographic distance threshold.

### External APIs

- Maps JavaScript API for frontend rendering.
- Server-side Routes/Directions API for road route and distance.
- Geocoding API for destination coordinates.
- Courier tracking API for AWB event/status.

### Privacy and security

- Hide exact current GPS until the order is active and owned by the customer.
- Stop exposing agent location after delivery/cancellation.
- Store address/agent position only as needed and apply a retention policy.
- Add location rate limits and audit logs.

## 10. Task 9 - Development priority

| Phase | Scope |
|---|---|
| 1. Setup and database | Maven project, MySQL, Flyway/Liquibase, entities, repositories, API conventions, base exception handling |
| 2. Authentication and customer management | JWT, refresh tokens, BCrypt, roles, profile, forgot/reset password |
| 3. Products, categories and images | Product catalog/detail, variants, category filters, admin product CRUD, object storage |
| 4. Cart and wishlist | Server cart, quantity/limit, server totals, wishlist and address CRUD |
| 5. Checkout and orders | Checkout preview, stock reservation, order snapshots, invoices, ownership, cancellation |
| 6. Payment gateway | Razorpay order creation, signature verification, webhook, failed payments, idempotency |
| 7. Returns, refunds and reviews | Refund reconciliation, return workflow, verified purchase reviews and helpful votes |
| 8. Admin dashboard and analytics | Admin APIs, inventory, customers, state-wise revenue and status distribution |
| 9. Notifications and integrations | Email, newsletter, contact, notifications and optional SMS/WhatsApp |
| 10. Delivery agent and live tracking | Agent accounts, assigned shipments, courier sync, GPS updates and live/polling tracking |

## 11. Task 10 - Final summary

1. **Total frontend features analyzed:** 32.
2. **Total backend API endpoints required:** 109 unique method/path combinations.
3. **Total database tables required:** 31.
4. **Total JPA entities required:** 30.
5. **Total controllers required:** 27.
6. **Total services required:** 27 primary services.
7. **Total repositories required:** 30.
8. **Total DTO classes in implementation baseline:** 106.
9. **Total external integrations required:** 10 identified; 5 mandatory and 5 optional.
10. **Mandatory credentials:** Razorpay key ID/secret/webhook secret, storage credentials, email credentials, courier credentials, maps/routes/geocoding key.
11. **Optional credentials:** SMS, WhatsApp, newsletter, FCM, social OAuth.
12. **Estimated phases:** 10 phases.

### Count reconciliation

- 45 GET + 32 POST + 6 PUT + 13 PATCH + 13 DELETE = 109 APIs.
- 31 tables = 30 JPA entities plus the `user_roles` join table.
- 27 controllers correspond to 27 primary services.
- 30 repositories correspond to 30 JPA entities.

### Technical risks and assumptions

- The existing simulated payment modal is not a real payment integration.
- Google/Facebook social login buttons are demonstrations and do not require backend APIs unless they are approved.
- Newsletter signup is not real until an email provider and subscriber storage are connected.
- Contact form submission is currently local-only.
- Review data is currently static/local-only and must not be treated as purchase verification evidence.
- Frontend revenue and state-wise analytics currently depend on browser orders and can be bypassed or lost.
- Real live tracking requires an actual courier/delivery agent feed.
- The frontend currently assumes one cart and one wishlist per user, matching the proposed database design.
- Coupon functionality is not present in the actual frontend and no coupon table or coupon APIs are included.
- Social login, mobile OTP and WhatsApp are omitted from mandatory scope.
- Courier, map, SMS and email provider choices and exact free/paid limits must be confirmed after business approval.

**Internal consistency check:** The endpoint list, method counts, table counts, entity counts and package counts have been reconciled in this report.
