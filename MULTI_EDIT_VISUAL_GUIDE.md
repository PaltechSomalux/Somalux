# Multi-File Editing Enhancement - Quick Visual Guide

## What Was Added to PastPapersManagement.jsx

### 1️⃣ Checkbox Column in Table
```
┌─────┬─────────────────┬──────────────┬──────────┐
│ ☑   │ Unit Name       │ Unit Code    │ Faculty  │
├─────┼─────────────────┼──────────────┼──────────┤
│ ☐   │ Calculus I      │ MATH 101     │ Sciences │
│ ☐   │ Physics II      │ PHYS 201     │ Sciences │
│ ☐   │ Programming     │ CS 150       │ IT       │
└─────┴─────────────────┴──────────────┴──────────┘
```

### 2️⃣ Selection Toolbar (appears when items selected)
```
┌─────────────────────────────────────────────────────────┐
│ 2 items selected                                         │
│                    [Edit Selected (2)] [Clear Selection] │
└─────────────────────────────────────────────────────────┘
```

### 3️⃣ Multi-Edit Panel (appears when "Edit Selected" clicked)
```
┌─────────────────────────────────────────────────────────┐
│ Edit 2 Past Papers                            [Cancel]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Unit Name         │  Unit Code                          │
│  [_______________] │ [_______________]                  │
│  Leave blank to skip                                    │
│                                                          │
│  Faculty           │  Year                               │
│  [dropdown v    ]  │ [_______________]                  │
│  ☐ Add custom      │  Leave blank to skip               │
│                                                          │
│  Semester          │  Exam Type                          │
│  [dropdown v    ]  │ [dropdown v    ]                   │
│  Leave blank to skip                                    │
│                                                          │
│                    [Save Changes to All 2 Items]        │
│                    [Cancel]                             │
└─────────────────────────────────────────────────────────┘
```

## Features at a Glance

✅ **Select Files**
- Click checkboxes to select papers
- "Select All" checkbox to select entire page
- Visual highlight on selected rows

✅ **Enter Edit Mode**
- Click "Edit Selected (n)" button
- Multi-edit panel appears with all fields
- Checkboxes disable to prevent interference

✅ **Make Changes**
- Fill in any fields you want to update
- Leave blank to skip that field
- Option to add custom faculty

✅ **Save or Cancel**
- Save applies changes to ALL selected papers
- Cancel discards changes
- Toast notification shows result

## Code Structure

```
PastPapersManagement Component
├── State
│   ├── selectedIds (Set)
│   ├── isMultiEditMode (boolean)
│   └── [existing states...]
│
├── Handlers
│   ├── toggleSelectRow()
│   ├── toggleSelectAll()
│   ├── startMultiEdit()
│   ├── cancelMultiEdit()
│   └── saveMultiEdit()
│
├── UI Sections
│   ├── Table Header
│   │   └── Checkbox column (40px)
│   │
│   ├── Multi-Edit Toolbar (conditional)
│   │   └── 6 input fields
│   │
│   ├── Selection Toolbar (conditional)
│   │   └── Count + Action buttons
│   │
│   └── Table Body
│       └── Checkbox in each row
│
└── Existing Sections
    ├── Search/Filter
    ├── Add New button
    └── Pagination
```

## State Management Flow

```
Initial State
    ↓
User selects checkboxes
    ↓ selectedIds = {id1, id2}
Selection Toolbar appears
    ↓
User clicks "Edit Selected"
    ↓ isMultiEditMode = true
Multi-Edit Panel appears
    ↓
User fills fields and clicks Save
    ↓ saveMultiEdit() executes
Backend updates all papers
    ↓
Toast notification
    ↓
Table refreshes
    ↓
Reset to Initial State
```

## Event Flow

1. **Select Papers**
   ```
   Checkbox clicked → toggleSelectRow(id) → Update selectedIds Set
   ```

2. **Select All**
   ```
   Header checkbox clicked → toggleSelectAll() → Update selectedIds Set
   ```

3. **Start Editing**
   ```
   "Edit Selected" button → startMultiEdit() → Set isMultiEditMode = true
   ```

4. **Update Fields**
   ```
   Input changed → setEditDraft() → Form state updates
   ```

5. **Save Changes**
   ```
   "Save Changes" button → saveMultiEdit() → Update each paper → Refresh table
   ```

6. **Cancel**
   ```
   "Cancel" button → cancelMultiEdit() → Reset all states
   ```

## Validation & Permissions

Before editing:
- ✅ At least one paper selected
- ✅ User has permission for ALL papers
- ✅ At least one field filled to update

During save:
- ✅ Each paper checked for permissions
- ✅ Only non-empty fields sent to backend
- ✅ Custom faculty option validated
- ✅ Error messages shown if validation fails

## Styling Details

- **Selected Row**: Light blue background (rgba(52, 183, 241, 0.1))
- **Multi-Edit Panel**: Blue top border (2px solid #34B7F1)
- **Checkboxes**: 16x16px, cursor pointer
- **Buttons**: Consistent with admin UI colors
- **Toolbar**: Dark background with proper contrast

## Browser Support

- ✅ Chrome/Edge (Set data structure)
- ✅ Firefox (Set data structure)
- ✅ Safari (Set data structure)
- ✅ Modern browsers (HTML5 inputs)

## Accessibility Features

- Checkboxes have proper width/height for touch
- Labels associated with inputs
- Clear visual feedback for selections
- Descriptive toast messages
- Button text indicates action count

## Performance Considerations

- Uses Set for O(1) checkbox lookups
- Only sends non-empty fields in batch update
- Batch updates happen sequentially (not parallel) to avoid race conditions
- Table refreshes once after all updates complete
