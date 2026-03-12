import React, { useState, useEffect } from 'react';
import { MapPin, NavigationArrow, Buildings } from 'phosphor-react';
import './GoogleMapsIntegration.css';

export const GoogleMapsIntegration = ({ listing, university }) => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [directions, setDirections] = useState(null);
  const [walkingTime, setWalkingTime] = useState(null);

  useEffect(() => {
    loadGoogleMaps();
  }, []);

  const loadGoogleMaps = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setMapLoaded(true);
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places,directions`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setMapLoaded(true);
      initializeMap();
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!listing.latitude || !listing.longitude) return;

    const mapContainer = document.getElementById('rental-map');
    if (!mapContainer) return;

    const map = new window.google.maps.Map(mapContainer, {
      center: { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) },
      zoom: 15,
      styles: darkMapStyle,
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    });

    // Property marker
    new window.google.maps.Marker({
      position: { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) },
      map: map,
      title: listing.title,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#00a884',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });

    // University marker if coordinates available
    if (university?.latitude && university?.longitude) {
      new window.google.maps.Marker({
        position: { lat: parseFloat(university.latitude), lng: parseFloat(university.longitude) },
        map: map,
        title: university.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#2196f3',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2
        }
      });

      // Calculate walking directions
      calculateRoute(map);
    }

    // Add nearby places (optional)
    searchNearbyPlaces(map, { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) });
  };

  const calculateRoute = (map) => {
    if (!university?.latitude || !university?.longitude) return;

    const directionsService = new window.google.maps.DirectionsService();
    const directionsRenderer = new window.google.maps.DirectionsRenderer({
      map: map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#00a884',
        strokeWeight: 4
      }
    });

    const request = {
      origin: { lat: parseFloat(university.latitude), lng: parseFloat(university.longitude) },
      destination: { lat: parseFloat(listing.latitude), lng: parseFloat(listing.longitude) },
      travelMode: window.google.maps.TravelMode.WALKING
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK') {
        directionsRenderer.setDirections(result);
        const route = result.routes[0];
        if (route.legs[0]) {
          setDirections(route.legs[0]);
          setWalkingTime(route.legs[0].duration.text);
        }
      }
    });
  };

  const searchNearbyPlaces = (map, location) => {
    const service = new window.google.maps.places.PlacesService(map);
    
    const types = ['shopping_mall', 'hospital', 'police', 'atm', 'restaurant'];
    
    types.forEach(type => {
      service.nearbySearch({
        location: location,
        radius: 500,
        type: [type]
      }, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          // Show first result
          results.slice(0, 3).forEach(place => {
            new window.google.maps.Marker({
              position: place.geometry.location,
              map: map,
              title: place.name,
              icon: {
                url: place.icon,
                scaledSize: new window.google.maps.Size(20, 20)
              }
            });
          });
        }
      });
    });
  };

  const openInGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    window.open(url, '_blank');
  };

  return (
    <div className="maps-integration">
      <div className="maps-header">
        <h4>
          <MapPin size={20} weight="duotone" />
          Location & Directions
        </h4>
        {walkingTime && (
          <div className="walking-time">
            <NavigationArrow size={16} />
            {walkingTime} walk from campus
          </div>
        )}
      </div>

      {/* Map Container */}
      <div id="rental-map" className="map-container">
        {!mapLoaded && (
          <div className="map-loading">
            <div className="spinner"></div>
            <p>Loading map...</p>
          </div>
        )}
      </div>

      {/* Route Info */}
      {directions && (
        <div className="route-info">
          <div className="route-stat">
            <span className="stat-label">Distance</span>
            <span className="stat-value">{directions.distance.text}</span>
          </div>
          <div className="route-stat">
            <span className="stat-label">Walking Time</span>
            <span className="stat-value">{directions.duration.text}</span>
          </div>
          <div className="route-stat">
            <span className="stat-label">From</span>
            <span className="stat-value">{university?.name || 'Campus'}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="map-actions">
        <button className="map-action-btn" onClick={openInGoogleMaps}>
          Open in Google Maps
        </button>
        <button className="map-action-btn secondary">
          Get Directions
        </button>
      </div>

      {/* Nearby Places */}
      <div className="nearby-info">
        <h5>Nearby</h5>
        <div className="nearby-tags">
          <span className="nearby-tag">🛒 Shops</span>
          <span className="nearby-tag">🏥 Hospital</span>
          <span className="nearby-tag">🏧 ATM</span>
          <span className="nearby-tag">🍔 Restaurants</span>
        </div>
      </div>
    </div>
  );
};

// Dark map style for consistency
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];

/* 
Add to .env:
REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key

Get key from: https://console.cloud.google.com/google/maps-apis
Enable: Maps JavaScript API, Places API, Directions API
*/
