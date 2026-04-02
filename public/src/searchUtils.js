// Utility functions for comprehensive search functionality

/**
 * Extracts all searchable fields from a profile/job object
 */
export const getSearchableText = (profile) => {
  if (!profile) return '';
  
  const searchParts = [
    profile.name,
    profile.title,
    profile.bio,
    profile.location,
    profile.email,
    profile.phone,
    profile.availability,
    profile.category,
    profile.jobTitle,
    profile.company,
    profile.experience,
    profile.hourlyRate,
    profile.responseTime,
    ...(Array.isArray(profile.skills) ? profile.skills : []),
    ...(Array.isArray(profile.certifications) ? profile.certifications : []),
  ];
  
  return searchParts
    .filter(part => part && String(part).trim())
    .join(' ')
    .toLowerCase();
};

/**
 * Extracts all distinct words from a profile for granular searching
 */
export const getDistinctWords = (profile) => {
  if (!profile) return new Set();
  
  const words = new Set();
  const searchableText = getSearchableText(profile);
  
  // Split on word boundaries, spaces, and special characters
  const splitWords = searchableText
    .split(/[\s+\-,./()[\]@#+]+/)
    .filter(word => word && word.length > 1);
  
  splitWords.forEach(word => words.add(word));
  
  // Also add individual skills and certifications as complete words
  if (Array.isArray(profile.skills)) {
    profile.skills.forEach(skill => {
      const skillLower = String(skill).toLowerCase().trim();
      if (skillLower.length > 1) words.add(skillLower);
    });
  }
  
  if (Array.isArray(profile.certifications)) {
    profile.certifications.forEach(cert => {
      const certLower = String(cert).toLowerCase().trim();
      if (certLower.length > 1) words.add(certLower);
    });
  }
  
  return words;
};

/**
 * Get all indexed search data from all profiles
 */
export const getAllSearchableTerms = (profiles) => {
  const allTerms = new Set();
  
  profiles.forEach(profile => {
    // Add all distinct words
    const words = getDistinctWords(profile);
    words.forEach(word => allTerms.add(word));
    
    // Add titles
    if (profile.title) allTerms.add(profile.title.toLowerCase());
    if (profile.name) allTerms.add(profile.name.toLowerCase());
    if (profile.availability) allTerms.add(profile.availability.toLowerCase());
    if (profile.experience) allTerms.add(profile.experience.toLowerCase());
    
    // Add location city/state
    if (profile.location) {
      const locationParts = profile.location.toLowerCase().split(',');
      locationParts.forEach(part => {
        const trimmed = part.trim();
        if (trimmed.length > 1) allTerms.add(trimmed);
      });
    }
  });
  
  return allTerms;
};

/**
 * Checks if a word matches a search term (start-of-word or exact match)
 */
const wordMatches = (word, searchTerm) => {
  // Exact match
  if (word === searchTerm) return true;
  
  // Starts with (e.g., "React" matches "Reac", "React Dev")
  if (word.startsWith(searchTerm)) return true;
  
  // Word boundary match - match at the start of compound words
  // e.g., "fullstack" matches "full" or "stack"
  const wordBoundaryRegex = new RegExp(`(^|\\b)${searchTerm}`);
  if (wordBoundaryRegex.test(word)) return true;
  
  return false;
};

/**
 * Checks if a profile matches the search term with accurate filtering
 */
export const matchesSearchTerm = (profile, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) return true;
  
  const searchLower = searchTerm.toLowerCase().trim();
  const searchableText = getSearchableText(profile);
  const profileWords = Array.from(getDistinctWords(profile));
  
  // Split search into individual words
  const searchWords = searchLower.split(/\s+/).filter(word => word.length > 0);
  
  // ALL search words must match for accurate filtering
  return searchWords.every(searchWord => {
    // Check if ANY profile word matches this search word
    const hasWordMatch = profileWords.some(word => wordMatches(word, searchWord));
    
    if (hasWordMatch) return true;
    
    // Fallback: check if searchable text contains the exact phrase
    // This helps with multi-word entries like "UI/UX Designer"
    if (searchableText.includes(searchWord)) return true;
    
    return false;
  });
};

/**
 * Filters an array of profiles based on search term
 */
export const filterProfiles = (profiles, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return profiles;
  }
  
  return profiles.filter(profile => matchesSearchTerm(profile, searchTerm));
};

/**
 * Gets search suggestions based on partial input
 */
export const getSearchSuggestions = (profiles, searchTerm) => {
  if (!searchTerm || searchTerm.trim().length === 0) return [];
  
  const searchLower = searchTerm.toLowerCase().trim();
  const suggestions = new Set();
  
  // Get all searchable terms from all profiles
  const allTerms = getAllSearchableTerms(profiles);
  
  // Filter terms that start with or contain the search term
  allTerms.forEach(term => {
    if (term.startsWith(searchLower) || term.includes(searchLower)) {
      suggestions.add(term);
    }
  });
  
  // Add specific matches from profiles
  profiles.forEach(profile => {
    const distinctWords = getDistinctWords(profile);
    
    distinctWords.forEach(word => {
      if (word.startsWith(searchLower)) {
        suggestions.add(word);
      }
    });
    
    // Add job titles
    if (profile.title && profile.title.toLowerCase().includes(searchLower)) {
      suggestions.add(profile.title.toLowerCase());
    }
    
    // Add names
    if (profile.name && profile.name.toLowerCase().includes(searchLower)) {
      suggestions.add(profile.name.toLowerCase());
    }
    
    // Add skills
    if (Array.isArray(profile.skills)) {
      profile.skills.forEach(skill => {
        const skillLower = skill.toLowerCase();
        if (skillLower.includes(searchLower)) {
          suggestions.add(skillLower);
        }
      });
    }
    
    // Add categories/availability
    if (profile.availability && profile.availability.toLowerCase().includes(searchLower)) {
      suggestions.add(profile.availability.toLowerCase());
    }
    
    if (profile.experience && profile.experience.toLowerCase().includes(searchLower)) {
      suggestions.add(profile.experience.toLowerCase());
    }
  });
  
  // Sort and return as array, with items starting with search term first
  const sortedSuggestions = Array.from(suggestions).sort((a, b) => {
    const aStartsWith = a.startsWith(searchLower) ? 0 : 1;
    const bStartsWith = b.startsWith(searchLower) ? 0 : 1;
    if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;
    return a.localeCompare(b);
  });
  
  return sortedSuggestions;
};

/**
 * Highlights matching text in content
 */
export const highlightMatchingText = (text, searchTerm) => {
  if (!searchTerm || !text) return text;
  
  const searchLower = searchTerm.toLowerCase();
  const regex = new RegExp(`(${searchLower.split(/\s+/).join('|')})`, 'gi');
  
  return text.replace(regex, '<mark>$1</mark>');
};
