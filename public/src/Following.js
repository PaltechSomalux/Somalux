import './Following.css';
import { useState } from 'react';
import JobCard from './JobCard';
import DetailsPanel from './DetailsPanel';
import Search from './Search';

function Following({ searchTerm = '', profiles = [], onToggleLiked, likedItems, onToggleBookmarked, bookmarkedItems, onToggleFollowing, followingItems, onSearchChange }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  
  // Filter profiles to show only those being followed
  const followingProfiles = profiles.filter(profile => followingItems?.[profile.id]);

  return (
    <div className="Following-container">
      <div className="Following">
        <div className="home-search-section">
          <Search profiles={profiles} onSearchChange={onSearchChange} />
        </div>
        {followingProfiles.length > 0 ? (
          <div className="jobs-grid">
            {followingProfiles.map((profile) => (
              <JobCard 
                key={profile.id} 
                job={profile}
                searchTerm={searchTerm}
                onSelect={() => setSelectedProfile(profile)}
                onToggleLiked={onToggleLiked}
                likedItems={likedItems}
                onToggleBookmarked={onToggleBookmarked}
                bookmarkedItems={bookmarkedItems}
                onToggleFollowing={onToggleFollowing}
                followingItems={followingItems}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No following yet. Click the follow button on profiles to add them here!</p>
          </div>
        )}
      </div>
      {selectedProfile && (
        <DetailsPanel 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)}
          onToggleFollowing={onToggleFollowing}
          followingItems={followingItems}
          isFromFollowing={true}
        />
      )}
    </div>
  );
}

export default Following;
