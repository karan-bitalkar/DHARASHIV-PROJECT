import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  ZoomControl,
  useMap
} from 'react-leaflet';
import { useOrders } from '../OrderContext';
import { useAuth } from '../AuthContext';
import { DEFAULT_PICKUP_LOCATION, MAP_TILE_URL } from '../trackingConfig';
import { isOrderOwnedByUser } from '../orderOwnership';
import 'leaflet/dist/leaflet.css';
import './TrackingPage.css';

const STATUS_STEPS = ['Order Placed', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];

const getCoordinatePair = (location) => {
  const latitude = location?.latitude ?? location?.lat;
  const longitude = location?.longitude ?? location?.lng ?? location?.lon;
  if (latitude === null || latitude === undefined || latitude === '' || longitude === null || longitude === undefined || longitude === '') {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }
  return [lat, lng];
};

const getRoadRoute = (geometry) => {
  if (geometry?.type !== 'LineString' || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    return [];
  }

  const positions = geometry.coordinates.map((point) => (
    Array.isArray(point) && point.length >= 2
      ? getCoordinatePair({ longitude: point[0], latitude: point[1] })
      : null
  ));
  return positions.every(Boolean) ? positions : [];
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
};

const formatTimelineUpdate = (entry, isComplete) => {
  const timestamp = entry?.updatedAt || entry?.timestamp;
  if (timestamp) {
    const hasTime = /T\d{2}:\d{2}| \d{1,2}:\d{2}/.test(String(timestamp));
    if (hasTime) return formatDateTime(timestamp);
  }
  return entry?.date || (isComplete ? 'Completed' : 'Not updated');
};

const MapViewport = ({ positions }) => {
  const map = useMap();

  useEffect(() => {
    if (positions.length > 1) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 13 });
    }
  }, [map, positions]);

  return null;
};

const StatusTimeline = ({ order, activeStep }) => (
  <ol className="tracking-timeline">
    {STATUS_STEPS.map((step, index) => {
      const entry = order.timeline?.find((item) => item.step === step);
      const isComplete = order.status !== 'Cancelled' && index <= activeStep;
      const isCurrent = order.status !== 'Cancelled' && index === activeStep;
      return (
        <li
          className={`tracking-timeline-step${isComplete ? ' is-complete' : ''}${isCurrent ? ' is-current' : ''}`}
          key={step}
        >
          <span className="tracking-timeline-marker" aria-hidden="true">
            {isComplete ? '✓' : ''}
          </span>
          <span className="tracking-timeline-label">{step}</span>
          <span className="tracking-timeline-date">{formatTimelineUpdate(entry, isComplete)}</span>
          {index < STATUS_STEPS.length - 1 && <span className="tracking-timeline-connector" aria-hidden="true" />}
        </li>
      );
    })}
  </ol>
);

const TrackingMap = ({ pickup, destination, route, driverLocation, driverUpdatedAt }) => {
  const positions = useMemo(() => [pickup, ...route, destination], [pickup, route, destination]);
  const [tileError, setTileError] = useState(false);

  return (
    <section className="tracking-map-section" aria-labelledby="tracking-map-title">
      <div className="tracking-map-heading">
        <div>
          <p className="tracking-eyebrow">ORDER ROUTE</p>
          <h2 id="tracking-map-title">Pickup to delivery</h2>
        </div>
        <span className="tracking-route-badge">Estimated road route · Not live GPS</span>
      </div>

      <div className="tracking-map-stage">
        <MapContainer
          center={route[0]}
          zoom={11}
          zoomControl={false}
          scrollWheelZoom
          className="tracking-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url={MAP_TILE_URL}
            eventHandlers={{ tileerror: () => setTileError(true) }}
          />
          <MapViewport positions={positions} />
          <ZoomControl position="topright" />
          <Polyline positions={route} pathOptions={{ color: '#ef5323', weight: 6, opacity: 0.88 }} />
          <CircleMarker center={pickup} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#15734a', fillOpacity: 1 }}>
            <Popup><strong>PROTINUT Foods pickup</strong></Popup>
          </CircleMarker>
          <CircleMarker center={destination} radius={9} pathOptions={{ color: '#fff', weight: 3, fillColor: '#ef5323', fillOpacity: 1 }}>
            <Popup><strong>Customer delivery destination</strong></Popup>
          </CircleMarker>
          {driverLocation && (
            <CircleMarker center={driverLocation} radius={7} pathOptions={{ color: '#fff', weight: 2, fillColor: '#2563eb', fillOpacity: 1 }}>
              <Popup>
                Last driver GPS update
                {driverUpdatedAt ? `: ${formatDateTime(driverUpdatedAt)}` : ''}
              </Popup>
            </CircleMarker>
          )}
        </MapContainer>
        {tileError && <p className="tracking-map-error" role="alert">Map tiles could not be loaded. Check the configured map tile service.</p>}
        <div className="tracking-map-legend" aria-label="Map markers">
          <span><i className="is-pickup" />Pickup</span>
          <span><i className="is-destination" />Delivery</span>
          {driverLocation && <span><i className="is-driver" />Last driver location</span>}
        </div>
      </div>
    </section>
  );
};

const TrackingPage = () => {
  const { orderId } = useParams();
  const { orders } = useOrders();
  const { user } = useAuth();
  const storedOrder = orders.find((item) => String(item.id) === orderId);
  const order = isOrderOwnedByUser(storedOrder, user) ? storedOrder : null;

  if (!order) {
    return (
      <section className="tracking-not-found">
        <div className="tracking-not-found-card">
          <span className="tracking-not-found-icon" aria-hidden="true">!</span>
          <h1>We couldn't find this order</h1>
          <p>Check the order number or return to My Orders to select an order to track.</p>
          <Link className="tracking-back-button" to="/orders">Back to My Orders</Link>
        </div>
      </section>
    );
  }

  if (order.status === 'Cancelled') {
    return (
      <section className="tracking-not-found">
        <div className="tracking-not-found-card">
          <span className="tracking-not-found-icon" aria-hidden="true">×</span>
          <h1>Live tracking is unavailable</h1>
          <p>This order has been cancelled, so no live tracking information is available.</p>
          <Link className="tracking-back-button" to="/orders">Back to My Orders</Link>
        </div>
      </section>
    );
  }

  const address = order.address || {};
  const pickupLocation = order.pickupLocation || DEFAULT_PICKUP_LOCATION;
  const tracking = order.tracking || {};
  const pickupCoordinates = getCoordinatePair(pickupLocation.coordinates || pickupLocation);
  const destinationCoordinates = getCoordinatePair(address.coordinates || address);
  const routeCoordinates = getRoadRoute(tracking.routeGeometry);
  const driverCoordinates = getCoordinatePair(tracking.driverLocation);
  const hasRouteData = Boolean(pickupCoordinates && destinationCoordinates && routeCoordinates.length > 1);
  const canShowMap = hasRouteData && Boolean(MAP_TILE_URL);
  const orderItems = Array.isArray(order.items) ? order.items : [];
  const activeStep = order.status === 'Cancelled'
    ? -1
    : ({ 'Order Placed': 0, Pending: 0, Processing: 1, Shipped: 2, 'Out for Delivery': 3, Delivered: 4 }[order.status] ?? order.statusIndex ?? 0);
  const fullAddress = [address.addressLine, address.city, address.state, address.pincode]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(', ');
  const distanceKm = Number(tracking.distanceKm);
  const estimatedDurationMinutes = Number(tracking.estimatedDurationMinutes);
  const distanceLabel = Number.isFinite(distanceKm) && distanceKm > 0 ? `${distanceKm.toFixed(1)} km` : 'Unavailable';
  const etaLabel = tracking.estimatedDeliveryAt
    ? formatDateTime(tracking.estimatedDeliveryAt)
    : Number.isFinite(estimatedDurationMinutes) && estimatedDurationMinutes > 0
      ? `${Math.round(estimatedDurationMinutes)} min`
      : 'Unavailable';
  const totalAmount = Number(order.pricing?.grandTotal ?? order.total ?? 0);
  const isCod = /cash on delivery|\bcod\b/i.test(order.paymentMethod || '');

  return (
    <section className="tracking-page" aria-label={`Order tracking for ${order.id}`}>
      <main className="tracking-main">
        <Link className="tracking-map-back" to="/orders">
          <span aria-hidden="true">←</span> My Orders
        </Link>

        {canShowMap ? (
          <TrackingMap
            pickup={pickupCoordinates}
            destination={destinationCoordinates}
            route={routeCoordinates}
            driverLocation={driverCoordinates}
            driverUpdatedAt={tracking.driverLocation?.updatedAt}
          />
        ) : (
          <section className="tracking-map-section" aria-labelledby="tracking-map-title">
            <div className="tracking-map-heading">
              <div>
                <p className="tracking-eyebrow">ORDER ROUTE</p>
                <h2 id="tracking-map-title">Pickup to delivery</h2>
              </div>
              <span className="tracking-route-badge">Estimated route · Not live GPS</span>
            </div>
            <div className="tracking-map-unavailable" role="status">
              <span className="tracking-location-icon" aria-hidden="true">↗</span>
              <h3>Road route unavailable</h3>
              <p>
                A map route will appear when trusted pickup and delivery coordinates,
                road-route geometry, and a private map tile service are available.
                No straight-line route or live vehicle movement is shown.
              </p>
              {!pickupCoordinates && <small>Pickup coordinates are not available yet.</small>}
              {!destinationCoordinates && <small>Delivery coordinates are not available for this order yet.</small>}
              {pickupCoordinates && destinationCoordinates && routeCoordinates.length < 2 && (
                <small>Actual road-route geometry is not available for this order yet.</small>
              )}
              {hasRouteData && !MAP_TILE_URL && <small>Configure VITE_OSM_TILE_URL with a trusted map tile endpoint to show the map.</small>}
            </div>
          </section>
        )}

        <div className="tracking-route-metrics">
          <article>
            <span>Total road distance</span>
            <strong>{distanceLabel}</strong>
          </article>
          <article>
            <span>Estimated delivery</span>
            <strong>{etaLabel}</strong>
          </article>
          <p>Route estimates are not live vehicle tracking. GPS appears only when a real driver update is supplied.</p>
        </div>
      </main>

      <aside className="tracking-details-panel" aria-label="Tracking and order details">
        <div className="tracking-details-scroll">
          <header className="tracking-details-header">
            <div>
              <p className="tracking-eyebrow">ORDER #{order.id}</p>
              <h1>Track your order</h1>
            </div>
            <span className="tracking-live-status">{order.status || 'Order Placed'}</span>
          </header>

          <section className="tracking-status-card" aria-live="polite">
            <div>
              <p className="tracking-eyebrow">CURRENT ORDER STATUS</p>
              <strong>{order.status || 'Order Placed'}</strong>
            </div>
            <small>
              {order.statusUpdatedAt
                ? `Updated ${formatDateTime(order.statusUpdatedAt)}`
                : `Placed ${order.date || 'date unavailable'}`}
            </small>
          </section>

          {order.status === 'Cancelled' && (
            <p className="tracking-cancelled-note">This order has been cancelled.</p>
          )}

          <section className="tracking-section">
            <h2>Delivery progress</h2>
            <StatusTimeline order={order} activeStep={activeStep} />
          </section>

          <section className="tracking-section tracking-locations">
            <h2>Pickup and delivery locations</h2>
            <article className="tracking-location-card">
              <span className="tracking-location-dot is-pickup" aria-hidden="true" />
              <div>
                <p className="tracking-eyebrow">PICKUP</p>
                <strong>{pickupLocation.name || DEFAULT_PICKUP_LOCATION.name}</strong>
                <p>{pickupLocation.address || DEFAULT_PICKUP_LOCATION.address}</p>
              </div>
            </article>
            <article className="tracking-location-card">
              <span className="tracking-location-dot is-destination" aria-hidden="true" />
              <div>
                <p className="tracking-eyebrow">DELIVERY DESTINATION</p>
                <strong>{address.name || 'Customer'}</strong>
                {address.mobile && <p className="tracking-address-mobile">{address.mobile}</p>}
                <p>{fullAddress || 'Delivery address unavailable'}</p>
              </div>
            </article>
          </section>

          <section className="tracking-section tracking-order-summary">
            <h2>Order summary <span>{orderItems.length} {orderItems.length === 1 ? 'item' : 'items'}</span></h2>
            <ul>
              {orderItems.map((item, index) => (
                <li key={`${item.id || item.name}-${index}`}>
                  <span>{item.name} <small>{item.weight ? `· ${item.weight}` : ''} × {item.quantity || 1}</small></span>
                  <strong>₹{Number(item.finalPrice || 0) * Number(item.quantity || 1)}</strong>
                </li>
              ))}
            </ul>
            <div className="tracking-order-total">
              <span>{isCod ? 'Total due on delivery' : 'Total amount paid'}</span>
              <strong>₹{Number.isFinite(totalAmount) ? totalAmount.toFixed(2) : '0.00'}</strong>
            </div>
          </section>
        </div>
      </aside>
    </section>
  );
};

export default TrackingPage;
