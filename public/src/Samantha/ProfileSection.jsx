import React, { useState } from 'react';
import { 
  FaCamera, FaCheckCircle, FaStar, FaInstagram, FaSpotify, 
  FaMicrophone, FaTimes, FaLock, FaSignOutAlt, FaExclamationTriangle
} from 'react-icons/fa';
import {AboutTab} from './AboutTab';
import {PreferencesTab} from './PreferencesTab';
import {SettingsTab} from './SettingsTab';
import {VerificationModal} from './VerificationModal';
import {DeleteAccountModal} from './DeleteAccountModal';
import {LocationModal} from './LocationModal';
import {ActivityModal} from './ActivityModal';

export const ProfileSection = () => {
  const [activeProfileTab, setActiveProfileTab] = useState('about');
  const [profile, setProfile] = useState({
    name: 'Alex Johnson',
    age: 28,
    photos: ['https://randomuser.me/api/portraits/men/32.jpg'],
    verified: false,
    // ... other profile fields
  });
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);

  return (
    <div className="profile-section">
      <div className="profile-tabs">
        <button 
          className={`profile-tab ${activeProfileTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('about')}
        >
          About
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'preferences' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('preferences')}
        >
          Preferences
        </button>
        <button 
          className={`profile-tab ${activeProfileTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveProfileTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeProfileTab === 'about' && (
        <AboutTab 
          profile={profile}
          setProfile={setProfile}
          setShowVerificationModal={setShowVerificationModal}
        />
      )}

      {activeProfileTab === 'preferences' && (
        <PreferencesTab 
          profile={profile}
          setProfile={setProfile}
        />
      )}

      {activeProfileTab === 'settings' && (
        <SettingsTab 
          setShowLocationModal={setShowLocationModal}
          setShowActivityModal={setShowActivityModal}
          setShowDeleteAccountModal={setShowDeleteAccountModal}
        />
      )}

      {showVerificationModal && (
        <VerificationModal 
          setShowVerificationModal={setShowVerificationModal}
          setProfile={setProfile}
        />
      )}

      {showDeleteAccountModal && (
        <DeleteAccountModal 
          setShowDeleteAccountModal={setShowDeleteAccountModal}
        />
      )}

      {showLocationModal && (
        <LocationModal 
          setShowLocationModal={setShowLocationModal}
        />
      )}

      {showActivityModal && (
        <ActivityModal 
          setShowActivityModal={setShowActivityModal}
          profile={profile}
          setProfile={setProfile}
        />
      )}
    </div>
  );
};

