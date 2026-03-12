import { supabase } from '../supabaseClient';

const BOOKS_BUCKET = 'elib-books';
const COVERS_BUCKET = 'elib-covers';

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, description')
    .order('name');
  if (error) throw error;
  return data || [];
}

// Fetch all users (for PDF export)
export async function fetchAllUsers() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, email, role')
      .order('role', { ascending: true })
      .order('display_name', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error fetching users for PDF:', e);
    return [];
  }
}

export async function createCategory(values) {
  const { data, error } = await supabase.from('categories').insert(values).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateCategory(id, values) {
  const { data, error } = await supabase.from('categories').update(values).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function fetchBooks({ page = 1, pageSize = 10, search = '', categoryId = null, sort = { col: 'created_at', dir: 'desc' } }) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  try {
    let query = supabase
      .from('books')
      .select('id, title, author, description, category_id, year, language, isbn, cover_url, file_path, uploaded_by, created_at, views, downloads, pages, publisher', { count: 'exact' })
      .order(sort.col || 'created_at', { ascending: (sort.dir || 'desc') === 'asc' })
      .range(from, to);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    const { data, error, count } = await query;
    if (error) {
      console.error('Supabase error fetching books:', error);
      throw new Error(`Failed to fetch books: ${error.message || 'Unknown error'}. Make sure all required columns exist in the books table.`);
    }
    return { data: data || [], count: count || 0 };
  } catch (err) {
    console.error('Error in fetchBooks:', err);
    throw err;
  }
}

export async function uploadFile(file) {
  try {
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(BOOKS_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Failed to upload file to bucket '${BOOKS_BUCKET}': ${error.message}. Make sure the bucket exists and is public.`);
    }
    return { path: data.path, publicUrl: supabase.storage.from(BOOKS_BUCKET).getPublicUrl(data.path).data.publicUrl };
  } catch (err) {
    console.error('File upload failed:', err);
    throw err;
  }
}

export async function uploadCover(file) {
  try {
    const ext = (file?.name?.split('.')?.pop() || 'jpg');
    const path = `${crypto.randomUUID()}.${ext}`;
    const { data, error } = await supabase.storage.from(COVERS_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type });
    if (error) {
      console.error('Cover upload error:', error);
      throw new Error(`Failed to upload cover to bucket '${COVERS_BUCKET}': ${error.message}. Make sure the bucket exists and is public.`);
    }
    return { path: data.path, publicUrl: supabase.storage.from(COVERS_BUCKET).getPublicUrl(data.path).data.publicUrl };
  } catch (err) {
    console.error('Cover upload failed:', err);
    throw err;
  }
}

export async function createBook({ metadata, pdfFile, coverFile }) {
  let file_path = null;
  let cover_url = null;
  if (pdfFile) {
    const uploaded = await uploadFile(pdfFile);
    file_path = uploaded.path;
  }
  if (coverFile) {
    const uploaded = await uploadCover(coverFile);
    cover_url = uploaded.publicUrl;
  }
  const payload = { ...metadata, file_path, cover_url };
  const { data, error } = await supabase.from('books').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function updateBook(id, { updates, newPdfFile, newCoverFile, oldFilePath }) {
  const patch = { ...updates };
  if (newPdfFile) {
    const uploaded = await uploadFile(newPdfFile);
    patch.file_path = uploaded.path;
    if (oldFilePath) {
      // best effort delete old file
      await supabase.storage.from(BOOKS_BUCKET).remove([oldFilePath]).catch(() => {});
    }
  }
  if (newCoverFile) {
    const uploaded = await uploadCover(newCoverFile);
    patch.cover_url = uploaded.publicUrl;
  }
  const { data, error } = await supabase.from('books').update(patch).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function deleteBook({ id, file_path }) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
  if (file_path) {
    await supabase.storage.from(BOOKS_BUCKET).remove([file_path]).catch(() => {});
  }
}

export async function fetchStats() {
  try {
    const [booksCountRes, usersCountRes, downloadsRes, viewsCountVal, universitiesCountVal, pastPapersCountVal, recentRes, topRes, categoriesRes, allBooksRes] = await Promise.all([
      supabase.from('books').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('books').select('downloads'),
      (async () => { const { count } = await supabase.from('book_views').select('id', { count: 'exact', head: true }); return count || 0; })(),
      (async () => { const { count } = await supabase.from('universities').select('id', { count: 'exact', head: true }); return count || 0; })(),
      (async () => { const { count } = await supabase.from('past_papers').select('id', { count: 'exact', head: true }); return count || 0; })(),
      supabase.from('books').select('id, title, author, cover_url, created_at').order('created_at', { ascending: false }).limit(10),
      supabase.from('books').select('id, title, cover_url, downloads').order('downloads', { ascending: false }).limit(5),
      supabase.from('categories').select('id, name'),
      supabase.from('books').select('id, category_id, created_at')
    ]);

    const booksCount = booksCountRes?.count || 0;
    const usersCount = usersCountRes?.count || 0;
    const universitiesCount = universitiesCountVal || 0;
    const pastPapersCount = pastPapersCountVal || 0;

    const totals = (list, key) => (list.data || []).reduce((a, b) => a + (b[key] || 0), 0);
    const totalDownloads = totals(downloadsRes, 'downloads');
    const totalViews = viewsCountVal || 0;

    // Build monthly uploads (client-side grouping of last 12 months)
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleString(undefined, { month: 'short' }), count: 0 });
    }
    (allBooksRes.data || []).forEach(row => {
      if (row.created_at) {
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const bucket = months.find(m => m.key === key);
        if (bucket) bucket.count += 1;
      }
    });

    // Category distribution
    const catMap = new Map((categoriesRes.data || []).map(c => [c.id, c.name]));
    const dist = new Map();
    (allBooksRes.data || []).forEach(b => {
      const k = b.category_id || 'uncategorized';
      dist.set(k, (dist.get(k) || 0) + 1);
    });
    const categories = Array.from(dist.entries()).map(([id, count]) => ({ id, name: catMap.get(id) || 'Uncategorized', count }));

    return {
      counts: { books: booksCount, users: usersCount, downloads: totalDownloads, views: totalViews, universities: universitiesCount, pastPapers: pastPapersCount },
      recent: recentRes.data || [],
      top: topRes.data || [],
      monthly: months.map(m => ({ month: m.label, uploads: m.count })),
      categories
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      counts: { books: 0, users: 0, downloads: 0, views: 0, universities: 0, pastPapers: 0 },
      recent: [],
      top: [],
      monthly: [],
      categories: []
    };
  }
}

export async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('id, email, display_name, role, created_at');
  if (error) throw error;
  return data || [];
}

export async function updateUserRole(id, role) {
  const { data, error } = await supabase.from('profiles').update({ role }).eq('id', id).select('*').single();
  if (error) throw error;
  return data;
}

export async function getProfileByEmail(email) {
  const { data, error } = await supabase.from('profiles').select('id, email, role, display_name').eq('email', email).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getCurrentUserProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from('profiles').select('id, email, role, display_name').eq('id', user.id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchViewDetails() {
  try {
    // Get all views
    const { data: viewsData, error: viewsError } = await supabase
      .from('book_views')
      .select('id, book_id, user_id, viewed_at')
      .order('viewed_at', { ascending: false });
    
    if (viewsError) {
      console.error('Error fetching views:', viewsError);
      return [];
    }

    if (!viewsData || viewsData.length === 0) {
      return [];
    }

    // Get all books
    const bookIds = [...new Set(viewsData.map(v => v.book_id))];
    const { data: booksData } = await supabase
      .from('books')
      .select('id, title')
      .in('id', bookIds);

    // Get all profiles
    const userIds = [...new Set(viewsData.map(v => v.user_id))];
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    // Create lookup maps
    const bookMap = new Map((booksData || []).map(b => [b.id, b.title]));
    const profileMap = new Map((profilesData || []).map(p => [p.id, p.email]));
    
    // Group by book to get stats
    const bookStats = {};
    viewsData.forEach(view => {
      const bookId = view.book_id;
      if (!bookStats[bookId]) {
        bookStats[bookId] = {
          book_id: bookId,
          book_title: bookMap.get(bookId) || 'Unknown',
          total_views: 0,
          unique_users: new Set(),
          users: []
        };
      }
      bookStats[bookId].total_views += 1;
      bookStats[bookId].unique_users.add(view.user_id);
      bookStats[bookId].users.push({
        email: profileMap.get(view.user_id) || 'Unknown',
        viewed_at: view.viewed_at
      });
    });
    
    // Convert to array and add unique count
    return Object.values(bookStats).map(stat => ({
      book_id: stat.book_id,
      book_title: stat.book_title,
      total_views: stat.total_views,
      unique_users: stat.unique_users.size,
      users: stat.users
    })).sort((a, b) => b.total_views - a.total_views);
  } catch (error) {
    console.error('Error in fetchViewDetails:', error);
    return [];
  }
}
