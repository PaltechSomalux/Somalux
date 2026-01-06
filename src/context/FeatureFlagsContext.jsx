/**
 * FeatureFlagsProvider & Context
 * Manages feature flags with auto-refresh, caching, and WebSocket updates
 * Similar to WhatsApp's feature distribution system
 */

import React, { createContext, useEffect, useRef, useState, useCallback } from 'react';
import axios from 'axios';

export const FeatureFlagsContext = createContext();

const FEATURES_CACHE_KEY = 'app_features_cache';
const FEATURES_TIMESTAMP_KEY = 'app_features_timestamp';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes

export const FeatureFlagsProvider = ({ children }) => {
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const refreshTimerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  /**
   * Fetch features from backend
   */
  const fetchFeatures = useCallback(async () => {
    try {
      // Get user context if available (from localStorage or auth hook)
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;

      const params = {};
      if (user?.id) params.user_id = user.id;
      if (user?.tier) params.user_tier = user.tier;

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/features`,
        { params, timeout: 5000 }
      );

      const newFeatures = response.data.features || {};

      // Update cache
      localStorage.setItem(FEATURES_CACHE_KEY, JSON.stringify(newFeatures));
      localStorage.setItem(FEATURES_TIMESTAMP_KEY, Date.now().toString());

      setFeatures(newFeatures);
      setError(null);
      return newFeatures;
    } catch (err) {
      console.error('Error fetching features:', err);
      
      // Try to use cached features
      const cachedFeatures = localStorage.getItem(FEATURES_CACHE_KEY);
      if (cachedFeatures) {
        const parsed = JSON.parse(cachedFeatures);
        setFeatures(parsed);
        setError('Using cached features - network unavailable');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Setup WebSocket for real-time feature updates
   */
  const setupWebSocket = useCallback(() => {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}`;
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return; // Already connected
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('Feature flags WebSocket connected');
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);

          if (message.type === 'feature_update') {
            // Feature was updated on the server
            // Refresh features automatically
            console.log('Feature update received, refreshing...', message.feature);
            fetchFeatures();
          }
        } catch (err) {
          console.error('Error processing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('Feature flags WebSocket error:', error);
      };

      ws.onclose = () => {
        console.log('Feature flags WebSocket disconnected');
        wsRef.current = null;
        // Reconnect after 5 seconds
        setTimeout(setupWebSocket, 5000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to setup WebSocket:', err);
    }
  }, [fetchFeatures]);

  /**
   * Initialize features on mount
   */
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    // Try to load from cache first
    const cachedFeatures = localStorage.getItem(FEATURES_CACHE_KEY);
    const timestamp = localStorage.getItem(FEATURES_TIMESTAMP_KEY);
    const now = Date.now();

    if (cachedFeatures && timestamp && (now - parseInt(timestamp)) < CACHE_DURATION) {
      setFeatures(JSON.parse(cachedFeatures));
      setLoading(false);
    }

    // Fetch fresh features from backend
    fetchFeatures();

    // Setup WebSocket for real-time updates
    setupWebSocket();

    // Setup periodic refresh
    const timer = setInterval(fetchFeatures, REFRESH_INTERVAL);
    refreshTimerRef.current = timer;

    return () => {
      clearInterval(timer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [fetchFeatures, setupWebSocket]);

  /**
   * Manual refresh function for components
   */
  const refreshFeatures = useCallback(async () => {
    setLoading(true);
    await fetchFeatures();
  }, [fetchFeatures]);

  /**
   * Check if a feature is enabled
   */
  const isFeatureEnabled = useCallback((featureKey) => {
    return features[featureKey]?.enabled || false;
  }, [features]);

  /**
   * Get feature config
   */
  const getFeatureConfig = useCallback((featureKey) => {
    return features[featureKey]?.config || {};
  }, [features]);

  const value = {
    features,
    loading,
    error,
    isFeatureEnabled,
    getFeatureConfig,
    refreshFeatures,
  };

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export default FeatureFlagsContext;
