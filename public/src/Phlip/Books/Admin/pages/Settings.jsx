import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../../../Assets/Paltech Black.png';
import { fetchStats, fetchViewDetails, fetchAllUsers } from '../api';
import { useAdminUI } from '../AdminUIContext';
import { supabase } from '../../supabaseClient';

const Settings = ({ userProfile }) => {
  const [pdfOptions, setPdfOptions] = useState({
    overview: true,
    uploadsPerMonth: true,
    categoriesDistribution: true,
    topBooks: true,
    recentBooks: true,
    viewsDetails: true,
    includeUsers: false,
    usersMode: 'names_emails',
    dateRange: 'all',
    // Rentals export options
    rentalsOverview: false,
    rentalsListings: false,
    rentalsBookings: false,
    rentalsLandlords: false,
    rentalsAnalytics: false,
  });
  const [generating, setGenerating] = useState(false);
  const [usersPanelOpen, setUsersPanelOpen] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [usersDataCache, setUsersDataCache] = useState([]);

  const { showToast } = useAdminUI();

  const [listingFeeKes, setListingFeeKes] = useState('');
  const [listingFeeLoading, setListingFeeLoading] = useState(false);
  const [listingFeeSaving, setListingFeeSaving] = useState(false);
  const [listingFeeMeta, setListingFeeMeta] = useState({ currency: 'KES', updated_at: null });

  const isAdmin = userProfile?.role === 'admin';

  const handleOptionChange = (key) => {
    setPdfOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!isAdmin) return;

    let isMounted = true;

    (async () => {
      try {
        setListingFeeLoading(true);
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token || '';
        if (!token) {
          if (!isMounted) return;
          setListingFeeKes(prev => (prev === '' ? '0' : prev));
          return;
        }

        const resp = await fetch('http://localhost:5000/api/rentals/admin/platform-settings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        const js = await resp.json().catch(() => ({}));

        if (!isMounted) return;

        if (resp.ok && js.success) {
          const fee = typeof js.listingFeeKes === 'number'
            ? js.listingFeeKes
            : parseInt(js.listingFeeKes, 10) || 0;
          setListingFeeKes(String(fee));
          setListingFeeMeta({
            currency: js.currency || 'KES',
            updated_at: js.updated_at || null
          });
        } else {
          console.warn('Failed to load rentals platform settings', js);
        }
      } catch (e) {
        console.error('Error loading rentals platform settings:', e);
      } finally {
        if (isMounted) setListingFeeLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [isAdmin]);

  const handleSaveListingFee = async () => {
    try {
      const parsed = parseInt(listingFeeKes, 10);
      const fee = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;

      setListingFeeSaving(true);

      const { data } = await supabase.auth.getSession();
      const token = data?.session?.access_token || '';
      if (!token) {
        showToast({ type: 'error', message: 'Session expired. Please sign in again.' });
        setListingFeeSaving(false);
        return;
      }

      const resp = await fetch('http://localhost:5000/api/rentals/admin/platform-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ listingFeeKes: fee })
      });

      const js = await resp.json().catch(() => ({}));

      if (!resp.ok || !js.success) {
        console.error('Failed to save rentals platform settings', js);
        showToast({ type: 'error', message: js.error || 'Failed to save listing fee.' });
      } else {
        const savedFee = typeof js.listingFeeKes === 'number' ? js.listingFeeKes : fee;
        setListingFeeKes(String(savedFee));
        setListingFeeMeta({
          currency: js.currency || 'KES',
          updated_at: js.updated_at || null
        });
        showToast({ type: 'success', message: 'Listing fee updated.' });
      }
    } catch (e) {
      console.error('Error saving listing fee:', e);
      showToast({ type: 'error', message: 'Failed to save listing fee. Please try again.' });
    } finally {
      setListingFeeSaving(false);
    }
  };

  // Load roles dynamically when users panel opens
  useEffect(() => {
    if (!usersPanelOpen) return;
    (async () => {
      const users = await fetchAllUsers();
      setUsersDataCache(users);
      const rolesSet = Array.from(new Set((users || []).map(u => (u.role || 'viewer').toLowerCase())));
      // Order Admin, Editor, Viewer first, then others alphabetically
      const priority = { admin: 0, editor: 1, viewer: 2 };
      const ordered = rolesSet.sort((a, b) => (priority[a] ?? 99) - (priority[b] ?? 99) || a.localeCompare(b));
      setAvailableRoles(ordered);
      // Default select all roles
      setSelectedRoles(ordered);
    })();
  }, [usersPanelOpen]);

  const toggleRole = (role) => {
    setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
  };

  // Helper: fetch asset and convert to Base64 data URL
  const toDataUrl = async (url) => {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      return null;
    }
  };

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const logoDataUrl = await toDataUrl(logo);
      const stats = await fetchStats();
      const viewDetails = pdfOptions.viewsDetails ? await fetchViewDetails() : [];
      const usersAll = (pdfOptions.includeUsers ? (usersDataCache.length ? usersDataCache : await fetchAllUsers()) : []);

      const doc = new jsPDF();
      let yPos = 20;

      // Add watermark to first page (behind content)
      const addWatermark = () => {
        if (!logoDataUrl) return;
        const pw = doc.internal.pageSize.width;
        const ph = doc.internal.pageSize.height;
        const w = Math.min(pw * 0.25, 60); // Smaller size
        const h = w; // Keep square for simplicity
        const x = (pw - w) / 2;
        const y = (ph - h) / 2;
        try {
          // @ts-ignore
          const g = doc.GState && new doc.GState({ opacity: 0.06 });
          if (g && doc.setGState) doc.setGState(g);
          doc.addImage(logoDataUrl, 'PNG', x, y, w, h, undefined, 'FAST');
        } catch {}
        // Reset opacity
        try {
          if (doc.setGState) doc.setGState(new doc.GState({ opacity: 1 }));
        } catch {}
      };

      addWatermark(); // Add to page 1

      // Header with embedded logo
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 168, 132); // Brand green
      try {
        if (logoDataUrl) {
          doc.addImage(logoDataUrl, 'PNG', 15, yPos - 6, 22, 22);
        }
      } catch {}
      doc.text('Paltech-Elib Documentation', 105, yPos, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, yPos + 8, { align: 'center' });
      
      // Add separator line
      doc.setDrawColor(0, 168, 132);
      doc.setLineWidth(0.5);
      doc.line(15, yPos + 12, 195, yPos + 12);
      
      // Reset color
      doc.setTextColor(0);
      yPos = 40;

      // Helper to ensure enough space before starting a new section (title + head)
      const ensureSpace = (y, reserve = 50) => {
        const pageH = doc.internal.pageSize.height;
        if (y > pageH - reserve) {
          doc.addPage();
          addWatermark(); // Add watermark behind content on new page
          return 20;
        }
        return y;
      };

      const tableCommon = {
        theme: 'striped',
        headStyles: { fillColor: [0, 168, 132], textColor: 255 },
        styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
        margin: { left: 15, right: 15 },
      };

      // Overview Section
      if (pdfOptions.overview && stats.counts) {
        yPos = ensureSpace(yPos);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Overview Statistics', 15, yPos);
        const startY = yPos + 6;
        autoTable(doc, {
          startY,
          head: [['Metric', 'Value']],
          body: [
            ['Total Books', stats.counts.books || 0],
            ['Total Users', stats.counts.users || 0],
            ['Total Downloads', stats.counts.downloads || 0],
            ['Total Views', stats.counts.views || 0],
          ],
          theme: 'grid',
          headStyles: { fillColor: [0, 168, 132], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 3, overflow: 'linebreak' },
          margin: { left: 15, right: 15 },
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Uploads per Month
      if (pdfOptions.uploadsPerMonth && stats.monthly?.length > 0) {
        const filtered = stats.monthly.filter(m => (m.uploads || 0) > 0);
        if (filtered.length > 0) {
          yPos = ensureSpace(yPos);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Uploads per Month', 15, yPos);
          const startY = yPos + 6;
          autoTable(doc, {
            startY,
            head: [['Month', 'Uploads']],
            body: filtered.sort((a, b) => (b.uploads || 0) - (a.uploads || 0)).map(m => [m.month, m.uploads || 0]),
            ...tableCommon,
          });
          yPos = doc.lastAutoTable.finalY + 15;
        }
      }

      // Categories Distribution
      if (pdfOptions.categoriesDistribution && stats.categories?.length > 0) {
        const filtered = stats.categories.filter(c => (c.count || 0) > 0);
        if (filtered.length > 0) {
          yPos = ensureSpace(yPos);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Categories Distribution', 15, yPos);
          const startY = yPos + 6;
          autoTable(doc, {
            startY,
            head: [['Category', 'Count']],
            body: filtered.sort((a, b) => (b.count || 0) - (a.count || 0)).map(c => [c.name, c.count || 0]),
            ...tableCommon,
          });
          yPos = doc.lastAutoTable.finalY + 15;
        }
      }

      // Top Books by Downloads
      if (pdfOptions.topBooks && stats.top?.length > 0) {
        const filtered = stats.top.filter(b => (b.downloads || 0) > 0);
        if (filtered.length > 0) {
          yPos = ensureSpace(yPos);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('Top Books (Downloads)', 15, yPos);
          const startY = yPos + 6;
          autoTable(doc, {
            startY,
            head: [['Title', 'Downloads']],
            body: filtered.sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).map(b => [b.title || 'Untitled', b.downloads || 0]),
            ...tableCommon,
          });
          yPos = doc.lastAutoTable.finalY + 15;
        }
      }

      // Recent Books
      if (pdfOptions.recentBooks && stats.recent?.length > 0) {
        yPos = ensureSpace(yPos);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Recent Books', 15, yPos);
        const startY = yPos + 6;
        autoTable(doc, {
          startY,
          head: [['Title', 'Author', 'Date Added']],
          body: stats.recent.slice(0, 10).map(b => [
            b.title || 'Untitled',
            b.author || 'Unknown',
            new Date(b.created_at).toLocaleDateString()
          ]),
          ...tableCommon,
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Views Details
      if (pdfOptions.viewsDetails && viewDetails.length > 0) {
        yPos = ensureSpace(yPos);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Book Views Details', 15, yPos);
        const startY = yPos + 6;
        autoTable(doc, {
          startY,
          head: [['Book Title', 'Total Views', 'Unique Users']],
          body: viewDetails.slice(0, 20).map(v => [
            v.book_title || 'Unknown',
            v.total_views || 0,
            v.unique_users || 0
          ]),
          ...tableCommon,
        });
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Users (optional)
      if (pdfOptions.includeUsers && usersAll.length > 0) {
        yPos = ensureSpace(yPos);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Users', 15, yPos);
        const startY = yPos + 6;

        const priority = { admin: 0, editor: 1, viewer: 2 };
        const normRole = (r) => (r || 'viewer').toLowerCase();

        let rows = usersAll;
        if (pdfOptions.usersMode === 'with_roles') {
          const allowed = new Set(selectedRoles);
          rows = rows.filter(u => allowed.has(normRole(u.role)));
        }
        // Sort by role priority then display_name
        rows = [...rows].sort((a, b) => {
          const ra = normRole(a.role), rb = normRole(b.role);
          const pr = (priority[ra] ?? 99) - (priority[rb] ?? 99);
          return pr !== 0 ? pr : (a.display_name || '').localeCompare(b.display_name || '');
        });

        if (pdfOptions.usersMode === 'with_roles') {
          autoTable(doc, {
            startY,
            head: [['Name', 'Email', 'Role']],
            body: rows.map(u => [u.display_name || '—', u.email || '—', (u.role || 'viewer')]),
            ...tableCommon,
            columnStyles: { 1: { cellWidth: 90 } },
          });
        } else {
          autoTable(doc, {
            startY,
            head: [['Name', 'Email']],
            body: rows.map(u => [u.display_name || '—', u.email || '—']),
            ...tableCommon,
            columnStyles: { 1: { cellWidth: 110 } },
          });
        }
        yPos = doc.lastAutoTable.finalY + 15;
      }

      // Rentals export (admin endpoints)
      const getAuthToken = async () => {
        const { data } = await supabase.auth.getSession();
        return data?.session?.access_token || '';
      };

      if (pdfOptions.rentalsOverview || pdfOptions.rentalsListings || pdfOptions.rentalsBookings || pdfOptions.rentalsLandlords || pdfOptions.rentalsAnalytics) {
        const token = await getAuthToken();

        // Rentals Overview
        if (pdfOptions.rentalsOverview) {
          try {
            const resp = await fetch('http://localhost:5000/api/rentals/admin/dashboard', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resp.ok) {
              const js = await resp.json();
              const rstats = js.stats || {};
              yPos = ensureSpace(yPos);
              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.text('Rentals Overview', 15, yPos);
              autoTable(doc, {
                startY: yPos + 6,
                head: [['Metric', 'Value']],
                body: [
                  ['Total Listings', rstats.totalListings || 0],
                  ['Total Bookings', rstats.totalBookings || 0],
                  ['Total Landlords', rstats.totalLandlords || 0],
                  ['Total Revenue (KES)', rstats.totalRevenue || 0],
                  ['Pending Listings', rstats.pendingListings || 0],
                  ['Pending Bookings', rstats.pendingBookings || 0]
                ],
                ...tableCommon,
              });
              yPos = doc.lastAutoTable.finalY + 15;
            }
          } catch (e) { console.warn('Failed rentals overview', e); }
        }

        // Listings
        if (pdfOptions.rentalsListings) {
          try {
            const resp = await fetch('http://localhost:5000/api/rentals/admin/listings?status=all', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resp.ok) {
              const js = await resp.json();
              const rows = js.listings || [];
              if (rows.length > 0) {
                yPos = ensureSpace(yPos);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Listings (Rentals)', 15, yPos);
                autoTable(doc, {
                  startY: yPos + 6,
                  head: [['Title', 'Landlord', 'Location', 'Rent', 'Status', 'Views', 'Rating']],
                  body: rows.slice(0, 200).map(r => [r.title || '—', r.landlord_name || '—', r.area_name || '—', (r.monthly_rent || 0), r.status || '—', r.views_count || 0, r.average_rating ? r.average_rating.toFixed(1) : '—']),
                  ...tableCommon,
                });
                yPos = doc.lastAutoTable.finalY + 15;
              }
            }
          } catch (e) { console.warn('Failed rentals listings', e); }
        }

        // Bookings
        if (pdfOptions.rentalsBookings) {
          try {
            const resp = await fetch('http://localhost:5000/api/rentals/admin/bookings?status=all', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resp.ok) {
              const js = await resp.json();
              const rows = js.bookings || [];
              if (rows.length > 0) {
                yPos = ensureSpace(yPos);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Bookings (Rentals)', 15, yPos);
                autoTable(doc, {
                  startY: yPos + 6,
                  head: [['Booking ID', 'Property', 'Student', 'Status', 'Created At']],
                  body: rows.slice(0, 200).map(b => [b.id || '—', (b.rental_listings?.title || '—'), (b.user_email || b.user?.email || '—'), b.status || '—', b.created_at ? new Date(b.created_at).toLocaleString() : '—']),
                  ...tableCommon,
                });
                yPos = doc.lastAutoTable.finalY + 15;
              }
            }
          } catch (e) { console.warn('Failed rentals bookings', e); }
        }

        // Landlords
        if (pdfOptions.rentalsLandlords) {
          try {
            const resp = await fetch('http://localhost:5000/api/rentals/admin/landlords?filter=all', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resp.ok) {
              const js = await resp.json();
              const rows = js.landlords || [];
              if (rows.length > 0) {
                yPos = ensureSpace(yPos);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Landlords', 15, yPos);
                autoTable(doc, {
                  startY: yPos + 6,
                  head: [['Name', 'Email', 'Properties', 'Bookings', 'Revenue (KES)', 'Rating', 'Status']],
                  body: rows.slice(0, 200).map(l => [l.name || '—', l.email || '—', l.properties_count || 0, l.bookings_count || 0, l.total_revenue || 0, l.average_rating ? l.average_rating.toFixed(1) : '—', l.verified ? 'Verified' : (l.suspended ? 'Suspended' : 'Unverified')]),
                  ...tableCommon,
                });
                yPos = doc.lastAutoTable.finalY + 15;
              }
            }
          } catch (e) { console.warn('Failed rentals landlords', e); }
        }

        // Analytics
        if (pdfOptions.rentalsAnalytics) {
          try {
            const resp = await fetch('http://localhost:5000/api/rentals/admin/analytics?range=30d', { headers: { 'Authorization': `Bearer ${token}` } });
            if (resp.ok) {
              const js = await resp.json();
              const analytics = js.analytics || {};
              yPos = ensureSpace(yPos);
              doc.setFontSize(16);
              doc.setFont('helvetica', 'bold');
              doc.text('Rentals Analytics (30d)', 15, yPos);
              const body = [
                ['Total Revenue (KES)', analytics.revenue?.total || 0],
                ['This Month Revenue (KES)', analytics.revenue?.thisMonth || 0],
                ['Total Listings', analytics.listings?.total || 0],
                ['Active Listings', analytics.listings?.active || 0],
                ['Occupancy Rate', analytics.listings?.occupancyRate || 0],
                ['Total Bookings', analytics.bookings?.total || 0],
                ['Bookings This Month', analytics.bookings?.thisMonth || 0],
              ];
              autoTable(doc, { startY: yPos + 6, head: [['Metric', 'Value']], body, ...tableCommon });
              yPos = doc.lastAutoTable.finalY + 15;
            }
          } catch (e) { console.warn('Failed rentals analytics', e); }
        }
      }

      // Footer on all pages
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(
          `Paltech-Elib | Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      // Save PDF
      doc.save(`Paltech-Elib-Report-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast({ type: 'success', message: 'PDF report downloaded.' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast({ type: 'error', message: 'Failed to generate PDF. Please try again.' });
    } finally {
      setGenerating(false);
    }
  };
  return (
    <div>
      {isAdmin && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-title">PDF Documentation Export</div>
          <p style={{ color: '#8696a0', marginBottom: 20, fontSize: 14 }}>
            Generate a comprehensive PDF report of your library statistics and data. Select the sections you want to include:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12, marginBottom: 20 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.overview}
                onChange={() => handleOptionChange('overview')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Overview Statistics</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.uploadsPerMonth}
                onChange={() => handleOptionChange('uploadsPerMonth')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Uploads per Month</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.categoriesDistribution}
                onChange={() => handleOptionChange('categoriesDistribution')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Categories Distribution</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.topBooks}
                onChange={() => handleOptionChange('topBooks')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Top Books (Downloads)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.recentBooks}
                onChange={() => handleOptionChange('recentBooks')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Recent Books</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.viewsDetails}
                onChange={() => handleOptionChange('viewsDetails')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Book Views Details</span>
            </label>

            {/* Rentals export options */}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.rentalsOverview}
                onChange={() => handleOptionChange('rentalsOverview')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Rentals Overview</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.rentalsListings}
                onChange={() => handleOptionChange('rentalsListings')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Rentals Listings</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.rentalsBookings}
                onChange={() => handleOptionChange('rentalsBookings')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Rentals Bookings</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.rentalsLandlords}
                onChange={() => handleOptionChange('rentalsLandlords')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Rentals Landlords</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={pdfOptions.rentalsAnalytics}
                onChange={() => handleOptionChange('rentalsAnalytics')}
                style={{ width: 16, height: 16, cursor: 'pointer' }}
              />
              <span style={{ color: '#e9edef' }}>Rentals Analytics</span>
            </label>
          </div>

          {/* More (Users) */}
          <div style={{ marginTop: 10, marginBottom: 20 }}>
            <button className="btn" onClick={() => setUsersPanelOpen(v => !v)}>
              {usersPanelOpen ? 'Hide' : 'More'}
            </button>
          </div>

          {usersPanelOpen && (
            <div className="panel" style={{ marginTop: 12 }}>
              <div className="panel-title">Users Export Options</div>

              <div className="settings-tree">
                <div className="settings-branch">
                  <label className="settings-check" style={{ width: 'fit-content' }}>
                    <input
                      type="checkbox"
                      checked={!!pdfOptions.includeUsers}
                      onChange={() => setPdfOptions(p => ({ ...p, includeUsers: !p.includeUsers }))}
                      style={{ width: 16, height: 16 }}
                    />
                    <div>
                      <div className="settings-check-title">Include Users in PDF</div>
                      <div className="muted">Toggle to include a Users section in the report</div>
                    </div>
                  </label>

                  {pdfOptions.includeUsers && (
                    <div className="settings-children">
                      <div className="option-grid">
                        <label className={`option-card ${pdfOptions.usersMode !== 'with_roles' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="usersMode"
                            checked={pdfOptions.usersMode !== 'with_roles'}
                            onChange={() => setPdfOptions(p => ({ ...p, usersMode: 'names_emails' }))}
                          />
                          <div>
                            <div className="option-title">Users</div>
                            <div className="muted small">Only name and email are included</div>
                          </div>
                        </label>

                        <label className={`option-card ${pdfOptions.usersMode === 'with_roles' ? 'active' : ''}`}>
                          <input
                            type="radio"
                            name="usersMode"
                            checked={pdfOptions.usersMode === 'with_roles'}
                            onChange={() => setPdfOptions(p => ({ ...p, usersMode: 'with_roles' }))}
                          />
                          <div>
                            <div className="option-title">Users with Roles</div>
                            <div className="muted small">Include roles and filter which roles to show</div>
                          </div>
                        </label>
                      </div>

                      {pdfOptions.usersMode === 'with_roles' && (
                        <div className="settings-branch" style={{ marginTop: 10 }}>
                          <div className="muted" style={{ marginBottom: 6 }}>Include roles</div>
                          <div className="roles-grid">
                            {availableRoles.map(role => (
                              <label key={role} className="role-chip">
                                <input
                                  type="checkbox"
                                  checked={selectedRoles.includes(role)}
                                  onChange={() => toggleRole(role)}
                                />
                                <span className="cap">{role}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="actions">
            <button
              className="btn primary"
              onClick={generatePDF}
              disabled={generating || Object.values(pdfOptions).filter(v => v === true).length === 0}
            >
              {generating ? 'Generating PDF...' : 'Download PDF Report'}
            </button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-title">Rentals Listing Fee</div>
          <p style={{ color: '#8696a0', marginBottom: 12, fontSize: 14 }}>
            Set the amount landlords pay per rental listing. All amounts are in Kenyan Shillings (KES).
          </p>
          <div
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'flex-end',
              marginBottom: 8,
              flexWrap: 'wrap'
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <label className="label">Listing Fee (KES)</label>
              <input
                className="input"
                type="number"
                min="0"
                placeholder="0 = free listings"
                value={listingFeeKes}
                onChange={(e) => setListingFeeKes(e.target.value)}
                disabled={listingFeeLoading || listingFeeSaving}
              />
            </div>
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 4 }}>Current</div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(0, 168, 132, 0.12)',
                  color: '#00a884',
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {listingFeeLoading
                  ? 'Loading...'
                  : `KES ${Number(listingFeeKes || 0).toLocaleString()}`}
              </span>
            </div>
          </div>
          {listingFeeMeta?.updated_at && (
            <div style={{ fontSize: 12, color: '#8696a0', marginBottom: 8 }}>
              Last updated: {new Date(listingFeeMeta.updated_at).toLocaleString()}
            </div>
          )}
          <div className="actions">
            <button
              className="btn primary"
              onClick={handleSaveListingFee}
              disabled={listingFeeSaving || listingFeeLoading}
            >
              {listingFeeSaving ? 'Saving...' : 'Save Listing Fee'}
            </button>
          </div>
        </div>
      )}

      <div className="grid-2">
      <div className="panel">
        <div className="panel-title">General</div>
        <label className="label">App Name</label>
        <input className="input" placeholder="eLib" />
        <label className="label" style={{ marginTop: 10 }}>Storage Bucket</label>
        <input className="input" placeholder="books" />
        <div className="actions" style={{ marginTop: 12 }}>
          <button className="btn primary">Save</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">Account Config</div>
        <label className="label">Project URL</label>
        <input className="input" value={process.env.REACT_APP_SUPABASE_URL || ''} readOnly />
        <label className="label" style={{ marginTop: 10 }}>Public Key</label>
        <input className="input" value={(process.env.REACT_APP_SUPABASE_ANON_KEY || '').slice(0, 8) + '•••'} readOnly />
        <div style={{ marginTop: 8, color: '#8696a0' }}>Set values in .env file</div>
      </div>

      <div className="panel">
        <div className="panel-title">Activity Logs</div>
        <div style={{ color: '#8696a0' }}>No logs yet</div>
      </div>
    </div>
    </div>
  );
};

export default Settings;