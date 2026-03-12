import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { DotsThreeVertical, List, X } from "phosphor-react";
import logo from "../../Assets/Paltech White.png";
import { UserProfile } from './MyProfile';
import { auth, provider, db } from "../../firebase";
import { signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore"; // Added getDoc import
import "./Navbar1.css";

export const Navbar1 = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [localUser, setLocalUser] = useState(null); // Local state for Firebase auth
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Track auth loading state
  const [savedGoogleEmail, setSavedGoogleEmail] = useState(null); // Store Google account email
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const isConnectListView = location.pathname === '/ConnectMe' &&
    (!location.hash || location.hash === '#chats' || location.hash === '#groups');

  // Helper to check if a nav item should be active based on current path
  const isNavActive = (path) => {
    if (path === '/BookManagement') {
      // Books is active for /BookManagement and /books/* routes
      return location.pathname === '/BookManagement' || location.pathname.startsWith('/books');
    }
    return location.pathname === path;
  };

  // log: Monitor Firebase auth state directly
  useEffect(() => {
    // console.log('Navbar1: Initializing Firebase auth listener');
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setLocalUser(currentUser);
      setIsAuthLoading(false);

      // Store Google email for display in modal
      if (currentUser?.email) {
        setSavedGoogleEmail(currentUser.email);
      }

      // Optional: Check if user doc exists on auth state change and handle if not
      if (currentUser?.uid) {
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            // If doc doesn't exist (edge case), you could sign out or log a warning
            // For now, we'll handle it in handleConnectClick to prompt login
            console.warn('User document does not exist in Firestore');
          }
        } catch (error) {
          console.error('Error checking user document:', error);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);


  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // Google Sign-In Logic
  const handleGoogleSignIn = async (e) => {
    e.preventDefault();
    // console.log('Navbar1: Initiating Google Sign-In');
    try {
      const result = await signInWithPopup(auth, provider);
      const signedInUser = result.user;

      await setDoc(doc(db, "users", signedInUser.uid), {
        uid: signedInUser.uid,
        name: signedInUser.displayName,
        email: signedInUser.email,
        photoURL: signedInUser.photoURL,
        lastLogin: new Date(),
      }, { merge: true });

      setShowConnectModal(false);
      navigate("/ConnectMe");
    } catch (error) {
      // console.error('Navbar1: Google Sign-In failed:', error);
    }
  };

  // Manual sign-in redirect
  const handleManualSignIn = () => {
    // console.log('Navbar1: Redirecting to manual sign-in');
    setShowConnectModal(false);
    navigate("/Registration");
  };

  // Helper function to check if user document exists in Firestore
  const checkUserDocumentExists = async (uid) => {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user document:', error);
      return false;
    }
  };

  // Handle Connect button click
  const handleConnectClick = async () => {
    if (isAuthLoading) {
      // console.log('Navbar1: Authentication state still loading, deferring action');
      return;
    }
    // Prefer localUser from Firebase over prop user to avoid prop lag
    if (localUser?.uid) {
      // Check if user document exists in Firestore
      const docExists = await checkUserDocumentExists(localUser.uid);
      if (docExists) {
        // console.log('Navbar1: User is signed in and doc exists, navigating to /ConnectMe');
        navigate("/ConnectMe");
      } else {
        // If doc doesn't exist, prompt login (e.g., sign out and show modal)
        // console.log('Navbar1: User signed in but doc missing, prompting login');
        await auth.signOut(); // Sign out to reset state
        setLocalUser(null);
        setShowConnectModal(true);
      }
    } else if (user?.uid) {
      // Fallback to prop user (though less preferred)
      const docExists = await checkUserDocumentExists(user.uid);
      if (docExists) {
        // console.log('Navbar1: User is signed in (via prop user) and doc exists, navigating to /ConnectMe');
        navigate("/ConnectMe");
      } else {
        // console.log('Navbar1: User signed in (via prop) but doc missing, prompting login');
        onLogout(); // Assuming onLogout handles sign out
        setShowConnectModal(true);
      }
    } else {
      // console.log('Navbar1: User is not signed in, showing connect modal');
      setShowConnectModal(true);
    }
  };

  // Hide navbar on ConnectMe when in immersive views: chat, channel detail, or group detail
  if (location.pathname === '/ConnectMe' && (location.hash === '#chat' || location.hash === '#channel' || location.hash === '#group')) {
    return null;
  }

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-brand">
            <Link to="/BookManagement" className="navbar-logo">
              <img src={logo} alt="Paltech Logo" className="logo-image" />
              <span style={{ color: "white" }} className="logo-text">Paltech Inc.</span>
            </Link>
          </div>

          {/* Horizontal nav links - always visible and horizontal */}
          <div className="navbar-links">
            <NavLink 
              to="/BookManagement" 
              className={({ isActive }) => {
                const shouldBeActive = isActive || location.pathname.startsWith('/books');
                return `nav-link1 ${shouldBeActive ? 'active' : ''}`;
              }}
              onClick={() => setIsMenuOpen(false)}
            >
              Books
            </NavLink>
            <NavLink 
              to="/University" 
              className={({ isActive }) => `nav-link1 ${isActive ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Campus
            </NavLink>
            <NavLink 
              to="/LectureDashboard" 
              className={({ isActive }) => `nav-link1 ${isActive ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Classes
            </NavLink>
            <NavLink
              to="/ConnectMe"
              className={({ isActive }) => `nav-link1 connect-btn ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                // If not authenticated, show modal instead of navigating
                if (!localUser?.uid && !user?.uid) {
                  e.preventDefault();
                  handleConnectClick();
                }
                setIsMenuOpen(false);
              }}
            >
              Connect
            </NavLink>
            <NavLink 
              to="/SocialDashboard" 
              className={({ isActive }) => `nav-link1 ${isActive ? 'active' : ''}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Luxy
            </NavLink>
          </div>

          <div className="navbar-user">
            <UserProfile user={user} onLogout={onLogout} />
          </div>
        </div>
      </nav>

      {/* 🧭 Connect Modal */}
      {showConnectModal && (
        <div className="connect-modal-overlay">
          <div className="connect-modal">
            <button className="close-btn" onClick={() => setShowConnectModal(false)}>
              <X size={20} />
            </button>

            <img src={logo} alt="Paltech Logo" className="modal-logo" />
            <h2>Connect to Paltech</h2>
            <p>Choose your preferred sign-in method to continue</p>

            <div className="google-signin-container">
              <button className="google-btn" onClick={handleGoogleSignIn}>
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google logo"
                />
                Continue with Google
              </button>
              {savedGoogleEmail && (
                <span className="saved-email-hint">{savedGoogleEmail}</span>
              )}
            </div>

            <button className="manual-btn" onClick={handleManualSignIn}>
              Sign in Manually
            </button>
          </div>
        </div>
      )}
    </>
  ); 
};