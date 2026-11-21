import React, { useMemo, useState } from 'react';
import { buildStateWiseSales, getDateWindow } from './stateWiseSales';
import './StateWiseSalesAnalytics.css';

const formatCurrency = (amount) => `₹${Number(amount || 0).toLocaleString('en-IN', {
  maximumFractionDigits: 2
})}`;

const dateInputValue = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const StateWiseSalesAnalytics = ({ orders, getOrderAmount }) => {
  const today = new Date();
  const [range, setRange] = useState('30d');
  const [customStart, setCustomStart] = useState(dateInputValue(new Date(today.getFullYear(), today.getMonth(), 1)));
  const [customEnd, setCustomEnd] = useState(dateInputValue(today));
  const window = useMemo(
    () => getDateWindow(range, customStart, customEnd),
    [range, customStart, customEnd]
  );
  const sales = useMemo(() => (
    Array.isArray(orders) && !window.invalid
      ? buildStateWiseSales(orders, window, getOrderAmount)
      : null
  ), [orders, window, getOrderAmount]);

  if (orders === undefined) {
    return (
      <section className="admin-india-sales" aria-labelledby="india-state-sales-title" aria-busy="true">
        <div className="admin-india-sales-heading">
          <div>
            <h2 id="india-state-sales-title">India State-Wise Sales Performance</h2>
            <p>Track revenue and orders across different states of India.</p>
          </div>
        </div>
        <div className="admin-india-skeleton-grid">
          {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="admin-india-skeleton" />)}
        </div>
      </section>
    );
  }

  return (
    <section className="admin-india-sales" aria-labelledby="india-state-sales-title">
      <div className="admin-india-sales-heading">
        <div>
          <h2 id="india-state-sales-title">India State-Wise Sales Performance</h2>
          <p>Track revenue and orders across different states of India.</p>
        </div>
        <label className="admin-india-range-control">
          <span>Date range</span>
          <select value={range} onChange={(event) => setRange(event.target.value)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </label>
      </div>

      {range === 'custom' && (
        <div className="admin-india-custom-range">
          <label>From <input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} /></label>
          <label>To <input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} /></label>
        </div>
      )}
      <p className="admin-india-method-note">
        Cancelled and fully refunded orders are excluded. Recorded refund amounts are deducted; returned or partially refunded orders without an amount are excluded.
      </p>

      {window.invalid ? (
        <div className="admin-india-message is-error" role="alert">Choose a valid date range to view sales.</div>
      ) : !Array.isArray(orders) ? (
        <div className="admin-india-message is-error" role="alert">Order data could not be loaded.</div>
      ) : (
        <>
          <div className="admin-india-summary-grid" aria-label="India sales summary">
            <article className="admin-stat-card">
              <span className="admin-stat-icon">₹</span>
              <span className="admin-summary-copy"><small>Total India Sales</small><strong>{formatCurrency(sales.totalRevenue)}</strong></span>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon">▣</span>
              <span className="admin-summary-copy"><small>Total Orders</small><strong>{sales.totalOrders.toLocaleString('en-IN')}</strong></span>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon">Q</span>
              <span className="admin-summary-copy"><small>Total Quantity Sold</small><strong>{sales.totalQuantity.toLocaleString('en-IN')}</strong></span>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon">⌖</span>
              <span className="admin-summary-copy"><small>Total States with Sales</small><strong>{sales.statesWithSales.toLocaleString('en-IN')}</strong></span>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon">A</span>
              <span className="admin-summary-copy"><small>Average Order Value</small><strong>{formatCurrency(sales.averageOrderValue)}</strong></span>
            </article>
            <article className="admin-stat-card">
              <span className="admin-stat-icon">★</span>
              <span className="admin-summary-copy"><small>Top Performing State</small><strong className="admin-india-top-state">{sales.topPerformingState?.name || '—'}</strong></span>
            </article>
          </div>

          {(sales.diagnostics.missingDate > 0 || sales.diagnostics.missingRefundAmount > 0) && (
            <p className="admin-india-data-note" role="status">
              {sales.diagnostics.missingDate > 0 && `${sales.diagnostics.missingDate} order(s) without a valid date were excluded. `}
              {sales.diagnostics.missingRefundAmount > 0 && `${sales.diagnostics.missingRefundAmount} returned or partially refunded order(s) without an actual refund amount were excluded.`}
            </p>
          )}

          {sales.states.length === 0 ? (
            <div className="admin-india-message">
              No sales were recorded for the selected date range.
            </div>
          ) : (
            <>
              <section className="admin-india-panel" aria-labelledby="india-sales-chart-title">
                <div className="admin-india-panel-heading">
                  <div>
                    <h3 id="india-sales-chart-title">State-wise Revenue</h3>
                    <p>Hover a bar for its order count and revenue. Green marks the highest revenue.</p>
                  </div>
                </div>
                <IndiaSalesChart states={sales.states} />
              </section>

              <section className="admin-india-panel admin-india-table-panel" aria-labelledby="india-sales-table-title">
                <div className="admin-india-panel-heading">
                  <div>
                    <h3 id="india-sales-table-title">Sales by State and Union Territory</h3>
                    <p>Sorted by total revenue, highest first.</p>
                  </div>
                </div>
                <div className="admin-india-table-scroll">
                  <table className="admin-india-table">
                    <thead>
                      <tr>
                        <th scope="col">State Name</th>
                        <th scope="col">Total Orders</th>
                        <th scope="col">Total Quantity Sold</th>
                        <th scope="col">Total Revenue</th>
                        <th scope="col">Average Order Value</th>
                        <th scope="col">Revenue Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.states.map((state) => (
                        <tr key={state.key}>
                          <th scope="row">{state.name}</th>
                          <td>{state.orders.toLocaleString('en-IN')}</td>
                          <td>{state.quantity.toLocaleString('en-IN')}</td>
                          <td>{formatCurrency(state.revenue)}</td>
                          <td>{formatCurrency(state.averageOrderValue)}</td>
                          <td>{state.revenuePercentage.toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row">Total</th>
                        <td>{sales.totalOrders.toLocaleString('en-IN')}</td>
                        <td>{sales.totalQuantity.toLocaleString('en-IN')}</td>
                        <td>{formatCurrency(sales.totalRevenue)}</td>
                        <td>{formatCurrency(sales.totalOrders ? sales.totalRevenue / sales.totalOrders : 0)}</td>
                        <td>100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </section>
            </>
          )}
        </>
      )}
    </section>
  );
};

const IndiaSalesChart = ({ states }) => {
  const left = 82;
  const top = 24;
  const baseline = 245;
  const plotHeight = baseline - top;
  const slot = 126;
  const width = Math.max(700, left + states.length * slot + 20);
  const maxRevenue = Math.max(1, ...states.map((state) => state.revenue));
  const highestRevenueState = states[0]?.key;
  const barWidth = 42;
  const chartHeight = 365;

  return (
    <div className="admin-india-chart-scroll">
      <svg
        className="admin-india-chart"
        viewBox={`0 0 ${width} ${chartHeight}`}
        width={width}
        height={chartHeight}
        role="img"
        aria-label="State names and total sales revenue"
      >
        {[0, 1, 2, 3, 4].map((step) => {
          const value = (maxRevenue / 4) * step;
          const y = baseline - (plotHeight / 4) * step;
          return (
            <g key={step}>
              <line x1={left} x2={width - 16} y1={y} y2={y} className="admin-india-gridline" />
              <text x={left - 10} y={y + 4} textAnchor="end" className="admin-india-axis-label">{formatCurrency(value)}</text>
            </g>
          );
        })}
        <text x={left / 2} y={top + plotHeight / 2} transform={`rotate(-90 ${left / 2} ${top + plotHeight / 2})`} className="admin-india-y-axis-title">
          Total sales revenue
        </text>
        {states.map((state, index) => {
          const x = left + index * slot + (slot - barWidth) / 2;
          const barHeight = (state.revenue / maxRevenue) * plotHeight;
          const labelX = x + barWidth / 2;
          return (
            <g key={state.key} className={`admin-india-bar-group${state.key === highestRevenueState ? ' is-top-state' : ''}`}>
              <rect
                x={x}
                y={baseline - barHeight}
                width={barWidth}
                height={Math.max(1, barHeight)}
                rx="6"
                className="admin-india-bar"
              >
                <title>{`${state.name}: ${state.orders} orders, ${formatCurrency(state.revenue)} revenue`}</title>
              </rect>
              <text
                x={labelX}
                y={Math.max(14, baseline - barHeight - 8)}
                textAnchor="middle"
                className="admin-india-revenue-label"
              >
                {formatCurrency(state.revenue)}
              </text>
              <text
                x={labelX}
                y={baseline + 22}
                transform={`rotate(-42 ${labelX} ${baseline + 22})`}
                textAnchor="end"
                className="admin-india-state-label"
              >
                {state.name}
              </text>
            </g>
          );
        })}
        <line x1={left} x2={width - 16} y1={baseline} y2={baseline} className="admin-india-baseline" />
      </svg>
    </div>
  );
};

export default StateWiseSalesAnalytics;
