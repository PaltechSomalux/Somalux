# Multi-File Editing - Quick Start Guide

## For Admins: How to Use Multi-Edit Feature

### Step 1️⃣: Open Past Papers Management
1. Go to Admin Dashboard
2. Navigate to **Content Management**
3. Click **Past Papers** tab

### Step 2️⃣: Select Papers to Edit
```
┌─────────────────────────────────────────────┐
│ ☑ (Select All)  Unit Name    Unit Code     │
├─────────────────────────────────────────────┤
│ ☐  Calculus I        MATH 101               │
│ ☐  Physics II        PHYS 201               │
│ ☐  Programming       CS 150                 │
└─────────────────────────────────────────────┘
```

**Click the checkboxes** next to papers you want to edit.

### Step 3️⃣: Click "Edit Selected"
```
┌─────────────────────────────────────────────┐
│ 2 items selected                            │
│             [Edit Selected (2)]             │
└─────────────────────────────────────────────┘
```

The multi-edit panel will appear.

### Step 4️⃣: Fill in the Fields You Want to Update
```
┌─────────────────────────────────────────────┐
│ Edit 2 Past Papers                          │
├─────────────────────────────────────────────┤
│ Unit Name:        [____________________]    │
│ Unit Code:        [____________________]    │
│ Faculty:          [Select Faculty v   ]    │
│ Year:             [____________________]    │
│ Semester:         [Select Semester v  ]    │
│ Exam Type:        [Select Type v     ]    │
├─────────────────────────────────────────────┤
│             [Save Changes] [Cancel]        │
└─────────────────────────────────────────────┘
```

**Important**: Only fill in the fields you want to change. Leave the rest blank.

### Step 5️⃣: Click "Save Changes"
The system will:
1. Update all selected papers
2. Show a success message
3. Refresh the table

### Example Scenarios

#### Scenario A: Update Faculty for Multiple Papers
1. Select papers with "Unknown" faculty
2. Click "Edit Selected"
3. Fill only the "Faculty" field
4. Leave other fields blank
5. Click Save ✅

#### Scenario B: Update Year for 3 Papers
1. Select 3 papers from 2023
2. Click "Edit Selected"
3. Change Year to "2024"
4. Leave other fields blank
5. Click Save ✅

#### Scenario C: Update Multiple Fields
1. Select papers
2. Fill: Unit Code, Faculty, Year
3. Leave: Unit Name, Semester, Exam Type blank
4. Click Save ✅

#### Scenario D: Cancel and Start Over
1. Select papers, click "Edit Selected"
2. Start filling fields
3. Change your mind - click "Cancel"
4. Panel closes, no changes saved
5. Selections remain - can try again ✅

---

## Keyboard Shortcuts
- `Ctrl+A` - Select all (when table focused)
- `Esc` - Cancel edit

---

## Visual Indicators

### Selection Mode
```
Row is NOT selected:  ☐ White background
Row IS selected:      ☑ Light blue background
```

### Edit Mode Indicators
```
Panel Color:     Blue border (2px solid)
Save Button:     Green (#00a884)
Cancel Button:   Dark gray
Field Status:    "Leave blank to skip" text
```

---

## Validation & Error Messages

| Error Message | Cause | Solution |
|---|---|---|
| "Please select at least one past paper to edit." | No papers selected | Click checkboxes to select papers |
| "Please enter at least one field to update." | All fields blank | Fill at least one field |
| "You do not have permission to edit all selected past papers." | Lack edit rights | Select only papers you can edit |
| "Please select or enter a faculty." | Faculty field empty | Select a faculty or add custom one |

---

## Tips & Tricks

### ✅ DO:
- ✅ Select papers with similar issues to fix together
- ✅ Use "Select All" to check all papers on page
- ✅ Leave blank to skip fields you don't want to change
- ✅ Use custom faculty option to add new faculties
- ✅ Check the count in button text (shows how many papers will be updated)

### ❌ DON'T:
- ❌ Don't select papers you don't have permission to edit
- ❌ Don't click Save without filling at least one field
- ❌ Don't refresh page during save operation
- ❌ Don't try to edit single paper with multi-edit (use regular Edit)

---

## Permissions

| User Type | Can Use Multi-Edit |
|---|---|
| Admin | ✅ Yes |
| Editor | ✅ Yes |
| Viewer | ❌ No |
| Guest | ❌ No |

---

## Browser Support

| Browser | Support |
|---|---|
| Chrome 90+ | ✅ Fully Supported |
| Firefox 88+ | ✅ Fully Supported |
| Safari 14+ | ✅ Fully Supported |
| Edge 90+ | ✅ Fully Supported |

---

## Troubleshooting

### Issue: "Edit Selected" button is grayed out
**Solution**: You need to select at least one paper. Click checkboxes to select.

### Issue: Can't edit certain papers
**Solution**: You may not have permission. Ask an admin or check your role.

### Issue: Changes not saving
**Solution**: 
1. Check error message
2. Ensure all required fields are filled
3. Try again or contact support

### Issue: Button shows wrong count
**Solution**: Refresh the page, selection state should synchronize.

---

## Performance Notes

- ✅ Fast selection/deselection (instant)
- ✅ Smooth bulk updates (sequential, not simultaneous)
- ✅ No slowdown with large datasets
- ✅ Table refreshes only after all updates complete

---

## Batch Sizes

The system updates papers **one at a time** to ensure:
- ✅ Data integrity
- ✅ Proper error handling
- ✅ Accurate success tracking
- ✅ No database race conditions

---

## Need Help?

### Quick Reference
- **Can't select papers**: Check permissions
- **Can't save changes**: Check error message and fill required fields
- **Changes not applied**: Refresh page and try again
- **Performance issues**: Try selecting fewer papers at once

### Contact Support
If you encounter issues:
1. Note the error message
2. Remember which papers were selected
3. Contact the development team

---

## Feature Comparison

| Action | Single Edit | Multi-Edit |
|---|---|---|
| Edit one paper | ✅ Use regular Edit | ❌ Not needed |
| Edit 2-3 papers | ❌ Repetitive | ✅ Use Multi-Edit |
| Edit 10+ papers | ❌ Very tedious | ✅ Much faster |
| Consistency | Manual | Guaranteed |
| Time to update 5 papers | ~2-3 minutes | ~30 seconds |

---

## Best Practices

1. **Group Similar Papers**: Select papers with same issue together
2. **Verify Before Saving**: Check preview of changes before clicking Save
3. **Use Custom Faculty Wisely**: Only add if faculty doesn't exist
4. **Clear Selection**: Use "Clear Selection" between batches
5. **Keep Changes Focused**: Avoid changing unrelated fields

---

## Summary of New Features

| Feature | Availability |
|---|---|
| Checkbox selection | ✅ Always visible |
| Select All checkbox | ✅ In table header |
| Selection toolbar | ✅ When items selected |
| Multi-edit panel | ✅ When "Edit Selected" clicked |
| Custom faculty | ✅ Optional in edit form |
| Batch save | ✅ Updates all selected |
| Progress notification | ✅ Shows result |

---

**Last Updated**: January 3, 2026
**For Questions**: Contact Admin Support
**Version**: 1.0 - Initial Release
