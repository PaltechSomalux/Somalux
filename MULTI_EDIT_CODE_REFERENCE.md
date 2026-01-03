# Multi-File Editing - Code Changes Reference

## File Modified
`src/SomaLux/Books/Admin/pages/PastPapersManagement.jsx`

---

## 1. New State Variables Added

```javascript
// Before edit mode (single paper)
const [editingId, setEditingId] = useState(null);
const [editDraft, setEditDraft] = useState({});

// NEW: Multi-select functionality
const [selectedIds, setSelectedIds] = useState(new Set());
const [isMultiEditMode, setIsMultiEditMode] = useState(false);
```

---

## 2. New Handler Functions

### Toggle Select Row
```javascript
const toggleSelectRow = (id) => {
  setSelectedIds(prev => {
    const newSet = new Set(prev);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    return newSet;
  });
};
```

### Toggle Select All
```javascript
const toggleSelectAll = () => {
  if (selectedIds.size === rows.length && rows.length > 0) {
    setSelectedIds(new Set());
  } else {
    setSelectedIds(new Set(rows.map(r => r.id)));
  }
};
```

### Start Multi-Edit Mode
```javascript
const startMultiEdit = () => {
  if (selectedIds.size === 0) {
    showToast({ type: 'error', message: 'Please select at least one past paper to edit.' });
    return;
  }
  
  // Check permissions for all selected rows
  const canEditAll = Array.from(selectedIds).every(id => {
    const row = rows.find(r => r.id === id);
    return canEdit(row);
  });

  if (!canEditAll) {
    showToast({ type: 'error', message: 'You do not have permission to edit all selected past papers.' });
    return;
  }

  setIsMultiEditMode(true);
  setEditDraft({
    faculty: '', unit_code: '', unit_name: '', year: '', semester: '', exam_type: ''
  });
  setUseCustomFaculty(false);
  setCustomFaculty('');
};
```

### Cancel Multi-Edit Mode
```javascript
const cancelMultiEdit = () => {
  setIsMultiEditMode(false);
  setEditDraft({});
  setUseCustomFaculty(false);
  setCustomFaculty('');
  setSelectedIds(new Set());
};
```

### Save Multi-Edit
```javascript
const saveMultiEdit = async () => {
  if (selectedIds.size === 0) {
    showToast({ type: 'error', message: 'No past papers selected.' });
    return;
  }

  // Get the values that were actually changed
  const updates = {};
  if (editDraft.faculty) updates.faculty = editDraft.faculty || (useCustomFaculty ? customFaculty : editDraft.faculty);
  if (editDraft.unit_code) updates.unit_code = editDraft.unit_code;
  if (editDraft.unit_name) updates.unit_name = editDraft.unit_name;
  if (editDraft.year) updates.year = editDraft.year;
  if (editDraft.semester) updates.semester = editDraft.semester;
  if (editDraft.exam_type) updates.exam_type = editDraft.exam_type;

  if (Object.keys(updates).length === 0) {
    showToast({ type: 'error', message: 'Please enter at least one field to update.' });
    return;
  }

  try {
    const faculty = useCustomFaculty ? customFaculty : editDraft.faculty;
    if (updates.faculty && !faculty) {
      showToast({ type: 'error', message: 'Please select or enter a faculty.' });
      return;
    }

    // Update all selected papers
    for (const id of selectedIds) {
      const row = rows.find(r => r.id === id);
      await updatePastPaper(id, { 
        updates: { ...updates, faculty: updates.faculty || faculty }, 
        newPdfFile: null, 
        oldFilePath: row.file_path 
      });
    }

    cancelMultiEdit();
    await load();
    showToast({ type: 'success', message: `${selectedIds.size} past paper(s) updated successfully.` });
  } catch (e) {
    console.error('Failed to update past papers:', e?.message || e);
    showToast({ type: 'error', message: e?.message || 'Failed to update past papers.' });
  }
};
```

---

## 3. Table Header Changes

**Before:**
```jsx
<th style={{ width: '250px' }}>Unit Name</th>
<th style={{ width: '150px', cursor: 'pointer' }} onClick={() => toggleSort('unit_code')}>Unit Code...</th>
```

**After:**
```jsx
<th style={{ width: '40px' }}>
  <input
    type="checkbox"
    checked={rows.length > 0 && selectedIds.size === rows.length}
    onChange={toggleSelectAll}
    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
    title={selectedIds.size === rows.length ? 'Unselect all' : 'Select all'}
  />
</th>
<th style={{ width: '250px' }}>Unit Name</th>
<th style={{ width: '150px', cursor: 'pointer' }} onClick={() => toggleSort('unit_code')}>Unit Code...</th>
```

---

## 4. Table Row Changes

**Before:**
```jsx
<tr key={row.id}>
  <td style={{ color: row.unit_name ? '#e9edef' : '#8696a0' }}>
    {editingId === row.id ? ... : (row.unit_name || '—')}
  </td>
```

**After:**
```jsx
<tr key={row.id} style={{ background: selectedIds.has(row.id) ? 'rgba(52, 183, 241, 0.1)' : 'transparent' }}>
  <td style={{ textAlign: 'center' }}>
    <input
      type="checkbox"
      checked={selectedIds.has(row.id)}
      onChange={() => toggleSelectRow(row.id)}
      disabled={isMultiEditMode}
      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
    />
  </td>
  <td style={{ color: row.unit_name ? '#e9edef' : '#8696a0' }}>
    {editingId === row.id ? ... : (row.unit_name || '—')}
  </td>
```

---

## 5. New UI Sections (Inserted before table)

### Multi-Edit Mode Toolbar
```jsx
{isMultiEditMode && (
  <div style={{ 
    background: '#1a2332', 
    border: '2px solid #34B7F1', 
    borderRadius: '6px', 
    padding: '12px',
    marginBottom: '12px'
  }}>
    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h3 style={{ margin: 0, color: '#34B7F1' }}>
        Edit {selectedIds.size} Past Paper{selectedIds.size !== 1 ? 's' : ''}
      </h3>
      <button 
        className="btn" 
        onClick={cancelMultiEdit}
        style={{ background: '#2a3f56', color: '#e9edef' }}
      >
        Cancel
      </button>
    </div>

    <div className="grid-2" style={{ gap: '12px', marginBottom: '12px' }}>
      {/* 6 input fields here */}
      {/* Unit Name, Unit Code, Faculty, Year, Semester, Exam Type */}
    </div>

    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
      <button 
        className="btn primary" 
        onClick={saveMultiEdit}
        style={{ background: '#00a884' }}
      >
        Save Changes to All {selectedIds.size} Item{selectedIds.size !== 1 ? 's' : ''}
      </button>
      <button 
        className="btn" 
        onClick={cancelMultiEdit}
        style={{ background: '#2a3f56', color: '#e9edef' }}
      >
        Cancel
      </button>
    </div>
  </div>
)}
```

### Selection Toolbar
```jsx
{selectedIds.size > 0 && !isMultiEditMode && (
  <div style={{ 
    background: '#1a2332', 
    border: '1px solid #2a3f56', 
    borderRadius: '6px', 
    padding: '12px',
    marginBottom: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  }}>
    <span style={{ color: '#8696a0' }}>
      {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
    </span>
    <div style={{ display: 'flex', gap: '8px' }}>
      <button 
        className="btn primary" 
        onClick={startMultiEdit}
        style={{ background: '#34B7F1' }}
      >
        Edit Selected ({selectedIds.size})
      </button>
      <button 
        className="btn" 
        onClick={() => setSelectedIds(new Set())}
        style={{ background: '#2a3f56', color: '#e9edef' }}
      >
        Clear Selection
      </button>
    </div>
  </div>
)}
```

---

## 6. ColSpan Updates

**Before:**
```jsx
<tr><td colSpan={12} style={{ textAlign: 'center', color: '#8696a0' }}>Loading...</td></tr>
<tr><td colSpan={12} style={{ textAlign: 'center', color: '#8696a0' }}>No data</td></tr>
```

**After:**
```jsx
<tr><td colSpan={13} style={{ textAlign: 'center', color: '#8696a0' }}>Loading...</td></tr>
<tr><td colSpan={13} style={{ textAlign: 'center', color: '#8696a0' }}>No data</td></tr>
```

---

## Summary of Changes

| Item | Count | Type |
|------|-------|------|
| State variables added | 2 | New |
| Handler functions added | 5 | New |
| UI sections added | 2 | New |
| Table columns modified | 1 | Updated |
| Table rows modified | 1 | Updated |
| Lines of code added | ~300 | Total |

---

## Testing the Implementation

### Test Case 1: Select Single Paper
1. Click checkbox next to first paper
2. Selection toolbar appears with "1 item selected"
3. Row highlights in light blue

### Test Case 2: Select Multiple Papers
1. Click 3 checkboxes
2. Selection toolbar shows "3 items selected"
3. "Edit Selected (3)" button shows count

### Test Case 3: Select All
1. Click header checkbox
2. All rows get checkboxes checked
3. Selection toolbar shows full count

### Test Case 4: Edit Selected Papers
1. Select papers, click "Edit Selected"
2. Multi-edit panel appears
3. Fill "Unit Code" with "CS 101"
4. Leave other fields blank
5. Click "Save Changes to All X Items"
6. Success notification appears
7. Table refreshes

### Test Case 5: Clear Fields
1. Make changes in multi-edit form
2. Click "Cancel"
3. Panel disappears
4. State resets

### Test Case 6: Validation
1. Select papers
2. Click "Edit Selected"
3. Don't fill any fields
4. Click "Save Changes"
5. Error: "Please enter at least one field to update."

### Test Case 7: Permissions
1. Select papers you don't have permission for
2. Click "Edit Selected"
3. Error: "You do not have permission..."

---

## Performance Notes

- **Set lookup**: O(1) for checking if ID is selected
- **Batch update**: Sequential loop (not parallel) to prevent race conditions
- **UI updates**: Minimal re-renders using proper state management
- **Memory**: Selected IDs stored in Set (efficient for large datasets)
