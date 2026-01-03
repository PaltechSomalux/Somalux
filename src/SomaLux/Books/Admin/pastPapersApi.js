import { supabase } from '../supabaseClient';
import { API_URL } from '../../../config';

const API_BASE = API_URL;

const PAST_PAPERS_BUCKET = 'past-papers';

// =====================================================
// PAST PAPERS CRUD OPERATIONS
// =====================================================

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function makePastPapersCacheKey({ page, pageSize, search, universityId, faculty, sort }) {
  return `pastPapers:${page}:${pageSize}:${search || ''}:${universityId || ''}:${faculty || ''}:${(sort?.col)||''}:${(sort?.dir)||''}`;
}

export async function fetchPastPapers({ 
  page = 1, 
  pageSize = 20, 
  search = '', 
  universityId = null,
  faculty = null,
  sort = { col: 'created_at', dir: 'desc' },
  forceRefresh = false
}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  console.log('📥 fetchPastPapers called with:', { page, pageSize, search, universityId, faculty, forceRefresh });
  
  const cacheKey = makePastPapersCacheKey({ page, pageSize, search, universityId, faculty, sort });
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.timestamp && (Date.now() - parsed.timestamp) < CACHE_TTL_MS) {
          console.log('📦 Returning cached papers');
          return { data: parsed.data || [], count: parsed.count || 0, fromCache: true };
        }
      }
    } catch (e) {
      // ignore cache errors
    }
  }
  try {
    // Column mapping for sorting (frontend -> database)
    const sortColumnMap = {
      'views_count': 'views',
      'downloads_count': 'downloads_count',
      'views': 'views',
      'downloads': 'downloads_count'
    };
    
    const dbSortCol = sortColumnMap[sort.col] || sort.col || 'created_at';
    
    let query = supabase
      .from('past_papers')
      .select(`
        id, 
        unit_code, 
        unit_name, 
        faculty, 
        file_url, 
        year, 
        semester,
        exam_type,
        file_path,
        downloads_count, 
        views_count, 
        created_at, 
        uploaded_by,
        title,
        university_id,
        universities:university_id(id, name),
        profiles:uploaded_by(id, full_name, email)
      `, { count: 'exact' })
      .order(dbSortCol, { ascending: (sort.dir || 'desc') === 'asc' })
      .range(from, to);

    if (search) {
      // Trim search input and handle spaces
      const trimmedSearch = search.trim();
      console.log('🔍 Searching for:', trimmedSearch);
      
      // Split search into individual terms and search for each
      const searchTerms = trimmedSearch.split(/\s+/).filter(t => t.length > 0);
      console.log('🔍 Search terms:', searchTerms);
      
      if (searchTerms.length > 0) {
        // Build OR conditions for full text search on all fields
        // Also add conditions that match each individual term
        let searchConditions = [];
        
        // Add full string match
        searchConditions.push(`unit_code.ilike.%${trimmedSearch}%`);
        searchConditions.push(`unit_name.ilike.%${trimmedSearch}%`);
        searchConditions.push(`title.ilike.%${trimmedSearch}%`);
        
        // Add individual term matches
        searchTerms.forEach(term => {
          searchConditions.push(`unit_code.ilike.%${term}%`);
          searchConditions.push(`unit_name.ilike.%${term}%`);
          searchConditions.push(`title.ilike.%${term}%`);
        });
        
        // Remove duplicates
        searchConditions = [...new Set(searchConditions)];
        
        console.log('🔍 Final search conditions:', searchConditions.join(' OR '));
        query = query.or(searchConditions.join(','));
      }
    }

    if (universityId) {
      query = query.eq('university_id', universityId);
    }

    if (faculty) {
      query = query.eq('faculty', faculty);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('Supabase error fetching past papers:', error);
      throw new Error(`Failed to fetch past papers: ${error.message}`);
    }

    if (search) {
      console.log(`🔍 Search results: Found ${count} papers`);
      if (count === 0 && data.length === 0) {
        console.log('⚠️ No results found. Showing sample data from database:');
        const { data: sampleData } = await supabase
          .from('past_papers')
          .select('id, unit_code, unit_name, title')
          .limit(3);
        console.log('Sample database records:', sampleData);
      } else {
        console.log('Found papers:', data.map(p => ({ unit_code: p.unit_code, unit_name: p.unit_name, title: p.title })));
      }
    }

    // Ensure file_url is properly generated from file_path for each paper
    const processedData = (data || []).map(paper => {
      let finalUrl = paper.file_url;
      
      console.log('Processing paper:', {
        id: paper.id,
        title: paper.title,
        file_path: paper.file_path,
        file_url: paper.file_url,
        universities: paper.universities
      });
      
      // Always regenerate from file_path to ensure correct URL
      if (paper.file_path) {
        try {
          const publicUrlData = supabase.storage.from(PAST_PAPERS_BUCKET).getPublicUrl(paper.file_path);
          if (publicUrlData?.data?.publicUrl) {
            finalUrl = publicUrlData.data.publicUrl;
            console.log(`✓ Generated URL for ${paper.id}:`, finalUrl);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to generate URL from file_path for paper ${paper.id}:`, err);
          // Fall back to stored file_url if generation fails
        }
      }
      
      // Validate URL format
      if (!finalUrl || !finalUrl.startsWith('https://')) {
        console.warn(`⚠️ Invalid file_url for paper ${paper.id}:`, finalUrl);
      }
      
      return {
        ...paper,
        file_url: finalUrl
      };
    });

    const result = { data: processedData || [], count: count || 0 };
    console.log('✅ Successfully fetched and processed papers:', {
      count: processedData.length,
      papers: processedData.map(p => ({ id: p.id, title: p.title, hasUrl: !!p.file_url }))
    });
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result.data, count: result.count }));
    } catch (e) {
      // ignore localStorage write errors (quota, private mode)
    }
    return result;
  } catch (err) {
    console.error('❌ Error in fetchPastPapers:', err);
    throw err;
  }
}

export function clearPastPapersCache() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith('pastPapers:') || key === 'universities:dropdown') {
        try { localStorage.removeItem(key); } catch (e) {}
      }
    }
  } catch (e) {
    // ignore
  }
}

export async function uploadPastPaperFile(file) {
  try {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage
      .from(PAST_PAPERS_BUCKET)
      .upload(path, file, { 
        cacheControl: '3600', 
        upsert: false, 
        contentType: file.type 
      });
    
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file to bucket '${PAST_PAPERS_BUCKET}': ${error.message}`);
    }
    
    return { 
      path: data.path, 
      publicUrl: supabase.storage.from(PAST_PAPERS_BUCKET).getPublicUrl(data.path).data.publicUrl 
    };
  } catch (err) {
    console.error('File upload failed:', err);
    throw err;
  }
}

export async function checkDuplicatePastPaper({ universityId, faculty, unitCode, unitName, year }) {
  try {
    const { data, error } = await supabase
      .from('past_papers')
      .select('id, unit_code, unit_name, faculty, year')
      .eq('university_id', universityId)
      .eq('faculty', faculty)
      .eq('unit_code', unitCode)
      .eq('unit_name', unitName)
      .eq('year', year ? Number(year) : null);
    
    if (error && error.code !== 'PGRST116') {
      console.error('Error checking duplicate:', error);
      throw error;
    }
    
    return {
      exists: data && data.length > 0,
      count: data ? data.length : 0,
      paper: data && data.length > 0 ? data[0] : null
    };
  } catch (err) {
    console.error('Duplicate check failed:', err);
    throw err;
  }
}

export async function createPastPaper({ metadata, pdfFile }) {
  try {
    console.log('🔍 createPastPaper START - metadata:', metadata);
    
    if (!pdfFile) {
      throw new Error('PDF file is required');
    }

    // Upload file directly to Supabase storage (bypasses backend base64 conversion)
    console.log('📤 Uploading PDF file to Supabase storage...');
    const uploaded = await uploadPastPaperFile(pdfFile);
    const file_url = uploaded.publicUrl;
    console.log('✅ PDF uploaded successfully:', { path: uploaded.path, url: file_url });

    // Generate title with fallbacks
    const title = metadata.title || `${metadata.unit_code} - ${metadata.unit_name}`;

    // Get current user
    console.log('🔐 Getting current authenticated user...');
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', { id: user?.id, email: user?.email });
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Create the database record
    const nowIso = new Date().toISOString();
    const pastPaperRecord = {
      title: title || 'Past Paper',
      unit_code: metadata.unit_code || '',
      unit_name: metadata.unit_name || '',
      faculty: metadata.faculty || '',
      file_url: file_url,
      file_path: uploaded.path,
      year: metadata.year ? Number(metadata.year) : null,
      semester: metadata.semester || '',
      exam_type: metadata.exam_type || 'Main',
      university_id: metadata.university_id || null,
      uploaded_by: user.id,
      downloads_count: 0,
      views_count: 0,
      created_at: nowIso,
      updated_at: nowIso
    };

    console.log('📝 Record prepared, attempting database insert:', JSON.stringify(pastPaperRecord, null, 2));

    const { data: pastPaper, error } = await supabase
      .from('past_papers')
      .insert(pastPaperRecord)
      .select('*')
      .single();

    console.log('📊 Supabase response:', { error: error?.message, data: pastPaper?.id });
    
    if (error) {
      console.error('💥 Database error:', { message: error.message, code: error.code, details: error.details, hint: error.hint });
      throw new Error(error.message || 'Failed to create past paper');
    }

    console.log('✅ Successfully created past paper:', { id: pastPaper.id, title: pastPaper.title, university_id: pastPaper.university_id });

    // Clear cache so callers fetch fresh data
    try { clearPastPapersCache(); } catch (e) {}
    
    return pastPaper;
  } catch (err) {
    console.error('❌ Create past paper failed:', err);
    throw err;
  }
}

// Create a user-submitted past paper in the submissions table (awaiting admin approval)
export async function createPastPaperSubmission({ metadata, pdfFile }) {
  let file_path = null;

  if (!pdfFile) {
    throw new Error('PDF file is required');
  }

  const uploaded = await uploadPastPaperFile(pdfFile);
  file_path = uploaded.path;

  // Generate title from unit_code and unit_name if not provided
  const title = metadata.title || `${metadata.unit_code} - ${metadata.unit_name}`;

  const payload = { 
    ...metadata, 
    file_path,
    title,
    status: 'pending'
  };

  const { data, error } = await supabase
    .from('past_paper_submissions')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;

  // Fire-and-forget admin notification; do not block user on email errors
  try {
    const notifyBody = {
      type: 'past_papers',
      uploadedBy: payload.uploaded_by || null,
      faculty: payload.faculty || null,
      unitCode: payload.unit_code || null,
      unitName: payload.unit_name || null,
      year: payload.year || null,
      semester: payload.semester || null,
    };
    fetch(`${API_BASE}/api/elib/submissions/notify-admins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notifyBody),
    }).catch(() => {});
  } catch (_) {}

  return data;
}

export async function updatePastPaper(id, { updates, newPdfFile, oldFilePath }) {
  const patch = { ...updates };
  // Convert empty strings to null for integer/numeric fields
  if (patch.year === '') patch.year = null;
  
  if (newPdfFile) {
    const uploaded = await uploadPastPaperFile(newPdfFile);
    patch.file_path = uploaded.path;
    
    // Try to delete old file
    if (oldFilePath) {
      await supabase.storage
        .from(PAST_PAPERS_BUCKET)
        .remove([oldFilePath])
        .catch(() => {});
    }
  }
  
  const { data, error } = await supabase
    .from('past_papers')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  
  if (error) throw error;
  try { clearPastPapersCache(); } catch (e) {}
  return data;
}

export async function deletePastPaper({ id, file_path }) {
  try {
    // First, fetch the past paper to get the file_url
    const { data: paperData, error: fetchError } = await supabase
      .from('past_papers')
      .select('file_url')
      .eq('id', id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.warn('Could not fetch past paper details before deletion:', fetchError);
    }

    // Delete the past paper record from database
    const { error: deleteError } = await supabase
      .from('past_papers')
      .delete()
      .eq('id', id);
    
    if (deleteError) throw deleteError;

    // Delete file from Supabase storage
    const fileToDelete = file_path || paperData?.file_url;
    
    if (fileToDelete) {
      await supabase.storage
        .from(PAST_PAPERS_BUCKET)
        .remove([fileToDelete])
        .catch((err) => {
          console.warn('Failed to delete past paper file from storage:', err);
          // Don't throw - record is already deleted from DB
        });
    }

    try { clearPastPapersCache(); } catch (e) {}
  } catch (err) {
    console.error('Error in deletePastPaper:', err);
    throw err;
  }
}

// =====================================================
// PAST PAPER VIEWS & DOWNLOADS TRACKING
// =====================================================



export async function trackPastPaperDownload(paperId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    // Increment downloads count
    const { error: rpcError } = await supabase.rpc('increment_past_paper_downloads', { paper_id: paperId });
    
    if (rpcError) {
      console.error('RPC Error incrementing downloads:', rpcError);
      console.error('Paper ID:', paperId, 'Type:', typeof paperId);
      throw rpcError;
    }
    
    // Clear cache to get fresh data
    try { clearPastPapersCache(); } catch (e) {}
  } catch (error) {
    console.error('Download tracking error:', error);
    throw error; // Re-throw so UI can handle it
  }
}

// =====================================================
// UTILITY FUNCTIONS
// =====================================================

export async function getFaculties() {
  try {
    // Hardcoded faculties in the system (short forms only, no duplicates)
    const hardcodedFaculties = [
      'Agriculture',
      'FASS',
      'Commerce',
      'FEDCOS',
      'FERD',
      'FET',
      'Health Sciences',
      'Law',
      'Science',
      'Veterinary Medicine'
    ];
    
    // Get unique faculties from database
    const { data, error } = await supabase
      .from('past_papers')
      .select('faculty');
    
    if (error || !data) {
      return hardcodedFaculties.sort();
    }
    
    const dbFaculties = [...new Set(data.map(item => item.faculty))].filter(Boolean);
    
    // Merge hardcoded and database faculties, keeping unique values
    const allFaculties = [...new Set([...hardcodedFaculties, ...dbFaculties])];
    
    // Sort alphabetically
    return allFaculties.sort();
  } catch (error) {
    console.error('Error fetching faculties:', error);
    // Return hardcoded faculties as fallback
    return [
      'Agriculture',
      'FASS',
      'Commerce',
      'FEDCOS',
      'FERD',
      'FET',
      'Health Sciences',
      'Law',
      'Science',
      'Veterinary Medicine'
    ].sort();
  }
}

/**
 * Fetch faculties for a specific university
 * @param {string|number} universityId - The university ID
 * @returns {Promise<string[]>} Array of unique faculty names for that university
 */
export async function getFacultiesByUniversity(universityId) {
  if (!universityId) return [];
  
  try {
    const { data, error } = await supabase
      .from('past_papers')
      .select('faculty')
      .eq('university_id', universityId)
      .order('faculty');

    if (error) throw error;

    // Get unique faculties
    const faculties = [...new Set(data.map(item => item.faculty))].filter(Boolean);
    return faculties;
  } catch (error) {
    console.error('Error fetching faculties for university:', error);
    return [];
  }
}

/**
 * Fetch unit names for a specific university and faculty
 * @param {string|number} universityId - The university ID
 * @param {string} faculty - The faculty name
 * @returns {Promise<string[]>} Array of unique unit names for that university and faculty
 */
export async function getUnitNamesByUniversityAndFaculty(universityId, faculty) {
  if (!universityId || !faculty) return [];
  
  try {
    const { data, error } = await supabase
      .from('past_papers')
      .select('unit_name')
      .eq('university_id', universityId)
      .eq('faculty', faculty)
      .order('unit_name');

    if (error) throw error;

    // Get unique unit names
    const unitNames = [...new Set(data.map(item => item.unit_name))].filter(Boolean);
    return unitNames;
  } catch (error) {
    console.error('Error fetching unit names for university and faculty:', error);
    return [];
  }
}

/**
 * Fetch years for a specific university, faculty, and unit name
 * @param {string|number} universityId - The university ID
 * @param {string} faculty - The faculty name
 * @param {string} unitName - The unit name
 * @returns {Promise<number[]>} Array of unique years for that university, faculty, and unit
 */
export async function getYearsByUniversityFacultyAndUnitName(universityId, faculty, unitName) {
  if (!universityId || !faculty || !unitName) return [];
  
  try {
    const { data, error } = await supabase
      .from('past_papers')
      .select('year')
      .eq('university_id', universityId)
      .eq('faculty', faculty)
      .eq('unit_name', unitName)
      .order('year', { ascending: false });

    if (error) throw error;

    // Get unique years and convert to numbers
    const years = [...new Set(data.map(item => item.year))].filter(Boolean).sort((a, b) => b - a);
    return years;
  } catch (error) {
    console.error('Error fetching years for university, faculty, and unit:', error);
    return [];
  }
}

const DROPDOWN_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getUniversitiesForDropdown({ forceRefresh = false } = {}) {
  const cacheKey = 'universities:dropdown';
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.timestamp && (Date.now() - parsed.timestamp) < DROPDOWN_CACHE_TTL) {
          return parsed.data || [];
        }
      }
    } catch (e) {
      // ignore cache read
    }
  }

  try {
    const { data, error } = await supabase
      .from('universities')
      .select('id, name')
      .order('name');

    if (error) throw error;
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: data || [] }));
    } catch (e) {
      // ignore write errors
    }
    return data || [];
  } catch (error) {
    console.error('Error fetching universities:', error);
    return [];
  }
}

export async function getPastPaperStats() {
  try {
    const { count: totalPapers } = await supabase
      .from('past_papers')
      .select('*', { count: 'exact', head: true });

    const { data: downloadData } = await supabase
      .from('past_papers')
      .select('downloads_count');

    const totalDownloads = (downloadData || []).reduce((sum, item) => sum + (item.downloads_count || 0), 0);

    return {
      totalPapers: totalPapers || 0,
      totalDownloads
    };
  } catch (error) {
    console.error('Error fetching past paper stats:', error);
    return { totalPapers: 0, totalDownloads: 0 };
  }
}

export async function getPastPaperCountByUniversity(universityId, subscriptionTier = null) {
  try {
    let query = supabase
      .from('past_papers')
      .select('*', { count: 'exact', head: true })
      .eq('university_id', universityId);
    
    // For premium users, show all papers; for non-premium, show only papers with file URLs
    if (subscriptionTier !== 'premium' && subscriptionTier !== 'premium_pro') {
      query = query.not('file_url', 'is', null);
    }
    
    const { count } = await query;
    
    return count || 0;
  } catch (error) {
    console.error('Error fetching past paper count:', error);
    return 0;
  }
}

export async function trackPastPaperView(paperId) {
  try {
    console.log('🔍 Calling trackPastPaperView for paper:', paperId);
    const { data, error } = await supabase.rpc('increment_past_paper_views', {
      p_paper_id: paperId
    });
    
    console.log('📊 RPC Response - Data:', data, 'Error:', error);
    
    if (error) {
      console.error('❌ Error incrementing past paper views:', error);
      return null;
    }
    
    console.log('✅ Successfully tracked view. New count:', data);
    return data;
  } catch (error) {
    console.error('❌ Past paper view tracking error:', error);
    return null;
  }
}

export async function togglePastPaperLike(paperId, userId) {
  try {
    const { data, error } = await supabase.rpc('toggle_past_paper_like', {
      p_paper_id: paperId,
      p_user_id: userId || 'anonymous'
    });
    
    if (error) {
      console.error('Error toggling past paper like:', error);
      return null;
    }
    
    return data; // { liked: boolean, count: number }
  } catch (error) {
    console.error('Past paper like toggle error:', error);
    return null;
  }
}

export async function togglePastPaperBookmark(paperId, userId) {
  try {
    const { data, error } = await supabase.rpc('toggle_past_paper_bookmark', {
      p_paper_id: paperId,
      p_user_id: userId || 'anonymous'
    });
    
    if (error) {
      console.error('Error toggling past paper bookmark:', error);
      return null;
    }
    
    return data; // { bookmarked: boolean, count: number }
  } catch (error) {
    console.error('Past paper bookmark toggle error:', error);
    return null;
  }
}

// =====================================================
// REAL-TIME SUBSCRIPTIONS
// =====================================================

export function subscribeToPastPapers(callback) {
  const subscription = supabase
    .channel('past_papers_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'past_papers' }, 
      callback
    )
    .subscribe();

  return subscription;
}

export function subscribeToPastPapersByUniversity(universityId, callback) {
  const subscription = supabase
    .channel(`past_papers_${universityId}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'past_papers',
        filter: `university_id=eq.${universityId}`
      }, 
      callback
    )
    .subscribe();

  return subscription;
}

// =====================================================
// SMART FACULTY DETECTION
// =====================================================

/**
 * Search for the actual faculty of a unit code at a specific university
 * Uses Google Search to find accurate, university-specific faculty information
 * 
 * @param {string} universityName - Name of the university (e.g., "Egerton University")
 * @param {string} unitCode - Unit code/number (e.g., "212")
 * @param {string} unitName - Unit name (e.g., "CHEM") - optional, helps with search
 * @returns {Promise<{faculty: string|null, source: string}>} Faculty name or null if not found
 */
export async function searchUnitFaculty(universityName, unitCode, unitName) {
  try {
    if (!universityName || !unitCode) {
      console.warn('⚠️ searchUnitFaculty: Missing university name or unit code');
      return { faculty: null, source: 'error', error: 'Missing required parameters' };
    }

    const params = new URLSearchParams({
      universityName: String(universityName).trim(),
      unitCode: String(unitCode).trim(),
      ...(unitName && { unitName: String(unitName).trim() })
    });

    const url = `${API_BASE}/api/elib/search-unit-faculty?${params.toString()}`;
    console.log('🔍 Searching faculty via:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000 // 10 second timeout
    });

    if (!response.ok) {
      console.warn(`⚠️ Faculty search failed with status ${response.status}`);
      return { faculty: null, source: 'error', status: response.status };
    }

    const data = await response.json();
    console.log(`✅ Faculty search result for ${universityName} ${unitCode}:`, data);
    
    return data; // Returns { faculty, source, fallback }
  } catch (error) {
    console.error('❌ Error searching for faculty:', error);
    return { 
      faculty: null, 
      source: 'error', 
      error: error.message 
    };
  }
}

// =====================================================
// UPLOAD HISTORY FUNCTIONS
// =====================================================

export async function logUploadHistory({ 
  fileName, 
  status, 
  paperTitle, 
  universityId, 
  faculty, 
  unitCode, 
  unitName, 
  year, 
  uploadedBy,
  errorMessage = null,
  isDuplicate = false
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const historyRecord = {
      file_name: fileName,
      status: status, // 'success', 'failed', 'duplicate'
      paper_title: paperTitle || '',
      university_id: universityId || null,
      faculty: faculty || '',
      unit_code: unitCode || '',
      unit_name: unitName || '',
      year: year ? Number(year) : null,
      uploaded_by: uploadedBy || user?.id || null,
      error_message: errorMessage || null,
      is_duplicate: isDuplicate || false,
      created_at: new Date().toISOString()
    };

    console.log('📝 Logging upload history:', historyRecord);

    const { data, error } = await supabase
      .from('past_papers_upload_history')
      .insert(historyRecord)
      .select('*')
      .single();

    if (error) {
      console.error('⚠️ Failed to log upload history:', error);
      return null;
    }

    console.log('✅ Upload history logged:', data?.id);
    return data;
  } catch (err) {
    console.error('❌ Error logging upload history:', err);
    return null;
  }
}

export async function fetchUploadHistory({ 
  page = 1, 
  pageSize = 20,
  universityId = null,
  status = null,
  startDate = null,
  endDate = null,
  uploadedBy = null
}) {
  try {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('past_papers_upload_history')
      .select(`
        id,
        file_name,
        status,
        paper_title,
        university_id,
        universities:university_id(id, name),
        faculty,
        unit_code,
        unit_name,
        year,
        uploaded_by,
        profiles:uploaded_by(id, full_name, email),
        error_message,
        is_duplicate,
        created_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (universityId) {
      query = query.eq('university_id', universityId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (uploadedBy) {
      query = query.eq('uploaded_by', uploadedBy);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('❌ Error fetching upload history:', error);
      throw error;
    }

    console.log('✅ Fetched upload history:', { count, records: data?.length });

    return { 
      data: data || [], 
      count: count || 0 
    };
  } catch (err) {
    console.error('❌ Error in fetchUploadHistory:', err);
    throw err;
  }
}

export async function getUploadHistoryStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const [
      { count: todayCount, error: todayError },
      { count: totalCount, error: totalError },
      { count: duplicatesCount, error: duplicatesError },
      { count: failedCount, error: failedError }
    ] = await Promise.all([
      supabase
        .from('past_papers_upload_history')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayISO),
      supabase
        .from('past_papers_upload_history')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('past_papers_upload_history')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'duplicate'),
      supabase
        .from('past_papers_upload_history')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
    ]);

    const stats = {
      today: todayCount || 0,
      total: totalCount || 0,
      duplicates: duplicatesCount || 0,
      failed: failedCount || 0,
      successful: (totalCount || 0) - (duplicatesCount || 0) - (failedCount || 0)
    };

    console.log('📊 Upload history stats:', stats);
    return stats;
  } catch (err) {
    console.error('❌ Error getting upload history stats:', err);
    return { today: 0, total: 0, duplicates: 0, failed: 0, successful: 0 };
  }
}


