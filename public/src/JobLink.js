import './Joblink.css';
import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { HashRouter } from 'react-router-dom';
import Home from './Home';
import Trending from './Trending';
import Following from './Following';
import Liked from './Liked';
import Profile from './Profile';
import Search from './Search';
import Landing from './Landing';
import UserAccountPanel from './UserAccountPanel';
import EmployerAccountPanel from './EmployerAccountPanel';
import AccountTypeSelector from './AccountTypeSelector';
import UserProfile from './UserProfile';
import SubscriptionModal from './SubscriptionModal';
import PremiumPanel from './PremiumPanel';
import { Admin } from './Admin/Admin';
import { PROFILES_DATA } from './profilesData';
import { filterProfiles } from './searchUtils';

function Joblink() {
  const [activeTab, setActiveTab] = useState('Home');
  const [showAccountPanel, setShowAccountPanel] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountTypeSelector, setShowAccountTypeSelector] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedAccountType, setSelectedAccountType] = useState(null);
  const [likedItems, setLikedItems] = useState({});
  const [bookmarkedItems, setBookmarkedItems] = useState({});
  const [followingItems, setFollowingItems] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showLanding, setShowLanding] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUpgradePanel, setShowUpgradePanel] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [userCreatedProfiles, setUserCreatedProfiles] = useState(() => {
    // Load from localStorage on initial mount
    try {
      const saved = localStorage.getItem('userCreatedProfiles');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Error loading profiles from localStorage:', error);
      return [];
    }
  });
  const isInitialMount = useRef(true);
  const previousRoute = useRef('/home'); // Track previous route for profile form closes
  const inactivityTimerRef = useRef(null);
  const INACTIVITY_TIMEOUT = 3 * 60 * 1000; // 3 minutes in milliseconds

  // Utility function to navigate using hash-based routing
  const navigateTo = useCallback((route) => {
    // Save current route as previous route if navigating to a profile page
    if (route.includes('edit-profile')) {
      previousRoute.current = window.location.hash.slice(1) || '/home';
      console.log('Saving previous route:', previousRoute.current);
    }
    window.location.hash = route;
  }, []);

  // Utility function to get current hash
  const getCurrentHash = useCallback(() => {
    const hash = window.location.hash.slice(1) || '';
    
    // If no hash, decide based on whether user has created profiles
    if (!hash) {
      // Return /landing for new users (no profiles), /home for returning users
      return userCreatedProfiles.length > 0 ? '/home' : '/landing';
    }
    
    return hash;
  }, [userCreatedProfiles.length]);

  // Parse hash and update state accordingly
  const parseHashAndUpdateState = useCallback(() => {
    const hash = getCurrentHash();
    console.log('Current hash:', hash);

    // Reset all states initially
    setShowAccountPanel(false);
    setShowProfileMenu(false);
    setShowAccountTypeSelector(false);
    setShowSubscriptionModal(false);
    setShowUpgradePanel(false);
    setShowAdminPanel(false);

    if (hash === '/landing') {
      setShowLanding(true);
      setActiveTab('Home');
    } else if (hash.startsWith('/admin')) {
      setShowAdminPanel(true);
      setShowLanding(false);
    } else if (hash === '/account-type-selector') {
      setShowLanding(false);
      setShowAccountTypeSelector(true);
    } else if (hash === '/edit-profile-employee') {
      setShowLanding(false);
      setShowAccountTypeSelector(false);
      setShowAccountPanel(true);
      setSelectedAccountType('employee');
      setActiveTab('Profile');
    } else if (hash === '/edit-profile-employer') {
      setShowLanding(false);
      setShowAccountTypeSelector(false);
      setShowAccountPanel(true);
      setSelectedAccountType('employer');
      setActiveTab('Profile');
    } else if (hash === '/upgrade-panel') {
      setShowUpgradePanel(true);
    } else if (hash === '/subscription-modal') {
      setShowSubscriptionModal(true);
    } else if (hash.startsWith('/')) {
      // App tabs: /home, /trending, /following, /liked
      const routeName = hash.slice(1); // Remove the leading slash
      const tab = routeName.charAt(0).toUpperCase() + routeName.slice(1); // Capitalize first letter
      const tabMap = {
        'Home': 'Home',
        'Trending': 'Trending',
        'Following': 'Following',
        'Liked': 'Liked',
        'Profile': 'Profile'
      };
      
      if (tabMap[tab]) {
        // Save as previous route if it's not a profile page
        if (!hash.includes('edit-profile')) {
          previousRoute.current = hash;
          console.log('Updated previous route to:', previousRoute.current);
        }
        setShowLanding(false);
        setShowAccountTypeSelector(false);
        setShowAccountPanel(false);
        setActiveTab(tab);
      } else {
        // Default based on user status: show landing for new users, home for returning users
        if (userCreatedProfiles.length > 0) {
          navigateTo('/home');
        } else {
          navigateTo('/landing');
        }
      }
    }
  }, [getCurrentHash, navigateTo, userCreatedProfiles.length]); 

  // Handle hash changes - applies on mount and whenever hash changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      parseHashAndUpdateState();
    }
  }, [parseHashAndUpdateState]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      parseHashAndUpdateState();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [parseHashAndUpdateState]);

  // Inactivity detection - show Landing page after inactivity (only for new users)
  useEffect(() => {
    const resetInactivityTimer = () => {
      // Clear existing timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }

      // Don't trigger inactivity for users with created profiles
      if (userCreatedProfiles.length > 0) {
        return;
      }

      // Don't start timer if already on Landing page
      const currentHash = window.location.hash.slice(1) || '/home';
      if (currentHash === '/landing') {
        return;
      }

      // Set new timer - navigate to landing after inactivity
      inactivityTimerRef.current = setTimeout(() => {
        console.log('Inactivity detected - showing Landing page');
        navigateTo('/landing');
      }, INACTIVITY_TIMEOUT);
    };

    // Listen for user interactions
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      window.addEventListener(event, resetInactivityTimer);
    });

    // Start the initial timer
    resetInactivityTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, resetInactivityTimer);
      });
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [navigateTo, userCreatedProfiles, INACTIVITY_TIMEOUT]);

  // Save user created profiles to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('userCreatedProfiles', JSON.stringify(userCreatedProfiles));
      console.log('Profiles saved to localStorage:', userCreatedProfiles);
    } catch (error) {
      console.error('Error saving profiles to localStorage:', error);
    }
  }, [userCreatedProfiles]);

  // Memoized filtered profiles based on search term
  const allProfiles = useMemo(
    () => {
      // Combine PROFILES_DATA with user-created profiles
      return [...PROFILES_DATA, ...userCreatedProfiles];
    },
    [userCreatedProfiles]
  );

  const filteredProfiles = useMemo(
    () => filterProfiles(allProfiles, searchTerm),
    [allProfiles, searchTerm]
  );

  const toggleLiked = (jobId) => {
    setLikedItems(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const toggleBookmarked = (jobId) => {
    setBookmarkedItems(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const toggleFollowing = (jobId) => {
    setFollowingItems(prev => ({
      ...prev,
      [jobId]: !prev[jobId]
    }));
  };

  const handleSearchChange = (term) => {
    setSearchTerm(term);
  };

  const handleOpenProfile = () => {
    setShowProfileMenu(false);
    
    // If a profile has been created, load it for editing instead of creating a new one
    if (userCreatedProfiles.length > 0) {
      const userProfile = userCreatedProfiles[0]; // Load the first created profile
      console.log('Loading profile for editing:', userProfile);
      setSelectedAccount(userProfile);
      setSelectedAccountType(userProfile.userType);
      // Navigate to edit profile page
      if (userProfile.userType === 'employee') {
        navigateTo('/edit-profile-employee');
      } else if (userProfile.userType === 'employer') {
        navigateTo('/edit-profile-employer');
      }
    } else {
      // No profile created yet, clear selectedAccount to show create mode
      console.log('No profile found, showing create form');
      setSelectedAccount(null);
      // Ensure selectedAccountType is set from localStorage if available
      const savedType = localStorage.getItem('accountType');
      if (savedType) {
        setSelectedAccountType(savedType);
        // Navigate to edit profile page
        if (savedType === 'employee') {
          navigateTo('/edit-profile-employee');
        } else if (savedType === 'employer') {
          navigateTo('/edit-profile-employer');
        }
      } else {
        navigateTo('/account-type-selector');
      }
    }
  };

  const handleSwitchAccount = () => {
    setShowProfileMenu(false);
    navigateTo('/account-type-selector');
  };

  const handleSelectAccountType = (accountType, profession) => {
    setSelectedAccountType(accountType);
    localStorage.setItem('accountType', accountType);
    if (profession) {
      localStorage.setItem('selectedProfession', JSON.stringify(profession));
    }
    // Navigate to appropriate form page
    if (accountType === 'employee') {
      navigateTo('/edit-profile-employee');
    } else if (accountType === 'employer') {
      navigateTo('/edit-profile-employer');
    }
  };

  const handleProfileCreated = (profileData) => {
    setSelectedAccount(profileData);
    
    // Add the created profile to the grid list
    const newProfile = {
      id: PROFILES_DATA.length + userCreatedProfiles.length + 1,
      userType: profileData.userType || 'employee',
      
      // Basic Info
      name: profileData.name || '',
      email: profileData.email || '',
      phone: profileData.phone || '',
      avatar: profileData.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=NewUser',
      title: profileData.title || 'Professional',
      bio: profileData.bio || '',
      location: profileData.location || '',
      
      // Professional Info
      skills: Array.isArray(profileData.skills) ? profileData.skills : (profileData.skills ? profileData.skills.split(',').map(s => s.trim()) : []),
      certifications: Array.isArray(profileData.certifications) ? profileData.certifications : (profileData.certifications ? profileData.certifications.split(',').map(c => c.trim()) : []),
      experience: profileData.experience || '',
      hourlyRate: profileData.hourlyRate || '',
      availability: profileData.availability || 'Available',
      languages: Array.isArray(profileData.languages) ? profileData.languages : (profileData.languages ? [profileData.languages] : []),
      timezone: profileData.timezone || '',
      
      // Work Preferences
      projectTypes: Array.isArray(profileData.projectTypes) ? profileData.projectTypes : (profileData.projectTypes ? profileData.projectTypes.split(',').map(p => p.trim()) : []),
      workStyle: profileData.workStyle || 'Remote',
      
      // Portfolio & Social Links
      portfolioWebsite: profileData.portfolioWebsite || '',
      github: profileData.github || '',
      linkedin: profileData.linkedin || '',
      twitter: profileData.twitter || '',
      instagram: profileData.instagram || '',
      facebook: profileData.facebook || '',
      tiktok: profileData.tiktok || '',
      whatsapp: profileData.whatsapp || '',
      
      // Grid Display Fields
      rating: 5,
      followers: 0,
      completedProjects: 0,
      responseTime: '< 1 hour',
      reviews: []
    };
    
    console.log('Profile created:', newProfile); // Debug log
    console.log('Profile data details - Skills:', newProfile.skills, 'Certifications:', newProfile.certifications, 'Languages:', newProfile.languages);
    
    // Add the new profile to the list
    setUserCreatedProfiles(prev => {
      const updated = [...prev, newProfile];
      console.log('User created profiles updated:', updated); // Debug log
      return updated;
    });
    
    // Navigate to Home tab after creating profile
    setTimeout(() => {
      navigateTo('/home');
    }, 100);
  };

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem('accountType');
    localStorage.removeItem('userAvatar');
    localStorage.removeItem('selectedProfession');
    setSelectedAccount(null);
    setSelectedAccountType(null);
    setShowProfileMenu(false);
    setShowAccountPanel(false);
    navigateTo('/landing'); // Navigate to landing page
  };

  const renderComponent = () => {
    const userProfileId = userCreatedProfiles.length > 0 ? userCreatedProfiles[userCreatedProfiles.length - 1].id : null;
    
    switch (activeTab) {
      case 'Home':
        return <Home profiles={filteredProfiles} searchTerm={searchTerm} onToggleLiked={toggleLiked} likedItems={likedItems} onToggleBookmarked={toggleBookmarked} bookmarkedItems={bookmarkedItems} onToggleFollowing={toggleFollowing} followingItems={followingItems} userProfileId={userProfileId} onSearchChange={handleSearchChange} />;
      case 'Trending':
        return <Trending profiles={filteredProfiles} searchTerm={searchTerm} onToggleLiked={toggleLiked} likedItems={likedItems} onToggleBookmarked={toggleBookmarked} bookmarkedItems={bookmarkedItems} onToggleFollowing={toggleFollowing} followingItems={followingItems} userProfileId={userProfileId} onSearchChange={handleSearchChange} />;
      case 'Following':
        return <Following profiles={filteredProfiles} searchTerm={searchTerm} onToggleLiked={toggleLiked} likedItems={likedItems} onToggleBookmarked={toggleBookmarked} bookmarkedItems={bookmarkedItems} onToggleFollowing={toggleFollowing} followingItems={followingItems} userProfileId={userProfileId} onSearchChange={handleSearchChange} />;
      case 'Liked':
        return <Liked profiles={filteredProfiles} searchTerm={searchTerm} likedItems={likedItems} bookmarkedItems={bookmarkedItems} onToggleLiked={toggleLiked} onToggleBookmarked={toggleBookmarked} onToggleFollowing={toggleFollowing} followingItems={followingItems} userProfileId={userProfileId} onSearchChange={handleSearchChange} />;
      default:
        return <Home profiles={filteredProfiles} searchTerm={searchTerm} onToggleLiked={toggleLiked} likedItems={likedItems} onToggleBookmarked={toggleBookmarked} bookmarkedItems={bookmarkedItems} onToggleFollowing={toggleFollowing} followingItems={followingItems} userProfileId={userProfileId} onSearchChange={handleSearchChange} />;
    }
  };

  if (showLanding) {
    return <Landing onGetStarted={() => {
      navigateTo('/account-type-selector');
    }} />;
  }

  // Show admin panel wrapped with HashRouter for React Router support
  if (showAdminPanel) {
    return (
      <HashRouter>
        <Admin />
      </HashRouter>
    );
  }

  // Show account type selector (which now includes welcome)
  if (showAccountTypeSelector && !showAccountPanel) {
    return (
      <AccountTypeSelector 
        onSelectAccountType={handleSelectAccountType}
        onClose={() => {
          navigateTo('/landing');
        }}
      />
    );
  }

  // Show account form as full page
  if (showAccountPanel && selectedAccountType === 'employee') {
    return (
      <div className="Joblink">
        <header className="Joblink-header-title">
          <div className="Joblink-header-top">
            <button 
              className="back-button"
              onClick={() => navigateTo(previousRoute.current || '/home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00d4ff',
                fontSize: '20px',
                cursor: 'pointer',
                marginRight: '20px'
              }}
            >
              ← Back
            </button>
            <h1>JobLink</h1>
            <Search profiles={PROFILES_DATA} onSearchChange={handleSearchChange} />
          </div>
        </header>
        <div className="Joblink-content">
          <UserAccountPanel 
            selectedAccount={selectedAccount} 
            onClose={() => navigateTo(previousRoute.current || '/home')} 
            onProfileCreated={handleProfileCreated} 
            onBack={() => navigateTo(previousRoute.current || '/home')} 
          />
        </div>
      </div>
    );
  }

  if (showAccountPanel && selectedAccountType === 'employer') {
    return (
      <div className="Joblink">
        <header className="Joblink-header-title">
          <div className="Joblink-header-top">
            <button 
              className="back-button"
              onClick={() => navigateTo(previousRoute.current || '/home')}
              style={{
                background: 'none',
                border: 'none',
                color: '#00d4ff',
                fontSize: '20px',
                cursor: 'pointer',
                marginRight: '20px'
              }}
            >
              ← Back
            </button>
            <h1>JobLink</h1>
            <Search profiles={PROFILES_DATA} onSearchChange={handleSearchChange} />
          </div>
        </header>
        <div className="Joblink-content">
          <EmployerAccountPanel 
            selectedAccount={selectedAccount} 
            onClose={() => navigateTo(previousRoute.current || '/home')} 
            onProfileCreated={handleProfileCreated} 
            onBack={() => navigateTo(previousRoute.current || '/home')} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="Joblink" onClick={() => {
      setShowProfileMenu(false);
    }}>
      <header className="Joblink-header-title">
        <div className="Joblink-header-top">
          <h1>JobLink</h1>
        </div>
        <div className="tabs-container">
          <button
            className={`tab-button ${activeTab === 'Home' ? 'active' : ''}`}
            onClick={() => navigateTo('/home')}
          >
            Home
          </button>
          <button
            className={`tab-button ${activeTab === 'Trending' ? 'active' : ''}`}
            onClick={() => navigateTo('/trending')}
          >
            Trending
          </button>
          {Object.values(followingItems).some(v => v) && (
            <button
              className={`tab-button ${activeTab === 'Following' ? 'active' : ''}`}
              onClick={() => navigateTo('/following')}
            >
              Following
            </button>
          )}
          {(Object.values(likedItems).some(v => v) || Object.values(bookmarkedItems).some(v => v)) && (
            <button
              className={`tab-button ${activeTab === 'Liked' ? 'active' : ''}`}
              onClick={() => navigateTo('/liked')}
            >
              Liked
            </button>
          )}
        </div>
      </header>
      <div className="profile-wrapper" onClick={(e) => {
        e.stopPropagation();
        setShowProfileMenu(!showProfileMenu);
      }}>
        <Profile />
        {showProfileMenu && (
          <UserProfile 
            selectedAccount={selectedAccount}
            onOpenProfile={handleOpenProfile}
            onSwitchAccount={handleSwitchAccount}
            onLogout={handleLogout}
            onUpgrade={() => navigateTo('/upgrade-panel')}
          />
        )}

      </div>
      <SubscriptionModal
        isOpen={showSubscriptionModal}
        onClose={() => {
          navigateTo('/home'); // Return to home after closing subscription modal
          setSelectedUpgradePlan(null);
        }}
        user={selectedAccount}
        product="joblink"
        selectedPlan={selectedUpgradePlan}
      />
      
      {/* Premium Upgrade Panels */}
      {showUpgradePanel && (
        <PremiumPanel 
          onClose={() => navigateTo('/home')}
          onSelectPlan={(selectedPlan) => {
            setSelectedUpgradePlan(selectedPlan);
            navigateTo('/subscription-modal');
          }}
        />
      )}

      <div className="Joblink-content">
        {renderComponent()}
      </div>
    </div>
  );
}

export default Joblink;
