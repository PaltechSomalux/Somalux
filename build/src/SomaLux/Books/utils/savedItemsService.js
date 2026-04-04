import { supabase } from '../supabaseClient';

/**
 * Track a book download to user_book_downloads table
 */
export const trackBookDownload = async (userId, bookId) => {
  if (!userId || !bookId) return;

  try {
    const { error } = await supabase
      .from('user_book_downloads')
      .upsert(
        {
          user_id: userId,
          book_id: bookId,
          downloaded_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,book_id' }
      );

    if (error) {
      console.error('Error tracking book download:', error);
    }
  } catch (error) {
    console.error('Failed to track book download:', error);
  }
};

/**
 * Track a paper download to user_paper_downloads table
 */
export const trackPaperDownload = async (userId, paperId) => {
  if (!userId || !paperId) return;

  try {
    const { error } = await supabase
      .from('user_paper_downloads')
      .upsert(
        {
          user_id: userId,
          paper_id: paperId,
          downloaded_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,paper_id' }
      );

    if (error) {
      console.error('Error tracking paper download:', error);
    }
  } catch (error) {
    console.error('Failed to track paper download:', error);
  }
};

/**
 * Remove a saved item
 */
export const removeSavedItem = async (itemId, type) => {
  if (!itemId || !type) return;

  try {
    const tableName = type === 'book' ? 'user_book_downloads' : 'user_paper_downloads';
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error(`Error removing saved ${type}:`, error);
    }
  } catch (error) {
    console.error(`Failed to remove saved ${type}:`, error);
  }
};
