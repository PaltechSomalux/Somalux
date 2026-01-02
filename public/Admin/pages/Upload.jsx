import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createBook, fetchCategories } from '../api';
import { createUniversity } from '../campusApi';
import { createPastPaper, getUniversitiesForDropdown } from '../pastPapersApi';
import { 
  autoFillUniversityData, 
  searchUniversityNames,
  uploadUniversityImages,
  addUniversityImage,
  downloadImageAsFile,
  fetchWikimediaImages,
  fetchUnsplashImages
} from '../universityPrefillApi';
import { FiUpload, FiFile, FiImage, FiBook, FiMapPin, FiFileText, FiSearch, FiX, FiLoader } from 'react-icons/fi';
import { useAdminUI } from '../AdminUIContext';

// Simple debounce hook
function useDebounce(callback, delay) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// Add styles for drag and drop effect and tabs
const dropzoneStyles = `
  .dropzone {
    border: 2px dashed #374151;
    border-radius: 8px;
    padding: 20px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  .dropzone:hover {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.05);
  }
  .dropzone.drag-over {
    border-color: #00a884;
    background: rgba(0, 168, 132, 0.1);
  }
  .upload-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 2px solid #374151;
  }
  .upload-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: transparent;
    border: none;
    color: #8696a0;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
    border-bottom: 3px solid transparent;
    margin-bottom: -2px;
  }
  .upload-tab:hover {
    color: #e9edef;
    background: rgba(0, 168, 132, 0.05);
  }
  .upload-tab.active {
    color: #00a884;
    border-bottom-color: #00a884;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .spin {
    animation: spin 1s linear infinite;
  }
`;

const Upload = ({ userProfile }) => {
  // Add style tag to document
  useEffect(() => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = dropzoneStyles;
    document.head.appendChild(styleTag);
    return () => styleTag.remove();
  }, []);

  const [activeTab, setActiveTab] = useState('books'); // 'books', 'campus', 'pastpapers'
  const navigate = useNavigate();
  const { showToast } = useAdminUI();
  
  // Books state
  const [pdf, setPdf] = useState(null);
  const [cover, setCover] = useState(null);
  const [categories, setCategories] = useState([]);
  const [bookForm, setBookForm] = useState({ 
    title: '', author: '', description: '', category_id: '', 
    year: '', language: '', isbn: '', pages: '', publisher: '' 
  });

  // Campus state
  const [campusImages, setCampusImages] = useState([]);
  const [campusForm, setCampusForm] = useState({ 
    name: '', description: '', website_url: '', location: '', 
    established: '', student_count: '' 
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Past Papers state
  const [paperPdf, setPaperPdf] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [paperForm, setPaperForm] = useState({ 
    university_id: '', faculty: '', unit_code: '', 
    unit_name: '', year: '', semester: '', exam_type: '' 
  });

  const [busy, setBusy] = useState(false);

  useEffect(() => { 
    (async () => { 
      try { 
        setCategories(await fetchCategories()); 
        setUniversities(await getUniversitiesForDropdown());
      } catch {} 
    })(); 
  }, []);

  const onBookChange = (k) => (e) => setBookForm((f) => ({ ...f, [k]: e.target.value }));
  const onCampusChange = (k) => (e) => {
    setCampusForm((f) => ({ ...f, [k]: e.target.value }));
    // If changing name, trigger search
    if (k === 'name') {
      setSearchQuery(e.target.value);
      debouncedSearch(e.target.value);
    }
  };

  // Debounced search for universities
  const handleSearchUniversities = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const results = await searchUniversityNames(query);
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };
  const debouncedSearch = useDebounce(handleSearchUniversities, 300);

  // Auto-fill university data
  const handleAutoFill = async (universityName) => {
    setIsAutoFilling(true);
    setShowSearchResults(false);

    try {
      const data = await autoFillUniversityData(universityName || campusForm.name);
      
      if (data) {
        setCampusForm({
          name: data.name || '',
          description: data.description || '',
          website_url: data.website_url || '',
          location: data.location || '',
          established: data.established?.toString() || '',
          student_count: data.student_count?.toString() || ''
        });
        
        // Download images if available
        if (data.cover_images && data.cover_images.length > 0) {
          const downloadedImages = [];
          
          for (let i = 0; i < Math.min(data.cover_images.length, 5); i++) {
            const imageUrl = data.cover_images[i];
            const fileName = `${data.name.replace(/\s+/g, '_')}_image_${i + 1}.jpg`;
            
            try {
              const imageFile = await downloadImageAsFile(imageUrl, fileName);
              if (imageFile) {
                downloadedImages.push(imageFile);
              }
            } catch (err) {
              console.error('Error downloading image:', err);
            }
          }
          
          if (downloadedImages.length > 0) {
            setCampusImages(downloadedImages);
            showToast({ type: 'success', message: `Auto-filled data for ${data.name} with ${downloadedImages.length} image(s)!` });
          } else {
            showToast({ type: 'info', message: `Auto-filled data for ${data.name}! But images could not be downloaded, please upload manually.` });
          }
        } else {
          // Prefer Wikimedia Commons fallback, then Unsplash
          let urls = await fetchWikimediaImages(data.name);
          if (!urls.length) {
            urls = await fetchUnsplashImages(data.name);
          }

          if (urls.length > 0) {
            const downloadedImages = [];
            for (let i = 0; i < urls.length; i++) {
              try {
                const fileName = `${data.name.replace(/\s+/g, '_')}_auto_${i + 1}.jpg`;
                const file = await downloadImageAsFile(urls[i], fileName);
                if (file) downloadedImages.push(file);
              } catch (err) {
                console.error('Auto image download error:', err);
              }
            }

            if (downloadedImages.length > 0) {
              setCampusImages(downloadedImages);
              showToast({ type: 'success', message: `Auto-filled data for ${data.name} with ${downloadedImages.length} image(s)!` });
            } else {
              showToast({ type: 'info', message: `Auto-filled data for ${data.name}, but images couldn't be downloaded.` });
            }
          } else {
            showToast({ type: 'info', message: `Auto-filled data for ${data.name}, but no images were found automatically.` });
          }
        }
      } else {
        showToast({ type: 'info', message: 'No data found for this university. Please enter details manually.' });
      }
    } catch (error) {
      console.error('Error auto-filling:', error);
      showToast({ type: 'error', message: 'Failed to auto-fill data. Please try again.' });
    } finally {
      setIsAutoFilling(false);
    }
  };
  const onPaperChange = (k) => (e) => setPaperForm((f) => ({ ...f, [k]: e.target.value }));

  const submitBook = async () => {
    if (!pdf) { showToast({ type: 'error', message: 'Please choose a PDF file.' }); return; }
    setBusy(true);
    try {
      const metadata = {
        title: bookForm.title || (pdf?.name?.replace(/\.[^/.]+$/, '') || ''),
        author: bookForm.author || 'Unknown',
        description: bookForm.description || '',
        category_id: bookForm.category_id || null,
        year: bookForm.year ? Number(bookForm.year) : null,
        language: bookForm.language || '',
        isbn: bookForm.isbn || '',
        pages: bookForm.pages ? Number(bookForm.pages) : 0,
        publisher: bookForm.publisher || '',
        uploaded_by: userProfile?.id || null
      };
      await createBook({ metadata, pdfFile: pdf, coverFile: cover });
      showToast({ type: 'success', message: 'Book uploaded successfully.' });
      navigate('/books/admin/books');
    } catch (e) {
      console.error('Book upload failed:', e);
      showToast({ type: 'error', message: e?.message || 'Upload failed.' });
    } finally { setBusy(false); }
  };

  const submitCampus = async () => {
    if (!campusForm.name) { showToast({ type: 'error', message: 'Please enter university name.' }); return; }
    setBusy(true);
    try {
      const metadata = {
        name: campusForm.name,
        description: campusForm.description || '',
        website_url: campusForm.website_url || '',
        location: campusForm.location || '',
        established: campusForm.established ? Number(campusForm.established) : null,
        student_count: campusForm.student_count ? Number(campusForm.student_count) : 0,
        uploaded_by: userProfile?.id || null
      };
      
      // Create university (use first image as cover)
      const primaryImage = campusImages[0] || null;
      const result = await createUniversity({ metadata, coverFile: primaryImage });
      const universityId = result.id;
      
      // Upload additional images if any
      if (campusImages.length > 1 && universityId) {
        const additionalImages = campusImages.slice(1);
        const uploadedUrls = await uploadUniversityImages(universityId, additionalImages);
        
        // Add them to the database
        for (let i = 0; i < uploadedUrls.length; i++) {
          await addUniversityImage(universityId, uploadedUrls[i].url, null, false, i + 1);
        }
      }
      
      showToast({ type: 'success', message: `University added successfully with ${campusImages.length} image(s)!` });
      // Reset form
      setCampusForm({ name: '', description: '', website_url: '', location: '', established: '', student_count: '' });
      setCampusImages([]);
    } catch (e) {
      console.error('University upload failed:', e);
      showToast({ type: 'error', message: e?.message || 'Upload failed.' });
    } finally { setBusy(false); }
  };

  const submitPastPaper = async () => {
    if (!paperPdf) { showToast({ type: 'error', message: 'Please choose a PDF file.' }); return; }
    if (!paperForm.faculty) { showToast({ type: 'error', message: 'Please enter faculty.' }); return; }
    if (!paperForm.unit_code) { showToast({ type: 'error', message: 'Please enter unit code.' }); return; }
    if (!paperForm.unit_name) { showToast({ type: 'error', message: 'Please enter unit name.' }); return; }
    
    setBusy(true);
    try {
      const metadata = {
        title: `${paperForm.unit_code} - ${paperForm.unit_name}`,
        university_id: paperForm.university_id || null,
        faculty: paperForm.faculty,
        unit_code: paperForm.unit_code,
        unit_name: paperForm.unit_name,
        year: paperForm.year ? Number(paperForm.year) : null,
        semester: paperForm.semester || '',
        exam_type: paperForm.exam_type || 'Main',
        uploaded_by: userProfile?.id || null
      };
      await createPastPaper({ metadata, pdfFile: paperPdf });
      showToast({ type: 'success', message: 'Past paper uploaded successfully.' });
      // Reset form
      setPaperForm({ university_id: '', faculty: '', unit_code: '', unit_name: '', year: '', semester: '', exam_type: '' });
      setPaperPdf(null);
    } catch (e) {
      console.error('Past paper upload failed:', e);
      showToast({ type: 'error', message: e?.message || 'Upload failed.' });
    } finally { setBusy(false); }
  };

  // Render dropzone component
  const renderDropzone = (file, setFile, accept, fileType, icon) => (
    <div
      className="dropzone"
      onDragOver={(e) => {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.match(accept)) {
          setFile(droppedFile);
        }
      }}
      onClick={() => document.getElementById(`${fileType}-input`).click()}
      style={{
        border: '2px dashed #374151',
        borderRadius: '8px',
        padding: '20px',
        textAlign: 'center',
        cursor: 'pointer',
        background: file ? 'rgba(0, 168, 132, 0.1)' : 'transparent',
        transition: 'all 0.3s ease'
      }}
    >
      <input
        id={`${fileType}-input`}
        type="file"
        accept={accept}
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        style={{ display: 'none' }}
      />
      {file ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: '#00a884' }}>
          {icon}
          <span>{file.name}</span>
        </div>
      ) : (
        <div>
          <FiUpload size={20} style={{ marginBottom: '4px', color: '#8696a0' }} />
          <div style={{ color: '#e9edef' }}>Drag and drop or click to browse</div>
          <div style={{ color: '#8696a0', fontSize: '0.85em', marginTop: '2px' }}>
            {accept === 'application/pdf' ? 'PDF files only' : 'Image files (JPG, PNG, GIF)'}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="panel">
      <div className="panel-title">Upload Content</div>
      
      {/* Tabs */}
      <div className="upload-tabs">
        <button 
          className={`upload-tab ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <FiBook size={20} />
          Books
        </button>
        <button 
          className={`upload-tab ${activeTab === 'campus' ? 'active' : ''}`}
          onClick={() => setActiveTab('campus')}
        >
          <FiMapPin size={20} />
          Campus
        </button>
        <button 
          className={`upload-tab ${activeTab === 'pastpapers' ? 'active' : ''}`}
          onClick={() => setActiveTab('pastpapers')}
        >
          <FiFileText size={20} />
          Past Papers
        </button>
      </div>

      {/* Books Tab */}
      {activeTab === 'books' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">PDF File</label>
            {renderDropzone(pdf, setPdf, 'application/pdf', 'pdf', <FiFile size={24} />)}
            
            <label className="label" style={{ marginTop: 20 }}>Cover Image (optional)</label>
            {renderDropzone(cover, setCover, 'image/*', 'cover', <FiImage size={24} />)}
          </div>
          <div className="panel">
            <label className="label">Title</label>
            <input className="input" placeholder="Book title" value={bookForm.title} onChange={onBookChange('title')} />
            <label className="label" style={{ marginTop: 10 }}>Author</label>
            <input className="input" placeholder="Author" value={bookForm.author} onChange={onBookChange('author')} />
            <label className="label" style={{ marginTop: 10 }}>Description</label>
            <textarea className="input" rows={5} placeholder="Short description" value={bookForm.description} onChange={onBookChange('description')} />

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Category</label>
                <select className="select" value={bookForm.category_id} onChange={onBookChange('category_id')}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input className="input" placeholder="Year" value={bookForm.year} onChange={onBookChange('year')} />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Language</label>
                <input className="input" placeholder="English" value={bookForm.language} onChange={onBookChange('language')} />
              </div>
              <div>
                <label className="label">ISBN</label>
                <input className="input" placeholder="978-0-123456-78-9" value={bookForm.isbn} onChange={onBookChange('isbn')} />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Pages</label>
                <input className="input" type="number" placeholder="Number of pages" value={bookForm.pages} onChange={onBookChange('pages')} />
              </div>
              <div>
                <label className="label">Publisher</label>
                <input className="input" placeholder="Publisher name" value={bookForm.publisher} onChange={onBookChange('publisher')} />
              </div>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitBook}>{busy ? 'Uploading...' : 'Upload Book'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Campus Tab */}
      {activeTab === 'campus' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">University Cover Images (Multiple)</label>
            <input 
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setCampusImages(Array.from(e.target.files))}
              style={{ marginBottom: '10px' }}
              className="input"
            />
            {campusImages.length > 0 && (
            <div style={{ marginTop: '10px', color: '#00a884' }}>
              ✓ {campusImages.length} image(s) selected
              <button 
                onClick={() => setCampusImages([])}
                style={{ marginLeft: '10px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <FiX /> Clear
              </button>
            </div>
          )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px', marginTop: '6px' }}>
            {campusImages.map((img, idx) => (
              <div key={idx} style={{ position: 'relative', border: '2px solid #374151', borderRadius: '8px', overflow: 'hidden' }}>
                <img src={URL.createObjectURL(img)} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                {/* Remove (X) button */}
                <button
                  aria-label="Remove image"
                  title="Remove"
                  onClick={() => setCampusImages((prev) => prev.filter((_, i) => i !== idx))}
                  style={{
                    position: 'absolute',
                    top: '6px',
                    left: '6px',
                    width: '20px',
                    height: '20px',
                    padding: '2px',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#a08f8f96',
                    color: '#111010ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                  }}
                >X
                  {/* <FiX size={36} /> */}
                </button>
                <div style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.7)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '12px' }}>
                  {idx === 0 ? 'Primary' : `#${idx + 1}`}
                </div>
              </div>
            ))}
          </div>
          </div>
          <div className="panel">
            <label className="label">University Name *</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="input" 
                placeholder="e.g., University of Nairobi" 
                value={campusForm.name} 
                onChange={onCampusChange('name')}
                style={{ paddingRight: '80px' }}
              />
              <button 
                onClick={() => handleAutoFill()}
                disabled={!campusForm.name || isAutoFilling}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#00a884',
                  color: 'white',
                  border: 'none',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  cursor: campusForm.name && !isAutoFilling ? 'pointer' : 'not-allowed',
                  fontSize: '12px',
                  opacity: campusForm.name && !isAutoFilling ? 1 : 0.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isAutoFilling ? <><FiLoader className="spin" /> Loading</> : <><FiSearch /> Auto-Fill</>}
              </button>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#202c33',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  marginTop: '4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000,
                  boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}>
                  {searchResults.map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAutoFill(result.university_name)}
                      style={{
                        padding: '10px',
                        cursor: 'pointer',
                        borderBottom: idx < searchResults.length - 1 ? '1px solid #374151' : 'none',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = 'rgba(0, 168, 132, 0.1)'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {result.university_name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <label className="label" style={{ marginTop: 10 }}>Description</label>
            <textarea className="input" rows={4} placeholder="Brief description about the university" value={campusForm.description} onChange={onCampusChange('description')} />

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Location</label>
                <input className="input" placeholder="e.g., Nairobi" value={campusForm.location} onChange={onCampusChange('location')} />
              </div>
              <div>
                <label className="label">Website URL</label>
                <input className="input" placeholder="https://..." value={campusForm.website_url} onChange={onCampusChange('website_url')} />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Established Year</label>
                <input className="input" type="number" placeholder="e.g., 1956" value={campusForm.established} onChange={onCampusChange('established')} />
              </div>
              <div>
                <label className="label">Student Count</label>
                <input className="input" type="number" placeholder="e.g., 84000" value={campusForm.student_count} onChange={onCampusChange('student_count')} />
              </div>
            </div>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitCampus}>{busy ? 'Adding...' : 'Add University'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Past Papers Tab */}
      {activeTab === 'pastpapers' && (
        <div className="grid-2">
          <div className="panel">
            <label className="label">Past Paper PDF *</label>
            {renderDropzone(paperPdf, setPaperPdf, 'application/pdf', 'paper-pdf', <FiFile size={24} />)}
          </div>
          <div className="panel">
            <label className="label">University (optional)</label>
            <select className="select" value={paperForm.university_id} onChange={onPaperChange('university_id')}>
              <option value="">Select University</option>
              {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <label className="label" style={{ marginTop: 10 }}>Faculty *</label>
            <input className="input" placeholder="e.g., Engineering, Business, Arts" value={paperForm.faculty} onChange={onPaperChange('faculty')} />

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Unit Code *</label>
                <input className="input" placeholder="e.g., CS101" value={paperForm.unit_code} onChange={onPaperChange('unit_code')} />
              </div>
              <div>
                <label className="label">Unit Name *</label>
                <input className="input" placeholder="e.g., Introduction to Programming" value={paperForm.unit_name} onChange={onPaperChange('unit_name')} />
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: 10 }}>
              <div>
                <label className="label">Year</label>
                <input className="input" type="number" placeholder="e.g., 2023" value={paperForm.year} onChange={onPaperChange('year')} />
              </div>
              <div>
                <label className="label">Semester</label>
                <select className="select" value={paperForm.semester} onChange={onPaperChange('semester')}>
                  <option value="">Select Semester</option>
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                  <option value="3">Semester 3</option>
                </select>
              </div>
            </div>

            <label className="label" style={{ marginTop: 10 }}>Exam Type</label>
            <select className="select" value={paperForm.exam_type} onChange={onPaperChange('exam_type')}>
              <option value="Main">Main Exam</option>
              <option value="Supplementary">Supplementary</option>
              <option value="CAT">CAT</option>
              <option value="Mock">Mock Exam</option>
            </select>

            <div className="actions" style={{ marginTop: 12 }}>
              <button className="btn primary" disabled={busy} onClick={submitPastPaper}>{busy ? 'Uploading...' : 'Upload Past Paper'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;