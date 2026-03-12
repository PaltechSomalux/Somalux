import React, { useState, useEffect, useMemo } from 'react';
import { 
  FaTimes, 
  FaStar, 
  FaHeart, 
  FaMapMarkerAlt, 
  FaCheckCircle,
  FaRegHeart
} from 'react-icons/fa';
import { 
  FiX,
  FiRefreshCw,
  FiZap,
  FiUser,
  FiInfo,
  FiClock
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { PremiumModal } from "./PremiumModal";
import { BoostModal } from "./BoostModal";
import { CompatibilityModal } from './CompatibilityModal';
import {
  Container,
  Header,
  Title,
  Subtitle,
  Controls,
  SearchContainer,
  SearchInput,
  ProfileCard,
  CardContent,
  ProfileImage,
  ProfileInfoOverlay,
  ProfileHeader,
  Distance,
  Bio,
  Tags,
  Tag,
  SwipeActions,
  SwipeButton,
  NoProfiles,
  RefreshButton,
  BoostButton,
  VerifiedBadge,
  OnlineBadge,
  SuperLikeCount,
  ModalOverlay,
  ModalContent,
  CloseButton,
  BadgeContainer,
  NewBadge,
  ActionButtons,
  DetailItem,
  DetailLabel,
  DetailValue,
  DetailsContainer
} from './DiscoverSection.styles';

export const DiscoverSection = () => {
  const [currentProfileIndex, setCurrentProfileIndex] = useState(0);
  const [superLikesRemaining, setSuperLikesRemaining] = useState(3);
  const [isPremium, setIsPremium] = useState(false);
  const [boostAvailable, setBoostAvailable] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [showCompatibilityModal, setShowCompatibilityModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const profiles = useMemo(() => [
    {
      id: '1',
      name: 'Sarah',
      age: 26,
      photos: ['https://randomuser.me/api/portraits/women/44.jpg'],
      bio: 'Artist and dog lover. Enjoy museums and weekend getaways.',
      distance: 3,
      tags: ['art', 'dogs', 'travel'],
      verified: true,
      interests: ['painting', 'hiking', 'yoga'],
      prompts: [{
        question: "I'm weirdly attracted to",
        answer: "People who can cook a perfect omelet"
      }],
      compatibility: 92,
      astroSigns: {
        sun: 'Gemini',
        moon: 'Pisces',
        rising: 'Leo'
      },
      lastActive: '2 hours ago',
      online: true,
      activityStatus: 'active',
      new: true
    },
    // More profiles...
  ], []);

  useEffect(() => {
    // Simulate loading profiles
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return [...profiles];
    
    return profiles.filter(profile => 
      profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.bio.toLowerCase().includes(searchTerm.toLowerCase()) ||
      profile.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  }, [profiles, searchTerm]);

  const handleSwipe = (direction) => {
    if (direction === 'super' && superLikesRemaining <= 0 && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    
    if (direction === 'super' && !isPremium) {
      setSuperLikesRemaining(prev => prev - 1);
    }
    
    setCurrentProfileIndex(prev => prev + 1);
  };

  const handleBoostProfile = () => {
    if (isPremium || boostAvailable) {
      setShowBoostModal(true);
      setBoostAvailable(false);
    } else {
      setShowPremiumModal(true);
    }
  };

  const refreshProfiles = () => {
    setCurrentProfileIndex(0);
    setBoostAvailable(true);
  };

  if (loading) {
    return (
      <Container>
        <Header>
          <Title>Discover</Title>
          <Subtitle>Find your perfect match</Subtitle>
        </Header>
        
        <Controls>
          <SearchContainer>
            <SearchInput
              type="text"
              placeholder="Search profiles..."
              disabled
            />
          </SearchContainer>
        </Controls>
        
        <ProfileCard style={{ height: '500px' }}>
          {/* Skeleton loading state */}
        </ProfileCard>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <Title>Discover</Title>
        <Subtitle>Find your perfect match</Subtitle>
      </Header>

      <Controls>
        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Search profiles by name, bio or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 8px'
              }}
            >
              <FiX size={16} />
            </button>
          )}
        </SearchContainer>
      </Controls>

      {profiles.length > 0 && currentProfileIndex < profiles.length ? (
        <motion.div
          key={profiles[currentProfileIndex].id}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
        >
          <ProfileCard>
            <BadgeContainer>
              {profiles[currentProfileIndex].new && (
                <NewBadge>New</NewBadge>
              )}
            </BadgeContainer>
            
            <ProfileImage src={profiles[currentProfileIndex].photos[0]} 
              alt={profiles[currentProfileIndex].name} />
            
            <ProfileInfoOverlay>
              <ProfileHeader>
                <h2>{profiles[currentProfileIndex].name}, {profiles[currentProfileIndex].age}</h2>
                {profiles[currentProfileIndex].verified && (
                  <VerifiedBadge><FaCheckCircle /> Verified</VerifiedBadge>
                )}
                {profiles[currentProfileIndex].online && (
                  <OnlineBadge>Online</OnlineBadge>
                )}
              </ProfileHeader>
              <Distance>
                <FaMapMarkerAlt /> {profiles[currentProfileIndex].distance} miles away
              </Distance>
              <Bio>{profiles[currentProfileIndex].bio}</Bio>
              <Tags>
                {profiles[currentProfileIndex].tags?.map(tag => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </Tags>
            </ProfileInfoOverlay>

            <SwipeActions>
              <SwipeButton 
                className="pass" 
                onClick={() => handleSwipe('left')}
                title="Pass"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaTimes />
              </SwipeButton>
              <SwipeButton 
                className="super-like" 
                onClick={() => handleSwipe('super')}
                title={`Super Like (${superLikesRemaining} left)`}
                disabled={superLikesRemaining <= 0 && !isPremium}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaStar />
                {superLikesRemaining > 0 && !isPremium && (
                  <SuperLikeCount>{superLikesRemaining}</SuperLikeCount>
                )}
              </SwipeButton>
              <SwipeButton 
                className="like" 
                onClick={() => handleSwipe('right')}
                title="Like"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaHeart />
              </SwipeButton>
            </SwipeActions>
          </ProfileCard>
        </motion.div>
      ) : (
        <NoProfiles>
          <FiUser size={48} />
          <h3>No more profiles in your area</h3>
          <p>Try adjusting your search or boost your profile</p>
          
          <RefreshButton
            onClick={refreshProfiles}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiRefreshCw /> Refresh
          </RefreshButton>
          
          {!isPremium && (
            <BoostButton
              onClick={handleBoostProfile}
              disabled={!boostAvailable}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiZap /> {boostAvailable ? 'Boost My Profile' : 'Boost Used'}
            </BoostButton>
          )}
        </NoProfiles>
      )}

      <AnimatePresence>
        {showPremiumModal && (
          <PremiumModal setShowPremiumModal={setShowPremiumModal} />
        )}

        {showBoostModal && (
          <BoostModal setShowBoostModal={setShowBoostModal} />
        )}

        {showCompatibilityModal && (
          <CompatibilityModal 
            profile={profiles[currentProfileIndex]}
            setShowCompatibilityModal={setShowCompatibilityModal}
          />
        )}
      </AnimatePresence>
    </Container>
  );
};