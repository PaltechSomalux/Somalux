import styled from 'styled-components';
import { motion } from 'framer-motion';

// WhatsApp color variables (updated to match the profile management colors)
const colors = {
  primary: '#00a884',
  primaryHover: '#008069',
  secondary: '#25D366',
  accent: '#34B7F1',
  error: '#f15e6c',
  warning: '#FFCC00',
  textDark: '#e9edef',
  textLight: '#8696a0',
  bgLight: '#0b1216',
  bgDark: '#0b1216',
  bgSecondary: '#111b21',
  borderColor: '#2a3942',
};

export const Container = styled.div`
  max-width: 100%;
  margin-top: 10px;
  padding: 0.75rem 0.5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: ${colors.bgDark};
  color: ${colors.textDark};

  @media (min-width: 768px) {
    margin-top: 40px;
  }
`;

export const Header = styled.header`
  text-align: center;
  margin-bottom: 1.25rem;
  padding-top: 1rem;
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  color: ${colors.textDark};
  margin-bottom: 0.25rem;
  font-weight: 700;

  @media (min-width: 768px) {
    font-size: 1.8rem;
  }
`;

export const Subtitle = styled.p`
  font-size: 0.8rem;
  color: ${colors.textLight};
  max-width: 500px;
  margin: 0 auto;
  padding: 0 1rem;

  @media (min-width: 768px) {
    font-size: 0.85rem;
  }
`;

export const Controls = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  position: relative;
  align-items: center;
  width: 100%;

  @media (min-width: 640px) {
    gap: 1rem;
  }
`;

export const SearchContainer = styled.div`
  flex: 1;
  background: ${colors.bgLight};
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  min-width: 0;

  @media (min-width: 768px) {
    max-width: 70%;
  }
`;

export const SearchInput = styled.input`
  flex: 1;
  min-width: 0;
  padding: 0.4rem 0.75rem;
  border: none;
  background: transparent;
  font-size: 0.85rem;
  color: ${colors.textDark};
  outline: none;
  border-radius: 4px;

  &::placeholder {
    color: ${colors.textLight};
    font-size: 0.85rem;
  }
`;

export const SearchIcon = styled.span`
  margin-right: 0.5rem;
  color: ${colors.textLight};
  display: flex;
  align-items: center;
`;

export const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: ${props => props.active ? 'rgba(0, 168, 132, 0.2)' : colors.bgLight};
  color: ${props => props.active ? colors.primary : colors.textDark};
  border: 1px solid ${props => props.active ? colors.primary : colors.borderColor};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 168, 132, 0.2);
    border-color: ${colors.primary};
    color: ${colors.primary};
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }

  @media (min-width: 640px) {
    padding: 0.5rem 1rem;
  }
`;

export const FilterDropdown = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  background: ${colors.bgLight};
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  z-index: 10;
  min-width: 180px;
  margin-top: 0.5rem;
  border: 1px solid ${colors.borderColor};

  small {
    display: block;
    color: ${colors.textLight};
    font-size: 0.7rem;
    margin-bottom: 0.4rem;
  }
`;

export const FilterOption = styled.div`
  padding: 0.4rem 0.6rem;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: ${props => props.active ? colors.primary : colors.textDark};
  background: ${props => props.active ? 'rgba(0, 168, 132, 0.1)' : 'transparent'};
  margin-bottom: 0.2rem;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(134, 150, 160, 0.1);
    color: ${colors.primary};
  }

  svg {
    flex-shrink: 0;
    font-size: 0.9rem;
  }
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.9rem;
  }
`;

export const BookCard = styled(motion.div)`
  background: ${colors.bgLight};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 1px solid ${colors.borderColor};
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  height: 100%;

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
    transform: translateY(-2px);
  }
`;

export const BookCover = styled.img`
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-bottom: 1px solid ${colors.borderColor};

  @media (min-width: 768px) {
    height: 180px;
  }
`;

export const CardContent = styled.div`
  padding: 0.75rem;
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    padding: 0.9rem;
  }
`;

export const BookInfo = styled.div`
  flex: 1;
`;

export const BookTitle = styled.h3`
  font-size: 0.9rem;
  color: ${colors.textDark};
  margin-bottom: 0.3rem;
  font-weight: 600;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.4rem;
  }
`;

export const BookAuthor = styled.p`
  color: ${colors.textLight};
  font-size: 0.7rem;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const BookDesc = styled.p`
  color: ${colors.textLight};
  font-size: 0.7rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;

  @media (min-width: 768px) {
    font-size: 0.75rem;
    margin-bottom: 0.9rem;
  }
`;

export const BookMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  font-size: 0.7rem;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const ViewCount = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: ${colors.textLight};
`;

export const Rating = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: ${colors.textLight};
`;

export const ActionButtons = styled.div`
  display: flex;
  border-top: 1px solid ${colors.borderColor};
  padding: 0.5rem;
  gap: 0.5rem;
`;

export const ActionButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.3rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  color: ${colors.textDark};

  &:hover {
    background: rgba(134, 150, 160, 0.1);
  }

  @media (min-width: 768px) {
    font-size: 0.75rem;
    padding: 0.4rem;
  }
`;

export const WishlistButton = styled(ActionButton)`
  color: ${props => props.active ? colors.primary : colors.textLight};
`;

export const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.5rem 1rem;
  background: ${colors.primary};
  color: ${colors.textDark};
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    padding: 0.6rem 1.2rem;
    font-size: 0.9rem;
  }

  &:hover {
    background: ${colors.primaryHover};
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 1.5rem 1rem;
  background: ${colors.bgLight};
  border-radius: 8px;
  border: 1px dashed ${colors.borderColor};
  color: ${colors.textLight};
  margin: 1rem 0;
  grid-column: 1 / -1;

  h3 {
    font-size: 1rem;
    color: ${colors.textDark};
    margin: 0.8rem 0 0.4rem;
  }

  p {
    margin-bottom: 0;
    font-size: 0.8rem;
  }

  svg {
    color: ${colors.textLight};
    font-size: 1.5rem;
  }

  @media (min-width: 768px) {
    padding: 2rem 1rem;

    h3 {
      font-size: 1.1rem;
    }

    p {
      font-size: 0.85rem;
    }

    svg {
      font-size: 2rem;
    }
  }
`;

export const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
  overflow-y: auto;
`;

export const ModalContent = styled(motion.div)`
  position: relative;
  background: ${colors.bgLight};
  margin-top: 70px;
  border-radius: 12px;
  overflow: hidden;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  
  @media (max-width: 768px) {
    max-width: 90%;
    margin-top: 0;
  }
  
  @media (max-width: 480px) {
    max-width: 95%;
    border-radius: 8px;
  }
`;

export const ModalHeader = styled.div`
  padding: 1rem 1.5rem;
  text-align: center;
  color: ${colors.textDark};
 
  h2 {
    font-size: 1.25rem;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  p {
    opacity: 0.9;
    margin-bottom: 0;
    font-size: 0.9rem;
    color: ${colors.textLight};
  }

  @media (max-width: 768px) {
    padding: 0.8rem 1rem;
    
    h2 {
      font-size: 1.1rem;
    }
    
    p {
      font-size: 0.85rem;
    }
  }
`;

export const ModalBody = styled.div`
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
  
  @media (max-width: 768px) {
    padding: 1rem;
  }
  
  @media (max-width: 480px) {
    padding: 0.75rem;
  }
`;

export const DetailsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0.75rem 0;
`;

export const DetailItem = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 120px;
  padding: 0.1rem;
  background: ${colors.bgLight};
  border-radius: 6px;
  border: 1px solid ${colors.borderColor};

  @media (min-width: 250px) {
    min-width: 60px;
`;

export const DetailLabel = styled.span`
  font-size: 0.7rem;
  color: ${colors.textLight};
  font-weight: 500;
`;

export const DetailValue = styled.span`
  font-size: 0.8rem;
  color: ${colors.textDark};
  font-weight: 600;
  word-break: break-word;
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem;
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.8rem;
  color: ${colors.textDark};

  svg {
    color: ${colors.primary};
    flex-shrink: 0;
    font-size: 0.5rem;
  }

  @media (min-width: 168px) {
    font-size: 0.85rem;

    svg {
      font-size: 1rem;
    }
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: ${colors.error};
  border: none;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: ${colors.textDark};
  font-size: 1.9rem;
  z-index: 10;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    top: 1rem;
    right: 1rem;
    width: 2.2rem;
    height: 2.2rem;
    font-size: 1rem;
  }

  &:hover {
    background: #dc2626;
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

export const BadgeContainer = styled.div`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  display: flex;
  gap: 0.3rem;
  @media (min-width: 768px) {
    top: 0.6rem;
    right: 0.6rem;
    gap: 0.4rem;
  }
`;

export const TrendingBadge = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  background: ${colors.bgLight};
  color: #f59e0b;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;
  font-size: 0.55rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }
`;

export const NewBadge = styled.span`
  background: ${colors.bgLight};
  color: #10b981;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;
  font-size: 0.55rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

  @media (min-width: 768px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }
`;

export const SkeletonCard = styled.div`
  background: ${colors.bgLight};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  border: 1px solid ${colors.borderColor};
  padding: 0.75rem;
  height: 140px;

  @media (min-width: 768px) {
    padding: 0.9rem;
    height: 160px;
  }
`;

export const SkeletonCover = styled.div`
  width: 100%;
  height: 100px;
  background: ${colors.bgDark};
  border-radius: 4px;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    height: 120px;
  }
`;

export const SkeletonText = styled.div`
  height: 10px;
  background: ${colors.bgDark};
  border-radius: 4px;
  margin-bottom: 0.4rem;
  width: ${props => props.width || '100%'};

  @media (min-width: 768px) {
    height: 12px;
    margin-bottom: 0.5rem;
  }
`;

export const ExploreButton = styled(motion.button)`
  display: block;
  width: calc(100% - 2rem);
  margin: 0 auto 0.75rem;
  padding: 0.5rem;
  background: ${colors.primary};
  color: ${colors.textDark};
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  @media (min-width: 768px) {
    width: calc(100% - 3rem);
    padding: 0.6rem;
    font-size: 0.9rem;
    margin-bottom: 1rem;
  }

  &:hover {
    background: ${colors.primaryHover};
  }
`;

export const ReactionButtonsContainer = styled.div`
  display: flex;
  gap: 8px;

  button {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: ${colors.bgLight};
    cursor: pointer;
    transition: all 0.2s;
    color: ${colors.textDark};
    
    &:hover {
      background: rgba(134, 150, 160, 0.1);
    }
    
    &.active {
      background: transparent;
    }
    
    .count {
      font-size: 0.9em;
    }
  }

  .love-button.active {
    color: ${colors.error};
  }
`;

export const WishlistPanel = styled(motion.div)`
  position: fixed;
  top: 10%;
  right: 0;
  width: 230px;
  height: 100vh;
  background: ${colors.bgLight};
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  padding: 20px;
  overflow-y: auto;
  border-left: 1px solid ${colors.borderColor};
`;

export const WishlistHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid ${colors.borderColor};
`;

export const WishlistTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: ${colors.textDark};
`;

export const WishlistCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: ${colors.error};
  padding: 5px;
  
  &:hover {
    color: ${colors.textDark};
  }
`;

export const WishlistToggle = styled(motion.button)`
  position: fixed;
  bottom: 20px;
  right: 10px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${colors.primary};
  color: ${colors.textDark};
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 168, 132, 0.3);
  z-index: 999;
  font-size: 2rem;
`;

export const WishlistCount = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: ${colors.error};
  color: ${colors.textDark};
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
`;

export const WishlistBooks = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const WishlistBookItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
  background: ${colors.bgDark};
  
  &:hover {
    background: rgba(134, 150, 160, 0.1);
  }
`;

export const WishlistBookCover = styled.img`
  width: 50px;
  height: 70px;
  object-fit: cover;
  border-radius: 4px;
`;

export const WishlistBookInfo = styled.div`
  flex: 1;
  
  h4 {
    margin: 0 0 5px 0;
    font-size: 0.9rem;
    color: ${colors.textDark};
  }
  
  p {
    margin: 0;
    font-size: 0.8rem;
    color: ${colors.textLight};
  }
`;

export const WishlistEmpty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  text-align: center;
  
  p {
    margin-top: 15px;
    color: ${colors.textLight};
  }
`;

export const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: ${colors.bgDark};
  padding: 20px;
`;

export const AuthMessage = styled.div`
  background: ${colors.bgLight};
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
  border: 1px solid ${colors.borderColor};

  h3 {
    margin: 20px 0 10px;
    color: ${colors.textDark};
    font-size: 24px;
  }

  p {
    color: ${colors.textLight};
    margin-bottom: 20px;
    line-height: 1.5;
  }
`;

export const AuthButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 1px solid ${props => props.primary ? 'transparent' : colors.borderColor};
  background-color: ${props => props.primary ? colors.primary : colors.bgLight};
  color: ${props => props.primary ? colors.textDark : colors.textDark};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.primary ? colors.primaryHover : colors.bgDark};
  }
`;

export const AuthIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;