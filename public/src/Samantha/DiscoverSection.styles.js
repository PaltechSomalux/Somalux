import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';

// Updated to WhatsApp-inspired Color Scheme
const colors = {
  primary: '#00a884',       // WhatsApp green
  secondary: '#25D366',     // WhatsApp secondary green
  accent: '#34B7F1',       // WhatsApp blue
  dark: '#111b21',         // Dark background
  light: '#2a3942',        // Darker background
  gray: '#8696a0',         // Medium gray
  success: '#25D366',      // Green for online status (using WhatsApp green)
  warning: '#fdcb6e',      // Yellow for badges
  white: '#e9edef',        // Light text/background
  black: '#000000',
  text: '#e9edef',         // Light text
  textLight: '#8696a0',    // Medium gray
};

// Animation constants (unchanged)
const transition = 'all 0.3s ease';
const shadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
const shadowHover = '0 4px 15px rgba(0, 0, 0, 0.4)';

// Base container
export const Container = styled.div`
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
  background: ${colors.dark};
  min-height: 100vh;
  position: relative;
`;

// Header styles
export const Header = styled.header`
  text-align: center;
  margin-bottom: 25px;
`;

export const Title = styled.h1`
  font-size: 2rem;
  color: ${colors.text};
  margin-bottom: 5px;
  font-weight: 700;
`;

export const Subtitle = styled.p`
  font-size: 1rem;
  color: ${colors.textLight};
  margin: 0;
`;

// Controls section
export const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 15px;
  position: relative;
`;

export const SearchContainer = styled.div`
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  border-radius: 25px;
  border: 1px solid ${colors.light};
  font-size: 0.9rem;
  transition: ${transition};
  background: ${colors.light};
  color: ${colors.text};
  
  &:focus {
    outline: none;
    border-color: ${colors.primary};
    box-shadow: 0 0 0 2px rgba(0, 168, 132, 0.2);
  }
`;

export const FilterButton = styled.button`
  background: ${colors.light};
  border: 1px solid ${colors.light};
  color: ${colors.text};
  padding: 10px 15px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${transition};
  position: relative;
  
  ${({ active }) => active && css`
    background: ${colors.primary};
    color: ${colors.white};
    border-color: ${colors.primary};
  `}
  
  &:hover {
    background: ${({ active }) => active ? colors.primary : '#3a4a52'};
    box-shadow: ${shadow};
  }
  
  &::after {
    ${({ active }) => active && css`
      content: '';
      position: absolute;
      top: -5px;
      right: -5px;
      width: 10px;
      height: 10px;
      background: ${colors.warning};
      border-radius: 50%;
      border: 2px solid ${colors.light};
    `}
  }
`;

export const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${colors.dark};
  border-radius: 12px;
  box-shadow: ${shadowHover};
  padding: 15px;
  z-index: 10;
  width: 250px;
  margin-top: 10px;
  border: 1px solid ${colors.light};
  
  h4 {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin: 15px 0 8px;
    color: ${colors.textLight};
  }
`;

export const FilterOption = styled.div`
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: ${transition};
  color: ${colors.text};
  
  ${({ active }) => active && css`
    background: rgba(52, 183, 241, 0.1);
    color: ${colors.accent};
    font-weight: 500;
  `}
  
  &:hover {
    background: #3a4a52;
  }
`;

// Profile card styles
export const ProfileCard = styled.div`
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  height: 70vh;
  max-height: 600px;
  box-shadow: ${shadow};
  background: ${colors.dark};
  border: 1px solid ${colors.light};
`;

export const CardContent = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
`;

export const ProfileInfoOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 25px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
  color: ${colors.white};
  z-index: 2;
`;

export const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
  gap: 8px;
  
  h2 {
    font-size: 1.8rem;
    margin: 0;
    font-weight: 700;
  }
`;

export const Distance = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  margin-bottom: 15px;
  opacity: 0.9;
  color: ${colors.white};
  
  svg {
    margin-right: 5px;
  }
`;

export const Bio = styled.p`
  font-size: 1rem;
  line-height: 1.4;
  margin-bottom: 15px;
  color: ${colors.white};
`;

export const Tags = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
`;

export const Tag = styled.span`
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 12px;
  border-radius: 15px;
  font-size: 0.8rem;
  backdrop-filter: blur(5px);
  color: ${colors.white};
`;

// Badges
export const BadgeContainer = styled.div`
  position: absolute;
  top: 15px;
  left: 15px;
  z-index: 3;
  display: flex;
  gap: 8px;
`;

export const VerifiedBadge = styled.span`
  background: ${colors.primary};
  color: ${colors.white};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  display: flex;
  align-items: center;
  gap: 4px;
  font-weight: 500;
  
  svg {
    font-size: 0.8rem;
  }
`;

export const OnlineBadge = styled.span`
  background: ${colors.success};
  color: ${colors.white};
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 500;
`;

export const NewBadge = styled.span`
  background: ${colors.warning};
  color: ${colors.dark};
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
`;

export const SuperLikeCount = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: ${colors.white};
  color: ${colors.primary};
  width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  font-weight: 700;
  border: 1px solid ${colors.primary};
`;

// Swipe actions
export const SwipeActions = styled.div`
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 25px;
  z-index: 3;
`;

export const SwipeButton = styled(motion.button)`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  font-size: 1.4rem;
  color: ${colors.white};
  position: relative;
  box-shadow: ${shadow};
  transition: ${transition};
  
  &.pass {
    background: ${colors.light};
    color: ${colors.text};
    
    &:hover {
      background: #3a4a52;
    }
  }
  
  &.like {
    background: ${colors.primary};
    
    &:hover {
      background: #008069;
    }
  }
  
  &.super-like {
    background: ${colors.accent};
    
    &:hover {
      background: #1a8cd8;
    }
    
    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }
`;

// Empty state
export const NoProfiles = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  background: ${colors.dark};
  border-radius: 20px;
  box-shadow: ${shadow};
  height: 300px;
  border: 1px solid ${colors.light};
  
  h3 {
    color: ${colors.text};
    margin: 15px 0 5px;
    font-size: 1.3rem;
  }
  
  p {
    color: ${colors.textLight};
    margin-bottom: 25px;
    font-size: 0.9rem;
  }
  
  svg {
    color: ${colors.textLight};
    opacity: 0.5;
  }
`;

export const RefreshButton = styled(motion.button)`
  background: ${colors.light};
  border: 1px solid ${colors.light};
  color: ${colors.text};
  padding: 12px 25px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${transition};
  margin-bottom: 15px;
  
  &:hover {
    background: #3a4a52;
    box-shadow: ${shadow};
  }
`;

export const BoostButton = styled(motion.button)`
  background: ${colors.primary};
  border: none;
  color: ${colors.white};
  padding: 12px 25px;
  border-radius: 25px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: ${transition};
  font-weight: 500;
  
  &:hover {
    background: #008069;
    box-shadow: ${shadow};
  }
  
  &:disabled {
    background: ${colors.gray};
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

// Modal styles
export const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

export const ModalContent = styled(motion.div)`
  background: ${colors.dark};
  border-radius: 20px;
  padding: 25px;
  max-width: 90%;
  width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  border: 1px solid ${colors.light};
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  font-size: 1.2rem;
  color: ${colors.textLight};
  cursor: pointer;
  
  &:hover {
    color: ${colors.text};
  }
`;

// Detail components
export const DetailsContainer = styled.div`
  margin-top: 20px;
`;

export const DetailItem = styled.div`
  margin-bottom: 15px;
`;

export const DetailLabel = styled.div`
  font-size: 0.8rem;
  color: ${colors.textLight};
  margin-bottom: 5px;
  text-transform: uppercase;
  letter-spacing: 1px;
`;

export const DetailValue = styled.div`
  font-size: 1rem;
  color: ${colors.text};
`;

export const ActionButtons = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 25px;
`;