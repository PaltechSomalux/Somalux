/**
 * Wikipedia API Module
 * Handles fetching explanations and summaries from Wikipedia
 */

/**
 * Extract key terms from text (handling multi-line selections)
 * @param {string} text - The text to extract from
 * @returns {string} - The search term
 */
const extractKeyTerms = (text) => {
  try {
    // Clean up the text - remove extra whitespace and newlines
    let cleanText = text.trim().replace(/\s+/g, ' ');
    
    // Remove special characters and URLs
    cleanText = cleanText.replace(/[^a-zA-Z0-9\s]/g, '').trim();
    
    // If text is very short or empty, return original with cleanup
    if (cleanText.length < 3) {
      const fallback = text.trim().split(/\s+/)[0];
      return fallback || 'Business Intelligence';
    }
    
    // Split into words
    const words = cleanText.split(/\s+/).filter(w => w.length > 2);
    
    // Common words to filter out
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'your', 'my', 'our', 'their', 'his', 'her', 'its', 'that', 'this', 'these', 'those', 'with', 'from', 'as', 'by', 'com', 'org', 'net'];
    
    // Filter out common words
    const meaningfulWords = words.filter(w => !commonWords.includes(w.toLowerCase()));
    
    // If we have meaningful words, use them
    if (meaningfulWords.length >= 3) {
      return meaningfulWords.slice(0, 3).join(' ');
    } else if (meaningfulWords.length === 2) {
      return meaningfulWords.join(' ');
    } else if (meaningfulWords.length === 1) {
      return meaningfulWords[0];
    } else if (words.length > 0) {
      // Fall back to first non-common words or first word
      return words.slice(0, 2).join(' ');
    } else {
      // Last resort - return original text up to first space
      return text.trim().split(/\s+/)[0] || 'Information';
    }
  } catch (error) {
    console.error('Error extracting key terms:', error);
    return text.trim().split(/\s+/).slice(0, 2).join(' ') || 'Information';
  }
};

/**
 * Fetch a summary/explanation from Wikipedia
 * @param {string} searchTerm - The term to search for
 * @returns {Promise<Object>} - Object containing title and extract
 */
export const fetchWikipediaExplanation = async (searchTerm) => {
  try {
    console.log('📚 Fetching Wikipedia explanation for:', searchTerm);
    
    // Extract key terms from the search term (handles multi-line selections)
    const keyTerm = extractKeyTerms(searchTerm);
    console.log('🔍 Extracted key term:', keyTerm);
    
    // Use Wikipedia REST API endpoint - simpler and more reliable
    const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(keyTerm)}`;
    
    console.log('🌐 Requesting URL:', wikiUrl);
    
    const response = await fetch(wikiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'SomaLux/1.0'
      }
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.warn('⚠️ REST API failed, trying query API...');
      return await fetchWithQueryApi(keyTerm);
    }
    
    const data = await response.json();
    
    console.log('✅ Wikipedia data received');
    
    if (data.extract) {
      // Get more content - up to 1000 characters for better explanation
      const extract = data.extract.substring(0, 1000);
      
      return {
        title: data.title || keyTerm,
        extract: extract,
        success: true,
        source: 'REST API'
      };
    } else {
      console.warn('⚠️ No extract in REST response, trying query API...');
      return await fetchWithQueryApi(keyTerm);
    }
  } catch (error) {
    console.error('❌ Wikipedia API error:', error);
    return await fetchWithQueryApi(searchTerm);
  }
};

/**
 * Fallback: Use Wikipedia query API
 */
const fetchWithQueryApi = async (searchTerm) => {
  try {
    console.log('📚 Trying Wikipedia query API for:', searchTerm);
    
    const keyTerm = extractKeyTerms(searchTerm);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(keyTerm)}&prop=extracts&explaintext=true&format=json&origin=*`;
    
    console.log('🌐 Query API URL:', wikiUrl);
    
    const response = await fetch(wikiUrl);
    
    console.log('📡 Query API Response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Query API HTTP error');
    }
    
    const data = await response.json();
    const pages = data.query?.pages || {};
    const pageId = Object.keys(pages)[0];
    
    if (pageId && pages[pageId]?.extract) {
      const page = pages[pageId];
      const extract = page.extract.substring(0, 1000);
      
      console.log('✅ Query API data received');
      
      return {
        title: page.title || keyTerm,
        extract: extract,
        success: true,
        source: 'Query API'
      };
    }
    
    console.warn('⚠️ No extract in query response');
    throw new Error('No extract found');
  } catch (error) {
    console.error('❌ Query API error:', error);
    return {
      title: searchTerm,
      extract: null,
      success: false,
      error: error.message
    };
  }
};

/**
 * Fetch detailed page content from Wikipedia
 * @param {string} searchTerm - The term to search for
 * @returns {Promise<Object>} - Object containing page data
 */
export const fetchWikipediaPage = async (searchTerm) => {
  try {
    console.log('📄 Fetching Wikipedia page for:', searchTerm);
    
    const keyTerm = extractKeyTerms(searchTerm);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(keyTerm)}&prop=extracts|info&inprop=url&explaintext=true&format=json&origin=*`;
    
    const response = await fetch(wikiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    const pages = data.query?.pages;
    if (!pages) {
      throw new Error('No pages found');
    }
    
    const pageId = Object.keys(pages)[0];
    const page = pages[pageId];
    
    console.log('✅ Page data received');
    
    return {
      title: page.title,
      extract: page.extract || '',
      url: page.fullurl || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
      success: true
    };
  } catch (error) {
    console.error('❌ Wikipedia page fetch error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Search Wikipedia for related articles
 * @param {string} searchTerm - The term to search for
 * @param {number} limit - Maximum number of results
 * @returns {Promise<Array>} - Array of search results
 */
export const searchWikipedia = async (searchTerm, limit = 5) => {
  try {
    console.log('🔎 Searching Wikipedia for:', searchTerm);
    
    const keyTerm = extractKeyTerms(searchTerm);
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(keyTerm)}&srlimit=${limit}&format=json&origin=*`;
    
    const response = await fetch(wikiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Search results received:', data.query?.search?.length || 0);
    
    return data.query?.search || [];
  } catch (error) {
    console.error('❌ Wikipedia search error:', error);
    return [];
  }
};

/**
 * Get a simple definition from Wikipedia
 * @param {string} searchTerm - The term to search for
 * @returns {Promise<string>} - Simple definition text
 */
export const getWikipediaDefinition = async (searchTerm) => {
  try {
    console.log('📖 Getting Wikipedia definition for:', searchTerm);
    
    const result = await fetchWikipediaExplanation(searchTerm);
    
    if (result.success && result.extract) {
      // Return just the first sentence or paragraph
      const firstParagraph = result.extract.split('\n')[0];
      return firstParagraph || result.extract.substring(0, 150);
    }
    
    return `Unable to fetch definition for "${searchTerm}"`;
  } catch (error) {
    console.error('❌ Definition fetch error:', error);
    return `Unable to fetch definition for "${searchTerm}"`;
  }
};
