import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminLayout from './AdminLayout';
import { useAdminStore } from '../../AdminStoreContext';
import { useGlobalSettings } from '../../GlobalSettingsContext';
import { getDiscountPercent } from '../../productPricing';
import { getProductStockStatus, isProductPurchasable, STOCK_STATUSES } from '../../productAvailability';
import { initialReviewsByProduct } from '../../reviewsData';
import StateWiseSalesAnalytics from './StateWiseSalesAnalytics';
import './AdminPanel.css';

const currency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN')}`;
const PAGE_SIZE = 10;
const stockFor = (product) => Number(product.stock ?? (product.inStock ? 15 : 0));
const orderAmount = (order) => Number(
  order.pricing?.grandTotal
  ?? order.total
  ?? order.items?.reduce((sum, item) => sum + Number(item.finalPrice || item.price || 0) * Number(item.quantity || 1), 0)
  ?? 0
);
const orderCustomer = (order) => order.address?.name || order.customerName || 'Customer';
const orderMatchesCustomer = (order, customer) => {
  if (!customer) return false;
  const customerEmail = String(customer.email || '').trim().toLowerCase();
  const orderEmail = String(order.userEmail || order.address?.email || '').trim().toLowerCase();
  const customerPhone = String(customer.phone || '').replace(/\D/g, '');
  const orderPhone = String(order.address?.mobile || '').replace(/\D/g, '');
  return Boolean(
    (customerEmail && orderEmail && customerEmail === orderEmail)
    || (customerPhone && orderPhone && customerPhone === orderPhone)
  );
};
const statusClass = (status) => `admin-status-pill${status === 'Delivered' ? ' is-delivered' : status === 'Cancelled' ? ' is-cancelled' : ''}`;
const handleRequiredFieldError = (event) => {
  event.preventDefault();
  toast.error('Please complete all required fields.', { id: 'admin-required-fields-error' });
};

const dashboardSummaryIconPaths = {
  revenue: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v12c0 1.66 3.13 3 7 3s7-1.34 7-3V6" />
      <path d="M5 12c0 1.66 3.13 3 7 3s7-1.34 7-3" />
    </>
  ),
  orders: (
    <>
      <path d="M5 8h14l1 12H4L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  customers: (
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="10" cy="7" r="4" />
      <path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  products: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </>
  ),
  pendingOrders: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4.5V3h6v1.5M9 10h6M9 14h6M9 18h4" />
    </>
  ),
  lowStock: (
    <>
      <path d="m10.3 3.9-8 14a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  returns: (
    <>
      <path d="M3 10h9a6 6 0 1 1-6 6" />
      <path d="m7 6-4 4 4 4" />
    </>
  ),
  refunds: (
    <>
      <rect x="5" y="7" width="17" height="12" rx="2" />
      <path d="M9 7v2m9-2v2m-9 10v-2m9 2v-2" />
      <circle cx="15" cy="13" r="2" />
      <path d="M8 4H3m0 0 3-3M3 4l3 3" />
    </>
  )
};

const DashboardSummaryIcon = ({ name }) => {
  const paths = dashboardSummaryIconPaths[name];
  if (!paths) throw new Error(`Unknown dashboard summary icon: ${name}`);

  return (
    <svg
      aria-hidden="true"
      width="19"
      height="19"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
};

const pageMeta = {
  dashboard: ['Welcome to Protinut', "Here's what's happening with your store today."],
  'website-content': ['Edit Website Content', 'Update website copy and invoice details in one place.'],
  analytics: ['Analytics', 'Track sales and order performance across your store.'],
  products: ['Products', 'Manage your catalog, pricing, and inventory.'],
  categories: ['Categories', 'Explore products grouped by category.'],
  inventory: ['Inventory', 'Monitor stock levels across your catalog.'],
  orders: ['Orders', 'Review customer orders and keep fulfillment up to date.'],
  customers: ['Customers', 'Registered customers and buyers from your orders.'],
  payments: ['Payments', 'Payment methods and collected order totals.'],
  returns: ['Returns', 'Review orders that need a return or follow-up.'],
  refunds: ['Refunds', 'Review refund requests and completed refunds.'],
  reviews: ['Reviews', 'Recent feedback from PROTINUT customers.'],
  banners: ['Banners', 'Manage promotional content shown in the store.'],
  notifications: ['Notifications', 'Manage store activity notifications.'],
  settings: ['Settings', 'Manage your admin workspace preferences.']
};

const AdminDashboardPage = () => {
  const { products, orders, customers, addProduct, addCustomer, deleteCustomer, updateProduct, deleteProduct, updateOrderStatus } = useAdminStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingProduct, setEditingProduct] = useState(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => localStorage.getItem('protinut_admin_notifications') !== 'false');
  const activeTab = location.pathname.split('/')[2] || 'dashboard';
  const page = pageMeta[activeTab] ? activeTab : 'dashboard';
  const [title, subtitle] = pageMeta[page];
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredProducts = useMemo(() => products.filter((product) => (
    `${product.name} ${product.id} ${product.sku || ''}`.toLowerCase().includes(normalizedSearch)
  )), [products, normalizedSearch]);
  const filteredOrders = useMemo(() => orders.filter((order) => (
    `${order.id} ${orderCustomer(order)} ${order.userEmail || ''} ${order.status || ''}`.toLowerCase().includes(normalizedSearch)
  )), [orders, normalizedSearch]);
  const filteredCustomers = useMemo(() => customers.filter((customer) => (
    `${customer.name || ''} ${customer.email || ''} ${customer.phone || ''}`.toLowerCase().includes(normalizedSearch)
  )), [customers, normalizedSearch]);

  const totalRevenue = orders.reduce((sum, order) => sum + orderAmount(order), 0);
  const pendingOrders = orders.filter((order) => (
    ['Order Placed', 'Pending', 'Processing', 'Shipped', 'Out for Delivery'].includes(order.status)
  )).length;
  const lowStockProducts = products.filter((product) => stockFor(product) <= 5);
  const pendingReturns = orders.filter((order) => order.status === 'Return Requested').length;
  const pendingRefunds = orders.filter((order) => order.status === 'Refund Requested').length;
  const stats = [
    { label: 'Total Revenue', value: currency(totalRevenue), icon: 'revenue', className: 'revenue' },
    { label: 'Total Orders', value: orders.length.toLocaleString('en-IN'), icon: 'orders', className: 'orders' },
    { label: 'Total Customers', value: customers.length.toLocaleString('en-IN'), icon: 'customers', className: 'customers' },
    { label: 'Total Products', value: products.length.toLocaleString('en-IN'), icon: 'products', className: 'products' }
  ];

  const handleSaveProduct = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const has550gmPrice = !editingProduct || editingProduct.price550 != null;
    const mrp550 = has550gmPrice ? Number(formData.get('mrp550')) : null;
    const discountPercent550 = has550gmPrice ? Number(formData.get('discount550')) : null;
    const mrp1kg = Number(formData.get('mrp1kg'));
    const discountPercent1kg = Number(formData.get('discount1kg'));
    const stockStatus = String(formData.get('stockStatus') || 'Out of Stock');
    const price550 = has550gmPrice ? Math.round(mrp550 * (1 - discountPercent550 / 100)) : null;
    const price1kg = Math.round(mrp1kg * (1 - discountPercent1kg / 100));
    const stock = Number(formData.get('stock'));
    const image = String(formData.get('image') || '').trim() || '/products/dark-chocolate-crunch-front.png';

    if (
      !name
      || (has550gmPrice && !Number.isFinite(mrp550))
      || !Number.isFinite(mrp1kg)
      || (has550gmPrice && !Number.isFinite(discountPercent550))
      || !Number.isFinite(discountPercent1kg)
      || (has550gmPrice && mrp550 <= 0)
      || mrp1kg <= 0
      || (has550gmPrice && (discountPercent550 < 0 || discountPercent550 > 100))
      || discountPercent1kg < 0
      || discountPercent1kg > 100
      || !Number.isInteger(stock)
      || stock < 0
      || !STOCK_STATUSES.includes(stockStatus)
      || (isProductPurchasable({ stockStatus }) && stock === 0)
    ) {
      toast.error('Enter valid prices, discounts, stock quantity, and keep purchasable products above zero stock.');
      return;
    }

    const isPurchasable = isProductPurchasable({ stockStatus });
    if (editingProduct) {
      updateProduct(editingProduct.id, {
        name,
        price550,
        price1kg,
        originalPrice550: mrp550,
        originalPrice1kg: mrp1kg,
        ...(has550gmPrice ? { discountPercent550 } : {}),
        discountPercent1kg,
        stock,
        stockStatus,
        inStock: isPurchasable,
        isAvailable: isPurchasable,
        image,
        sku: String(formData.get('sku') || editingProduct.sku || '').trim()
      });
      toast.success('✅ Changes Saved Successfully');
    } else {
      const id = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'product'}-${Date.now()}`;
      const category = String(formData.get('category') || 'other');
      const sku = String(formData.get('sku') || '').trim() || `PRO-${Date.now().toString().slice(-6)}`;
      addProduct({
        id,
        name,
        sku,
        category,
        isCombo: false,
        inStock: isPurchasable,
        isAvailable: isPurchasable,
        stockStatus,
        tag: 'Newly Added',
        stock,
        price550,
        price1kg,
        originalPrice550: mrp550,
        originalPrice1kg: mrp1kg,
        discountPercent550,
        discountPercent1kg,
        defaultWeight: '550gm',
        weightOptions: [
          { id: '550gm', label: '550gm', price: price550, original: mrp550 },
          { id: '1kg', label: '1kg', price: price1kg, original: mrp1kg }
        ],
        image,
        studioImage: image,
        rating: 0,
        reviewsCount: 0,
        description: '',
        tagline: 'Freshly added to the PROTINUT range',
        themeColor: '#ef5323',
        protein: 'Plant Protein',
        highlightBadge: 'Fresh Batch',
        nutrients: [
          { label: 'Plant Protein', val: '—', desc: 'Per 100g' },
          { label: 'Palm Oil', val: '0%', desc: 'Pure Peanut Oil' }
        ],
        features: ['Made with carefully selected ingredients.', 'Freshly prepared in small batches.']
      });
      toast.success('✅ Product added successfully.');
    }

    setEditingProduct(null);
    setShowProductForm(false);
  };

  const openNewProductForm = () => {
    setEditingProduct(null);
    setShowProductForm(true);
  };

  const removeProduct = () => {
    if (!productToDelete) return;
    deleteProduct(productToDelete.id);
    toast.success('Product deleted successfully.');
    setProductToDelete(null);
  };

  const removeCustomer = () => {
    if (!customerToDelete) return;
    if (!deleteCustomer(customerToDelete)) {
      toast.error('Unable to delete customer. Check browser storage and try again.');
      return;
    }
    toast.success('Customer deleted successfully.');
    setCustomerToDelete(null);
  };

  const confirmProductDelete = (product) => {
    setProductToDelete(product);
  };

  const setStatus = (orderId, status, trackingId) => {
    const saved = updateOrderStatus(orderId, status, trackingId);
    if (saved) {
      toast.success(`✅ Order ${orderId} updated to ${status}.`);
    } else {
      toast.error(`Could not save the status update for order ${orderId}.`);
    }
  };

  const handleAddCustomer = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phone = String(formData.get('phone') || '').replace(/\D/g, '');
    const password = String(formData.get('password') || '');
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[6-9]\d{9}$/.test(phone) || password.length < 6) {
      toast.error('Enter a name, valid email, 10-digit mobile, and password with at least 6 characters.');
      return;
    }
    const result = addCustomer({ name, email, phone });
    if (result === 'duplicate') {
      toast.error('A customer with this email or mobile already exists.');
      return;
    }
    if (result !== 'success') {
      toast.error('Unable to save customer. Check browser storage and try again.');
      return;
    }
    toast.success('✅ Customer added successfully.');
    setShowCustomerForm(false);
  };

  const dashboard = (
    <>
      <div className="admin-page-heading">
        <div><h1>{title}</h1><p>{subtitle}</p></div>
        <div className="admin-heading-actions">
          <button type="button" className="admin-button" onClick={openNewProductForm}>＋ Add Product</button>
          <button type="button" className="admin-button secondary" onClick={() => navigate('/admin/orders')}>Manage Orders</button>
          <span className="admin-date-chip">▣ &nbsp; Today &nbsp; {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
        </div>
      </div>
      <section className="admin-stat-grid" aria-label="Store totals">
        {stats.map((stat) => (
          <article className="admin-stat-card" key={stat.label}>
            <span className={`admin-stat-icon ${stat.className}`} aria-hidden="true">
              <DashboardSummaryIcon name={stat.icon} />
            </span>
            <div><small>{stat.label}</small><strong>{stat.value}</strong><span>Live store data</span></div>
          </article>
        ))}
      </section>
      <section className="admin-stat-grid admin-stat-grid-secondary" aria-label="Pending store activity">
        <SummaryLink icon={<DashboardSummaryIcon name="pendingOrders" />} label="Pending Orders" value={pendingOrders} onClick={() => navigate('/admin/orders')} />
        <SummaryLink icon={<DashboardSummaryIcon name="lowStock" />} label="Low Stock" value={lowStockProducts.length} onClick={() => navigate('/admin/inventory')} />
        <SummaryLink icon={<DashboardSummaryIcon name="returns" />} label="Pending Returns" value={pendingReturns} onClick={() => navigate('/admin/returns')} />
        <SummaryLink icon={<DashboardSummaryIcon name="refunds" />} label="Pending Refunds" value={pendingRefunds} onClick={() => navigate('/admin/refunds')} />
      </section>

      <div className="admin-dashboard-grid">
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>Sales Overview</h2><span className="admin-period-chip">Recent orders</span></div>
          <SalesChart orders={orders} />
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>Order Status</h2></div>
          <OrderStatusChart orders={orders} />
        </section>
        <section className="admin-panel">
          <div className="admin-panel-heading"><h2>Top Selling Products</h2><button type="button" onClick={() => navigate('/admin/products')}>View all</button></div>
          <TopProducts orders={orders} products={products} />
        </section>
      </div>

      <div className="admin-bottom-grid">
        <section className="admin-table-panel">
          <div className="admin-panel-heading"><h2>Recent Orders</h2><button type="button" onClick={() => navigate('/admin/orders')}>View all</button></div>
          <OrdersTable orders={filteredOrders.slice(0, 5)} onStatusChange={setStatus} onViewDetails={setSelectedOrder} compact />
        </section>
        <section className="admin-table-panel">
          <div className="admin-panel-heading"><h2>Low Stock Products</h2><button type="button" onClick={() => navigate('/admin/products')}>View all</button></div>
          <LowStockTable products={products.filter((product) => stockFor(product) <= 5).slice(0, 5)} />
        </section>
      </div>

      <section className="admin-table-panel admin-reviews-panel">
        <div className="admin-panel-heading"><h2>Recent Reviews</h2><button type="button" onClick={() => navigate('/admin/reviews')}>View all</button></div>
        <RecentReviews products={products} />
      </section>
    </>
  );

  const productsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<button className="admin-button" type="button" onClick={openNewProductForm}>＋ Add Product</button>} />
      <section className="admin-table-panel">
        <ProductsTable
          products={filteredProducts}
          onEdit={(product) => { setEditingProduct(product); setShowProductForm(true); }}
          onDelete={confirmProductDelete}
        />
      </section>
    </>
  );

  const ordersPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<button className="admin-button secondary" type="button" onClick={() => navigate('/admin/dashboard')}>↗ Dashboard</button>} />
      <OrderAnalytics orders={orders} />
      <section className="admin-table-panel"><OrdersTable orders={filteredOrders} onStatusChange={setStatus} onViewDetails={setSelectedOrder} /></section>
    </>
  );

  const customersPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<div className="admin-heading-actions"><span className="admin-count-chip">{filteredCustomers.length} customers</span><button className="admin-button" type="button" onClick={() => setShowCustomerForm(true)}>＋ Add Customer</button></div>} />
      <section className="admin-table-panel">
        <CustomersTable
          customers={filteredCustomers}
          onView={setSelectedCustomer}
          onDelete={setCustomerToDelete}
        />
      </section>
    </>
  );

  const returnsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<span className="admin-count-chip">{pendingReturns} open</span>} />
      <section className="admin-table-panel">
        <div className="admin-panel-heading"><h2>Return requests</h2><span className="admin-status-pill">{orders.filter((order) => order.status === 'Return Requested').length} open</span></div>
        <OrdersTable orders={filteredOrders.filter((order) => order.status === 'Return Requested' || order.status === 'Returned')} onStatusChange={setStatus} onViewDetails={setSelectedOrder} />
        {!orders.some((order) => order.status === 'Return Requested' || order.status === 'Returned') && <div className="admin-empty-state">No return requests have been recorded.</div>}
      </section>
    </>
  );

  const analyticsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      <section className="admin-stat-grid" aria-label="Analytics summary">
        <SummaryLink icon="₹" label="Total Revenue" value={currency(totalRevenue)} />
        <SummaryLink icon="▣" label="Total Orders" value={orders.length} />
        <SummaryLink icon="♙" label="Customers" value={customers.length} />
        <SummaryLink icon="◇" label="Products" value={products.length} />
      </section>
      <div className="admin-dashboard-grid admin-analytics-grid">
        <section className="admin-panel"><div className="admin-panel-heading"><h2>Sales Overview</h2><span className="admin-period-chip">Recent orders</span></div><SalesChart orders={orders} /></section>
        <section className="admin-panel"><div className="admin-panel-heading"><h2>Order Status</h2></div><OrderStatusChart orders={orders} /></section>
      </div>
      <StateWiseSalesAnalytics orders={orders} getOrderAmount={orderAmount} />
    </>
  );

  const categoriesPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<span className="admin-count-chip">{products.length} products</span>} />
      <section className="admin-table-panel"><CategoriesTable products={products} onViewProducts={() => navigate('/admin/products')} /></section>
    </>
  );

  const inventoryPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<button className="admin-button secondary" type="button" onClick={() => navigate('/admin/products')}>Manage Products</button>} />
      <section className="admin-table-panel"><InventoryTable products={filteredProducts} onEdit={(product) => { setEditingProduct(product); setShowProductForm(true); }} /></section>
    </>
  );

  const paymentsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<span className="admin-count-chip">{currency(totalRevenue)} collected</span>} />
      <section className="admin-table-panel"><PaymentsTable orders={filteredOrders} onViewDetails={setSelectedOrder} /></section>
    </>
  );

  const refundsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<span className="admin-count-chip">{pendingRefunds} pending</span>} />
      <section className="admin-table-panel"><RefundsTable orders={filteredOrders.filter((order) => order.status === 'Refund Requested' || order.status === 'Refunded')} onStatusChange={setStatus} onViewDetails={setSelectedOrder} /></section>
    </>
  );

  const reviewsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} action={<span className="admin-count-chip">{Object.values(initialReviewsByProduct).reduce((sum, item) => sum + item.totalReviews, 0)} reviews</span>} />
      <section className="admin-table-panel"><ReviewsTable products={products} /></section>
    </>
  );

  const bannersPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      <BannerSettings />
    </>
  );

  const notificationsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      <NotificationSettings enabled={notificationsEnabled} onToggle={(enabled) => {
        setNotificationsEnabled(enabled);
        localStorage.setItem('protinut_admin_notifications', String(enabled));
        toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}.`);
      }} />
    </>
  );

  const settingsPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      <section className="admin-table-panel admin-settings-panel">
        <h2>Workspace preferences</h2>
        <div className="admin-setting-row">
          <span><strong>Admin account</strong><small>protinut@gmail.com</small></span>
          <span className="admin-status-pill is-delivered">Active</span>
        </div>
        <label className="admin-setting-row">
          <span><strong>Admin notifications</strong><small>Show alerts for new store activity.</small></span>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(event) => {
              const enabled = event.target.checked;
              setNotificationsEnabled(enabled);
              localStorage.setItem('protinut_admin_notifications', String(enabled));
              toast.success(`Notifications ${enabled ? 'enabled' : 'disabled'}.`);
            }}
          />
        </label>
        <div className="admin-setting-row"><span><strong>Store data</strong><small>Products, orders, and customers are shared with the storefront.</small></span></div>
      </section>
    </>
  );

  const websiteContentPage = (
    <>
      <PageHeading title={title} subtitle={subtitle} />
      <WebsiteContentEditor />
    </>
  );

  return (
    <AdminLayout activeTab={page} searchQuery={searchQuery} onSearchChange={setSearchQuery}>
      {page === 'dashboard' && dashboard}
      {page === 'analytics' && analyticsPage}
      {page === 'products' && productsPage}
      {page === 'categories' && categoriesPage}
      {page === 'inventory' && inventoryPage}
      {page === 'orders' && ordersPage}
      {page === 'customers' && customersPage}
      {page === 'payments' && paymentsPage}
      {page === 'returns' && returnsPage}
      {page === 'refunds' && refundsPage}
      {page === 'reviews' && reviewsPage}
      {page === 'banners' && bannersPage}
      {page === 'notifications' && notificationsPage}
      {page === 'settings' && settingsPage}
      {page === 'website-content' && websiteContentPage}
      {showProductForm && (
        <ProductForm
          product={editingProduct}
          onClose={() => { setShowProductForm(false); setEditingProduct(null); }}
          onSubmit={handleSaveProduct}
        />
      )}
      {showCustomerForm && (
        <CustomerForm
          onClose={() => setShowCustomerForm(false)}
          onSubmit={handleAddCustomer}
        />
      )}
      <AdminConfirmationModal
        isOpen={Boolean(productToDelete)}
        message={productToDelete ? `Are you sure you want to delete "${productToDelete.name}"?` : 'Are you sure you want to delete this?'}
        onCancel={() => setProductToDelete(null)}
        onConfirm={removeProduct}
      />
      <AdminConfirmationModal
        isOpen={Boolean(customerToDelete)}
        message={customerToDelete ? `Are you sure you want to delete "${customerToDelete.name || 'this customer'}"? This removes their profile from the admin customer list.` : 'Are you sure you want to delete this customer?'}
        onCancel={() => setCustomerToDelete(null)}
        onConfirm={removeCustomer}
      />
      <CustomerDetailsModal
        customer={selectedCustomer}
        orders={orders.filter((order) => orderMatchesCustomer(order, selectedCustomer))}
        onClose={() => setSelectedCustomer(null)}
        onDelete={(customer) => {
          setSelectedCustomer(null);
          setCustomerToDelete(customer);
        }}
      />
      <OrderDetailsModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </AdminLayout>
  );
};

const websiteContentGroups = [
  {
    title: 'Home Page',
    description: 'Control the editable copy shown on the homepage carousel and offer strip.',
    fields: [
      { key: 'homeHeroHeading', label: 'Hero heading', multiline: false },
      { key: 'homeHeroSubtitle', label: 'Hero subtitle', multiline: true },
      { key: 'offerBannerText', label: 'Offer banner text', multiline: false, optional: true }
    ]
  },
  {
    title: 'About Us Page',
    description: 'Update the About page headings and founder story. Separate story paragraphs with a blank line.',
    fields: [
      { key: 'aboutHeroHeading', label: 'About page heading', multiline: false },
      { key: 'aboutHeroSubtitle', label: 'About page introduction', multiline: true },
      { key: 'aboutFounderHeading', label: 'Founder section heading', multiline: false },
      { key: 'aboutFounderSubtitle', label: 'Founder section subtitle', multiline: true },
      { key: 'founderStory', label: 'Founder story', multiline: true, rows: 8 }
    ]
  },
  {
    title: 'Contact & Footer',
    description: 'These details appear on the Contact page and website footer.',
    fields: [
      { key: 'contactHeading', label: 'Contact page heading', multiline: false },
      { key: 'contactSubtitle', label: 'Contact page introduction', multiline: true },
      { key: 'supportEmail', label: 'Support email', type: 'email', multiline: false },
      { key: 'supportPhone', label: 'Support phone', multiline: false },
      { key: 'companyAddress', label: 'Physical address', multiline: true }
    ]
  },
  {
    title: 'Company Details for Invoices',
    description: 'Values are read directly by the invoice preview, print view, and downloaded PDF.',
    fields: [
      { key: 'companyName', label: 'Company name', multiline: false },
      { key: 'websiteUrl', label: 'Website URL', multiline: false },
      { key: 'gstin', label: 'GSTIN number', multiline: false },
      { key: 'fssai', label: 'FSSAI number', multiline: false }
    ]
  },
  {
    title: 'Product Page Policies & Instructions',
    description: 'These texts are shared across all product detail pages and invoice terms where applicable.',
    fields: [
      { key: 'storageInstructions', label: 'Storage instructions', multiline: true },
      { key: 'shippingPolicy', label: 'Shipping policy', multiline: true },
      { key: 'returnPolicy', label: 'Return policy', multiline: true }
    ]
  }
];

const WebsiteContentEditor = () => {
  const { settings, updateSettings } = useGlobalSettings();
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    setDraft(settings);
  }, [settings]);

  const handleSubmit = (event) => {
    event.preventDefault();
    try {
      updateSettings(draft);
      toast.success('✅ Changes Saved Successfully');
    } catch (error) {
      toast.error('Unable to save website content. Please try again.');
    }
  };

  return (
    <form className="admin-cms-form" onSubmit={handleSubmit} onInvalid={handleRequiredFieldError}>
      <div className="admin-cms-live-note"><span>●</span> Changes publish immediately to the website and new invoice/PDF previews.</div>
      {websiteContentGroups.map((group) => (
        <section className="admin-table-panel admin-cms-group" key={group.title}>
          <div className="admin-cms-group-heading"><h2>{group.title}</h2><p>{group.description}</p></div>
          <div className="admin-cms-fields">
            {group.fields.map((field) => (
              <label className="admin-cms-field" key={field.key}>
                <span>{field.label}</span>
                {field.multiline ? (
                  <textarea
                    name={field.key}
                    rows={field.rows || 3}
                    value={draft[field.key] || ''}
                    required={!field.optional}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                ) : (
                  <input
                    type={field.type || 'text'}
                    name={field.key}
                    value={draft[field.key] || ''}
                    required={!field.optional}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  />
                )}
              </label>
            ))}
          </div>
        </section>
      ))}
      <div className="admin-cms-submit-row">
        <button type="submit" className="admin-button">Save &amp; Publish Changes</button>
      </div>
    </form>
  );
};

const PageHeading = ({ title, subtitle, action }) => (
  <div className="admin-page-heading">
    <div><h1>{title}</h1><p>{subtitle}</p></div>
    {action}
  </div>
);

const AdminConfirmationModal = ({ isOpen, message, onCancel, onConfirm }) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section className="admin-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-delete-confirmation-title">
        <div className="admin-confirm-icon" aria-hidden="true">!</div>
        <h2 id="admin-delete-confirmation-title">Are you sure you want to delete this?</h2>
        <p>{message}</p>
        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={onCancel}>Cancel</button>
          <button type="button" className="admin-button danger" onClick={onConfirm}>Yes</button>
        </div>
      </section>
    </div>
  );
};

const SummaryLink = ({ icon, label, value, onClick }) => (
  <button type="button" className={`admin-stat-card admin-summary-link${onClick ? '' : ' is-static'}`} onClick={onClick} disabled={!onClick}>
    <span className="admin-stat-icon">{icon}</span>
    <span className="admin-summary-copy"><small>{label}</small><strong>{value}</strong></span>
    {onClick && <span className="admin-summary-arrow" aria-hidden="true">›</span>}
  </button>
);

const OrderAnalytics = ({ orders }) => {
  const completed = orders.filter((order) => order.status === 'Delivered').length;
  const cancelled = orders.filter((order) => order.status === 'Cancelled').length;
  const pending = orders.filter((order) => ['Order Placed', 'Pending', 'Processing', 'Shipped', 'Out for Delivery'].includes(order.status)).length;
  return (
    <section className="admin-stat-grid admin-order-analytics" aria-label="Order analytics">
      <SummaryLink icon="✓" label="Completed Orders" value={completed} />
      <SummaryLink icon="◷" label="Pending / In Transit" value={pending} />
      <SummaryLink icon="×" label="Cancelled Orders" value={cancelled} />
    </section>
  );
};

const usePagination = (items, { resetOnItemsChange = true } = {}) => {
  const [page, setPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  useEffect(() => {
    if (resetOnItemsChange) setPage(1);
  }, [items, resetOnItemsChange]);
  const currentPage = Math.min(page, pageCount);
  const visibleItems = items.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  return { page: currentPage, pageCount, setPage, visibleItems, total: items.length };
};

const PaginationControls = ({ pagination }) => {
  if (pagination.pageCount <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="Table pagination">
      <span>Showing {(pagination.page - 1) * PAGE_SIZE + 1}–{Math.min(pagination.page * PAGE_SIZE, pagination.total)} of {pagination.total}</span>
      <div>
        <button type="button" className="admin-button secondary" onClick={() => pagination.setPage((page) => Math.max(1, page - 1))} disabled={pagination.page === 1}>Previous</button>
        <div className="admin-pagination-pages" aria-label="Choose page">
          {Array.from({ length: pagination.pageCount }, (_, index) => index + 1).map((page) => (
            <button
              type="button"
              key={page}
              className={`admin-button secondary${page === pagination.page ? ' is-current' : ''}`}
              aria-current={page === pagination.page ? 'page' : undefined}
              aria-label={`Page ${page}`}
              onClick={() => pagination.setPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
        <button type="button" className="admin-button secondary" onClick={() => pagination.setPage((page) => Math.min(pagination.pageCount, page + 1))} disabled={pagination.page === pagination.pageCount}>Next</button>
      </div>
    </nav>
  );
};

const SalesChart = ({ orders }) => {
  const recentOrders = orders.slice(0, 7).reverse();
  const maxAmount = Math.max(1, ...recentOrders.map(orderAmount));
  const points = recentOrders.map((order, index) => ({
    x: recentOrders.length > 1 ? 36 + (index * 310) / (recentOrders.length - 1) : 191,
    y: 145 - (orderAmount(order) / maxAmount) * 112,
    label: order.date || order.id
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(' ');
  const area = points.length ? `36,150 ${line} 346,150` : '';
  return (
    <div className="admin-sales-chart-wrap">
      {orders.length ? (
        <svg className="admin-sales-chart" viewBox="0 0 370 184" role="img" aria-label="Revenue per recent order">
          {[30, 70, 110, 150].map((y) => <line key={y} x1="36" x2="350" y1={y} y2={y} className="admin-chart-gridline" />)}
          {[0, 1, 2, 3].map((index) => <text key={index} x="2" y={153 - (index * 40)} className="admin-chart-label">{currency((maxAmount / 3) * index)}</text>)}
          <polygon points={area} className="admin-chart-area" />
          <polyline points={line} className="admin-chart-line" />
          {points.map((point, index) => <circle key={`${point.x}-${index}`} cx={point.x} cy={point.y} r="3" className="admin-chart-point"><title>{point.label}: {currency(orderAmount(recentOrders[index]))}</title></circle>)}
          {points.map((point, index) => <text key={`label-${index}`} x={point.x} y="172" textAnchor="middle" className="admin-chart-label">{String(point.label).slice(0, 6)}</text>)}
        </svg>
      ) : <div className="admin-chart-empty">Sales activity will appear here after the first order.</div>}
    </div>
  );
};

const OrderStatusChart = ({ orders }) => {
  const knownStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const segments = [
    { label: 'Pending', color: '#f5a623' },
    { label: 'Processing', color: '#54a6e8' },
    { label: 'Shipped', color: '#56c596' },
    { label: 'Delivered', color: '#07583e' },
    { label: 'Cancelled', color: '#e75d57' },
    { label: 'Other', color: '#9a8b7f' }
  ].map((segment) => ({
    ...segment,
    count: segment.label === 'Other'
      ? orders.filter((order) => !knownStatuses.includes(order.status)).length
      : orders.filter((order) => order.status === segment.label).length
  }));
  const total = orders.length;
  let running = 0;
  const gradient = segments.map((segment) => {
    const start = total ? (running / total) * 100 : 0;
    running += segment.count;
    const end = total ? (running / total) * 100 : 0;
    return `${segment.color} ${start}% ${end}%`;
  }).join(', ');
  return (
    <div className="admin-donut-wrap">
      <div className="admin-donut" style={{ background: total ? `conic-gradient(${gradient})` : '#e8e4dc' }}>
        <div className="admin-donut-hole"><strong>{total}</strong><span>Total Orders</span></div>
      </div>
      <div className="admin-status-legend">
        {segments.map((segment) => <span key={segment.label}><i style={{ backgroundColor: segment.color }} />{segment.label} <b>{segment.count}</b></span>)}
      </div>
    </div>
  );
};

const TopProducts = ({ orders, products }) => {
  const quantities = new Map();
  orders.forEach((order) => order.items?.forEach((item) => {
    const key = item.id || item.name;
    quantities.set(key, (quantities.get(key) || 0) + Number(item.quantity || 1));
  }));
  const topProducts = [...products]
    .sort((a, b) => (quantities.get(b.id) || 0) - (quantities.get(a.id) || 0))
    .slice(0, 5);
  return topProducts.length ? (
    <ul className="admin-list">
      {topProducts.map((product) => (
        <li className="admin-list-item" key={product.id}>
          <img className="admin-product-thumb" src={product.image || '/products/dark-chocolate-crunch-front.png'} alt="" />
          <span><strong>{product.name}</strong><small>{quantities.get(product.id) || 0} sold</small></span>
        </li>
      ))}
    </ul>
  ) : <div className="admin-empty-state">No products in the catalog.</div>;
};

const RecentReviews = ({ products }) => {
  const productById = new Map(products.map((product) => [product.id, product]));
  const reviews = Object.values(initialReviewsByProduct)
    .flatMap((product) => product.reviews.map((review) => ({ ...review, productName: product.productName, image: productById.get(product.productId)?.image })))
    .slice(0, 3);
  return (
    <ul className="admin-reviews-list">
      {reviews.map((review) => (
        <li key={review.id}>
          <img src={review.image || '/products/dark-chocolate-crunch-front.png'} alt="" />
          <span><strong>{review.userName}</strong><small>{review.productName}</small><span className="admin-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><p>{review.title}</p></span>
        </li>
      ))}
    </ul>
  );
};

const LowStockTable = ({ products }) => products.length ? (
  <div className="admin-table-scroll">
    <table className="admin-table">
      <thead><tr><th>Product</th><th>Stock</th><th>Status</th></tr></thead>
      <tbody>{products.map((product) => (
        <tr key={product.id}>
          <td><span className="admin-product-cell"><img src={product.image || '/products/dark-chocolate-crunch-front.png'} alt="" />{product.name}</span></td>
          <td>{stockFor(product)}</td>
          <td><span className="admin-low-stock-pill">{stockFor(product) === 0 ? 'Out of stock' : 'Low stock'}</span></td>
        </tr>
      ))}</tbody>
    </table>
  </div>
) : <div className="admin-empty-state">All products have healthy stock.</div>;

const ProductsTable = ({ products, onEdit, onDelete }) => {
  const pagination = usePagination(products);
  if (!products.length) return <div className="admin-empty-state">No products match your search.</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table admin-products-table admin-responsive-cards">
          <thead><tr><th>Product</th><th>SKU</th><th>MRP (Pack 1)</th><th>Discount (Pack 1)</th><th>Final Price (Pack 1)</th><th>MRP (Pack 2)</th><th>Discount (Pack 2)</th><th>Final Price (Pack 2)</th><th>Stock</th><th>Stock Status</th><th>Actions</th></tr></thead>
          <tbody>{pagination.visibleItems.map((product) => {
            const firstPackSize = product.id === 'dark-chocolate-crunch' ? '500 Gram' : '550gm';
            const secondPackSize = product.id === 'dark-chocolate-crunch' ? '1000 Gram (1 KG)' : '1kg';
            return (
              <tr key={product.id}>
                <td data-label="Product"><span className="admin-product-cell"><img src={product.image || '/products/dark-chocolate-crunch-front.png'} alt="" /><strong>{product.name}</strong></span></td>
                <td data-label="SKU">{product.sku || `PRO-${product.id.slice(0, 6).toUpperCase()}`}</td>
                <td data-label={`MRP (${firstPackSize})`}>{product.price550 == null ? '—' : currency(product.originalPrice550 || product.price550)}</td>
                <td data-label={`Discount (${firstPackSize})`}>{product.price550 == null ? '—' : `${product.discountPercent550 ?? getDiscountPercent(product.originalPrice550 || product.price550, product.price550)}%`}</td>
                <td data-label={`Final price (${firstPackSize})`}><strong>{product.price550 == null ? '—' : currency(product.price550)}</strong></td>
                <td data-label={`MRP (${secondPackSize})`}>{currency(product.originalPrice1kg || product.price1kg)}</td>
                <td data-label={`Discount (${secondPackSize})`}>{product.discountPercent1kg ?? getDiscountPercent(product.originalPrice1kg || product.price1kg, product.price1kg)}%</td>
                <td data-label={`Final price (${secondPackSize})`}><strong>{currency(product.price1kg)}</strong></td>
                <td data-label="Stock"><span className={stockFor(product) <= 5 ? 'admin-low-stock-pill' : 'admin-stock-pill'}>{stockFor(product)}</span></td>
                <td data-label="Stock status">{getProductStockStatus(product)}</td>
                <td data-label="Actions"><div className="admin-action-row"><button type="button" className="admin-button secondary" onClick={() => onEdit(product)}>Edit</button><button type="button" className="admin-button danger" onClick={() => onDelete(product)}>Delete</button></div></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const OrderTableRow = ({ order, onStatusChange, onViewDetails }) => {
  const [status, setStatus] = useState(order.status || 'Pending');
  const [trackingId, setTrackingId] = useState(order.trackingId || '');

  useEffect(() => {
    setStatus(order.status || 'Pending');
    setTrackingId(order.trackingId || '');
  }, [order.status, order.trackingId]);

  return (
    <tr>
      <td data-label="Order ID"><strong>#{order.id}</strong></td>
      <td data-label="Customer">{orderCustomer(order)}</td>
      <td data-label="Amount">{currency(orderAmount(order))}</td>
      <td className="admin-order-edit-cell" data-label="Status / Tracking">
        <select aria-label={`Change status for ${order.id}`} value={status} onChange={(event) => setStatus(event.target.value)}>
          {['Order Placed', 'Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Returned', 'Refund Requested', 'Refunded'].map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
        <input aria-label={`Tracking ID for ${order.id}`} value={trackingId} onChange={(event) => setTrackingId(event.target.value)} placeholder="Tracking ID" maxLength={80} />
      </td>
      <td data-label="Date">{order.date || '—'}</td>
      <td data-label="Actions">
        <div className="admin-action-row">
          <button type="button" className="admin-button secondary" onClick={() => onViewDetails(order)}>View Details</button>
          <button type="button" className="admin-button" onClick={() => onStatusChange(order.id, status, trackingId)}>Update Status</button>
        </div>
      </td>
    </tr>
  );
};

const OrdersTable = ({ orders, onStatusChange, onViewDetails, compact = false }) => {
  const pagination = usePagination(orders);
  if (!orders.length) return <div className="admin-empty-state">No orders{compact ? ' yet.' : ' match your search.'}</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table admin-orders-table admin-responsive-cards">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Amount</th><th>Status / Tracking</th><th>Date</th><th>Action</th></tr></thead>
          <tbody>{pagination.visibleItems.map((order) => (
            <OrderTableRow key={order.id} order={order} onStatusChange={onStatusChange} onViewDetails={onViewDetails} />
          ))}</tbody>
        </table>
        {compact && <span className="admin-table-note">Manage each order's fulfillment status from this table.</span>}
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const CustomersTable = ({ customers, onView, onDelete }) => {
  const pagination = usePagination(customers);
  if (!customers.length) return <div className="admin-empty-state">No customers have registered yet.</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table admin-customers-table admin-responsive-cards">
          <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Joined</th><th>Source</th><th>Actions</th></tr></thead>
          <tbody>{pagination.visibleItems.map((customer, index) => (
            <tr key={customer.email || customer.phone || `${customer.name}-${index}`}>
              <td data-label="Customer">
                <button type="button" className="admin-customer-name-button" onClick={() => onView(customer)}>
                  {customer.name || 'Customer'}
                </button>
              </td>
              <td data-label="Email">{customer.email || '—'}</td>
              <td data-label="Phone">{customer.phone || '—'}</td>
              <td data-label="Joined">{customer.joinedAt || '—'}</td>
              <td data-label="Source">{customer.source || 'registration'}</td>
              <td data-label="Actions">
                <div className="admin-action-row">
                  <button type="button" className="admin-icon-button" aria-label={`View ${customer.name || 'customer'} details`} onClick={() => onView(customer)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></svg>
                  </button>
                  <button type="button" className="admin-icon-button danger" aria-label={`Delete ${customer.name || 'customer'}`} onClick={() => onDelete(customer)}>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" /></svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const CustomerDetailsModal = ({ customer, orders, onClose, onDelete }) => {
  useEffect(() => {
    if (!customer) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [customer, onClose]);

  if (!customer) return null;
  return (
    <div
      className="admin-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="admin-customer-modal" role="dialog" aria-modal="true" aria-labelledby="admin-customer-details-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="admin-customer-details-title">Customer details</h2>
            <p>Customer profile information</p>
          </div>
          <button type="button" aria-label="Close customer details" onClick={onClose}>×</button>
        </div>
        <dl className="admin-customer-details">
          <div><dt>Full name</dt><dd>{customer.name || '—'}</dd></div>
          <div><dt>Email</dt><dd>{customer.email || '—'}</dd></div>
          <div><dt>Mobile number</dt><dd>{customer.phone || '—'}</dd></div>
          <div><dt>Registration date</dt><dd>{customer.joinedAt || '—'}</dd></div>
        </dl>
        <section className="admin-customer-order-history" aria-labelledby="admin-customer-orders-title">
          <div className="admin-panel-heading">
            <h3 id="admin-customer-orders-title">Orders</h3>
            <span className="admin-count-chip">{orders.length}</span>
          </div>
          {orders.length ? (
            <div className="admin-customer-order-list">
              {orders.map((order) => (
                <article key={order.id}>
                  <div><strong>#{order.id}</strong><small>{order.date || 'Date unavailable'}</small></div>
                  <div><span className={statusClass(order.status)}>{order.status || 'Pending'}</span><strong>{currency(orderAmount(order))}</strong></div>
                </article>
              ))}
            </div>
          ) : <p className="admin-customer-no-orders">No orders found for this customer.</p>}
        </section>
        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={onClose}>Close</button>
          <button type="button" className="admin-button danger" onClick={() => onDelete(customer)}>Delete Customer</button>
        </div>
      </section>
    </div>
  );
};

const OrderDetailsModal = ({ order, onClose }) => {
  useEffect(() => {
    if (!order) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [order, onClose]);

  if (!order) return null;
  const address = order.address || {};
  const addressFields = [
    ['Name', address.name || order.customerName],
    ['Mobile', address.mobile],
    ['Address Line', address.addressLine],
    ['City', address.city],
    ['State', address.state],
    ['Pincode', address.pincode]
  ];

  return (
    <div
      className="admin-modal-backdrop admin-order-print-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="admin-customer-modal admin-order-details-modal" role="dialog" aria-modal="true" aria-labelledby="admin-order-details-title">
        <div className="admin-panel-heading">
          <div>
            <h2 id="admin-order-details-title">Shipping address</h2>
            <p>Order #{order.id} · {order.date || 'Date unavailable'}</p>
          </div>
          <button type="button" aria-label="Close shipping address" onClick={onClose}>×</button>
        </div>
        <dl className="admin-customer-details">
          {addressFields.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>
          ))}
        </dl>
        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={onClose}>Close</button>
          <button type="button" className="admin-button" onClick={() => window.print()}>Print Shipping Address</button>
        </div>
      </section>
    </div>
  );
};

const CategoriesTable = ({ products, onViewProducts }) => {
  const categories = useMemo(() => {
    const categoryMap = new Map();
    products.forEach((product) => {
      const category = product.category || 'other';
      const current = categoryMap.get(category) || { category, count: 0, stock: 0 };
      current.count += 1;
      current.stock += stockFor(product);
      categoryMap.set(category, current);
    });
    return [...categoryMap.values()].sort((a, b) => a.category.localeCompare(b.category));
  }, [products]);
  const pagination = usePagination(categories);
  if (!categories.length) return <div className="admin-empty-state">Categories will appear when products are added.</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Category</th><th>Products</th><th>Units in stock</th><th>Action</th></tr></thead>
          <tbody>{pagination.visibleItems.map((category) => (
            <tr key={category.category}>
              <td><strong className="admin-category-name">{category.category.replace(/-/g, ' ')}</strong></td>
              <td>{category.count}</td><td>{category.stock}</td>
              <td><button type="button" className="admin-button secondary" onClick={onViewProducts}>View products</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const InventoryTable = ({ products, onEdit }) => {
  const pagination = usePagination(products);
  if (!products.length) return <div className="admin-empty-state">No products match your search.</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Product</th><th>SKU</th><th>Available stock</th><th>Inventory status</th><th>Action</th></tr></thead>
          <tbody>{pagination.visibleItems.map((product) => {
            const inventoryStatus = product.id === 'dark-chocolate-crunch'
              ? getProductStockStatus(product)
              : stockFor(product) === 0
                ? 'Out of stock'
                : stockFor(product) <= 5
                  ? 'Low stock'
                  : 'In stock';
            const isLowStock = product.id === 'dark-chocolate-crunch'
              ? ['Out of Stock', 'Currently Unavailable', 'Low Stock'].includes(inventoryStatus)
              : stockFor(product) <= 5;
            return (
              <tr key={product.id}>
                <td><span className="admin-product-cell"><img src={product.image || '/products/dark-chocolate-crunch-front.png'} alt="" /><strong>{product.name}</strong></span></td>
                <td>{product.sku || `PRO-${product.id.slice(0, 6).toUpperCase()}`}</td>
                <td>{stockFor(product)}</td>
                <td><span className={isLowStock ? 'admin-low-stock-pill' : 'admin-stock-pill'}>{inventoryStatus}</span></td>
                <td><button type="button" className="admin-button secondary" onClick={() => onEdit(product)}>Adjust stock</button></td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const PaymentsTable = ({ orders, onViewDetails }) => {
  const pagination = usePagination(orders);
  if (!orders.length) return <div className="admin-empty-state">No payments match your search.</div>;
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Order ID</th><th>Customer</th><th>Payment method</th><th>Amount</th><th>Order status</th><th>Action</th></tr></thead>
          <tbody>{pagination.visibleItems.map((order) => (
            <tr key={order.id}>
              <td><strong>#{order.id}</strong></td><td>{orderCustomer(order)}</td><td>{order.paymentMethod || 'Not specified'}</td><td>{currency(orderAmount(order))}</td><td><span className={statusClass(order.status)}>{order.status || 'Pending'}</span></td>
              <td><button type="button" className="admin-button secondary" onClick={() => onViewDetails(order)}>View Details</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const RefundsTable = ({ orders, onStatusChange, onViewDetails }) => {
  if (!orders.length) return <div className="admin-empty-state">No refund requests have been recorded.</div>;
  return <OrdersTable orders={orders} onStatusChange={onStatusChange} onViewDetails={onViewDetails} />;
};

const getReviews = (products) => {
  const productById = new Map(products.map((product) => [product.id, product]));
  return Object.values(initialReviewsByProduct).flatMap((product) => product.reviews.map((review) => ({
    ...review,
    productName: product.productName,
    image: productById.get(product.productId)?.image || '/products/dark-chocolate-crunch-front.png'
  })));
};

const ReviewsTable = ({ products }) => {
  const reviews = useMemo(() => getReviews(products), [products]);
  const pagination = usePagination(reviews);
  return (
    <>
      <div className="admin-table-scroll">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Product</th><th>Rating</th><th>Review</th><th>Date</th></tr></thead>
          <tbody>{pagination.visibleItems.map((review) => (
            <tr key={review.id}>
              <td><strong>{review.userName}</strong></td>
              <td><span className="admin-product-cell"><img src={review.image} alt="" />{review.productName}</span></td>
              <td><span className="admin-review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span></td>
              <td>{review.title}</td><td>{review.date}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <PaginationControls pagination={pagination} />
    </>
  );
};

const BannerSettings = () => {
  const { settings, updateSettings } = useGlobalSettings();
  const [showAddForm, setShowAddForm] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState(null);
  const heroSlides = settings.heroBanners || [];
  const pagination = usePagination(heroSlides, { resetOnItemsChange: false });

  useEffect(() => {
    if (!showAddForm) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setShowAddForm(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showAddForm]);

  const togglePlacement = (settingKey, label) => {
    try {
      updateSettings({ [settingKey]: !settings[settingKey] });
      toast.success(`${label} ${settings[settingKey] ? 'hidden from' : 'published on'} the website.`);
    } catch (error) {
      console.error('Unable to save banner settings', error);
      toast.error('Unable to save banner settings.');
    }
  };

  const saveHeroBanners = (nextBanners) => {
    updateSettings({ heroBanners: nextBanners });
  };

  const toggleBanner = (bannerId) => {
    try {
      saveHeroBanners(heroSlides.map((banner) => (
        banner.id === bannerId ? { ...banner, active: banner.active === false } : banner
      )));
      toast.success('Banner visibility updated on the website.');
    } catch (error) {
      console.error('Unable to update banner visibility', error);
      toast.error('Unable to update banner visibility.');
    }
  };

  const removeBanner = () => {
    if (!bannerToDelete) return;
    try {
      saveHeroBanners(heroSlides.filter((banner) => banner.id !== bannerToDelete.id));
      toast.success('Banner removed from the website.');
      setBannerToDelete(null);
    } catch (error) {
      console.error('Unable to remove banner', error);
      toast.error('Unable to remove banner.');
    }
  };

  const addBanner = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const alt = String(formData.get('bannerTitle') || '').trim();
    const imageUrl = String(formData.get('bannerImageUrl') || '').trim();
    const imageFile = formData.get('bannerImageFile');
    let src = imageUrl;

    try {
      if (imageFile instanceof File && imageFile.size > 0) {
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(imageFile.type)) {
          toast.error('Choose a JPG, PNG, WEBP, or GIF image.');
          return;
        }
        if (imageFile.size > 1024 * 1024) {
          toast.error('Banner image must be 1 MB or smaller.');
          return;
        }
        src = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') resolve(reader.result);
            else reject(new Error('Unable to read the selected image.'));
          };
          reader.onerror = () => reject(reader.error || new Error('Unable to read the selected image.'));
          reader.readAsDataURL(imageFile);
        });
      } else if (imageUrl) {
        if (!imageUrl.startsWith('/') && !/^https?:\/\//i.test(imageUrl)) {
          toast.error('Use an https image URL or a site path beginning with /.');
          return;
        }
      } else {
        toast.error('Add an image URL or choose an image file.');
        return;
      }

      saveHeroBanners([
        ...heroSlides,
        { id: `hero-banner-${Date.now()}`, src, alt, active: true }
      ]);
      pagination.setPage(Math.ceil((heroSlides.length + 1) / PAGE_SIZE));
      toast.success('Banner added and published to the homepage.');
      setShowAddForm(false);
    } catch (error) {
      console.error('Unable to add homepage banner', error);
      toast.error('Unable to save the banner. Try a smaller image or an image URL.');
    }
  };

  return (
    <div className="admin-banner-manager">
      <section className="admin-table-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Homepage hero carousel</h2>
            <p className="admin-banner-description">Add and manage image banners shown in the customer homepage carousel.</p>
          </div>
          <div className="admin-action-row admin-banner-heading-actions">
            <div className="admin-banner-placement-control">
              <span className={`admin-status-pill${settings.showHeroBanner ? ' is-delivered' : ''}`}>{settings.showHeroBanner ? 'Live on website' : 'Hidden from website'}</span>
              <button type="button" role="switch" aria-label="Show homepage hero carousel" aria-checked={settings.showHeroBanner} className={`admin-toggle-switch${settings.showHeroBanner ? ' is-on' : ''}`} onClick={() => togglePlacement('showHeroBanner', 'Homepage hero carousel')}><span /></button>
            </div>
            <button type="button" className="admin-button" onClick={() => setShowAddForm(true)}>＋ Add Banner</button>
          </div>
        </div>
        <div className="admin-banner-preview-grid">
          {pagination.visibleItems.map((slide, index) => (
            <article className="admin-banner-preview-card" key={slide.id || slide.src}>
              <img src={slide.src} alt={slide.alt} />
              <div><strong>{slide.alt || `Homepage banner ${(pagination.page - 1) * PAGE_SIZE + index + 1}`}</strong><small>Homepage carousel banner</small></div>
              <div className="admin-banner-card-actions">
                <span className={`admin-status-pill${settings.showHeroBanner && slide.active !== false ? ' is-delivered' : ''}`}>{settings.showHeroBanner && slide.active !== false ? 'Published' : 'Hidden'}</span>
                <button type="button" role="switch" aria-label={`Publish ${slide.alt || `banner ${(pagination.page - 1) * PAGE_SIZE + index + 1}`}`} aria-checked={slide.active !== false} className={`admin-toggle-switch${slide.active !== false ? ' is-on' : ''}`} onClick={() => toggleBanner(slide.id)}><span /></button>
                <button type="button" className="admin-button danger" onClick={() => setBannerToDelete(slide)}>Remove</button>
              </div>
            </article>
          ))}
          {!heroSlides.length && <div className="admin-empty-state">No homepage banners yet. Add a banner to publish one.</div>}
        </div>
        <PaginationControls pagination={pagination} />
      </section>
      {showAddForm && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowAddForm(false);
          }}
        >
          <section className="admin-banner-modal" role="dialog" aria-modal="true" aria-labelledby="admin-add-banner-title">
            <div className="admin-panel-heading">
              <div>
                <h2 id="admin-add-banner-title">Add Homepage Banner</h2>
                <p className="admin-banner-description">New banners are published to the homepage carousel when saved.</p>
              </div>
              <button type="button" className="admin-modal-close" aria-label="Close add banner form" onClick={() => setShowAddForm(false)}>×</button>
            </div>
            <form className="admin-banner-form" onSubmit={addBanner} onInvalid={handleRequiredFieldError}>
              <label>Banner title / image description<input name="bannerTitle" required maxLength="120" placeholder="Describe this banner" /></label>
              <label>Image URL<input name="bannerImageUrl" type="text" placeholder="https://... or /hero-slides/banner.jpg" /></label>
              <span className="admin-banner-form-or">Or upload an image (JPG, PNG, WEBP, GIF; max 1 MB)</span>
              <label>Image file<input name="bannerImageFile" type="file" accept="image/jpeg,image/png,image/webp,image/gif" /></label>
              <div className="admin-form-actions">
                <button type="button" className="admin-button secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="admin-button">Add &amp; Publish Banner</button>
              </div>
            </form>
          </section>
        </div>
      )}
      <AdminConfirmationModal
        isOpen={Boolean(bannerToDelete)}
        message={bannerToDelete ? `Are you sure you want to delete "${bannerToDelete.alt || 'this banner'}"?` : 'Are you sure you want to delete this?'}
        onCancel={() => setBannerToDelete(null)}
        onConfirm={removeBanner}
      />
      <section className="admin-table-panel admin-settings-panel">
        <div className="admin-panel-heading">
          <div>
            <h2>Offer announcement strip</h2>
            <p className="admin-banner-description">This message appears above the store navigation.</p>
          </div>
          <div className="admin-banner-placement-control">
            <span className={`admin-status-pill${settings.showOfferBanner ? ' is-delivered' : ''}`}>{settings.showOfferBanner ? 'Live on website' : 'Hidden from website'}</span>
            <button type="button" role="switch" aria-label="Show offer announcement strip" aria-checked={settings.showOfferBanner} className={`admin-toggle-switch${settings.showOfferBanner ? ' is-on' : ''}`} onClick={() => togglePlacement('showOfferBanner', 'Offer announcement strip')}><span /></button>
          </div>
        </div>
        <div className={`admin-banner-offer-preview${settings.showOfferBanner ? '' : ' is-hidden'}`}>
          <span>PROTINUT</span>
          <strong>{settings.offerBannerText || 'No offer text is configured. Edit Website Content to add one.'}</strong>
        </div>
      </section>
    </div>
  );
};

const NotificationSettings = ({ enabled, onToggle }) => (
  <section className="admin-table-panel admin-settings-panel">
    <h2>Notification preferences</h2>
    <div className="admin-setting-row">
      <span><strong>Admin notifications</strong><small>Receive alerts for new store activity.</small></span>
      <button type="button" role="switch" aria-checked={enabled} className={`admin-toggle-switch${enabled ? ' is-on' : ''}`} onClick={() => onToggle(!enabled)}><span /></button>
    </div>
    <div className="admin-setting-row"><span><strong>New orders</strong><small>Order activity is available in the Orders section.</small></span><span className="admin-status-pill is-delivered">Live</span></div>
    <div className="admin-setting-row"><span><strong>Low stock alerts</strong><small>See inventory warnings in the Inventory section.</small></span><span className="admin-status-pill">{'Enabled'}</span></div>
  </section>
);

const ProductPricingFields = ({ product, size, mrpField, discountField, finalPriceField }) => {
  const isOneKilogram = size === '1kg';
  const mrp = Number(product?.[isOneKilogram ? 'originalPrice1kg' : 'originalPrice550']
    ?? product?.[isOneKilogram ? 'price1kg' : 'price550']
    ?? '');
  const finalPrice = Number(product?.[isOneKilogram ? 'price1kg' : 'price550'] ?? '');
  const discount = product
    ? (product[isOneKilogram ? 'discountPercent1kg' : 'discountPercent550']
      ?? getDiscountPercent(mrp, finalPrice))
    : 0;

  const updatePreview = (event) => {
    const form = event.currentTarget.form;
    const currentMrp = Number(form.elements.namedItem(mrpField).value);
    const currentDiscount = Number(form.elements.namedItem(discountField).value);
    const output = form.elements.namedItem(finalPriceField);
    output.value = currentMrp > 0 && currentDiscount >= 0 && currentDiscount <= 100
      ? String(Math.round(currentMrp * (1 - currentDiscount / 100)))
      : '';
  };

  return (
    <fieldset className="admin-pricing-fields admin-form-wide">
      <legend>{size} pricing</legend>
      <label>MRP (₹)<input name={mrpField} type="number" min="1" step="1" defaultValue={product ? mrp : ''} onInput={updatePreview} required /></label>
      <label>Discount (%)<input name={discountField} type="number" min="0" max="100" step="0.01" defaultValue={discount} onInput={updatePreview} required /></label>
      <label>Final price (₹)<input name={finalPriceField} type="number" min="0" step="1" defaultValue={product ? finalPrice : ''} readOnly required /></label>
    </fieldset>
  );
};

const ProductForm = ({ product, onClose, onSubmit }) => (
  <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-form-title">
      <div className="admin-panel-heading"><h2 id="admin-product-form-title">{product ? 'Edit Product' : 'Add Product'}</h2><button type="button" aria-label="Close form" onClick={onClose}>×</button></div>
      <form className="admin-form" onSubmit={onSubmit} onInvalid={handleRequiredFieldError}>
        <label className="admin-form-wide">Product name<input name="name" defaultValue={product?.name || ''} required maxLength="100" placeholder="Product name" /></label>
        {!product && <label>Category<select name="category"><option value="other">Other</option><option value="crunchy">Crunchy</option><option value="creamy">Creamy</option><option value="sweet">Sweet</option><option value="combos">Combos</option></select></label>}
        <label>SKU<input name="sku" defaultValue={product?.sku || ''} maxLength="40" placeholder="PRO-000001" /></label>
        {(!product || product.price550 != null) && <ProductPricingFields product={product} size={product?.id === 'dark-chocolate-crunch' ? '500 Gram' : '550gm'} mrpField="mrp550" discountField="discount550" finalPriceField="price550" />}
        <ProductPricingFields product={product} size="1kg" mrpField="mrp1kg" discountField="discount1kg" finalPriceField="price1kg" />
        <label>Stock status
          <select name="stockStatus" defaultValue={product ? getProductStockStatus(product) : 'Out of Stock'} required>
            {STOCK_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </label>
        <label>Stock quantity<input name="stock" type="number" min="0" step="1" defaultValue={product ? stockFor(product) : 0} required /></label>
        <label className="admin-form-wide">Image URL<input name="image" type="text" inputMode="url" defaultValue={product?.image || ''} placeholder="https://... or /products/..." /></label>
        <div className="admin-form-actions"><button type="button" className="admin-button secondary" onClick={onClose}>Cancel</button><button type="submit" className="admin-button">{product ? 'Save changes' : 'Add product'}</button></div>
      </form>
    </section>
  </div>
);

const CustomerForm = ({ onClose, onSubmit }) => (
  <div className="admin-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="admin-customer-form-title">
      <div className="admin-panel-heading">
        <h2 id="admin-customer-form-title">Add Customer</h2>
        <button type="button" aria-label="Close form" onClick={onClose}>×</button>
      </div>
      <form className="admin-form" onSubmit={onSubmit} onInvalid={handleRequiredFieldError}>
        <label className="admin-form-wide">Name<input name="name" required maxLength="100" autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
        <label>Mobile<input name="phone" type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength="10" required autoComplete="tel" /></label>
        <label className="admin-form-wide">Password<input name="password" type="password" minLength="6" required autoComplete="new-password" /></label>
        <div className="admin-form-actions">
          <button type="button" className="admin-button secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="admin-button">Add Customer</button>
        </div>
      </form>
    </section>
  </div>
);

export default AdminDashboardPage;
