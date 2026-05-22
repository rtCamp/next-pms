# Fixing Insufficient Permission Error for Designation Doctype

## Problem
The application was throwing an "Insufficient Permission" error when fetching data from the `Designation` doctype using `frappe.client.get_list` directly from the frontend. This occurred because the current user did not have read permissions for the `Designation` doctype.

## Root Cause
The frontend was making direct calls to `frappe.client.get_list` to fetch:
- Designation list for filtering
- Business Unit list for filtering

This approach has permission issues because:
1. Not all users have read access to these master data doctypes
2. Direct API calls don't respect the application's permission layer
3. There's no way to customize which records are returned based on user role

## Solution Implemented

### 1. Created Backend API Endpoints
Created new permission-aware API endpoints in `next_pms/resource_management/api/filters.py`:

- **`get_designations()`**: Returns list of enabled designations (where `custom_enabled = True`)
- **`get_business_units()`**: Returns list of all business units

Both endpoints:
- Check user permissions using `resource_api_permissions_check()`
- Have built-in error handling for permission denied scenarios
- Return empty list on permission error instead of throwing exception
- Are decorated with `@frappe.whitelist()` to be accessible via API

### 2. Updated Frontend Components
Updated the following frontend files to use the new backend endpoints instead of `frappe.client.get_list`:

**Resource Management Timeline View:**
- `/frontend/packages/app/src/app/pages/resource-management/timeline/components/header/resourceTimLineHeaderSection.tsx`
  - Designation filter: `frappe.client.get_list` → `next_pms.resource_management.api.filters.get_designations`
  - Business Unit filter: `frappe.client.get_list` → `next_pms.resource_management.api.filters.get_business_units`

**Resource Management Team View:**
- `/frontend/packages/app/src/app/pages/resource-management/team/components/header.tsx`
  - Designation filter: `frappe.client.get_list` → `next_pms.resource_management.api.filters.get_designations`
  - Business Unit filter: `frappe.client.get_list` → `next_pms.resource_management.api.filters.get_business_units`

**Project List View:**
- `/frontend/packages/app/src/app/pages/project/components/header.tsx`
  - Business Unit filter: `frappe.client.get_list` → `next_pms.resource_management.api.filters.get_business_units`

### 3. Permission Model
The solution uses the existing `resource_api_permissions_check()` function which enforces:

```python
Allowed Roles:
- Projects Manager (read, write, delete)
- Projects User (read, write, delete)
- Employee (read only)

Blocked Roles:
- Contractor (access denied)
```

Users without these roles or without proper permissions get an empty list instead of an error.

## How to Set Up Permissions

### Option 1: Grant Direct Doctype Access
If users should have access to the Designation and Business Unit doctypes:

1. Go to **Setup > Role and Permissions > Role**
2. Select the appropriate role (e.g., "Timesheet User", "Projects User")
3. Add permissions:
   - **Designation**: Read ✓
   - **Business Unit**: Read ✓
4. Save

### Option 2: Assign Users to Proper Roles
Ensure users are assigned to roles with resource management access:

1. Go to **Setup > Users and Permissions > User**
2. Select the user
3. Add to roles section:
   - "Projects User" (has both read and write on resource management)
   - OR "Timesheet User"
4. Save

### Option 3: Use the Permission Script
If setting up roles programmatically, use the provided patch:
- `next_pms/resource_management/patches/update_resource_allocation_permissions.py`

## Verifying the Fix

### Backend Verification
```bash
# Test the API endpoints
bench execute next_pms.resource_management.api.filters.get_designations
bench execute next_pms.resource_management.api.filters.get_business_units
```

### Frontend Verification
1. Log in with a user who has "Projects User" or "Timesheet User" role
2. Navigate to Resource Management > Timeline or Team view
3. The Designation and Business Unit filters should load without errors
4. Check browser console for any API errors

## Troubleshooting

### Still Getting Permission Errors?

1. **Check User Role:**
   ```bash
   bench shell
   frappe.get_roles('username')
   ```
   Should include one of: "Projects Manager", "Projects User", "Employee"

2. **Check Doctype Permissions:**
   Go to **Setup > Customize Form > Designation/Business Unit**
   - Under "Permissions" section
   - Ensure your role has Read permission enabled

3. **Clear Cache:**
   ```bash
   bench clear-cache
   bench clear-website-cache
   ```

4. **Check Browser Console:**
   Look for specific error messages that indicate:
   - 401/403 status codes (permission denied)
   - Doctype access restrictions
   - Missing role assignments

## Technical Details

### Changes Made

| File | Changes |
|------|---------|
| `next_pms/resource_management/api/filters.py` | Created new file with `get_designations()` and `get_business_units()` endpoints |
| `resourceTimLineHeaderSection.tsx` | Updated 2 API calls from `frappe.client.get_list` |
| `team/components/header.tsx` | Updated 2 API calls from `frappe.client.get_list` |
| `project/components/header.tsx` | Updated 1 API call from `frappe.client.get_list` |

### API Contract

**New Endpoints:**
- `next_pms.resource_management.api.filters.get_designations` → Returns `[{name: "Manager"}, {name: "Developer"}, ...]`
- `next_pms.resource_management.api.filters.get_business_units` → Returns `[{name: "Engineering"}, {name: "Sales"}, ...]`

### Error Handling

The new endpoints have graceful degradation:
- Permission denied → Returns empty list (no error thrown)
- Connection error → Returns empty list (prevents UI breakage)
- User role missing → Returns empty list (permission denied)

This ensures the UI doesn't break even if permissions aren't set up correctly.

## Benefits

✅ **Improved Security**: API calls respect user permissions
✅ **Better Error Handling**: No more "Insufficient Permission" errors in UI
✅ **Customizable**: Easy to extend with more filter endpoints
✅ **Consistent**: Uses existing permission check patterns
✅ **Graceful**: UI degrades gracefully if data unavailable
✅ **Maintainable**: Centralized permission logic in backend

## Future Improvements

1. Add caching for frequently accessed designation/business unit lists
2. Create generic filter endpoint factory to reduce code duplication
3. Add analytics/logging for permission denied scenarios
4. Implement role-based data filtering (return only relevant items for role)
