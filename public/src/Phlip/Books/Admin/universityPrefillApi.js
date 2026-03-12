import { supabase } from '../supabaseClient';

// API keys (replace with your own)
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.REACT_APP_UNSPLASH_ACCESS_KEY;


/**
 * Search for university names for autocomplete
 */
export async function searchUniversityNames(query, limit = 10) {
  try {
    // Check cache first
    let { data, error } = await supabase
      .rpc('search_university_names', { p_query: query, p_limit: limit });

    if (error) throw error;
    if (data?.length) return data;

    // Fetch from Google Knowledge Graph if cache is empty
    const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&types=University&limit=${limit}&key=${GOOGLE_API_KEY}`;
    const kgResponse = await fetch(kgUrl, { mode: 'cors' });
    if (!kgResponse.ok) throw new Error('Google Knowledge Graph fetch failed');

    const kgData = await kgResponse.json();
    const universities = kgData.itemListElement?.map(item => ({
      name: item.result.name,
      description: item.result.detailedDescription?.articleBody || '',
      website_url: item.result.detailedDescription?.url || '',
    })) || [];

    // Cache results
    await Promise.all(universities.map(uni => cacheUniversityPrefillData(uni.name, uni, 'google')));
    return universities;
  } catch (error) {
    console.error('Error searching university names:', error);
    return [];
  }
}

/**
 * Get prefill data for a university by name from cache
 */
export async function getUniversityPrefillData(universityName) {
  try {
    const { data, error } = await supabase
      .rpc('get_university_prefill_data', {
        p_university_name: universityName,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching prefill data:', error);
    return null;
  }
}

/**
 * Fetch university data from Google Knowledge Graph
 */
export async function fetchUniversityDataFromGoogle(universityName) {
  try {
    const kgUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(universityName + ' university')}&types=University&key=${GOOGLE_API_KEY}`;
    const response = await fetch(kgUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Google Knowledge Graph fetch failed');

    const data = await response.json();
    const result = data.itemListElement?.[0]?.result;

    if (!result) return null;

    return {
      name: result.name || universityName,
      description: result.detailedDescription?.articleBody || '',
      website_url: result.detailedDescription?.url || '',
      location: result.address?.addressLocality || '',
      established: null, // Google may not provide this
      student_count: null, // Google may not provide this
      cover_images: [],
    };
  } catch (error) {
    console.error('Error fetching from Google Knowledge Graph:', error);
    return null;
  }
}

/**
 * Fetch university summary from Wikipedia REST API (accurate description)
 */
export async function fetchUniversityDataFromWikipedia(universityName) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(universityName)}`;
    const res = await fetch(url, { mode: 'cors' });
    if (!res.ok) return null;
    const json = await res.json();

    return {
      name: json.title || universityName,
      description: json.extract || '',
      website_url: '', // Official website filled from Wikidata if available
      location: '',    // Filled from Wikidata if available
      established: null,
      student_count: null,
      cover_images: [],
    };
  } catch (e) {
    console.error('Error fetching from Wikipedia REST:', e);
    return null;
  }
}

/**
 * Fetch university data from Wikidata (fallback)
 */
export async function fetchUniversityDataFromWikidata(universityName) {
  try {
    const sparqlQuery = `
      SELECT ?item ?itemLabel ?location ?established ?studentCount ?website
      WHERE {
        ?item wdt:P31/wdt:P279* wd:Q3918;
              rdfs:label ?itemLabel;
              wdt:P131 ?location.
        OPTIONAL { ?item wdt:P571 ?established. }
        OPTIONAL { ?item wdt:P2196 ?studentCount. }
        OPTIONAL { ?item wdt:P856 ?website. }
        FILTER(CONTAINS(LCASE(?itemLabel), LCASE("${universityName}")))
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
      }
      LIMIT 1
    `;
    const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Wikidata fetch failed');

    const data = await response.json();
    const binding = data.results.bindings[0];

    if (!binding) return null;

    return {
      name: binding.itemLabel.value,
      description: '', // Wikidata doesn't provide descriptions
      website_url: binding.website?.value || '',
      location: binding.location?.value || '',
      established: binding.established?.value ? new Date(binding.established.value).getFullYear() : null,
      student_count: binding.studentCount?.value || null,
      cover_images: [],
    };
  } catch (error) {
    console.error('Error fetching from Wikidata:', error);
    return null;
  }
}

/**
 * Fetch Wikimedia Commons images for a university (high accuracy)
 */
export async function fetchWikimediaImages(universityName) {
  try {
    const title = (universityName || '').trim().replace(/\s+/g, '_');
    if (!title) return [];

    // 1) Get file titles linked on the university page
    const listUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=images&titles=${encodeURIComponent(title)}`;
    const listRes = await fetch(listUrl, { mode: 'cors' });
    if (!listRes.ok) return [];
    const listJson = await listRes.json();

    const pages = listJson?.query?.pages ? Object.values(listJson.query.pages) : [];
    const images = pages[0]?.images || [];
    if (!images.length) return [];

    // Build titles param for imageinfo
    const fileTitles = images
      .map((img) => img?.title)
      .filter(Boolean)
      .slice(0, 50) // cap to avoid overly long URLs
      .join('|');

    if (!fileTitles) return [];

    // 2) Resolve each file to a direct URL
    const infoUrl = `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url&titles=${encodeURIComponent(fileTitles)}`;
    const infoRes = await fetch(infoUrl, { mode: 'cors' });
    if (!infoRes.ok) return [];
    const infoJson = await infoRes.json();

    const filePages = infoJson?.query?.pages ? Object.values(infoJson.query.pages) : [];
    const urls = filePages
      .map((p) => p?.imageinfo?.[0]?.url)
      .filter((u) => typeof u === 'string' && /\.(jpg|jpeg|png|webp)$/i.test(u));

    // Prioritize likely campus/building images over logos/seals
    const prioritized = urls.sort((a, b) => {
      const deprioritize = (s) => /logo|seal|coat_of_arms|emblem/i.test(s) ? 1 : 0;
      return deprioritize(a) - deprioritize(b);
    });

    return prioritized.slice(0, 5);
  } catch (e) {
    console.error('Error fetching Wikimedia images:', e);
    return [];
  }
}

/**
 * Fetch images from Unsplash
 */
export async function fetchUnsplashImages(universityName) {
  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(universityName + ' university campus')}&per_page=5&client_id=${UNSPLASH_ACCESS_KEY}`;
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) throw new Error('Unsplash fetch failed');

    const data = await response.json();
    return data.results.map(photo => photo.urls.regular).slice(0, 5);
  } catch (error) {
    console.error('Error fetching Unsplash images:', error);
    return [];
  }
}

/**
 * Download image from URL and convert to File object
 */
export async function downloadImageAsFile(imageUrl, fileName) {
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Failed to download image');

    const blob = await response.blob();
    const file = new File([blob], fileName, { type: blob.type });
    return file;
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

/**
 * Cache university prefill data
 */
export async function cacheUniversityPrefillData(universityName, data, source = 'manual') {
  try {
    const { error } = await supabase
      .from('university_prefill_cache')
      .upsert({
        university_name: universityName,
        data: data,
        source: source,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error caching prefill data:', error);
    return false;
  }
}

/**
 * Upload multiple images for a university
 */
export async function uploadUniversityImages(universityId, imageFiles) {
  try {
    const uploadedImages = [];
    const bucket = 'university-covers';

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${universityId}/image_${i + 1}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      uploadedImages.push({
        url: urlData.publicUrl,
        fileName: fileName,
      });
    }

    return uploadedImages;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}

/**
 * Add image record to university_images table
 */
export async function addUniversityImage(universityId, imageUrl, caption = null, isPrimary = false, displayOrder = 0) {
  try {
    const { data, error } = await supabase
      .rpc('add_university_image', {
        p_university_id: universityId,
        p_image_url: imageUrl,
        p_caption: caption,
        p_is_primary: isPrimary,
        p_display_order: displayOrder,
      });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding university image:', error);
    throw error;
  }
}

/**
 * Get all images for a university
 */
export async function getUniversityImages(universityId) {
  try {
    const { data, error } = await supabase
      .from('university_images')
      .select('*')
      .eq('university_id', universityId)
      .order('is_primary', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching university images:', error);
    throw error;
  }
}

/**
 * Set image as primary
 */
export async function setPrimaryUniversityImage(imageId) {
  try {
    const { error } = await supabase
      .rpc('set_primary_university_image', {
        p_image_id: imageId,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error setting primary image:', error);
    return false;
  }
}

/**
 * Delete university image
 */
export async function deleteUniversityImage(imageId, imageUrl) {
  try {
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucket = 'university-covers';
    const filePath = urlParts.slice(urlParts.indexOf(bucket) + 1).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting from storage:', storageError);
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('university_images')
      .delete()
      .eq('id', imageId);

    if (dbError) throw dbError;
    return true;
  } catch (error) {
    console.error('Error deleting university image:', error);
    throw error;
  }
}

/**
 * Main auto-fill function triggered on tab/input
 */
export async function autoFillUniversityData(universityName) {
  try {
    // Check cache first
    let data = await getUniversityPrefillData(universityName);
    if (data) return data;

    // Prefer Wikipedia + Wikidata for accuracy
    const wikiSummary = await fetchUniversityDataFromWikipedia(universityName);
    const wikidata = await fetchUniversityDataFromWikidata(universityName);

    // Merge: start with Wikipedia summary, overlay structured fields from Wikidata
    if (wikiSummary || wikidata) {
      const merged = {
        name: (wikiSummary?.name || wikidata?.name || universityName) ?? universityName,
        description: wikiSummary?.description || '',
        website_url: wikidata?.website_url || '',
        location: wikidata?.location || '',
        established: wikidata?.established ?? null,
        student_count: wikidata?.student_count ?? null,
        cover_images: [],
      };
      data = merged;
    }

    // As a last resort for metadata, try Google if both Wikipedia and Wikidata failed
    if (!data) {
      data = await fetchUniversityDataFromGoogle(universityName);
    }

    // Images: try Wikimedia Commons first, then Unsplash as last resort
    if (data && (!data.cover_images || data.cover_images.length === 0)) {
      const commons = await fetchWikimediaImages(data.name || universityName);
      if (commons.length) {
        data.cover_images = commons;
      } else {
        const unsplash = await fetchUnsplashImages(data.name || universityName);
        data.cover_images = unsplash;
      }
    }

    // Cache the result
    if (data) {
      await cacheUniversityPrefillData(universityName, data, 'wikipedia_wikidata');
    }

    return (
      data || {
        name: universityName,
        description: '',
        website_url: '',
        location: '',
        established: null,
        student_count: null,
        cover_images: [],
      }
    );
  } catch (error) {
    console.error('Error auto-filling university data:', error);
    return {
      name: universityName,
      description: '',
      website_url: '',
      location: '',
      established: null,
      student_count: null,
      cover_images: [],
    };
  }
}

/**
 * Get all cached universities for dropdown/autocomplete
 */
export async function getAllCachedUniversities() {
  try {
    const { data, error } = await supabase
      .from('university_prefill_cache')
      .select('university_name')
      .order('university_name');

    if (error) throw error;
    return data?.map(u => u.university_name) || [];
  } catch (error) {
    console.error('Error fetching cached universities:', error);
    return [];
  }
}

/**
 * Debounce utility to prevent excessive API calls
 */
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Frontend integration for auto-fill on tab/input
 */
export function setupAutoFill(inputElement, resultContainer) {
  // Autocomplete suggestions on input
  inputElement.addEventListener(
    'input',
    debounce(async () => {
      const query = inputElement.value.trim();
      if (query.length < 3) return;

      const suggestions = await searchUniversityNames(query);
      // Display suggestions in a dropdown (implement UI as needed)
      console.log('Suggestions:', suggestions);
      // Example: Update a dropdown or datalist
      const datalist = document.createElement('datalist');
      datalist.id = 'university-suggestions';
      suggestions.forEach(s => {
        const option = document.createElement('option');
        option.value = s.name;
        datalist.appendChild(option);
      });
      inputElement.setAttribute('list', 'university-suggestions');
      inputElement.parentNode.appendChild(datalist);
    }, 300)
  );

  // Auto-fill on tab
  inputElement.addEventListener('keydown', async (event) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      const universityName = inputElement.value.trim();
      if (!universityName) return;

      const data = await autoFillUniversityData(universityName);
      if (data) {
        // Populate form fields or UI
        resultContainer.innerHTML = `
          <h3>${data.name}</h3>
          <p>${data.description || 'No description available'}</p>
          <a href="${data.website_url || '#'}" target="_blank">Website</a>
          <p>Location: ${data.location || 'N/A'}</p>
          <p>Established: ${data.established || 'N/A'}</p>
          <p>Students: ${data.student_count || 'N/A'}</p>
          <div>
            ${data.cover_images
              .map(img => `<img src="${img}" alt="${data.name} campus" width="200" style="margin-right: 10px;" />`)
              .join('')}
          </div>
        `;
      }
    }
  });
}