/**
 * FEATURE FLAGS INTEGRATION EXAMPLES
 * 
 * Copy-paste examples for common use cases
 * Shows how to integrate feature flags into your existing components
 */

// ============================================================
// EXAMPLE 1: Simple Feature Toggle in Component
// ============================================================

import { useFeatureGate } from '../hooks/useFeatureFlags';

function DarkModeComponent() {
  const isDarkModeEnabled = useFeatureGate('dark_mode');
  
  return (
    <div style={{
      backgroundColor: isDarkModeEnabled ? '#1a1a1a' : '#ffffff',
      color: isDarkModeEnabled ? '#ffffff' : '#000000',
    }}>
      <h1>Welcome</h1>
      {isDarkModeEnabled && <p>Dark mode is active!</p>}
    </div>
  );
}

export default DarkModeComponent;


// ============================================================
// EXAMPLE 2: Feature with Configuration
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function SearchUI() {
  const { enabled, config } = useFeatureFlag('new_search_ui');
  
  const columns = config.columns || 2;
  const resultsPerPage = config.resultsPerPage || 10;
  
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px'
    }}>
      {/* Search results rendered with config */}
    </div>
  );
}

export default SearchUI;


// ============================================================
// EXAMPLE 3: Conditional Rendering - New vs Old UI
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function SearchPage() {
  const { enabled: useNewUI } = useFeatureFlag('new_search_ui');
  
  return (
    <>
      {useNewUI ? (
        <NewSearchUI />
      ) : (
        <OldSearchUI />
      )}
    </>
  );
}

export default SearchPage;


// ============================================================
// EXAMPLE 4: Feature-Based Layout Changes
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function Dashboard() {
  const { enabled: hasNewLayout } = useFeatureFlag('dashboard_redesign');
  const { enabled: hasAnalytics } = useFeatureFlag('advanced_analytics');
  
  return (
    <div>
      <Header />
      
      {hasNewLayout ? (
        <ModernLayout>
          {hasAnalytics && <AnalyticsDashboard />}
          <Content />
        </ModernLayout>
      ) : (
        <ClassicLayout>
          <Content />
        </ClassicLayout>
      )}
      
      <Footer />
    </div>
  );
}

export default Dashboard;


// ============================================================
// EXAMPLE 5: Lazy Loading Components Based on Feature
// ============================================================

import { lazy, Suspense } from 'react';
import { useFeatureGate } from '../hooks/useFeatureFlags';

const BetaAnalytics = lazy(() => import('./BetaAnalytics'));

function App() {
  const hasBetaAnalytics = useFeatureGate('beta_analytics');
  
  return (
    <main>
      <Header />
      <Content />
      
      {hasBetaAnalytics && (
        <Suspense fallback={<div>Loading analytics...</div>}>
          <BetaAnalytics />
        </Suspense>
      )}
      
      <Footer />
    </main>
  );
}

export default App;


// ============================================================
// EXAMPLE 6: Feature-Based Button Styling
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function SubmitButton() {
  const { enabled, config } = useFeatureFlag('button_redesign');
  
  const buttonStyle = enabled ? {
    backgroundColor: config.backgroundColor || '#007bff',
    padding: config.padding || '12px 24px',
    borderRadius: config.borderRadius || '8px',
  } : {
    backgroundColor: '#0056b3',
    padding: '10px 20px',
    borderRadius: '4px',
  };
  
  return (
    <button style={buttonStyle}>
      Submit
    </button>
  );
}

export default SubmitButton;


// ============================================================
// EXAMPLE 7: A/B Testing Different Variants
// ============================================================

import { useFeatureFlag, useFeatureFlags } from '../hooks/useFeatureFlags';

function CTASection() {
  const { features } = useFeatureFlags();
  
  // Feature with 50% rollout - different users see different variants
  const variantA = features['cta_variant_a']?.enabled || false;
  
  return (
    <section>
      {variantA ? (
        <Button variant="primary" size="large">
          Get Started Now
        </Button>
      ) : (
        <Button variant="outline" size="medium">
          Learn More
        </Button>
      )}
    </section>
  );
}

export default CTASection;


// ============================================================
// EXAMPLE 8: Feature-Based API Endpoints
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';
import axios from 'axios';

function DataFetcher() {
  const { enabled: useNewAPI } = useFeatureFlag('new_api_v2');
  
  const fetchData = async () => {
    const endpoint = useNewAPI 
      ? '/api/v2/data' 
      : '/api/v1/data';
    
    const response = await axios.get(endpoint);
    return response.data;
  };
  
  return (
    <button onClick={() => fetchData()}>
      Fetch Data
    </button>
  );
}

export default DataFetcher;


// ============================================================
// EXAMPLE 9: Tier-Based Feature Access
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function PremiumFeatures() {
  // In admin, set min_tier: 'pro' for this feature
  const { enabled: hasPremiumAnalytics } = useFeatureFlag('premium_analytics');
  
  if (!hasPremiumAnalytics) {
    return (
      <div className="upgrade-prompt">
        <p>Upgrade to Pro to access Advanced Analytics</p>
        <button>Upgrade Now</button>
      </div>
    );
  }
  
  return <AdvancedAnalytics />;
}

export default PremiumFeatures;


// ============================================================
// EXAMPLE 10: Analytics Tracking with Features
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { useEffect } from 'react';

function PageWithTracking() {
  const { enabled: newUI, version } = useFeatureFlag('new_ui');
  
  useEffect(() => {
    // Track which feature variant user has
    window.analytics?.track('page_view', {
      feature_new_ui: newUI,
      feature_version: version,
      timestamp: new Date()
    });
  }, [newUI, version]);
  
  return <div>{newUI ? <NewUI /> : <OldUI />}</div>;
}

export default PageWithTracking;


// ============================================================
// EXAMPLE 11: Feature Fallback / Error Handling
// ============================================================

import { useFeatureFlag, useFeatureFlags } from '../hooks/useFeatureFlags';

function AdvancedSearch() {
  const { enabled: hasFeature, config, version } = useFeatureFlag('advanced_search');
  const { loading, error } = useFeatureFlags();
  
  // Feature flags not loaded yet
  if (loading) {
    return <SearchSkeleton />;
  }
  
  // Error loading features - use safe defaults
  if (error) {
    console.warn('Features unavailable:', error);
    return <BasicSearch />;
  }
  
  // Feature available
  if (hasFeature) {
    return <AdvancedSearchUI config={config} />;
  }
  
  // Feature not available
  return <BasicSearch />;
}

export default AdvancedSearch;


// ============================================================
// EXAMPLE 12: Feature Validation in Forms
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function UserForm() {
  const { enabled: requirePhoneNumber } = useFeatureFlag('two_factor_auth_required');
  const { enabled: advancedValidation, config } = useFeatureFlag('advanced_form_validation');
  
  return (
    <form>
      <input type="email" placeholder="Email" required />
      
      {requirePhoneNumber && (
        <input type="tel" placeholder="Phone" required />
      )}
      
      {advancedValidation && (
        <>
          <input 
            type="password" 
            placeholder="Password"
            minLength={config.minPasswordLength || 8}
            required
          />
          <PasswordStrengthMeter minLength={config.minPasswordLength} />
        </>
      )}
      
      <button type="submit">Sign Up</button>
    </form>
  );
}

export default UserForm;


// ============================================================
// EXAMPLE 13: Monitoring Feature Performance
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';
import { useEffect, useState } from 'react';

function MonitoredComponent() {
  const { enabled, version } = useFeatureFlag('performance_feature');
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      // Send performance metrics
      fetch('/api/analytics/performance', {
        method: 'POST',
        body: JSON.stringify({
          feature: 'performance_feature',
          enabled,
          version,
          duration,
          timestamp: new Date()
        })
      });
    };
  }, [enabled, version]);
  
  return <div>{enabled ? <Feature /> : <Default />}</div>;
}

export default MonitoredComponent;


// ============================================================
// EXAMPLE 14: Feature Chaining / Dependencies
// ============================================================

import { useFeatureFlag } from '../hooks/useFeatureFlags';

function DependentFeatures() {
  const { enabled: hasNewUI } = useFeatureFlag('new_ui');
  const { enabled: hasDarkMode } = useFeatureFlag('dark_mode');
  
  // Dark mode only available with new UI
  const darkModeAvailable = hasNewUI && hasDarkMode;
  
  return (
    <div>
      {hasNewUI ? (
        <NewUI darkMode={darkModeAvailable} />
      ) : (
        <OldUI />
      )}
    </div>
  );
}

export default DependentFeatures;


// ============================================================
// EXAMPLE 15: Setup in App.jsx (Complete)
// ============================================================

import { FeatureFlagsProvider } from './context/FeatureFlagsContext';
import { registerServiceWorker } from './utils/serviceWorkerManager';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Register service worker for smart caching
    registerServiceWorker();
  }, []);
  
  return (
    <FeatureFlagsProvider>
      <Router>
        <Routes>
          {/* Your routes */}
        </Routes>
      </Router>
    </FeatureFlagsProvider>
  );
}

export default App;

// ============================================================
// END OF EXAMPLES
// ============================================================
