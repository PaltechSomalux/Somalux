import React from 'react';
import './BookPanel.skeleton.css';

export const BookCardSkeleton = () => (
  <div className="book-card-skeletonBKP">
    {/* Badges (Trending, New) */}
    <div className="skeleton-badges-containerBKP">
      <div className="skeleton-badgeBKP" style={{ width: '65px' }}></div>
      <div className="skeleton-badgeBKP" style={{ width: '45px' }}></div>
    </div>
    
    {/* Book Cover */}
    <div className="skeleton-imageBKP"></div>
    
    {/* Content */}
    <div className="skeleton-contentBKP">
      <div className="skeleton-titleBKP"></div>
      <div className="skeleton-authorBKP"></div>
      
      {/* Meta (Rating + Downloads) */}
      <div className="skeleton-metaBKP">
        <div className="skeleton-meta-itemBKP"></div>
        <div className="skeleton-meta-itemBKP"></div>
      </div>
    </div>
    
    {/* Action Buttons (Like, View, Wishlist) */}
    <div className="skeleton-actionsBKP">
      <div className="skeleton-action-btnBKP"></div>
      <div className="skeleton-action-btnBKP"></div>
      <div className="skeleton-action-btnBKP"></div>
    </div>
  </div>
);

export const BookGridSkeleton = ({ count = 12 }) => (
  <div className="books-gridBKP">
    {Array.from({ length: count }).map((_, index) => (
      <BookCardSkeleton key={index} />
    ))}
  </div>
);

export const StatsBarSkeleton = () => (
  <div className="stats-bar-skeletonBKP">
    <div className="stat-skeleton-itemBKP">
      <div className="skeleton-stat-valueBKP"></div>
      <div className="skeleton-stat-labelBKP"></div>
    </div>
    <div className="stat-skeleton-itemBKP">
      <div className="skeleton-stat-valueBKP"></div>
      <div className="skeleton-stat-labelBKP"></div>
    </div>
    <div className="stat-skeleton-itemBKP">
      <div className="skeleton-stat-valueBKP"></div>
      <div className="skeleton-stat-labelBKP"></div>
    </div>
    <div className="stat-skeleton-itemBKP">
      <div className="skeleton-stat-valueBKP"></div>
      <div className="skeleton-stat-labelBKP"></div>
    </div>
  </div>
);
