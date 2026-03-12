import styled from 'styled-components';
import { motion } from 'framer-motion';

const scaleFactor = 0.9;
const scaled = (value) => `calc(${value} * ${scaleFactor})`;

export const Container = styled.div`
  width: 100%;
  margin-top: 40px;
  padding: 1rem;
  background: #0b1216;
`;

export const Header = styled.div`
  text-align: center;
  margin-bottom: ${scaled('1.5rem')};
  color: #e9edef;
`;

export const Title = styled.h1`
  font-size: ${scaled('2rem')};
  color: #e9edef;
  margin-bottom: ${scaled('0.25rem')};
`;

export const Subtitle = styled.p`
  font-size: ${scaled('0.95rem')};
  color: #8696a0;
  max-width: ${scaled('700px')};
  margin: 0 auto;
`;

export const Controls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${scaled('1.25rem')};
  gap: ${scaled('0.75rem')};
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-wrap: nowrap;
    align-items: stretch;
  }
`;

export const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  min-width: ${scaled('200px')};

  @media (max-width: 480px) {
    max-width: calc(100% - ${scaled('120px')});
  }
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: ${scaled('0.5rem')} ${scaled('0.75rem')} ${scaled('0.5rem')} ${scaled('2rem')};
  border: 1px solid #2a3942;
  border-radius: ${scaled('4px')};
  font-size: ${scaled('0.9rem')};
  transition: all 0.2s;
  background-color: #2a3942;
  color: #e9edef;

  &:focus {
    outline: none;
    border-color: #00a884;
    box-shadow: 0 0 0 ${scaled('2px')} rgba(0, 168, 132, 0.2);
  }

  @media (max-width: 480px) {
    height: 100%;
  }
`;

export const SearchIcon = styled.span`
  position: absolute;
  left: ${scaled('0.75rem')};
  top: 50%;
  transform: translateY(-50%);
  color: #8696a0;
  font-size: ${scaled('0.9rem')};
`;

export const FilterWrapper = styled.div`
  position: relative;
  width: auto;
`;

export const FilterButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${scaled('6px')};
  padding: ${scaled('8px')} ${scaled('12px')};
  background: ${({ active }) => active ? '#2a3942' : '#2a3942'};
  color: ${({ active }) => active ? '#00a884' : '#e9edef'};
  border: 1px solid ${({ active }) => active ? '#00a884' : '#2a3942'};
  border-radius: ${scaled('4px')};
  font-weight: 500;
  font-size: ${scaled('0.9rem')};
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 100%;
  
  &:hover {
    background: #2a3942;
    border-color: #00a884;
  }
`;

export const FilterDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: ${scaled('6px')};
  width: ${scaled('200px')};
  background: #0b1216;
  border-radius: ${scaled('6px')};
  box-shadow: 0 ${scaled('2px')} ${scaled('8px')} rgba(0, 0, 0, 0.3);
  padding: ${scaled('8px')};
  z-index: 100;
  border: 1px solid #2a3942;
`;

export const FilterOption = styled.div`
  padding: ${scaled('6px')} ${scaled('10px')};
  border-radius: ${scaled('3px')};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${scaled('6px')};
  font-size: ${scaled('0.85rem')};
  background: ${({ active }) => active ? '#2a3942' : 'transparent'};
  color: ${({ active }) => active ? '#00a884' : '#e9edef'};
  margin-bottom: ${scaled('3px')};
  transition: all 0.2s;

  &:hover {
    background: #2a3942;
  }
`;

export const Grid = styled.div`
  display: grid;
  gap: ${scaled('1rem')};
  margin-bottom: ${scaled('1.5rem')};
  grid-template-columns: repeat(auto-fill, minmax(${scaled('240px')}, 1fr));

  @media (max-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 320px) {
    grid-template-columns: 1fr;
  }
`;

export const CategoryCard = styled(motion.div)`
  background: #0b1216;
  border-radius: ${scaled('8px')};
  overflow: hidden;
  box-shadow: 0 ${scaled('2px')} ${scaled('6px')} rgba(0, 0, 0, 0.2);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid #2a3942;
  border-top: ${scaled('3px')} solid ${({ color }) => color || '#00a884'};
`;

export const CardContent = styled.div`
  padding: ${scaled('1rem')};
`;

export const CategoryIcon = styled.div`
  font-size: ${scaled('1.5rem')};
  margin-bottom: ${scaled('0.75rem')};
  color: #00a884;
`;

export const CategoryName = styled.h3`
  font-size: ${scaled('1.1rem')};
  margin-bottom: ${scaled('0.25rem')};
  color: #e9edef;
`;

export const CategoryDesc = styled.p`
  color: #8696a0;
  font-size: ${scaled('0.8rem')};
  margin-bottom: ${scaled('1rem')};
  line-height: 1.4;
`;

export const CategoryMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${scaled('0.75rem')};
`;

export const Rating = styled.span`
  display: flex;
  align-items: center;
  gap: ${scaled('4px')};
  font-size: ${scaled('0.8rem')};
  color: #8696a0;
`;

export const ViewButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${scaled('0.5rem')};
  background: #2a3942;
  color: #00a884;
  font-weight: 500;
  font-size: ${scaled('0.85rem')};
  transition: all 0.2s;
  border-radius: ${scaled('4px')};

  &:hover {
    background: #2a3942;
  }

  svg {
    transition: transform 0.2s;
    font-size: ${scaled('0.9rem')};
  }

  &:hover svg {
    transform: translateX(${scaled('2px')});
  }
`;

export const LoadMoreButton = styled(motion.button)`
  display: block;
  margin: ${scaled('1.5rem')} auto 0;
  padding: ${scaled('0.6rem')} ${scaled('1.25rem')};
  background: #00a884;
  color: white;
  border: none;
  border-radius: ${scaled('4px')};
  font-weight: 500;
  font-size: ${scaled('0.9rem')};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #008069;
  }
`;

export const EmptyState = styled.div`
  text-align: center;
  padding: ${scaled('2rem')};
  background: #2a3942;
  border-radius: ${scaled('6px')};
  margin: ${scaled('1.5rem')} 0;
  border: 1px solid #2a3942;

  svg {
    color: #8696a0;
    margin-bottom: ${scaled('0.75rem')};
    font-size: ${scaled('2rem')};
  }

  h3 {
    color: #e9edef;
    margin-bottom: ${scaled('0.25rem')};
    font-size: ${scaled('1.25rem')};
  }

  p {
    color: #8696a0;
    margin-bottom: ${scaled('0.75rem')};
    font-size: ${scaled('0.9rem')};
  }
`;

export const SkeletonCard = styled.div`
  background: #0b1216;
  border-radius: ${scaled('8px')};
  padding: ${scaled('1rem')};
  box-shadow: 0 ${scaled('2px')} ${scaled('6px')} rgba(0, 0, 0, 0.2);
  border: 1px solid #2a3942;
`;

export const SkeletonIcon = styled.div`
  width: ${scaled('32px')};
  height: ${scaled('32px')};
  background: #2a3942;
  border-radius: 50%;
  margin-bottom: ${scaled('0.75rem')};
`;

export const SkeletonText = styled.div`
  height: ${scaled('10px')};
  background: #2a3942;
  border-radius: ${scaled('3px')};
  margin-bottom: ${scaled('0.5rem')};
  width: ${({ width }) => width || '100%'};
`;