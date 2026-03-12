import React from 'react';
import { 
  FaStore, FaChartBar, FaReceipt, FaBoxes, FaShippingFast, 
  FaMoneyCheckAlt, FaHandHoldingUsd, FaFileInvoiceDollar, 
  FaTags, FaPercentage, FaCalendarAlt, FaClock, FaPlus, 
  FaEdit, FaCrown, FaFilter, FaStar, FaChartLine
} from 'react-icons/fa';

export const SellerTab = ({
  profile,
  sellerStats,
  sellerProducts,
  sellerOrders,
  setShowNewProductForm,
  setShowSellerVerification,
  setShowPremiumModal
}) => {
  return (
    <div className="seller-tab">
      <div className="seller-header">
        <h2>Seller Dashboard</h2>
        <div className="seller-actions">
          <button 
            className="add-product"
            onClick={() => setShowNewProductForm(true)}
          >
            + Add New Product
          </button>
          <button className="seller-analytics">
            <FaChartBar /> Analytics
          </button>
        </div>
      </div>
      
      <div className="seller-stats">
        <div className="stat-card">
          <h3>${sellerStats.revenue.toLocaleString()}</h3>
          <p>Total Revenue</p>
          <div className="stat-trend">
            <FaChartLine className="up" />
            <span>12% from last month</span>
          </div>
        </div>
        <div className="stat-card">
          <h3>{sellerStats.sales.toLocaleString()}</h3>
          <p>Total Sales</p>
          <div className="stat-trend">
            <FaChartLine className="up" />
            <span>8% from last month</span>
          </div>
        </div>
        <div className="stat-card">
          <h3>{sellerStats.visitors.toLocaleString()}</h3>
          <p>Store Visitors</p>
          <div className="stat-trend">
            <FaChartLine className="up" />
            <span>5% from last month</span>
          </div>
        </div>
        <div className="stat-card">
          <h3>{sellerStats.conversion}%</h3>
          <p>Conversion Rate</p>
          <div className="stat-trend">
            <FaChartLine className="up" />
            <span>2% from last month</span>
          </div>
        </div>
      </div>
      
      <div className="seller-content">
        <div className="recent-orders">
          <div className="section-header">
            <h3>Recent Orders</h3>
            <button className="view-all">View All</button>
          </div>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sellerOrders.map(order => (
                <tr key={order.id}>
                  <td>#{order.id.split('-')[1]}</td>
                  <td>{order.customer}</td>
                  <td>{new Date(order.date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status ${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </td>
                  <td>${order.total.toFixed(2)}</td>
                  <td>
                    <button className="view-order">
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="products-management">
          <div className="section-header">
            <h3>Your Products ({sellerProducts.length})</h3>
            <div className="product-filters">
              <select>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button className="filter-button">
                <FaFilter /> Filter
              </button>
            </div>
          </div>
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Sales</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {sellerProducts.map(product => (
                <tr key={product.id}>
                  <td className="product-name">
                    <img src={product.images?.[0] || ''} alt="" />
                    <span>{product.name}</span>
                  </td>
                  <td>${product.price.toFixed(2)}</td>
                  <td>{product.stock}</td>
                  <td>{product.sales}</td>
                  <td>
                    <div className="product-rating">
                      <FaStar className="filled" />
                      <span>{product.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status ${product.status}`}>
                      {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                    </span>
                  </td>
                  <td>
                    <button className="edit-product">
                      <FaEdit /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};