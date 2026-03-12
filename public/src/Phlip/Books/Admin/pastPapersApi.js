import { supabase } from '../supabaseClient';

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
  
  const cacheKey = makePastPapersCacheKey({ page, pageSize, search, universityId, faculty, sort });
  if (!forceRefresh) {
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed?.timestamp && (Date.now() - parsed.timestamp) < CACHE_TTL_MS) {
          return { data: parsed.data || [], count: parsed.count || 0, fromCache: true };
        }
      }
    } catch (e) {
      // ignore cache errors
    }
  }
  try {
    let query = supabase
      .from('past_papers')
      .select(`
        id, 
        university_id, 
        faculty, 
        unit_code, 
        unit_name, 
        file_path, 
        year, 
        semester,
        exam_type,
        downloads, 
        views, 
        created_at, 
        uploaded_by,
        universities (
          id,
          name,
          location
        )
      `, { count: 'exact' })
      .order(sort.col || 'created_at', { ascending: (sort.dir || 'desc') === 'asc' })
      .range(from, to);

    if (search) {
      query = query.or(`unit_code.ilike.%${search}%,unit_name.ilike.%${search}%,faculty.ilike.%${search}%`);
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
    const result = { data: data || [], count: count || 0 };
    try {
      localStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: result.data, count: result.count }));
    } catch (e) {
      // ignore localStorage write errors (quota, private mode)
    }
    return result;
  } catch (err) {
    console.error('Error in fetchPastPapers:', err);
    throw err;
  }
}

function clearPastPapersCache() {
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

export async function createPastPaper({ metadata, pdfFile }) {
  let file_path = null;
  
  if (!pdfFile) {
    throw new Error('PDF file is required');
  }
  
  const uploaded = await uploadPastPaperFile(pdfFile);
  file_path = uploaded.path;
  
  const payload = { ...metadata, file_path };
  const { data, error } = await supabase
    .from('past_papers')
    .insert(payload)
    .select('*')
    .single();
  
  if (error) throw error;
  // Clear cache so callers fetch fresh data
  try { clearPastPapersCache(); } catch (e) {}
  return data;
}

export async function updatePastPaper(id, { updates, newPdfFile, oldFilePath }) {
  const patch = { ...updates };
  
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
  const { error } = await supabase
    .from('past_papers')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
  
  // Try to delete the file from storage
  if (file_path) {
    await supabase.storage
      .from(PAST_PAPERS_BUCKET)
      .remove([file_path])
      .catch(() => {});
  }
  try { clearPastPapersCache(); } catch (e) {}
}

// =====================================================
// PAST PAPER VIEWS & DOWNLOADS TRACKING
// =====================================================

export async function trackPastPaperView(paperId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  try {
    await supabase
      .from('past_paper_views')
      .insert({ paper_id: paperId, user_id: user.id });
    
    // Increment views count
    const { error: rpcError } = await supabase.rpc('increment_past_paper_views', { paper_id: paperId });
    
    if (rpcError) {
      console.error('RPC Error incrementing views:', rpcError);
      throw rpcError;
    }
    
    // Clear cache to get fresh data
    try { clearPastPapersCache(); } catch (e) {}
  } catch (error) {
    // Ignore duplicate view errors (unique constraint) and PostgREST 409 conflicts
    const msg = String(error?.message || '');
    const details = String(error?.details || '');
    const code = String(error?.code || '');
    const isDuplicate = /duplicate/i.test(msg) || /duplicate/i.test(details) || code === '23505' || code === '409';
    if (!isDuplicate) {
      console.error('View tracking error:', error);
    }
  }
}

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
    const { data, error } = await supabase
      .from('past_papers')
      .select('faculty')
      .order('faculty');

    if (error) throw error;

    // Get unique faculties
    const faculties = [...new Set(data.map(item => item.faculty))].filter(Boolean);
    return faculties;
  } catch (error) {
    console.error('Error fetching faculties:', error);
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
      .select('downloads');

    const totalDownloads = (downloadData || []).reduce((sum, item) => sum + (item.downloads || 0), 0);

    return {
      totalPapers: totalPapers || 0,
      totalDownloads
    };
  } catch (error) {
    console.error('Error fetching past paper stats:', error);
    return { totalPapers: 0, totalDownloads: 0 };
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
// LOVES (LIKES) API
// =====================================================

// Return a map { paperId: count }
export async function getLoveCountsForPapers(paperIds = []) {
  if (!paperIds.length) return {};
  const { data, error } = await supabase
    .from('past_paper_loves')
    .select('paper_id', { count: 'exact', head: false });

  if (error) {
    console.error('Error fetching love counts:', error);
    return {};
  }

  const counts = {};
  for (const id of paperIds) counts[id] = 0;
  for (const row of data) {
    // We'll aggregate client-side only for requested IDs
    if (counts[row.paper_id] !== undefined) counts[row.paper_id] += 1;
  }
  return counts;
}

// Return set/map of paperIds the user has loved
export async function getUserLovedPapers(paperIds = []) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !paperIds.length) return new Set();

  const { data, error } = await supabase
    .from('past_paper_loves')
    .select('paper_id')
    .eq('user_id', user.id)
    .in('paper_id', paperIds);

  if (error) {
    console.error('Error fetching user loved papers:', error);
    return new Set();
  }
  return new Set((data || []).map(r => r.paper_id));
}

export async function togglePaperLove(paperId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check if already loved
  const { data: existing, error: checkErr } = await supabase
    .from('past_paper_loves')
    .select('id')
    .eq('paper_id', paperId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (checkErr && checkErr.code !== 'PGRST116') { // ignore no rows
    console.error('Error checking love state:', checkErr);
  }

  if (existing) {
    // Unlike
    const { error } = await supabase
      .from('past_paper_loves')
      .delete()
      .eq('paper_id', paperId)
      .eq('user_id', user.id);
    if (error) throw error;
    return { loved: false };
  }

  // Like
  const { error } = await supabase
    .from('past_paper_loves')
    .insert({ paper_id: paperId, user_id: user.id });
  if (error) throw error;
  return { loved: true };
}

// Subscribe to real-time changes in loves
export function subscribeToLoves(callback, filterPaperId = null) {
  const channelName = filterPaperId ? `loves_${filterPaperId}` : 'loves_all';
  const opts = { event: '*', schema: 'public', table: 'past_paper_loves' };
  const payloadFilter = filterPaperId ? { ...opts, filter: `paper_id=eq.${filterPaperId}` } : opts;

  const subscription = supabase
    .channel(channelName)
    .on('postgres_changes', payloadFilter, callback)
    .subscribe();
  return subscription;
}
