# Past Papers Search Feature

## Overview
The Past Papers Management dashboard includes a powerful search feature that allows you to find papers by Unit Code, Unit Name, or Title.

## How to Search

### Search Input
Located in the **Search** field at the top of the Past Papers Management table.

**Placeholder:** `e.g., MENT 130 or Introduction to...`

### Search Examples

#### Example 1: Search by Unit Code
- **Search:** `MENT 130`
- **Results:** All papers with unit code containing "MENT 130"

#### Example 2: Search by Unit Name
- **Search:** `Introduction to Programming`
- **Results:** All papers with unit name containing "Introduction to Programming"

#### Example 3: Partial Search
- **Search:** `MENT`
- **Results:** All papers with unit code or name containing "MENT"

#### Example 4: Search by Course Title
- **Search:** `Programming`
- **Results:** All papers with "Programming" in the title

## Search Behavior

### What Gets Searched
The search function queries THREE fields:
1. **Unit Code** - e.g., "CS101", "MENT 130", "BIO 201"
2. **Unit Name** - e.g., "Introduction to Programming", "Advanced Biology"
3. **Title** - e.g., "CS101 - Introduction to Programming"

### Case Insensitive
All searches are **case-insensitive**, so:
- `ment 130` = `MENT 130` = `Ment 130`

### Partial Matching
Searches use partial matching, so:
- Searching `MENT` finds `MENT 130`, `MENT 101`, `MENT 250`
- Searching `Intro` finds `Introduction to Programming`, `Intro to Physics`

### Real-Time Results
Results update **instantly** as you type in the search field.

## Combined Filters

You can combine search with the **Faculty** filter:

1. **Search:** `MENT 130`
2. **Faculty:** `Engineering`
3. **Result:** Only Engineering papers with "MENT 130" in code/name

## Search Tips

- Use **specific codes** for exact matches: `MENT 130`
- Use **keywords** for broader searches: `Programming`
- **Partial searches work** great: `MENT` finds all MENT courses
- Combine with **Faculty filter** to narrow further
- Results show up **instantly** as you type

## Sorting Search Results

After searching, you can sort results by:
- **Unit Code** (A-Z or Z-A)
- **Year** (ascending/descending)
- **Views** (most to least)
- **Downloads** (most to least)
- **Uploaded** (newest to oldest)

---

**Status:** ✅ Search feature fully implemented and working with both Unit Name and Unit Code
