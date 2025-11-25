# Factory Settings Documentation

This document describes the default factory settings that the system resets to when the admin clicks the "Reset to Factory" button.

## Overview

The factory reset functionality restores the system to a clean, predictable state for development and testing purposes. It preserves essential test users and recreates the standard test templates.

## What Gets Reset

### Deleted Data
- **All user websites** and their pages/sections
- **All user-created content**
- **All non-test users** (except the 5 test accounts listed below)
- **All database instances** (feature databases)

### Preserved Data
- **5 Test User Accounts** (with credentials intact)
- **System configuration** and settings

### Recreated Data
- **4 Test Templates** with full content (navbar, hero, features/services sections)

## Test Users (Always Recreated with Sequential IDs 1-5)

These 5 user accounts are recreated with sequential IDs during factory reset:

1. **ID 1: admin@pagevoo.com** - Admin account (password: `password`)
2. **ID 2: trial@test.com** - Trial tier test account (password: `password`)
3. **ID 3: brochure@test.com** - Brochure tier test account (password: `password`)
4. **ID 4: niche@test.com** - Niche tier test account (password: `password`)
5. **ID 5: pro@test.com** - Pro tier test account (password: `password`)

**Note:** All users are deleted and recreated to ensure sequential IDs. Next new user will have ID 6.

## Test Templates (Always Recreated)

### Template 1: Trial Template
- **ID**: 1
- **Tier**: trial
- **Color Theme**: Blue (#4f46e5)
- **Exclusive To**: None (available to all)
- **Uses Trial Features Only**: Yes
- **Sections**:
  - Navigation Bar (TrialBrand)
  - Hero Section (Welcome message)
  - Features Grid (3 columns: Fast Setup, Easy Customization, Mobile Friendly)

### Template 2: Brochure Template
- **ID**: 2
- **Tier**: brochure
- **Color Theme**: Green (#059669)
- **Exclusive To**: brochure
- **Uses Trial Features Only**: No
- **Sections**:
  - Navigation Bar (BrochureBrand)
  - Hero Section (2 columns with gradient)
  - Services Grid (2x2 grid: Consulting, Strategy, Digital Services, Growth Support)

### Template 3: Niche Template
- **ID**: 3
- **Tier**: niche
- **Color Theme**: Orange (#ea580c)
- **Exclusive To**: niche
- **Uses Trial Features Only**: No
- **Sections**:
  - Navigation Bar (NicheBrand)
  - Hero Section (Specialized solutions)
  - Features Grid (3x2 grid: Targeted Solutions, Automation, Analytics, Customization, Performance, Security)

### Template 4: Pro Template
- **ID**: 4
- **Tier**: pro
- **Color Theme**: Purple (#7c3aed)
- **Exclusive To**: pro
- **Uses Trial Features Only**: No
- **Sections**:
  - Navigation Bar (ProBrand)
  - Hero Section (2 columns with gradient)
  - Features Grid (3x2 grid: Enterprise Solutions, Advanced Security, Analytics Dashboard, Lightning Fast, Global CDN, Custom Solutions)

## Auto-Increment Counters

After factory reset, all auto-increment counters are reset to ensure predictable IDs:

- **users**: Next ID will be 6 (IDs 1-5 used by test users)
- **templates**: Next ID will be 5 (IDs 1-4 used by test templates)
- **template_pages**: Next ID will be 5
- **template_sections**: Next ID will be 13
- **user_websites**: Next ID will be 1
- **user_pages**: Next ID will be 1
- **user_sections**: Next ID will be 1

## Implementation Details

### Backend Service
- **File**: `app/Services/FactoryResetService.php`
- **Method**: `resetToFactory()`

### API Endpoint
- **Route**: `POST /api/v1/users/reset-factory`
- **Controller**: `UserController@resetToFactory`
- **Auth**: Admin only

### Process Flow

1. Disable foreign key checks
2. Truncate all template and website tables
3. Truncate ALL users table (including test users)
4. Truncate database instances
5. Reset all auto-increment counters to 1 (including users table)
6. Re-enable foreign key checks
7. Recreate 5 test users with IDs 1-5
8. Create 4 test templates with full content (using admin user ID 1)
9. Return success response

### Template Creation

Each template includes:
- Full metadata (name, tier, exclusivity, description)
- One homepage with proper slug ('index')
- Complete navbar with brand name and navigation links
- Hero section with headline, description, and CTA button
- Features/services grid with icons and descriptions
- Proper CSS styling (section CSS and column CSS)
- Unique section IDs using `uniqid()`

## Usage

### Via Admin Panel
Click the "Reset to Factory" button in the admin panel to trigger the reset.

### Via API
```bash
POST http://localhost:8000/api/v1/users/reset-factory
Authorization: Bearer {admin_token}
```

### Via PHP Script
```php
$factoryResetService = new \App\Services\FactoryResetService();
$result = $factoryResetService->resetToFactory();
```

## Expected Response

```json
{
  "success": true,
  "message": "Factory reset completed",
  "data": {
    "success": true,
    "message": "System reset to factory defaults successfully",
    "templates_created": 4,
    "users_kept": 5
  }
}
```

## Verification

After factory reset, verify:

1. **5 test users exist with sequential IDs 1-5**
   - ID 1: admin@pagevoo.com
   - ID 2: trial@test.com
   - ID 3: brochure@test.com
   - ID 4: niche@test.com
   - ID 5: pro@test.com
2. **4 templates exist** with IDs 1-4
3. **4 template pages exist** (one per template)
4. **12 template sections exist** (3 per template: navbar, hero, features/services)
5. **No websites exist** (user_websites table is empty)
6. **No database instances exist**
7. **Auto-increment counters** are properly reset
8. **All test users can log in** with password: `password`

## Notes

- Factory reset is **irreversible** - all user data is permanently deleted
- Foreign key checks are temporarily disabled to allow truncation
- The process is **transactional** at the database level
- If any error occurs, foreign key checks are re-enabled
- All test templates use the `admin@pagevoo.com` user as creator
- Template sections use `uniqid()` for unique section IDs

## Maintenance

When updating factory settings:

1. Edit `app/Services/FactoryResetService.php`
2. Update the template creation methods
3. Update this documentation to reflect changes
4. Test the reset functionality thoroughly
5. Commit changes with clear description

## Last Updated

Date: November 25, 2025
Version: 1.0
