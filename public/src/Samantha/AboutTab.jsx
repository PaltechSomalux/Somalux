import React, { useState } from 'react';
import { 
  FaCamera, FaCheckCircle, FaStar, FaInstagram, FaSpotify, 
  FaMicrophone, FaTimes, FaHiking, FaPlane, FaMusic, FaGamepad,
  FaBook, FaUtensils, FaHeartbeat, FaTheaterMasks, FaSwimmer,
  FaRegSun, FaRegSnowflake, FaLeaf, FaCampground, FaFilm,
  FaCar, FaBicycle, FaMountain, FaCoffee, FaSeedling, FaUserFriends,
  FaVenusMars, FaBirthdayCake, FaGlobe, FaGraduationCap, FaBriefcase
} from 'react-icons/fa';
import "./AboutTab.css";


export const AboutTab = ({ profile, setProfile, setShowVerificationModal, isPremium }) => {
  const [showInstagramModal, setShowInstagramModal] = useState(false);
  const [showSpotifyModal, setShowSpotifyModal] = useState(false);
  const [instagramPhotos, setInstagramPhotos] = useState([]);
  const [spotifyTopArtists, setSpotifyTopArtists] = useState([]);

  // Safely initialize profile properties
  const safeProfile = {
    photos: [],
    interests: [],
    prompts: [],
    dealbreakers: [],
    ...profile
  };

  // All available interests with icons
  const allInterests = [
    { name: 'hiking', icon: <FaHiking /> },
    { name: 'travel', icon: <FaPlane /> },
    { name: 'photography', icon: <FaCamera /> },
    { name: 'music', icon: <FaMusic /> },
    { name: 'gaming', icon: <FaGamepad /> },
    { name: 'reading', icon: <FaBook /> },
    { name: 'cooking', icon: <FaUtensils /> },
    { name: 'fitness', icon: <FaHeartbeat /> },
    { name: 'art', icon: <FaTheaterMasks /> },
    { name: 'dancing', icon: <FaUserFriends /> },
    { name: 'swimming', icon: <FaSwimmer /> },
    { name: 'pets', icon: <FaCampground /> },
    { name: 'technology', icon: <FaBriefcase /> },
    { name: 'wine', icon: <FaUtensils /> },
    { name: 'yoga', icon: <FaRegSun /> },
    { name: 'snowboarding', icon: <FaRegSnowflake /> },
    { name: 'gardening', icon: <FaLeaf /> },
    { name: 'camping', icon: <FaCampground /> },
    { name: 'movies', icon: <FaFilm /> },
    { name: 'cycling', icon: <FaBicycle /> },
    { name: 'cars', icon: <FaCar /> },
    { name: 'coffee', icon: <FaCoffee /> },
    { name: 'mountains', icon: <FaMountain /> },
    { name: 'sustainability', icon: <FaSeedling /> }
  ];

  const handlePhotoUpload = (e) => {
    const files = e.target.files;
    const newPhotos = Array.from(files).map(file => URL.createObjectURL(file));
    setProfile(prev => ({
      ...prev,
      photos: [...(prev.photos || []), ...newPhotos].slice(0, 6)
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      const currentInterests = safeProfile.interests;
      if (checked) {
        setProfile(prev => ({
          ...prev,
          interests: [...currentInterests, name]
        }));
      } else {
        setProfile(prev => ({
          ...prev,
          interests: currentInterests.filter(i => i !== name)
        }));
      }
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePromptChange = (index, value) => {
    const newPrompts = [...safeProfile.prompts];
    newPrompts[index].answer = value;
    setProfile(prev => ({ ...prev, prompts: newPrompts }));
  };

  const handleDealbreakerChange = (index, value) => {
    const newDealbreakers = [...safeProfile.dealbreakers];
    newDealbreakers[index] = value;
    setProfile(prev => ({ ...prev, dealbreakers: newDealbreakers }));
  };

  const handleConnectInstagram = () => {
    setInstagramPhotos([
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      'https://images.unsplash.com/photo-1480429370139-e0132c086e2a',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e'
    ]);
    setShowInstagramModal(false);
  };

  const handleConnectSpotify = () => {
    setSpotifyTopArtists([
      'Tame Impala',
      'Radiohead',
      'Beach House',
      'Phoebe Bridgers',
      'The Beatles'
    ]);
    setShowSpotifyModal(false);
  };

  const handleRecordVoicePrompt = () => {
    const audioBlob = new Blob([/* recorded audio */], { type: 'audio/mp3' });
    const audioUrl = URL.createObjectURL(audioBlob);
    setProfile(prev => ({ ...prev, voicePrompt: audioUrl }));
  };

  return (
    <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
      {/* Profile Header with Photos */}
      <div className="profile-header">
        <div className="profile-photos">
          <div className="photos-grid">
            {safeProfile.photos.map((photo, index) => (
              <div key={index} className="photo-item">
                <img src={photo} alt={`Profile ${index + 1}`} />
                <button1 
                  type="button1"
                  className="remove-photo1"
                  onClick={() => {
                    const newPhotos = [...safeProfile.photos];
                    newPhotos.splice(index, 1);
                    setProfile(prev => ({ ...prev, photos: newPhotos }));
                  }}
                >
                  <FaTimes />
                </button1>
              </div>
            ))}
            
            {safeProfile.photos.length < 6 && (
              <label className="photo-upload">
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handlePhotoUpload}
                  style={{ display: 'none' }}
                />
                <FaCamera />
                <span>Add Photo</span>
              </label>
            )}
          </div>
        </div>
        
        <div className="profile-basic-info">
          <h2>{safeProfile.name}, {safeProfile.age}</h2>
          <p>{safeProfile.profession}</p>
          <p>{safeProfile.education}</p>
          
          <div className="profile-actions">
            {safeProfile.verified ? (
              <span className="verified-badge">
                <FaCheckCircle /> Verified
              </span>
            ) : (
              <button1 
                type="button1"
                className="verify-button1"
                onClick={() => setShowVerificationModal(true)}
              >
                Get Verified
              </button1>
            )}
          </div>
        </div>
      </div>

      {/* Basic Information Section */}
      <div className="form-section">
        <h3>Basic Information</h3>
        <div className="form-row">
          <div className="form-group">
            <label><FaUserFriends /> Name</label>
            <input 
              name="name" 
              type="text" 
              value={safeProfile.name}
              onChange={handleProfileChange}
              required
            />
          </div>
          <div className="form-group">
            <label><FaBirthdayCake /> Age</label>
            <input 
              name="age" 
              type="number" 
              min="18"
              max="100"
              value={safeProfile.age}
              onChange={handleProfileChange}
              required
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label><FaVenusMars /> Gender</label>
            <select 
              name="gender" 
              value={safeProfile.gender}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label><FaVenusMars /> Orientation</label>
            <select 
              name="orientation" 
              value={safeProfile.orientation}
              onChange={handleProfileChange}
              required
            >
              <option value="">Select</option>
              <option value="straight">Straight</option>
              <option value="gay">Gay</option>
              <option value="lesbian">Lesbian</option>
              <option value="bisexual">Bisexual</option>
              <option value="pansexual">Pansexual</option>
              <option value="asexual">Asexual</option>
              <option value="queer">Queer</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Bio</label>
          <textarea 
            name="bio" 
            rows={4}
            value={safeProfile.bio}
            onChange={handleProfileChange}
            maxLength="500"
            placeholder="Tell others about yourself..."
          />
          <div className="character-count">{safeProfile.bio?.length || 0}/500</div>
        </div>
      </div>

      {/* Lifestyle Section */}
      <div className="form-section">
        <h3>Lifestyle</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Height</label>
            <input 
              name="height" 
              type="text" 
              value={safeProfile.height}
              onChange={handleProfileChange}
            />
          </div>
          <div className="form-group">
            <label>Zodiac Sign</label>
            <select 
              name="zodiac" 
              value={safeProfile.zodiac}
              onChange={handleProfileChange}
            >
              <option value="">Select</option>
              <option value="Aries">Aries</option>
              <option value="Taurus">Taurus</option>
              <option value="Gemini">Gemini</option>
              <option value="Cancer">Cancer</option>
              <option value="Leo">Leo</option>
              <option value="Virgo">Virgo</option>
              <option value="Libra">Libra</option>
              <option value="Scorpio">Scorpio</option>
              <option value="Sagittarius">Sagittarius</option>
              <option value="Capricorn">Capricorn</option>
              <option value="Aquarius">Aquarius</option>
              <option value="Pisces">Pisces</option>
            </select>
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Drinking</label>
            <select 
              name="drinking" 
              value={safeProfile.drinking}
              onChange={handleProfileChange}
            >
              <option value="never">Never</option>
              <option value="socially">Socially</option>
              <option value="often">Often</option>
            </select>
          </div>
          <div className="form-group">
            <label>Smoking</label>
            <select 
              name="smoking" 
              value={safeProfile.smoking}
              onChange={handleProfileChange}
            >
              <option value="never">Never</option>
              <option value="sometimes">Sometimes</option>
              <option value="regularly">Regularly</option>
            </select>
          </div>
        </div>
        
        <div className="form-group">
          <label>Fitness</label>
          <select 
            name="fitness" 
            value={safeProfile.fitness}
            onChange={handleProfileChange}
          >
            <option value="active">Active</option>
            <option value="moderate">Moderate</option>
            <option value="sedentary">Sedentary</option>
          </select>
        </div>
      </div>

      {/* Career & Education Section */}
      <div className="form-section">
        <h3>Career & Education</h3>
        <div className="form-group">
          <label><FaBriefcase /> Profession</label>
          <input 
            name="profession" 
            type="text" 
            value={safeProfile.profession}
            onChange={handleProfileChange}
            placeholder="Software Engineer"
          />
        </div>
        <div className="form-group">
          <label><FaGraduationCap /> Education</label>
          <input 
            name="education" 
            type="text" 
            value={safeProfile.education}
            onChange={handleProfileChange}
            placeholder="Masters in Computer Science"
          />
        </div>
      </div>

      {/* Interests Section */}
      <div className="form-section">
        <h3>Interests</h3>
        <div className="interests-grid">
          {allInterests.map(interest => (
            <label 
              key={interest.name} 
              className={`interest-checkbox ${safeProfile.interests.includes(interest.name) ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                name={interest.name}
                checked={safeProfile.interests.includes(interest.name)}
                onChange={handleProfileChange}
                style={{ display: 'none' }}
              />
              {interest.icon}
              <span>{interest.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Prompts Section */}
      <div className="form-section">
        <h3>Prompts</h3>
        {safeProfile.prompts.map((prompt, index) => (
          <div key={index} className="prompt">
            <label>{prompt.question || "Prompt " + (index + 1)}</label>
            <textarea
              value={prompt.answer}
              onChange={(e) => handlePromptChange(index, e.target.value)}
              rows={3}
              maxLength="300"
              placeholder="Your answer..."
            />
            <div className="character-count">{prompt.answer?.length || 0}/300</div>
          </div>
        ))}
        {safeProfile.prompts.length < 3 && (
          <button1 
            type="button1"
            className="add-prompt1"
            onClick={() => {
              setProfile(prev => ({
                ...prev,
                prompts: [...prev.prompts, { question: "", answer: "" }]
              }));
            }}
          >
            + Add Prompt
          </button1>
        )}
      </div>

      {/* Dealbreakers Section */}
      <div className="form-section">
        <h3>Dealbreakers</h3>
        <div className="dealbreakers-list">
          {safeProfile.dealbreakers.map((dealbreaker, index) => (
            <div key={index} className="dealbreaker-item">
              <input
                type="text"
                value={dealbreaker}
                onChange={(e) => handleDealbreakerChange(index, e.target.value)}
                placeholder="Enter a dealbreaker"
              />
              <button1 
                onClick={() => {
                  const newDealbreakers = [...safeProfile.dealbreakers];
                  newDealbreakers.splice(index, 1);
                  setProfile(prev => ({ ...prev, dealbreakers: newDealbreakers }));
                }}
              >
                <FaTimes />
              </button1>
            </div>
          ))}
          <button1 
            className="add-dealbreaker1"
            onClick={() => {
              setProfile(prev => ({ 
                ...prev, 
                dealbreakers: [...prev.dealbreakers, ''] 
              }));
            }}
          >
            + Add Dealbreaker
          </button1>
        </div>
      </div>

      {/* Social Media Section */}
      <div className="form-section">
        <h3>Social Media</h3>
        <div className="form-row">
          <div className="form-group">
            <label><FaInstagram /> Instagram</label>
            <input 
              name="instagram" 
              type="text" 
              value={safeProfile.instagram}
              onChange={handleProfileChange}
              placeholder="@username"
            />
            {safeProfile.instagram && (
              <button1 
                type="button1"
                className="connect-button1"
                onClick={() => setShowInstagramModal(true)}
              >
                {instagramPhotos.length > 0 ? 'Update' : 'Connect'}
              </button1>
            )}
          </div>
          <div className="form-group">
            <label><FaSpotify /> Spotify</label>
            <input 
              name="spotify" 
              type="text" 
              value={safeProfile.spotify}
              onChange={handleProfileChange}
              placeholder="Profile name"
            />
            {safeProfile.spotify && (
              <button1 
                type="button1"
                className="connect-button1"
                onClick={() => setShowSpotifyModal(true)}
              >
                {spotifyTopArtists.length > 0 ? 'Update' : 'Connect'}
              </button1>
            )}
          </div>
        </div>
      </div>

      {/* Voice Prompt Section */}
      <div className="form-section">
        <h3>Voice Prompt</h3>
        {safeProfile.voicePrompt ? (
          <div className="voice-prompt">
            <audio src={safeProfile.voicePrompt} controls />
            <button1 
              type="button1"
              className="re-record-button1"
              onClick={handleRecordVoicePrompt}
            >
              Re-record
            </button1>
          </div>
        ) : (
          <button1 
            type="button1"
            className="record-button1"
            onClick={handleRecordVoicePrompt}
          >
            <FaMicrophone /> Record Voice Prompt
          </button1>
        )}
        <p className="hint">Record a short voice note to help your matches get to know you better</p>
      </div>

      {/* Form Actions */}
      <div className="form-actions">
        <button1 type="submit" className="save-button1">
          Save Profile
        </button1>
      </div>

      {/* Instagram Modal */}
      {showInstagramModal && (
        <div className="modal-overlay" onClick={() => setShowInstagramModal(false)}>
          <div className="instagram-modal" onClick={e => e.stopPropagation()}>
            <h2>Connect Instagram</h2>
            <p>Share your latest Instagram photos on your profile</p>
            <div className="instagram-content">
              {instagramPhotos.length > 0 ? (
                <div className="photos-grid">
                  {instagramPhotos.map((photo, index) => (
                    <img key={index} src={photo} alt={`Instagram ${index + 1}`} />
                  ))}
                </div>
              ) : (
                <button1 
                  className="connect-button1"
                  onClick={handleConnectInstagram}
                >
                  Connect to Instagram
                </button1>
              )}
            </div>
            <button1 
              className="close-instagram1"
              onClick={() => setShowInstagramModal(false)}
            >
              Close
            </button1>
          </div>
        </div>
      )}

      {/* Spotify Modal */}
      {showSpotifyModal && (
        <div className="modal-overlay" onClick={() => setShowSpotifyModal(false)}>
          <div className="spotify-modal" onClick={e => e.stopPropagation()}>
            <h2>Connect Spotify</h2>
            <p>Share your music taste and see compatibility with matches</p>
            <div className="spotify-content">
              {spotifyTopArtists.length > 0 ? (
                <div className="artists-list">
                  <h3>Your Top Artists</h3>
                  <ul>
                    {spotifyTopArtists.map((artist, index) => (
                      <li key={index}>{artist}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <button1 
                  className="connect-button1"
                  onClick={handleConnectSpotify}
                >
                  Connect to Spotify
                </button1>
              )}
            </div>
            <button1 
              className="close-spotify1"
              onClick={() => setShowSpotifyModal(false)}
            >
              Close
            </button1>
          </div>
        </div>
      )}
    </form>
  );
};