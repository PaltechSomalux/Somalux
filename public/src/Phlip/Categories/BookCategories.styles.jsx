import styled from 'styled-components';
import { motion } from 'framer-motion';

export const Container = styled.div`
  max-width: 100%;
  margin-top: 10px;
  padding: 0.75rem 0.5rem;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #0b1216;
`;

export const Header = styled.header`
  text-align: center;
  margin-bottom: 1.25rem;
  width: 100%;
  margin-top: 20px;
  padding: 1rem;
  color: #e9edef;

  @media (min-width: 768px) {
    
  }
`;

export const Title = styled.h1`
  font-size: 1.5rem;
  color: #e9edef;
  margin-bottom: 0.25rem;
  font-weight: 700;

  @media (min-width: 768px) {
    font-size: 1.8rem;
  }
`;

export const Subtitle = styled.p`
  font-size: 0.8rem;
  color: #8696a0;
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
  background: #2a3942;
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
  color: #e9edef;
  outline: none;
  border-radius: 4px;

  &::placeholder {
    color: #8696a0;
    font-size: 0.85rem;
  }
`;

export const SearchIcon = styled.span`
  margin-right: 0.5rem;
  color: #8696a0;
  display: flex;
  align-items: center;
`;

export const FilterButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.9rem;
  background: ${props => props.active ? '#2a3942' : '#2a3942'};
  color: ${props => props.active ? '#00a884' : '#e9edef'};
  border: 1px solid ${props => props.active ? '#00a884' : '#2a3942'};
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: #2a3942;
    border-color: #00a884;
    color: #00a884;
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
  background: #0b1216;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 0.5rem;
  z-index: 10;
  min-width: 180px;
  margin-top: 0.5rem;
  border: 1px solid #2a3942;

  small {
    display: block;
    color: #8696a0;
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
  color: ${props => props.active ? '#00a884' : '#e9edef'};
  background: ${props => props.active ? '#2a3942' : 'transparent'};
  margin-bottom: 0.2rem;
  transition: all 0.2s ease;

  &:hover {
    background: #2a3942;
    color: #00a884;
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
    grid-template-columns: repeat(3, 1fr);
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.9rem;
  }
`;

export const CategoryCard = styled(motion.div)`
  background: #0b1216;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border: 1px solid #2a3942;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  position: relative;
  height: 100%;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.color || '#00a884'};
  }

  &:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.4);
    transform: translateY(-2px);
  }
`;

export const CardContent = styled.div`
  padding: 0.75rem;
  flex: 1;

  @media (min-width: 768px) {
    padding: 0.9rem;
  }
`;

export const CategoryIcon = styled.div`
  font-size: 1.2rem;
  margin-bottom: 0.5rem;
  color: ${props => props.color || '#00a884'};

  @media (min-width: 768px) {
    font-size: 1.4rem;
    margin-bottom: 0.6rem;
  }
`;

export const CategoryName = styled.h3`
  font-size: 0.9rem;
  color: #e9edef;
  margin-bottom: 0.3rem;
  font-weight: 600;
  line-height: 1.3;

  @media (min-width: 768px) {
    font-size: 1rem;
    margin-bottom: 0.4rem;
  }
`;

export const CategoryDesc = styled.p`
  color: #8696a0;
  font-size: 0.7rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;

  @media (min-width: 768px) {
    font-size: 0.75rem;
    margin-bottom: 0.9rem;
  }
`;

export const CategoryMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
  font-size: 0.7rem;

  @media (min-width: 768px) {
    font-size: 0.75rem;
  }
`;

export const BookCount = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #8696a0;
`;

export const Rating = styled.span`
  display: flex;
  align-items: center;
  gap: 0.2rem;
  color: #8696a0;
`;

export const ViewButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.4rem;
  background: #2a3942;
  color: #00a884;
  font-weight: 500;
  gap: 0.2rem;
  border-top: 1px solid #2a3942;
  transition: all 0.2s ease;
  font-size: 0.75rem;

  @media (min-width: 768px) {
    padding: 0.5rem;
    font-size: 0.8rem;
  }

  ${CategoryCard}:hover & {
    background: #2a3942;
  }
`;

export const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: 1.5rem auto 0;
  padding: 0.5rem 1rem;
  background: #00a884;
  color: white;
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
    background: #008069;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: 1.5rem 1rem;
  background: #2a3942;
  border-radius: 8px;
  border: 1px dashed #2a3942;
  color: #8696a0;
  margin: 1rem 0;
  grid-column: 1 / -1;

  h3 {
    font-size: 1rem;
    color: #e9edef;
    margin: 0.8rem 0 0.4rem;
  }

  p {
    margin-bottom: 0;
    font-size: 0.8rem;
  }

  svg {
    color: #2a3942;
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
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 0.5rem;
`;

export const ModalContent = styled(motion.div)`
  position: relative;
  background: #0b1216;
  border-radius: 12px;
  overflow: hidden;
  max-width: 480px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border: 1px solid #2a3942;
`;

export const ModalHeader = styled.div`
  padding: 1rem 1.25rem 0.75rem;
  text-align: center;
  background: ${props => props.color || '#00a884'};
  color: white;

  .modal-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.2rem;
    margin-bottom: 0.4rem;
  }

  p {
    opacity: 0.9;
    margin-bottom: 0;
    font-size: 0.8rem;
  }

  @media (min-width: 768px) {
    padding: 1.2rem 1.5rem 0.8rem;

    .modal-icon {
      font-size: 2rem;
      margin-bottom: 0.6rem;
    }

    h2 {
      font-size: 1.4rem;
    }

    p {
      font-size: 0.85rem;
    }
  }
`;

export const ModalBody = styled.div`
  padding: 0.75rem 1.25rem;
  overflow-y: auto;
  flex: 1;

  @media (min-width: 768px) {
    padding: 1rem 1.5rem;
  }
`;

export const StatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
  margin-bottom: 1rem;

  @media (min-width: 480px) {
    grid-template-columns: 1fr 1fr;
  }
`;

export const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: #e9edef;

  svg {
    color: #00a884;
    flex-shrink: 0;
    font-size: 0.9rem;
  }

  @media (min-width: 768px) {
    font-size: 0.85rem;

    svg {
      font-size: 1rem;
    }
  }
`;

export const NewReleases = styled.div`
  h3 {
    font-size: 0.9rem;
    color: #e9edef;
    margin-bottom: 0.6rem;
    padding-bottom: 0.4rem;
    border-bottom: 1px solid #2a3942;
  }

  ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  li {
    padding: 0.3rem 0;
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: #e9edef;
    font-size: 0.8rem;

    svg {
      color: #8696a0;
      font-size: 0.7rem;
    }
  }

  @media (min-width: 768px) {
    h3 {
      font-size: 1rem;
      margin-bottom: 0.8rem;
    }

    li {
      font-size: 0.85rem;

      svg {
        font-size: 0.8rem;
      }
    }
  }
`;

export const ExploreButton = styled(motion.button)`
  display: block;
  width: calc(100% - 2rem);
  margin: 0 auto 0.75rem;
  padding: 0.5rem;
  background: #00a884;
  color: white;
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
    background: #008069;
  }
`;

export const CloseButton = styled.button`
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #ef4444;
  border: none;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: white;
  z-index: 10;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);

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
  background: #0b1216;
  color: #f59e0b;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;
  font-size: 0.55rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }
`;

export const NewBadge = styled.span`
  background: #0b1216;
  color: #10b981;
  padding: 0.15rem 0.3rem;
  border-radius: 999px;
  font-size: 0.55rem;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

  @media (min-width: 768px) {
    padding: 0.2rem 0.4rem;
    font-size: 0.6rem;
  }
`;

export const SkeletonCard = styled.div`
  background: #0b1216;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  border: 1px solid #2a3942;
  padding: 0.75rem;
  height: 140px;

  @media (min-width: 768px) {
    padding: 0.9rem;
    height: 160px;
  }
`;

export const SkeletonIcon = styled.div`
  width: 28px;
  height: 28px;
  background: #2a3942;
  border-radius: 50%;
  margin-bottom: 0.5rem;

  @media (min-width: 768px) {
    width: 32px;
    height: 32px;
    margin-bottom: 0.6rem;
  }
`;

export const SkeletonText = styled.div`
  height: 10px;
  background: #2a3942;
  border-radius: 4px;
  margin-bottom: 0.4rem;
  width: ${props => props.width || '100%'};

  @media (min-width: 768px) {
    height: 12px;
    margin-bottom: 0.5rem;
  }
`;

export const SkeletonButton = styled.div`
  height: 28px;
  background: #2a3942;
  border-radius: 6px;
  margin-top: 0.6rem;

  @media (min-width: 768px) {
    height: 32px;
    margin-top: 0.8rem;
  }
`;