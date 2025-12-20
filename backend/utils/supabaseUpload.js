import { createClient } from '@supabase/supabase-js';
import { readFileSync, appendFileSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Upload PDF and cover to Supabase and save book record to database
 * @param {object} params
 * @param {string} params.pdfPath - Local path to PDF file
 * @param {Buffer|null} params.coverBuffer - Cover image buffer (optional)
 * @param {object} params.metadata - Book metadata from Google Books
 * @param {object} params.supabaseClient - Supabase client instance
 * @param {string|null} params.uploadedBy - User ID who uploaded (optional)
 * @returns {object} Upload result with book ID and URLs
 */
export async function uploadBookToSupabase({
  pdfPath,
  coverBuffer = null,
  metadata,
  supabaseClient,
  uploadedBy = null,
  targetTable = 'books'
}) {
  try {
    const bookId = uuidv4();
    const pdfBuffer = readFileSync(pdfPath);
    const filename = path.basename(pdfPath);
    
    console.log(`📄 PDF file size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`);
    
    // Generate storage paths
    const pdfStoragePath = `books/${bookId}/${filename}`;
    const coverStoragePath = coverBuffer ? `books/${bookId}/cover.jpg` : null;

    // Upload PDF to Supabase Storage
    console.log(`📤 Uploading PDF: ${filename} (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
    
    // Try multiple times in case of transient errors
    let pdfError = null;
    let pdfData = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`   Attempt ${attempt}/2...`);
        const result = await supabaseClient.storage
          .from('elib-books')
          .upload(pdfStoragePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
            cacheControl: '3600',
            duplex: 'half'
          });
        pdfData = result.data;
        pdfError = result.error;
        if (!pdfError) break;
      } catch (e) {
        pdfError = e;
      }
      if (pdfError && attempt === 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    if (pdfError) throw new Error(`PDF upload failed: ${pdfError.message}`);
    
    // Get public URL for PDF
    const { data: pdfUrlData } = supabaseClient.storage
      .from('elib-books')
      .getPublicUrl(pdfStoragePath);
    
    const pdfUrl = pdfUrlData.publicUrl;

    // Upload cover if available
    let coverUrl = null;
    if (coverBuffer) {
      console.log(`📤 Uploading cover image to Supabase`);
      const { data: coverData, error: coverError } = await supabaseClient.storage
        .from('elib-books')
        .upload(coverStoragePath, coverBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (coverError) {
        console.warn(`⚠️ Cover upload to Supabase failed: ${coverError.message}`);
        // Fall back to Google Books URL if our upload fails
        coverUrl = metadata.cover_image_url || null;
      } else {
        const { data: coverUrlData } = supabaseClient.storage
          .from('elib-books')
          .getPublicUrl(coverStoragePath);
        coverUrl = coverUrlData.publicUrl;
        console.log(`✅ Cover uploaded to Supabase: ${coverUrl}`);
      }
    } else {
      // If no cover buffer (download failed), don't use unreliable Google URL
      console.log(`⚠️ No cover buffer available - book will be created without cover image`);
      coverUrl = null;
    }

    // Save record either to books (direct publish) or book_submissions (pending approval)
    const nowIso = new Date().toISOString();

    console.log(`💾 Saving ${targetTable === 'book_submissions' ? 'submission' : 'book'} record to database`);
    const tableName = targetTable === 'book_submissions' ? 'book_submissions' : 'books';
    
    // Use provided uploaded_by or leave as null (should be allowed after schema fix)
    const finalUploadedBy = uploadedBy || null;
    
    // Create payload with appropriate column names for each table
    const baseRecord = {
      id: bookId,
      title: metadata.title,
      author: metadata.author,
      description: metadata.description || '',
      isbn: metadata.isbn || '',
      year: metadata.published_year || null,
      publisher: metadata.publisher || '',
      pages: metadata.pages || 0,
      language: metadata.language || 'en',
      file_url: pdfStoragePath,
      created_at: nowIso,
      updated_at: nowIso
    };
    
    // Only add uploaded_by to payload if it has a value
    if (finalUploadedBy) {
      baseRecord.uploaded_by = finalUploadedBy;
    }
    
    // book_submissions uses cover_url + downloads/views, books uses cover_image_url + downloads_count/views_count
    const payload = tableName === 'book_submissions'
      ? { ...baseRecord, cover_url: coverUrl, status: 'pending', downloads: 0, views: 0 }
      : { ...baseRecord, cover_image_url: coverUrl, downloads_count: 0, views_count: 0, rating: 0, rating_count: 0 };

    console.log(`📝 Payload for table "${tableName}":`, JSON.stringify(payload, null, 2));

    const { data: dbData, error: dbError } = await supabaseClient
      .from(tableName)
      .insert(payload)
      .select('*')
      .single();

    if (dbError) {
      console.error(`🔴 Database error details:`, JSON.stringify(dbError, null, 2));
      console.error(`🔴 Full error object:`, dbError);
      console.error(`🔴 Error code:`, dbError.code);
      console.error(`🔴 Error details:`, dbError.details);
      console.error(`🔴 Error hint:`, dbError.hint);
      throw new Error(`Database insert failed: ${dbError.message}`);
    }

    console.log(`✅ Successfully uploaded: ${metadata.title}`);
    
    return {
      success: true,
      bookId: bookId,
      title: metadata.title,
      pdfUrl: pdfUrl,
      coverUrl: coverUrl,
      table: tableName,
      status: tableName === 'book_submissions' ? 'pending' : 'published'
    };

  } catch (error) {
    const errorMsg = `❌ Upload failed for ${path.basename(pdfPath)}: ${error.message}`;
    console.error(errorMsg);
    
    // Also log to file for debugging
    try {
      const logFile = path.join(process.cwd(), 'upload-errors.log');
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${errorMsg}\nFull error: ${JSON.stringify(error, null, 2)}\n---\n`;
      appendFileSync(logFile, logEntry, 'utf8');
    } catch (logError) {
      console.error('Failed to write to error log:', logError.message);
    }
    
    throw error;
  }
}

/**
 * Check if book already exists in database by ISBN
 * @param {string} isbn - Book ISBN
 * @param {object} supabaseClient - Supabase client instance
 * @returns {boolean} True if book exists
 */
export async function bookExistsByISBN(isbn, supabaseClient) {
  if (!isbn) return false;
  
  try {
    // Check both published books and any pending submissions to avoid duplicates
    const [{ data: booksData, error: booksError }, { data: subData, error: subError }] = await Promise.all([
      supabaseClient.from('books').select('id').eq('isbn', isbn).limit(1),
      supabaseClient.from('book_submissions').select('id').eq('isbn', isbn).limit(1)
    ]);

    if (booksError) throw booksError;
    if (subError) throw subError;
    
    const existsInBooks = booksData && booksData.length > 0;
    const existsInSubs = subData && subData.length > 0;
    return existsInBooks || existsInSubs;
  } catch (error) {
    console.warn(`⚠️ Failed to check book existence:`, error.message);
    return false;
  }
}
