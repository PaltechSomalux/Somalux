import './Trending.css';
import { useState } from 'react';
import JobCard from './JobCard';
import DetailsPanel from './DetailsPanel';
import Search from './Search';

function Trending({ profiles = [], searchTerm = '', onToggleLiked, likedItems, onToggleBookmarked, bookmarkedItems, onToggleFollowing, followingItems, userProfileId = null, onSearchChange }) {
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [trendingProfiles] = useState([
    {
      id: 1,
      name: 'Michael Chen',
      email: 'michael@example.com',
      phone: '+1 (555) 234-5678',
      avatar: 'https://via.placeholder.com/100?text=MC',
      title: 'Full Stack Developer',
      bio: 'Full stack specialist creating scalable web and mobile solutions. Expert in modern development practices and cloud deployment.',
      skills: ['Node.js', 'React', 'MongoDB', 'GraphQL', 'AWS', 'Python', 'Vue.js'],
      experience: '6+ years',
      rating: 4.9,
      hourlyRate: '$95',
      availability: 'Available',
      location: 'New York, NY',
      completedProjects: 52,
      responseTime: '1 hour',
      portfolio: [
        { title: 'SaaS Platform', image: 'https://via.placeholder.com/200?text=SaaS' },
        { title: 'Mobile App', image: 'https://via.placeholder.com/200?text=Mobile' },
        { title: 'Data Dashboard', image: 'https://via.placeholder.com/200?text=Dashboard' },
      ],
      certifications: [
        'AWS Certified Developer',
        'MongoDB Professional',
        'Agile Scrum Master',
      ],
      reviews: [
        { client: 'FinTech Solutions', rating: 5, comment: 'Outstanding full stack skills!' },
        { client: 'Digital Agency', rating: 4.9, comment: 'Very responsive and productive.' },
        { client: 'SaaS Startup', rating: 5, comment: 'Built exactly what we needed.' },
      ],
    },
    {
      id: 2,
      name: 'David Rodriguez',
      email: 'david@example.com',
      phone: '+1 (555) 456-7890',
      avatar: 'https://via.placeholder.com/100?text=DR',
      title: 'DevOps Engineer',
      bio: 'Cloud infrastructure specialist with expertise in AWS and Docker. Experienced in building and maintaining scalable systems.',
      skills: ['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Linux', 'Terraform', 'Jenkins'],
      experience: '8+ years',
      rating: 4.9,
      hourlyRate: '$110',
      availability: 'Busy',
      location: 'Seattle, WA',
      completedProjects: 67,
      responseTime: '4 hours',
      portfolio: [
        { title: 'Kubernetes Cluster Setup', image: 'https://via.placeholder.com/200?text=K8s' },
        { title: 'CI/CD Pipeline', image: 'https://via.placeholder.com/200?text=Pipeline' },
        { title: 'Cloud Migration', image: 'https://via.placeholder.com/200?text=Cloud' },
      ],
      certifications: [
        'AWS Solutions Architect Professional',
        'Kubernetes Administrator (CKA)',
        'HashiCorp Certified Terraform',
      ],
      reviews: [
        { client: 'Enterprise Corp', rating: 5, comment: 'Exceptional infrastructure expertise.' },
        { client: 'Cloud Services Co', rating: 4.9, comment: 'Reliable and knowledgeable.' },
        { client: 'SaaS Platform', rating: 5, comment: 'Scaled our system perfectly.' },
      ],
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      phone: '+1 (555) 123-4567',
      avatar: 'https://via.placeholder.com/100?text=SJ',
      title: 'Senior React Developer',
      bio: 'Experienced React developer with 7+ years building modern web applications. Specialized in creating scalable, high-performance applications with clean code practices.',
      skills: ['React', 'JavaScript', 'Node.js', 'TypeScript', 'REST APIs', 'PostgreSQL', 'Docker'],
      experience: '7+ years',
      rating: 4.8,
      hourlyRate: '$85',
      availability: 'Available',
      location: 'San Francisco, CA',
      completedProjects: 45,
      responseTime: '2 hours',
      portfolio: [
        { title: 'E-Commerce Platform', image: 'https://via.placeholder.com/200?text=Ecom' },
        { title: 'Project Management App', image: 'https://via.placeholder.com/200?text=PM' },
        { title: 'Analytics Dashboard', image: 'https://via.placeholder.com/200?text=Analytics' },
      ],
      certifications: [
        'React Certified Developer',
        'AWS Solutions Architect',
        'Google Cloud Professional',
      ],
      reviews: [
        { client: 'Tech Corp', rating: 5, comment: 'Excellent developer, delivered ahead of schedule!' },
        { client: 'StartUp Inc', rating: 4.8, comment: 'Great communication and code quality.' },
        { client: 'Enterprise Co', rating: 5, comment: 'Professional and reliable, highly recommended!' },
      ],
    },
  ]);

  return (
    <div className="Trending-container">
      <div className="Trending">
        <div className="home-search-section">
          <Search profiles={profiles} onSearchChange={onSearchChange} />
        </div>
        <div className="trending-header">
          <p>Top-rated freelancers gaining popularity</p>
        </div>
        
        <div className="jobs-grid">
          {/* User Profile First in Grid */}
          {userProfileId && (() => {
            const userProfile = profiles.find(p => p.id === userProfileId);
            return userProfile ? (
              <JobCard 
                key={userProfile.id} 
                job={userProfile} 
                searchTerm={searchTerm}
                onSelect={() => setSelectedProfile(userProfile)}
                onToggleLiked={onToggleLiked}
                likedItems={likedItems}
                onToggleBookmarked={onToggleBookmarked}
                bookmarkedItems={bookmarkedItems}
                onToggleFollowing={onToggleFollowing}
                followingItems={followingItems}
                isUserProfile={true}
              />
            ) : null;
          })()}
          
          {trendingProfiles.map((profile) => (
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
      </div>
      {selectedProfile && (
        <DetailsPanel 
          profile={selectedProfile} 
          onClose={() => setSelectedProfile(null)}
          onToggleFollowing={onToggleFollowing}
          followingItems={followingItems}
        />
      )}
    </div>
  );
}

export default Trending;
