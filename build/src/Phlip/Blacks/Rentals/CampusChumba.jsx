import React, { useState, useEffect } from 'react';
import { 
  MagnifyingGlass, Sliders, MapPin, House, Heart, Star,
  Money, WifiHigh, Drop, Lightning, Shield, CaretRight, CaretLeft,
  Users, Calendar, X, Plus, Buildings, PhoneCall,PushPin ,PushPinSimple 
} from 'phosphor-react';
import { supabase } from '../../Books/supabaseClient';
import { LandlordDashboard } from './LandlordDashboard';
import './CampusChumba.css';
import { getCache, setCache, delCacheByPrefix, delCache } from './cache';

// Supabase client is imported from shared Books supabaseClient

// Icon component for property types (module scope so all components can use it)
function PropertyTypeIcon({ type }) {
  const icons = {
    bedsitter: <House size={20} weight="duotone" />,
    single: <House size={20} weight="fill" />,
    one_bedroom: <Buildings size={20} weight="duotone" />,
    shared_2: <Users size={20} weight="duotone" />,
    shared_3: <Users size={20} weight="fill" />,
    shared_4: <Users size={20} weight="bold" />
  };
  return icons[type] || <House size={20} />;
}

export const CampusChumba = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [view, setView] = useState('student'); // 'student' or 'landlord'
  const [universities, setUniversities] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [showHeaderFilters, setShowHeaderFilters] = useState(false);
  const [headerPinned, setHeaderPinned] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [favorites, setFavorites] = useState([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    university_id: '',
    search: '',
    minPrice: '',
    maxPrice: '',
    propertyType: '',
    gender: '',
    hasWifi: false,
    has24hWater: false,
    hasSecurity: false,
    maxDistance: '',
    onlyFavorites: false
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check authentication via Supabase
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session || null);
      setUser(data.session?.user || null);
      if (!data.session?.user) setView('student');
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user || null);
      if (!newSession?.user) setView('student');
    });
    return () => {
      sub?.subscription?.unsubscribe?.();
      mounted = false;
    };
  }, []);

  const getToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token || '';
  };

  // Load universities
  useEffect(() => {
    loadUniversities();
  }, []);

  // Load listings when filters change
  useEffect(() => {
    if (view === 'student') {
      loadListings();
    }
  }, [filters, page, view]);

  // Load user's favorites
  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  // Ensure header filters are only visible for student view
  useEffect(() => {
    if (view !== 'student') setShowHeaderFilters(false);
  }, [view]);

  const loadUniversities = async () => {
    try {
      const cacheKey = 'universities';
      const cached = getCache(cacheKey);
      if (cached) {
        setUniversities(cached);
        return;
      }

      const response = await fetch('http://localhost:5000/api/rentals/universities');
      const data = await response.json();
      if (data.success) {
        setUniversities(data.universities);
        setCache(cacheKey, data.universities, 1000 * 60 * 60 * 6); // 6 hours
      }
    } catch (error) {
      console.error('Error loading universities:', error);
    }
  };

  const loadListings = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12'
      });

      if (filters.university_id) params.append('university_id', filters.university_id);
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);
      if (filters.propertyType) params.append('property_type', filters.propertyType);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.hasWifi) params.append('has_wifi', 'true');
      if (filters.has24hWater) params.append('has_24h_water', 'true');
      if (filters.hasSecurity) params.append('has_security', 'true');
      if (filters.maxDistance) params.append('max_distance', filters.maxDistance);

      const cacheKey = `listings:${params.toString()}`;
      const cached = getCache(cacheKey);
      let data;
      if (cached) {
        data = cached;
      } else {
        const response = await fetch(`http://localhost:5000/api/rentals/listings?${params}`);
        data = await response.json();
        if (data && data.success) {
          // short TTL to keep listing results fresh but speed up repeated views
          setCache(cacheKey, data, 1000 * 30); // 30s
        }
      }

      if (data && data.success) {
        // If user requested only favorites, filter client-side using loaded favorites
        if (filters.onlyFavorites) {
          // ensure favorites are loaded
          let favIds = favorites && favorites.length ? favorites : (user ? await loadFavorites() : []);
          if (!favIds || favIds.length === 0) {
            setListings([]);
            setTotalPages(1);
          } else {
            const filtered = data.listings.filter(l => favIds.includes(l.id));
            setListings(filtered);
            setTotalPages(1);
          }
        } else {
          setListings(data.listings);
          setTotalPages(data.pagination.pages);
        }
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    if (!user) return [];

    try {
      const cacheKey = `favorites:${user.id}`;
      const cached = getCache(cacheKey);
      if (cached) {
        setFavorites(cached);
        return cached;
      }

      const token = await getToken();
      const response = await fetch('http://localhost:5000/api/rentals/favorites', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const favIds = data.favorites.map(f => f.listing_id);
        setFavorites(favIds);
        setCache(cacheKey, favIds, 1000 * 60); // 60s
        return favIds;
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    return [];
  };

  const toggleFavorite = async (listingId) => {
    if (!user) {
      alert('Please sign in to save favorites');
      return;
    }

    try {
      const token = await getToken();
      const isFavorite = favorites.includes(listingId);

      // optimistic update for faster UI
      if (isFavorite) {
        setFavorites(prev => prev.filter(id => id !== listingId));
      } else {
        setFavorites(prev => [...prev, listingId]);
      }

      if (isFavorite) {
        const res = await fetch(`http://localhost:5000/api/rentals/favorites/${listingId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          // revert optimistic update
          setFavorites(prev => (prev.includes(listingId) ? prev : [...prev, listingId]));
        }
      } else {
        const res = await fetch('http://localhost:5000/api/rentals/favorites', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ listing_id: listingId })
        });
        if (!res.ok) {
          // revert optimistic update
          setFavorites(prev => prev.filter(id => id !== listingId));
        }
      }

      // update favorites cache and invalidate listing caches that may include favorite markers
      const favCacheKey = `favorites:${user.id}`;
      setCache(favCacheKey, favorites, 1000 * 60);
      delCacheByPrefix('listings:');
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // helper to update filters and reset to first page
  const updateFilters = (patch) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(1);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Render authentication prompt if not logged in
  if (!user) {
    return (
      <div className="campus-chumba-auth-required">
        <div className="auth-prompt">
          <House size={64} weight="duotone" color="#00a884" />
          <h2>Welcome to CampusChumba</h2>
          <p>Find your perfect student accommodation near campus</p>
          <div className="auth-message">
            <Shield size={24} />
            <span>Please sign in to browse listings, save favorites, and book rooms</span>
          </div>
          <button
            className="btn-primary"
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            style={{ marginTop: 16 }}
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  // Build a readable summary of active filters (returns empty string when no filters)
  const buildFilterSummary = () => {
    const parts = [];

    // University name
    if (filters.university_id) {
      const uni = universities.find(u => String(u.id) === String(filters.university_id));
      if (uni) parts.push(`Campus: ${uni.name}`);
    }

    // Price range
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? formatPrice(filters.minPrice) : '';
      const max = filters.maxPrice ? formatPrice(filters.maxPrice) : '';
      if (min && max) parts.push(`Price: ${min}–${max}`);
      else if (min) parts.push(`Price: from ${min}`);
      else if (max) parts.push(`Price: up to ${max}`);
    }

    // Property type
    if (filters.propertyType) {
      parts.push(`Type: ${filters.propertyType.replace('_', ' ')}`);
    }

    // Gender
    if (filters.gender) {
      parts.push(`${filters.gender === 'male' ? 'Male only' : filters.gender === 'female' ? 'Female only' : filters.gender}`);
    }

    // Amenities
    const amen = [];
    if (filters.hasWifi) amen.push('Wi‑Fi');
    if (filters.has24hWater) amen.push('24/7 Water');
    if (filters.hasSecurity) amen.push('Security');
    if (amen.length) parts.push(`Amenities: ${amen.join(', ')}`);

    // Distance
    if (filters.maxDistance) parts.push(`Within ${filters.maxDistance} km`);

    // Only favorites
    if (filters.onlyFavorites) parts.push('Favorites');

    // Search term
    if (filters.search) parts.push(`Search: "${filters.search}"`);

    return parts.length ? parts.join(' · ') : '';
  };

  return (
    <div className="campus-chumba-container">
      {/* Header with View Toggle */}
      <div className={`campus-chumba-header ${showHeaderFilters ? 'filters-open' : ''} ${headerPinned ? 'pinned' : 'unpinned'}`}>
        <div className="header-content">
          {!showHeaderFilters ? (
            <>
              <div className="brand">
                <House size={32} weight="duotone" />
                <div>
                  <h1>CampusChumba</h1>
                  <p>Off-Campus Student Housing</p>
                </div>
                <span
                  type="button"
                  className={`header-pin-toggle ${headerPinned ? 'active' : ''}`}
                  onClick={() => setHeaderPinned(prev => !prev)}
                  title={headerPinned ? 'Unpin header' : 'Pin header'}
                >
                  <PushPinSimple size={20} weight={headerPinned ? "fill" : "regular"} />
                </span>
              </div>

              <div className="view-toggle">
                <button
                  className={view === 'student' ? 'active' : ''}
                  onClick={() => { setView('student'); }}
                >
                  <MagnifyingGlass size={20} />
                  Find a Room
                </button>
                <button
                  className={view === 'landlord' ? 'active' : ''}
                  onClick={() => { setView('landlord'); setShowHeaderFilters(false); }}
                >
                  <Plus size={20} />
                  List Property
                </button>
                {view === 'student' && (
                  <button
                    className="header-filter-btn filter-toggle"
                    onClick={() => setShowHeaderFilters(true)}
                    aria-expanded={showHeaderFilters}
                  >
                    <Sliders size={16} />
                    Filters
                    {showHeaderFilters && <span className="active-indicator">•</span>}
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="filters-panel-in-header">
              <div className="filter-panel-actions">
                <button className="btn-secondary" onClick={() => setShowHeaderFilters(false)}>Close</button>
                <div style={{ flex: 1 }} />
                <button
                  className="btn-primary"
                  onClick={() => setShowHeaderFilters(false)}
                >
                  Apply
                </button>
              </div>

              <div className="filters-grid">
                <div className="filter-group">
                  <label>University</label>
                  <select
                    value={filters.university_id}
                    onChange={(e) => updateFilters({ university_id: e.target.value })}
                  >
                    <option value="">All Universities</option>
                    {universities.map(uni => (
                      <option key={uni.id} value={uni.id}>{uni.name}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-group">
                  <label>Price Range (KES)</label>
                  <div className="price-inputs">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(e) => updateFilters({ minPrice: e.target.value })}
                    />
                    <span>to</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(e) => updateFilters({ maxPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="filter-group">
                  <label>Room Type</label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => updateFilters({ propertyType: e.target.value })}
                  >
                    <option value="">All Types</option>
                    <option value="bedsitter">Bedsitter</option>
                    <option value="single">Single Room</option>
                    <option value="one_bedroom">One Bedroom</option>
                    <option value="shared_2">Sharing (2 people)</option>
                    <option value="shared_3">Sharing (3 people)</option>
                    <option value="shared_4">Sharing (4 people)</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Gender</label>
                  <select
                    value={filters.gender}
                    onChange={(e) => updateFilters({ gender: e.target.value })}
                  >
                    <option value="">Any</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Amenities</label>
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.hasWifi}
                        onChange={(e) => updateFilters({ hasWifi: e.target.checked })}
                      />
                      <WifiHigh size={18} />
                      Wi-Fi
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.has24hWater}
                        onChange={(e) => updateFilters({ has24hWater: e.target.checked })}
                      />
                      <Drop size={18} />
                      24/7 Water
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={filters.hasSecurity}
                        onChange={(e) => updateFilters({ hasSecurity: e.target.checked })}
                      />
                      <Shield size={18} />
                      Security
                    </label>
                  </div>
                </div>

                <div className="filter-group">
                  <label>Favorites</label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filters.onlyFavorites}
                      onChange={(e) => updateFilters({ onlyFavorites: e.target.checked })}
                    />
                    Only Favorites
                  </label>
                </div>

                <div className="filter-group">
                  <label>Max Distance from Gate (km)</label>
                  <input
                    type="number"
                    placeholder="e.g., 2"
                    value={filters.maxDistance}
                    onChange={(e) => updateFilters({ maxDistance: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button
                  className="clear-filters"
                  onClick={() => updateFilters({
                    university_id: '',
                    search: '',
                    minPrice: '',
                    maxPrice: '',
                    propertyType: '',
                    gender: '',
                    hasWifi: false,
                    has24hWater: false,
                    hasSecurity: false,
                    maxDistance: '',
                    onlyFavorites: false
                  })}
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {view === 'student' ? (
        <div className="student-view">

          {/* Search and Filters */}
          <div className="search-section">
            {/* <div className="search-bar">
              <MagnifyingGlass size={20} />
              <input
                type="text"
                placeholder="Search by location, area name..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div> */}
            
            {/* Filters are now accessible from the header */}
          </div>

          {/* Filters are now header-mounted; inline panel removed */}

          {/* Listings Grid */}
          <div className="listings-section">
            <div className="listings-header">
              <h3>
                {listings.length} Properties Available
                {(() => {
                  const summary = buildFilterSummary();
                  return summary ? ` · ${summary}` : '';
                })()}
              </h3>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading properties...</p>
              </div>
            ) : listings.length === 0 ? (
              <div className="empty-state">
                <House size={64} weight="light" />
                <h3>No Properties Found</h3>
                <p>Try adjusting your filters or search term</p>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isFavorite={favorites.includes(listing.id)}
                    onToggleFavorite={() => toggleFavorite(listing.id)}
                    onClick={() => setSelectedListing(listing)}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>Page {page} of {totalPages}</span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="landlord-view">
          <LandlordDashboard user={user} getToken={getToken} />
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          user={user}
        />
      )}
    </div>
  );
};

// Listing Card Component
const ListingCard = ({ listing, isFavorite, onToggleFavorite, onClick }) => {
  const images = Array.isArray(listing.images) ? listing.images : [];
  const mainImage = images[0] || 'https://via.placeholder.com/300x200?text=No+Image';

  return (
    <div className="listing-card" onClick={onClick}>
      <div className="listing-image">
        <img src={mainImage} alt={listing.title} />
        {listing.is_featured && <div className="featured-badge">Featured</div>}
        <span
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          {/* <Heart size={20} weight={isFavorite ? 'fill' : 'regular'} /> */}
          ❤
        </span>
      </div>

      <div className="listing-content">
        <div className="listing-header">
          <h4>{listing.title}</h4>
          {listing.average_rating > 0 && (
            <div className="rating">
              <Star size={16} weight="fill" />
              <span>{listing.average_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        <div className="listing-location">
          <MapPin size={16} />
          <span>{listing.area_name}</span>
          {listing.walking_minutes && (
            <span className="distance">• {listing.walking_minutes} min walk</span>
          )}
        </div>

        <div className="listing-type">
          <PropertyTypeIcon type={listing.property_type} />
          <span>{listing.property_type.replace('_', ' ')}</span>
        </div>

        <div className="listing-amenities">
          {listing.has_wifi && <WifiHigh size={16} title="Wi-Fi" />}
          {listing.has_24h_water && <Drop size={16} title="24/7 Water" />}
          {listing.has_24h_electricity && <Lightning size={16} title="24/7 Power" />}
          {listing.has_security && <Shield size={16} title="Security" />}
        </div>

        <div className="listing-footer">
          <div className="price">
            <Money size={18} />
            <span className="amount">{new Intl.NumberFormat('en-KE', {
              style: 'currency',
              currency: 'KES',
              minimumFractionDigits: 0
            }).format(listing.monthly_rent)}</span>
            <span className="period">/month</span>
          </div>
          <div className="availability">
            {listing.available_rooms} room{listing.available_rooms !== 1 ? 's' : ''} left
          </div>
        </div>
      </div>
    </div>
  );
};

// Listing Detail Modal with full info and booking
const ListingDetailModal = ({ listing, onClose, user }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingData, setBookingData] = useState({
    move_in_date: '',
    duration_months: 1,
    is_group_booking: false,
    payment_phone: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const images = Array.isArray(listing.images) && listing.images.length > 0
    ? listing.images
    : ['https://via.placeholder.com/800x600?text=No+Image'];

  const handleBooking = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token;
      if (!token) {
        alert('Please sign in to book');
        return;
      }

      const totalAmount = (listing.monthly_rent * bookingData.duration_months) + listing.deposit;
      const res = await fetch('http://localhost:5000/api/rentals/bookings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          listing_id: listing.id,
          move_in_date: bookingData.move_in_date,
          duration_months: parseInt(bookingData.duration_months),
          total_amount: totalAmount,
          payment_phone: bookingData.payment_phone,
          is_group_booking: bookingData.is_group_booking
        })
      });

      if (res.ok) {
        alert('Booking request submitted! Landlord will review.');
        onClose();
      } else {
        const err = await res.json();
        alert(`Booking failed: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="listing-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={24} weight="bold" />
        </button>

        {/* Image Gallery */}
        <div className="detail-images">
          <div className="main-image" onClick={() => setIsViewerOpen(true)}>
            <img src={images[selectedImageIndex]} alt={listing.title} />
            {listing.is_featured && <div className="featured-badge">Featured</div>}
          </div>
          {images.length > 1 && (
            <div className="image-thumbnails">
              {images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`${listing.title} ${idx + 1}`}
                  className={selectedImageIndex === idx ? 'active' : ''}
                  onClick={() => setSelectedImageIndex(idx)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Full image viewer overlay */}
        {isViewerOpen && (
          <div className="image-viewer-overlay" onClick={() => setIsViewerOpen(false)}>
            <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
              <button
                className="image-viewer-close"
                onClick={() => setIsViewerOpen(false)}
                aria-label="Close image viewer"
              >
                <X size={22} weight="bold" />
              </button>
              <div className="image-viewer-main">
                {selectedImageIndex > 0 && (
                  <button
                    className="image-viewer-nav left"
                    onClick={() => setSelectedImageIndex((idx) => Math.max(0, idx - 1))}
                    aria-label="Previous image"
                  >
                    <CaretLeft size={28} weight="bold" />
                  </button>
                )}
                <img src={images[selectedImageIndex]} alt={listing.title} />
                {selectedImageIndex < images.length - 1 && (
                  <button
                    className="image-viewer-nav right"
                    onClick={() => setSelectedImageIndex((idx) => Math.min(images.length - 1, idx + 1))}
                    aria-label="Next image"
                  >
                    <CaretRight size={28} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="detail-content">
          <div className="detail-header">
            <div>
              <h2>{listing.title}</h2>
              <div className="detail-location">
                <MapPin size={18} weight="fill" />
                <span>{listing.area_name}, {listing.address}</span>
              </div>
              {listing.distance_from_gate && (
                <div className="detail-distance">
                  <CaretRight size={16} />
                  <span>{listing.distance_from_gate} km from gate</span>
                  {listing.walking_minutes && <span> • {listing.walking_minutes} min walk</span>}
                </div>
              )}
            </div>
            <div className="detail-price">
              <Money size={24} weight="bold" />
              <div>
                <span className="amount">KES {listing.monthly_rent.toLocaleString()}</span>
                <span className="period">/month</span>
              </div>
            </div>
          </div>

          <div className="detail-stats">
            <div className="stat-item">
              <PropertyTypeIcon type={listing.property_type} />
              <span>{listing.property_type.replace('_', ' ')}</span>
            </div>
            <div className="stat-item">
              <Users size={18} />
              <span>{listing.available_rooms} / {listing.total_rooms} available</span>
            </div>
            {listing.average_rating > 0 && (
              <div className="stat-item">
                <Star size={18} weight="fill" />
                <span>{listing.average_rating.toFixed(1)} ({listing.total_reviews} reviews)</span>
              </div>
            )}
          </div>

          <div className="detail-section">
            <h3>Description</h3>
            <p>{listing.description}</p>
          </div>

          <div className="detail-section">
            <h3>Amenities & Features</h3>
            <div className="amenities-grid">
              {listing.has_wifi && <div className="amenity-item"><WifiHigh size={20} /> Wi-Fi</div>}
              {listing.has_24h_water && <div className="amenity-item"><Drop size={20} /> 24/7 Water</div>}
              {listing.has_24h_electricity && <div className="amenity-item"><Lightning size={20} /> 24/7 Power</div>}
              {listing.has_security && <div className="amenity-item"><Shield size={20} /> Security</div>}
              {listing.has_parking && <div className="amenity-item"><House size={20} /> Parking</div>}
              {listing.has_kitchen && <div className="amenity-item"><House size={20} /> Kitchen</div>}
              {listing.has_private_bathroom && <div className="amenity-item"><House size={20} /> Private Bathroom</div>}
              {listing.allows_cooking && <div className="amenity-item">Cooking Allowed</div>}
            </div>
          </div>

          <div className="detail-section">
            <h3>Property Details</h3>
            <div className="details-list">
              <div className="detail-row"><strong>Property Type:</strong> {listing.property_type.replace('_', ' ')}</div>
              <div className="detail-row"><strong>Gender:</strong> {listing.gender_restriction === 'any' ? 'Any' : listing.gender_restriction.replace('_', ' ')}</div>
              <div className="detail-row"><strong>Deposit:</strong> KES {listing.deposit.toLocaleString()}</div>
              {listing.booking_fee > 0 && <div className="detail-row"><strong>Booking Fee:</strong> KES {listing.booking_fee.toLocaleString()}</div>}
              <div className="detail-row"><strong>Max Occupants:</strong> {listing.max_occupants}</div>
              {listing.available_from && <div className="detail-row"><strong>Available From:</strong> {new Date(listing.available_from).toLocaleDateString()}</div>}
            </div>
          </div>

          {listing.house_rules && (
            <div className="detail-section">
              <h3>House Rules</h3>
              <p>{listing.house_rules}</p>
            </div>
          )}

          <div className="detail-section">
            <h3>Contact Landlord</h3>
            <div className="landlord-contact">
              <div><PhoneCall size={18} /> {listing.landlord_phone}</div>
              {listing.landlord_email && <div>{listing.landlord_email}</div>}
            </div>
          </div>

          {/* Booking Section */}
          {!showBookingForm ? (
            <button className="btn-primary btn-large" onClick={() => setShowBookingForm(true)}>
              <Calendar size={20} />
              Book This Property
            </button>
          ) : (
            <form className="booking-form" onSubmit={handleBooking}>
              <h3>Booking Details</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Move-in Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingData.move_in_date}
                    onChange={(e) => setBookingData({ ...bookingData, move_in_date: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Duration (months) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={bookingData.duration_months}
                    onChange={(e) => setBookingData({ ...bookingData, duration_months: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>M-Pesa Phone Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="07XXXXXXXX"
                  value={bookingData.payment_phone}
                  onChange={(e) => setBookingData({ ...bookingData, payment_phone: e.target.value })}
                />
              </div>
              <div className="booking-summary">
                <div>Rent: KES {(listing.monthly_rent * bookingData.duration_months).toLocaleString()}</div>
                <div>Deposit: KES {listing.deposit.toLocaleString()}</div>
                <div className="total">Total: KES {((listing.monthly_rent * bookingData.duration_months) + listing.deposit).toLocaleString()}</div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowBookingForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Booking Request'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
