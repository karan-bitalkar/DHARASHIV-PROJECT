import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { AuthProvider, useAuth } from './AuthContext';
import { CartProvider, useCart } from './CartContext';
import { OrderProvider, useOrders } from './OrderContext';
import { AdminStoreProvider, useAdminStore } from './AdminStoreContext';
import { GlobalSettingsProvider } from './GlobalSettingsContext';
import { getProductStockStatus, isProductPurchasable } from './productAvailability';
import ProtectedRoute from './ProtectedRoute';
import Navbar from './Navbar';
import Footer from './Footer';
import SideCartDrawer from './SideCartDrawer';
import WishlistDrawer from './WishlistDrawer';
import AuthModal from './AuthModal';
import InvoiceModal from './InvoiceModal';
import BottomNav from './BottomNav';
import { initialWishlistProducts } from './wishlistData';
import { allProductsData } from './OurRange';
import { getCustomerIdentity, getCustomerOrders } from './orderOwnership';
import ScrollToTop from './ScrollToTop';

const HONEY_CRUNCH_IMAGE = '/products/range2/honey.png';

// Pages
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import BenefitsPage from './pages/BenefitsPage';
import RecipesPage from './pages/RecipesPage';
import BlogPage from './pages/BlogPage';
import ContactPage from './pages/ContactPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import LoginPage from './pages/LoginPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import AccountPage from './pages/AccountPage';
const TrackingPage = React.lazy(() => import('./pages/TrackingPage'));
import AdminProtectedRoute from './AdminProtectedRoute';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function AppContent() {
  const { user, isAuthenticated, logout } = useAuth();
  const { products } = useAdminStore();
  const {
    cartItems,
    totalCartCount,
    addToCart: contextAddToCart,
    updateQuantity,
    removeItem,
    resetCart
  } = useCart();
  const { orders } = useOrders();
  const customerOrders = getCustomerOrders(orders, user);

  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isTrackingRoute = location.pathname.startsWith('/track-order/');
  const hideHeaderFooter = isAdminRoute || isTrackingRoute;
  const hideFooterOnMobile = location.pathname === '/account' || location.pathname === '/wishlist';

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login');

  // Pending user action triggered before login (ADD_TO_CART or BUY_NOW)
  const [pendingAction, setPendingAction] = useState(() => {
    try {
      const saved = sessionStorage.getItem('protinut_pending_action');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  React.useEffect(() => {
    if (pendingAction) {
      try {
        sessionStorage.setItem('protinut_pending_action', JSON.stringify(pendingAction));
      } catch (e) {
        console.error(e);
      }
    } else {
      sessionStorage.removeItem('protinut_pending_action');
    }
  }, [pendingAction]);

  // Automatically open the modal if route or query indicates auth
  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const authParam = params.get('auth');
    if (['/login', '/register', '/signup'].includes(location.pathname)) {
      setIsAuthOpen(false);
      return;
    }
    if (authParam === 'login' || location.pathname === '/login') {
      setIsAuthOpen(true);
      setAuthModalMode('login');
    } else if (authParam === 'register' || location.pathname === '/register' || location.pathname === '/signup') {
      setIsAuthOpen(true);
      setAuthModalMode('register');
    }
  }, [location.pathname, location.search]);

  // Central Logout Handler: Clears session, stays on / redirects to '/', opens Login modal immediately
  const handleLogout = () => {
      resetCart();
      setWishlistItems([]);
    logout();
    navigate('/', { replace: true });
    setAuthModalMode('login');
    setIsAuthOpen(true);
    toast.success('Logged out successfully', {
      duration: 3000,
      style: {
        background: '#15803d',
        color: '#ffffff',
        borderRadius: '12px',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '13px',
        fontWeight: 700
      }
    });
  };

  // Global Wishlist State (Starts strictly empty [] on initial login)
  const [wishlistItems, setWishlistItems] = useState(() => {
    try {
      const saved = localStorage.getItem('protinut_wishlist');
      const items = saved ? JSON.parse(saved) : [];
      return Array.isArray(items)
        ? items.map((item) => item?.id === 'honey-crunch' ? { ...item, image: HONEY_CRUNCH_IMAGE } : item)
        : items;
    } catch {
      return [];
    }
  });

  // Persist wishlist
  React.useEffect(() => {
    try {
      localStorage.setItem('protinut_wishlist', JSON.stringify(wishlistItems));
    } catch (e) {
      console.error(e);
    }
  }, [wishlistItems]);

  React.useEffect(() => {
    setWishlistItems((currentItems) => {
      let changed = false;
      const updatedItems = currentItems.map((item) => {
        const product = products.find((currentProduct) => currentProduct.id === item.id);
        if (!product) return item;

        const stockStatus = getProductStockStatus(product);
        const inStock = isProductPurchasable(product);
        if (item.stockStatus === stockStatus && item.inStock === inStock) return item;
        changed = true;
        return { ...item, stockStatus, inStock, isAvailable: inStock, isOutOfStock: !inStock };
      });
      return changed ? updatedItems : currentItems;
    });
  }, [products]);

  const queuePendingAction = (action) => {
    setPendingAction(action);
    try {
      sessionStorage.setItem('protinut_pending_action', JSON.stringify(action));
    } catch (error) {
      console.error('Unable to save the pending customer action', error);
    }
  };

  const toggleWishlistState = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.some((item) => item.id === product.id);
      if (exists) {
        toast('Removed from Wishlist', {
          icon: 'ℹ️',
          style: {
            background: '#2b1810',
            color: '#ffffff',
            borderRadius: '12px',
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px'
          }
        });
        return prev.filter((item) => item.id !== product.id);
      }
      toast.success(`❤️ Added ${product.name} to Wishlist!`, {
        style: {
          background: '#15803d',
          color: '#ffffff',
          borderRadius: '12px',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700
        }
      });
      const managedProduct = products.find((currentProduct) => currentProduct.id === product.id) || product;
      const stockStatus = getProductStockStatus(managedProduct);
      const inStock = isProductPurchasable(managedProduct);
      return [
        {
          id: product.id,
          name: product.name,
          weight: product.weight || product.selectedWeight || '550gm',
          price: product.price || product.finalPrice || 250,
          originalPrice: product.originalPrice || Math.round((product.price || 250) * 1.35),
          image: product.image || '/products/classy-crunch.png',
          rating: product.rating || 4.8,
          reviewsCount: product.reviewsCount || 280,
          tag: product.tag || 'Bestseller',
          stockStatus,
          inStock,
          isAvailable: inStock,
          isOutOfStock: !inStock
        },
        ...prev
      ];
    });
  };

  // ── Wishlist Handlers (Add / Remove toggle with Auth Check) ──
  const handleToggleWishlist = (product) => {
    if (!isAuthenticated) {
      toast.error('Please login or register to use your wishlist', {
        id: 'auth-wishlist-action-toast',
        duration: 3500,
        style: {
          background: '#2b1810',
          color: '#ffffff',
          borderRadius: '12px',
          border: '1.5px solid #ef5323',
          fontFamily: "'Montserrat', sans-serif",
          fontSize: '13px',
          fontWeight: 700
        }
      });
      queuePendingAction({ type: 'TOGGLE_WISHLIST', product });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return false;
    }

    toggleWishlistState(product);
    return true;
  };

  const handleRemoveFromWishlist = (itemId) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleClearWishlist = () => {
    setWishlistItems([]);
  };

  // ── Centralized Login Success Handler (Fulfills the action that required sign-in) ──
  const handleLoginSuccess = (loggedInUser) => {
    const currentIdentity = getCustomerIdentity(user);
    const nextIdentity = getCustomerIdentity(loggedInUser);
    if (currentIdentity && nextIdentity && currentIdentity !== nextIdentity) {
      resetCart();
      setWishlistItems([]);
    }

    setIsAuthOpen(false);
    const displayName = loggedInUser?.name || 'Customer';
    toast.success(`Welcome, ${displayName}!`, {
      duration: 2500,
      style: {
        background: '#15803d',
        color: '#ffffff',
        borderRadius: '12px',
        fontFamily: "'Montserrat', sans-serif",
        fontSize: '13px',
        fontWeight: 700
      }
    });

    if (pendingAction) {
      if (pendingAction.type === 'ADD_TO_CART') {
        const prod = pendingAction.product;
        const qty = prod.quantity || 1;
        const weight = prod.selectedWeight || '550gm';
        contextAddToCart(prod, qty, weight);
      } else if (pendingAction.type === 'BUY_NOW') {
        const prod = pendingAction.product;
        const managedProduct = products.find((product) => product.id === prod.id) || prod;
        if (!isProductPurchasable(managedProduct)) {
          toast.error(`${managedProduct.name} is currently unavailable.`);
          setPendingAction(null);
          return null;
        }
        try {
          sessionStorage.setItem('protinut_buy_now_item', JSON.stringify(prod));
        } catch (error) {
          console.error('Unable to save the pending purchase', error);
        }
        setPendingAction(null);
        navigate('/checkout', { state: { buyNowItem: prod } });
        return;
      } else if (pendingAction.type === 'TOGGLE_WISHLIST') {
        toggleWishlistState(pendingAction.product);
      }
      setPendingAction(null);
    }

    const redirect = new URLSearchParams(location.search).get('redirect');
    if (redirect?.startsWith('/') && !redirect.startsWith('//')) {
      navigate(redirect, { replace: true });
    }
    return null;
  };

  // ── 1. Add to Cart (Sign-in required) ──
  const handleAddToCart = (product) => {
    if (!isAuthenticated) {
      queuePendingAction({ type: 'ADD_TO_CART', product });
      toast('Please login or register to add items to your cart.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return false;
    }
    const qty = product.quantity || 1;
    const weight = product.selectedWeight || '550gm';
    const success = contextAddToCart(product, qty, weight);
    return success;
  };

  // ── 2. Buy Now (Sign-in required before checkout) ──
  const handleBuyNow = (product) => {
    const managedProduct = products.find((currentProduct) => currentProduct.id === product.id) || product;
    if (!isProductPurchasable(managedProduct)) {
      toast.error(`${managedProduct.name} is currently unavailable.`);
      return false;
    }

    const buyNowData = {
      id: product.id,
      name: product.name,
      selectedWeight: product.selectedWeight || '550gm',
      originalPrice: product.originalPrice || Math.round((product.finalPrice || product.price || 250) * 1.35),
      finalPrice: product.finalPrice || product.price || 250,
      quantity: product.quantity || 1,
      image: product.image
    };

    if (!isAuthenticated) {
      queuePendingAction({ type: 'BUY_NOW', product: buyNowData });
      toast('Please login or register before checkout.', { icon: '🔒' });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return false;
    }

    try {
      sessionStorage.setItem('protinut_buy_now_item', JSON.stringify(buyNowData));
    } catch (error) {
      console.error('Unable to save the purchase before checkout', error);
    }

    navigate('/checkout', {
      state: { buyNowItem: buyNowData }
    });
  };

  const handleOpenQuickView = (product) => {
    if (product?.id == null) return;
    navigate(`/product/${encodeURIComponent(product.id)}`);
  };

  return (
    <div className="app-container">
      
      {/* Toast Notification Provider (Top Right / Top Center Flipkart Style) */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={10}
        containerStyle={{
          top: 24,
          right: 24,
          zIndex: 999999
        }}
        toastOptions={{
          duration: 2500,
          style: {
            fontFamily: "'Montserrat', sans-serif",
            fontSize: '13px',
            fontWeight: 700,
            padding: '12px 18px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.18), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
          },
          success: {
            duration: 2500,
            style: {
              background: '#16a34a',
              color: '#ffffff'
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#16a34a'
            }
          },
          error: {
            duration: 2500,
            style: {
              background: '#dc2626',
              color: '#ffffff'
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: '#dc2626'
            }
          }
        }}
      />

      {/* Navigation Bar — hidden on full-page auth and admin routes */}
      {!hideHeaderFooter && (
        <Navbar
          cartCount={totalCartCount}
          wishlistCount={wishlistItems.length}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenWishlist={() => setIsWishlistOpen(true)}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthOpen(true);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Page Routes */}
      <main className="main-content-flow pb-20 md:pb-0">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={
              <HomePage
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onQuickView={handleOpenQuickView}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/reviews" element={<AboutPage />} />
          <Route
            path="/products"
            element={
              <ProductsPage
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onQuickView={handleOpenQuickView}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route
            path="/products/:id"
            element={
              <ProductDetailPage
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProductDetailPage
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
          <Route path="/benefits" element={<BenefitsPage />} />
          <Route path="/recipes" element={<RecipesPage />} />
          <Route path="/blog" element={<BlogPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/login"
            element={
              <LoginPage
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />
          <Route
            path="/register"
            element={
              <LoginPage
                initialMode="register"
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />
          <Route
            path="/signup"
            element={
              <LoginPage
                initialMode="register"
                onLoginSuccess={handleLoginSuccess}
              />
            }
          />

          {/* ── Strict Protected Routes (Requires Login) ── */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/wishlist"
            element={
              <ProtectedRoute>
                <WishlistPage
                  wishlistItems={wishlistItems}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  onQuickView={handleOpenQuickView}
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <CheckoutPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/order-success"
            element={
              <ProtectedRoute>
                <OrderSuccessPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/orders/:orderId"
            element={
              <ProtectedRoute>
                <OrderDetailPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/track-order/:orderId"
            element={
              <React.Suspense
                fallback={(
                  <div
                    role="status"
                    aria-live="polite"
                    style={{
                      minHeight: '100dvh',
                      display: 'grid',
                      placeItems: 'center',
                      background: '#F8F3E8',
                      color: '#3E2723',
                      fontWeight: 700
                    }}
                  >
                    Loading order tracking...
                  </div>
                )}
              >
                <ProtectedRoute>
                  <TrackingPage />
                </ProtectedRoute>
              </React.Suspense>
            }
          />

          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <AccountPage
                  wishlistCount={wishlistItems.length}
                  onClearWishlist={handleClearWishlist}
                  onLogout={handleLogout}
                  onOpenCart={() => setIsCartOpen(true)}
                />
              </ProtectedRoute>
            }
          />

          {/* ── Direct Tax Invoice Route ── */}
          <Route
            path="/invoice"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-[#faf5ee]">
                  {customerOrders.length > 0 ? (
                    <InvoiceModal
                      isOpen={true}
                      onClose={() => navigate('/orders')}
                      order={customerOrders[0]}
                    />
                  ) : (
                    <div className="max-w-md mx-auto pt-24 text-center p-6">
                      <span className="text-4xl block mb-3">🧾</span>
                      <h3 className="font-bold text-gray-900 text-lg mb-2">No Active Order Found</h3>
                      <p className="text-gray-500 text-sm mb-5">
                        Invoices are dynamically generated when you place an order. Please place an order first!
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="bg-[#F58220] hover:bg-[#e06d0e] text-white font-bold text-sm px-6 py-2.5 rounded-lg shadow transition"
                      >
                        Browse Products
                      </button>
                    </div>
                  )}
                </div>
              </ProtectedRoute>
            }
          />

          {/* ── Strict Admin Panel Routes (Spring Boot & JWT Ready) ── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />

          {/* Fallback to Home */}
          <Route
            path="*"
            element={
              <HomePage
                onAddToCart={handleAddToCart}
                onBuyNow={handleBuyNow}
                onQuickView={handleOpenQuickView}
                wishlistItems={wishlistItems}
                onToggleWishlist={handleToggleWishlist}
              />
            }
          />
        </Routes>
      </main>

      {/* Brand Footer — hidden on full-page auth & admin routes */}
      {!hideHeaderFooter && <Footer hideOnMobile={hideFooterOnMobile} />}

      {/* Slide-Over Right Side Cart Drawer */}
      {!hideHeaderFooter && (
        <SideCartDrawer
          isOpen={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          cartItems={cartItems}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
        />
      )}

      {/* Slide-Over Right Side Wishlist Drawer */}
      {!hideHeaderFooter && (
        <WishlistDrawer
          isOpen={isWishlistOpen}
          onClose={() => setIsWishlistOpen(false)}
          wishlistItems={wishlistItems}
          onRemoveFromWishlist={handleRemoveFromWishlist}
          onClearWishlist={handleClearWishlist}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Auth / Login Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        defaultMode={authModalMode}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Fixed Native Mobile Bottom Navigation Bar (< 768px) */}
      {!hideHeaderFooter && (
        <BottomNav
          cartCount={totalCartCount}
          wishlistCount={wishlistItems.length}
          isAuthenticated={isAuthenticated}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenLogin={() => {
            setAuthModalMode('login');
            setIsAuthOpen(true);
          }}
          isCartOpen={isCartOpen}
        />
      )}

    </div>
  );
}

function App() {
  return (
    <GlobalSettingsProvider>
      <AuthProvider>
        <OrderProvider>
          <AdminStoreProvider initialProducts={allProductsData}>
            <CartProvider>
              <Router>
                <ScrollToTop />
                <AppContent />
              </Router>
            </CartProvider>
          </AdminStoreProvider>
        </OrderProvider>
      </AuthProvider>
    </GlobalSettingsProvider>
  );
}

export default App;
