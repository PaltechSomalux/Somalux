# Filename Format Guide - Critical for Automatic Extraction

## The Format

```
CODE_Name_2023_1_Main.pdf
```

## Parts Breakdown

| Part | Example | Description | Required? |
|------|---------|-------------|-----------|
| CODE | BIO101 | Unit/Course Code (2-6 letters + 2-4 digits) | **YES** |
| Name | Biology | Unit/Course Name (descriptive) | **YES** |
| Year | 2023 | Exam Year (4 digits) | **YES** |
| Semester | 1 | 1, 2, or 3 | **YES** |
| Type | Main | Main, Supplementary, CAT, Mock, etc. | **YES** |

## What Each Part Extracts

### Part 1: Unit Code
```
BIO101_... → unit_code = "BIO101"
```
- Use any alphanumeric combination
- Keep it short (4-6 characters typical)
- Examples: BIO101, CHM201, MENT130, ENG102

### Part 2: Unit Name
```
_Biology_2023_... → unit_name = "Biology"
```
- Descriptive name of the unit
- Can have multiple words
- Examples: Biology, Chemistry, Mental Health, English Literature

### Part 3: Year
```
_2023_1_... → year = 2023
```
- 4-digit year
- Examples: 2020, 2021, 2022, 2023, 2024

### Part 4: Semester
```
_1_Main.pdf → semester = "1"
```
- Single digit: 1, 2, or 3
- Examples: 1 (first), 2 (second), 3 (third)

### Part 5: Exam Type
```
_Main.pdf → exam_type = "Main"
```
- Common types:
  - Main (standard exam)
  - Supplementary (makeup exam)
  - CAT (continuous assessment test)
  - Mock (practice exam)
  - Midterm (midterm exam)

## Perfect Examples

### Biology Exams
```
✅ BIO101_BiologyI_2023_1_Main.pdf
   └─ Code: BIO101
   └─ Name: BiologyI
   └─ Year: 2023
   └─ Semester: 1
   └─ Type: Main

✅ BIO102_BiologyII_2023_1_Supplementary.pdf
✅ BIO201_BiologyIII_2023_2_CAT.pdf
✅ BIO301_BiologyIV_2023_2_Mock.pdf
```

### Chemistry Exams
```
✅ CHM101_ChemistryI_2023_1_Main.pdf
✅ CHM201_ChemistryII_2023_2_Supplementary.pdf
✅ CHM301_OrganicChemistry_2023_1_CAT.pdf
```

### Other Sciences
```
✅ PHY101_PhysicsI_2023_1_Main.pdf
✅ MENT130_MentalHealth_2023_1_Main.pdf
✅ PHARM101_Pharmacology_2023_2_CAT.pdf
✅ ENG102_EnglishLiterature_2024_1_Mock.pdf
```

## Multi-Word Names

If unit name has multiple words, you can:

### Option A: Use Camel Case (No Spaces)
```
✅ BIO101_BiologyI_2023_1_Main.pdf
✅ MENT130_MentalHealth_2023_1_Main.pdf
✅ ENG102_EnglishLiterature_2023_1_Main.pdf
```

### Option B: Use Hyphens
```
✅ BIO101_Biology-I_2023_1_Main.pdf
✅ MENT130_Mental-Health_2023_1_Main.pdf
✅ ENG102_English-Literature_2023_1_Main.pdf
```

### Option C: Use First Word Only
```
✅ BIO101_Biology_2023_1_Main.pdf
✅ MENT130_Mental_2023_1_Main.pdf
✅ ENG102_English_2023_1_Main.pdf
```

## What NOT to Do

### ❌ Missing Parts
```
exam.pdf (No code, no year, nothing!)
2023_exam.pdf (Missing code)
BIO101.pdf (Missing year, semester, type)
BIO101_Biology.pdf (Missing year)
```

### ❌ Wrong Order
```
2023_BIO101_Biology_1_Main.pdf (Year first - wrong!)
Main_BIO101_Biology_2023_1.pdf (Type first - wrong!)
```

### ❌ Wrong Separators
```
BIO101 Biology 2023 1 Main.pdf (Spaces instead of underscores)
BIO101-Biology-2023-1-Main.pdf (Hyphens instead of underscores)
BIO101.Biology.2023.1.Main.pdf (Dots instead of underscores)
```

### ❌ Multiple Underscores
```
BIO101__Biology__2023__1__Main.pdf (Too many underscores)
```

## Code Format Rules

### Good Code Examples:
```
BIO101       (3 letters + 3 digits)
CHM201       (3 letters + 3 digits)
MENT130      (4 letters + 3 digits)
CS301        (2 letters + 3 digits)
ENG102       (3 letters + 3 digits)
```

### Also Good:
```
BIO1010      (3 letters + 4 digits)
CHM2010      (3 letters + 4 digits)
CHEM101      (4 letters + 3 digits)
```

### Avoid:
```
BIO (too short, no numbers)
101 (just numbers, no letters)
BIO-101 (hyphen breaks extraction)
BIO 101 (space breaks extraction)
```

## Year Format

### Correct:
```
2020, 2021, 2022, 2023, 2024, 2025
```

### Incorrect:
```
23 (only 2 digits)
20-23 (range/hyphen)
2023-2024 (range)
```

## Semester Values

### Valid:
```
1 = First Semester
2 = Second Semester
3 = Third Semester
```

### Invalid:
```
0 (no zero semester)
4 (no fourth semester)
I (use digit, not Roman numeral)
First (use digit, not word)
```

## Exam Type Variations

System recognizes these variations:

### Exact Matches (Best):
```
Main
Supplementary
CAT
Mock
Midterm
```

### Also Recognized:
```
MAIN (uppercase)
main (lowercase)
Supplemental (alternative spelling)
Continuous Assessment (full name)
```

## Batch Rename Examples

### Windows PowerShell Rename:
```powershell
# Rename files to format: CODE_Name_YEAR_SEMESTER_TYPE.pdf
Rename-Item "exam.pdf" "BIO101_Biology_2023_1_Main.pdf"
Rename-Item "chem exam.pdf" "CHM201_Chemistry_2023_1_Supplementary.pdf"
```

### Using Batch Rename Tool:
Most file managers have rename features. Pattern:
```
{original} → CODE_Name_2023_SEMESTER_TYPE.pdf
```

## Testing Your Filename

**Before uploading, check:**

1. Does it have exactly 5 parts separated by underscores?
2. Part 1: Letters + numbers (unit code)?
3. Part 2: Descriptive name?
4. Part 3: 4-digit year?
5. Part 4: Single digit (1, 2, or 3)?
6. Part 5: Exam type (Main, Supplementary, CAT, Mock)?

✅ If yes to all: Your filename is correct!

## What Gets Extracted

From filename `BIO101_Biology_2023_1_Main.pdf`:

```
unit_code = "BIO101"
unit_name = "Biology"
year = 2023 (number)
semester = "1" (string)
exam_type = "Main"
```

This is sent to backend for each file uploaded.

## If Filename Doesn't Match Format

- System still uploads (doesn't fail)
- Code/year/semester fields might be missing or wrong
- University/Faculty extracted from PDF if available
- Better to fix filename to ensure correct data

## Quick Checklist

For each file:
- [ ] Filename ends in `.pdf`
- [ ] Has 5 parts separated by underscores
- [ ] Part 1: Unit code (letters + numbers)
- [ ] Part 2: Unit name (descriptive)
- [ ] Part 3: 4-digit year
- [ ] Part 4: Semester (1, 2, or 3)
- [ ] Part 5: Exam type
- [ ] Example: `BIO101_Biology_2023_1_Main.pdf`

---

**Remember:** Proper filename format is crucial for automatic extraction to work perfectly!
