import styled from 'styled-components';

export const DashboardContainer = styled.div`
  width: 100%;
  margin-top: 0;
  padding: 0.75rem;
  box-sizing: border-box;
  background-color: #0b1216;
  color: #e9edef;

  .dashboard-header h1 {
    font-size: 1.5rem;
    text-align: center;
    margin-bottom: 1.5rem;
    word-break: break-word;
    color: #e9edef;
  }

  @media (max-width: 768px) {
    .dashboard-header h1 {
      font-size: 1.3rem;
      margin-bottom: 1.2rem;
    }
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    
    .dashboard-header h1 {
      font-size: 1.1rem;
      margin-bottom: 1rem;
      padding: 0 0.5rem;
    }
  }
`;

export const SearchContainer = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 0 0.5rem;
  box-sizing: border-box;

  .search-box {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    max-width: 500px;

    input {
      padding: 0.5rem 2rem 0.5rem 2.5rem;
      width: 100%;
      border: 1px solid #2a3942;
      border-radius: 4px;
      font-size: 0.9rem;
      box-sizing: border-box;
      background-color: #0b1216;
      color: #e9edef;
      
      &::placeholder {
        color: #8696a0;
      }
    }
    
    .search-icon {
      position: absolute;
      left: 0.75rem;
      color: #8696a0;
    }
    
    .clear-search {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      color: #8696a0;
      cursor: pointer;
      font-size: 1rem;
    }
  }

  @media (max-width: 480px) {
    margin-bottom: 1rem;
    padding: 0 0.25rem;
    
    .search-box {
      input {
        padding: 0.5rem 1.5rem 0.5rem 2rem;
        font-size: 0.8rem;
      }
      
      .search-icon {
        left: 0.5rem;
      }
      
      .clear-search {
        right: 0.5rem;
      }
    }
  }
`;

export const AuthorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.8rem;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 0.5rem;
    padding: 0 0.25rem;
  }
`;

export const AuthorCard = styled.div`
  border: 1px solid #2a3942;
  border-radius: 8px;
  padding: 0.75rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
  overflow: hidden;
  background-color: #0b1216;
  color: #e9edef;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  }
  
  .author-photo {
    position: relative;
    text-align: center;
    margin-bottom: 0.75rem;
    
    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #0b1216;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .author-badge {
      position: absolute;
      bottom: -5px;
      left: 50%;
      transform: translateX(-50%);
      background: #0b1216;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      gap: 3px;
      white-space: nowrap;
      color: #e9edef;
    }
  }
  
  .author-info {
    h3 {
      font-size: 0.95rem;
      margin: 0.5rem 0;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      color: #e9edef;
    }
    
    .nationality {
      font-size: 0.8rem;
      color: #8696a0;
      text-align: center;
      margin-bottom: 0.5rem;
      word-break: break-word;
    }
  }
  
  .author-stats {
    font-size: 0.75rem;
    color: #8696a0;
    display: flex;
    justify-content: center;
    gap: 0.5rem;
    margin: 0.5rem 0;
    flex-wrap: wrap;
    
    svg {
      margin-right: 0.2rem;
      color: #8696a0;
    }
    
    span {
      white-space: nowrap;
    }
  }
  
  .author-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.75rem;
    
    .follow-button {
      background: #0b1216;
      border: none;
      border-radius: 4px;
      padding: 0.3rem 0.5rem;
      font-size: 0.7rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 60%;
      color: #e9edef;
      
      &.following {
        background: #008069;
        color: #00a884;
      }
    }
    
    .reaction-buttons {
      display: flex;
      gap: 0.3rem;
      
      button {
        background: none;
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        padding: 0.2rem;
        color: #8696a0;
        
        &.active {
          color: #00a884;
        }
        
        .count {
          font-size: 0.7rem;
          margin-left: 0.2rem;
          color: #e9edef;
        }
      }
    }
  }

  @media (max-width: 480px) {
    padding: 0.5rem;
    
    .author-photo img {
      width: 60px;
      height: 60px;
    }
    
    .author-info h3 {
      font-size: 0.85rem;
    }
    
    .author-actions {
      flex-direction: column;
      gap: 0.5rem;
      align-items: stretch;
      
      .follow-button {
        max-width: 100%;
        justify-content: center;
      }
      
      .reaction-buttons {
        justify-content: space-around;
      }
    }
  }
`;

export const RatingStars = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin: 0.5rem 0;
  flex-wrap: wrap;
  
  span {
    color: #2a3942;
    font-size: 0.8rem;
    
    &.filled {
      color: #00a884;
    }
    
    &:last-child {
      color: #8696a0;
      font-size: 0.7rem;
      margin-left: 0.3rem;
    }
  }
`;

export const PaginationControls = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1.5rem;
  flex-wrap: wrap;
  padding: 0 0.5rem;
  
  button {
    padding: 0.5rem 1rem;
    border: 1px solid #2a3942;
    background: #0b1216;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    min-width: 40px;
    color: #e9edef;
    
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    &:hover:not(:disabled) {
      background: #008069;
    }
  }

  @media (max-width: 480px) {
    gap: 0.5rem;
    margin-top: 1rem;
    
    button {
      padding: 0.3rem 0.7rem;
      font-size: 0.8rem;
      min-width: 36px;
    }
  }
`;

export const AuthorSpotlight = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 0.5rem;
  box-sizing: border-box;
  
  .modal-content {
    background: #0b1216;
    border-radius: 8px;
    width: 100%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1.5rem;
    position: relative;
    box-sizing: border-box;
    border: 1px solid #2a3942;
    
    .close-modal {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #8696a0;
    }
    
    .author-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      text-align: center;
      
      img {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid #2a3942;
      }
      
      .author-info {
        width: 100%;
        
        h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
          word-break: break-word;
          color: #e9edef;
        }
        
        .nationality {
          color: #8696a0;
          margin-bottom: 1rem;
          font-size: 1rem;
          word-break: break-word;
        }
        
        .author-stats {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 1rem;
          margin-top: 1rem;
          
          span {
            display: flex;
            align-items: center;
            gap: 0.3rem;
            font-size: 0.9rem;
            color: #8696a0;
            white-space: nowrap;
          }
        }
      }
    }
    
    .author-details {
      h3 {
        margin-top: 0;
        font-size: 1.2rem;
        word-break: break-word;
        color: #e9edef;
      }
      
      .booklist-button-container {
        margin: 1.5rem 0;
        text-align: center;
        
        .booklist-button {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: #00a884;
          color: #0b1216;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          
          &:hover {
            background: #008069;
          }
        }
      }
      
      .rating-section {
        margin-top: 1.5rem;
        
        .star-rating {
          display: flex;
          justify-content: center;
          gap: 0.3rem;
          margin: 1rem 0;
          flex-wrap: wrap;
          
          .star {
            cursor: pointer;
            font-size: 1.5rem;
            color: #2a3942;
            
            &.filled {
              color: #00a884;
            }
          }
        }
        
        .rating-text {
          display: block;
          font-size: 0.9rem;
          color: #8696a0;
          text-align: center;
          word-break: break-word;
        }
      }
    }
  }

  @media (max-width: 768px) {
    .modal-content {
      padding: 1rem;
      
      .author-header {
        .author-info h2 {
          font-size: 1.3rem;
        }
      }
    }
  }

  @media (max-width: 480px) {
    padding: 0.25rem;
    
    .modal-content {
      padding: 0.75rem;
      
      .author-header img {
        width: 80px;
        height: 80px;
      }
      
      .author-details h3 {
        font-size: 1.1rem;
      }
      
      .author-stats {
        gap: 0.5rem !important;
        
        span {
          font-size: 0.8rem !important;
        }
      }
    }
  }
`;

export const NoResults = styled.div`
  text-align: center;
  padding: 2rem 0;
  width: 100%;
  box-sizing: border-box;
  
  h3 {
    color: #8696a0;
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
    word-break: break-word;
    padding: 0 0.5rem;
  }
  
  p {
    color: #2a3942;
    font-size: 0.9rem;
    word-break: break-word;
    padding: 0 0.5rem;
  }

  @media (max-width: 480px) {
    padding: 1.5rem 0.5rem;
    
    h3 {
      font-size: 1.1rem;
    }
    
    p {
      font-size: 0.85rem;
    }
  }
`;