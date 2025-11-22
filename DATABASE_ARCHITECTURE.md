# PAGEVOO - DATABASE ARCHITECTURE
**Created:** November 22, 2025
**Critical:** This is a FUNDAMENTAL architectural requirement

---

## OVERVIEW

Pagevoo uses a **dual-database architecture**:

1. **Main Database** (`pagevoo_core`)
   - Stores Pagevoo platform data
   - User accounts (Pagevoo customers)
   - Templates (Template Builder)
   - Websites metadata
   - Subscriptions, tiers, permissions

2. **Per-User Databases** (`pagevoo_website_{user_id}`)
   - ONE database per user
   - Stores ALL script feature data for that user's published website
   - Products, blog posts, form submissions, user accounts (website members), etc.

---

## CRITICAL RULES

### Rule #1: One Database Per User
✅ Each user can have **exactly ONE active database**
❌ Users CANNOT have multiple databases simultaneously

### Rule #2: Database Required for Script Features
✅ ALL script features require a database to function
❌ Script features CANNOT work without a database

### Rule #3: Website Locking
✅ Once a website has a database, ONLY that website can be edited
❌ User CANNOT create new templates while database is active
❌ User CANNOT save other websites while database is active

### Rule #4: Database Creation
Database is created when:
- User publishes a website (automatic), OR
- User manually creates database (for testing features before publish)

### Rule #5: Database Deletion
To create new templates or switch websites:
- User MUST delete the current database
- User MUST unpublish the current website
- ⚠️ Deletes ALL script feature data permanently

---

## USER WORKFLOWS

### Workflow A: Standard Website Creation

1. User creates website from template (no database yet)
2. User adds HTML/CSS sections
3. User clicks "Publish"
4. System creates database automatically
5. User can now add script features (Shop, Blog, etc.)
6. User is now locked to this website

### Workflow B: Testing Features Before Publishing

1. User creates website from template
2. User clicks "Create Database" (manual)
3. Database created (website still unpublished)
4. User can test script features locally
5. When ready, user clicks "Publish"
6. Website goes live with features already configured

### Workflow C: Switching to New Website

1. User has active database for "Website A"
2. User wants to create new template or work on "Website B"
3. System blocks: "You have active database"
4. User must:
   - Export database backup (optional)
   - Delete database (confirms deletion)
   - Unpublish "Website A"
5. Now user can create new templates or work on other websites

---

## DATABASE STRUCTURE

### Main Database (pagevoo_core)

**Existing Tables:**
- `users` - Pagevoo customer accounts
- `templates` - Template Builder templates
- `template_pages`, `template_sections`
- `user_websites` - Website Builder websites
- `user_pages`, `user_sections`
- `tier_permissions`, `settings`, etc.

**New Table:**
```sql
user_databases
  - id (PK)
  - user_id (FK to users, UNIQUE when status='active')
  - website_id (FK to user_websites)
  - database_name (e.g., pagevoo_website_42)
  - status (enum: 'active', 'deleted')
  - created_at
  - deleted_at (nullable)

-- Constraint: Only one active database per user
-- Unique index on (user_id, status) WHERE status='active'
```

### Per-User Database (pagevoo_website_{user_id})

**Script Feature Tables:**
```sql
-- Contact Form
contact_forms
form_submissions
support_tickets

-- Shop
shop_products
shop_categories
shop_orders
shop_order_items
shop_carts

-- Blog
blog_posts
blog_categories
blog_tags
blog_comments

-- User Access (website members, NOT Pagevoo customers)
website_users
website_roles
website_permissions

-- Events
events
event_categories
event_rsvps

-- Booking System
booking_services
booking_availability
bookings

-- File Hoster
hosted_files
file_downloads

-- Video Sharing
videos
video_playlists

-- Social Platform
social_posts
social_comments
social_likes
social_follows
notifications

-- Feature Management
installed_features (tracks which features are active)
```

---

## TECHNICAL IMPLEMENTATION

### Database Creation

```php
namespace App\Services;

class UserDatabaseService
{
    public function createDatabase(int $userId, int $websiteId): string
    {
        // Check if user already has active database
        $existing = UserDatabase::where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if ($existing) {
            throw new Exception('User already has an active database');
        }

        // Create database name
        $databaseName = "pagevoo_website_{$userId}";

        // Create database
        DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}`
            CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Record in main database
        UserDatabase::create([
            'user_id' => $userId,
            'website_id' => $websiteId,
            'database_name' => $databaseName,
            'status' => 'active'
        ]);

        // Configure connection
        $this->configureDatabaseConnection($userId, $databaseName);

        // Run base migrations (only core tables, not feature-specific)
        $this->runBaseMigrations($databaseName);

        return $databaseName;
    }

    private function configureDatabaseConnection(int $userId, string $databaseName)
    {
        config(["database.connections.website_{$userId}" => [
            'driver' => 'mysql',
            'host' => env('DB_HOST'),
            'database' => $databaseName,
            'username' => env('DB_USERNAME'),
            'password' => env('DB_PASSWORD'),
            'charset' => 'utf8mb4',
            'collation' => 'utf8mb4_unicode_ci',
            'prefix' => '',
        ]]);
    }

    private function runBaseMigrations(string $databaseName)
    {
        // Run only essential tables (installed_features, etc.)
        Artisan::call('migrate', [
            '--database' => "website_{$userId}",
            '--path' => 'database/migrations/website_core',
            '--force' => true
        ]);
    }
}
```

### Feature Installation with Database

```php
namespace App\Services\ScriptFeatures;

class FeatureInstaller
{
    public function install(int $websiteId, string $featureType): bool
    {
        $website = UserWebsite::findOrFail($websiteId);
        $userId = $website->user_id;

        // Check if user has database
        $userDb = UserDatabase::where('user_id', $userId)
            ->where('status', 'active')
            ->first();

        if (!$userDb) {
            throw new Exception('Database required. Please publish website or create database first.');
        }

        // Get user's database connection
        $connection = "website_{$userId}";

        // Run feature-specific migrations
        $this->runFeatureMigrations($connection, $featureType);

        // Record feature installation
        DB::connection($connection)->table('installed_features')->insert([
            'feature_type' => $featureType,
            'configuration' => json_encode([]),
            'is_active' => true,
            'installed_at' => now()
        ]);

        return true;
    }

    private function runFeatureMigrations(string $connection, string $featureType)
    {
        $migrationPath = "database/migrations/script_features/{$featureType}";

        Artisan::call('migrate', [
            '--database' => $connection,
            '--path' => $migrationPath,
            '--force' => true
        ]);
    }
}
```

### Database Deletion

```php
public function deleteDatabase(int $userId): bool
{
    $userDb = UserDatabase::where('user_id', $userId)
        ->where('status', 'active')
        ->firstOrFail();

    // Drop the database
    DB::statement("DROP DATABASE IF EXISTS `{$userDb->database_name}`");

    // Mark as deleted (keep record for audit)
    $userDb->update([
        'status' => 'deleted',
        'deleted_at' => now()
    ]);

    // Unpublish associated website
    $website = UserWebsite::find($userDb->website_id);
    if ($website) {
        $website->update(['is_published' => false]);
    }

    return true;
}
```

---

## UI COMPONENTS

### Database Status Indicator

**In Website Builder Header:**
```tsx
<div className="database-status">
  {hasActiveDatabase ? (
    <>
      <div className="status-indicator active">
        <Database className="w-4 h-4" />
        <span>Database Active</span>
      </div>
      <button onClick={() => setShowDatabaseModal(true)}>
        Manage Database
      </button>
    </>
  ) : (
    <button onClick={() => setShowCreateDatabaseModal(true)} className="create-db-btn">
      <Plus className="w-4 h-4" />
      Create Database
    </button>
  )}
</div>
```

### Create Database Modal

```tsx
interface CreateDatabaseModalProps {
  websiteId: number
  onCreated: () => void
}

function CreateDatabaseModal({ websiteId, onCreated }: CreateDatabaseModalProps) {
  return (
    <Modal>
      <h2>Create Website Database</h2>
      <p>This will create a dedicated database for dynamic features.</p>

      <div className="info-box">
        <Info className="w-5 h-5" />
        <div>
          <strong>Important:</strong>
          <ul>
            <li>You can only have one active database at a time</li>
            <li>Once created, you can only work on this website</li>
            <li>Required for Shop, Blog, User Accounts, and other features</li>
          </ul>
        </div>
      </div>

      <div className="actions">
        <label>
          <input type="checkbox" required />
          I understand I'll be locked to this website
        </label>
      </div>

      <div className="buttons">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={handleCreate} className="primary">
          Create Database
        </button>
      </div>
    </Modal>
  )
}
```

### Feature Installation Check

```tsx
async function installFeature(featureType: ScriptFeature) {
  // Check if database exists
  const response = await api.checkDatabase()

  if (!response.hasDatabase) {
    // Show create database prompt
    const choice = await showDatabaseRequiredModal()

    if (choice === 'publish') {
      await publishWebsite() // Creates database automatically
    } else if (choice === 'create_only') {
      await createDatabase() // Creates database without publishing
    } else {
      return // User cancelled
    }
  }

  // Now install the feature
  await api.installFeature(featureType)
}
```

---

## MIGRATION STRUCTURE

```
database/migrations/
  website_core/                    # Run when database is created
    2025_11_22_000001_create_installed_features_table.php
    2025_11_22_000002_create_feature_settings_table.php

  script_features/                 # Run when feature is installed
    contact_form/
      2025_11_22_100001_create_contact_forms_table.php
      2025_11_22_100002_create_form_submissions_table.php

    shop/
      2025_11_22_200001_create_shop_products_table.php
      2025_11_22_200002_create_shop_orders_table.php
      2025_11_22_200003_create_shop_carts_table.php

    user_access/
      2025_11_22_300001_create_website_users_table.php
      2025_11_22_300002_create_roles_permissions_tables.php

    blog/
      2025_11_22_400001_create_blog_posts_table.php
      2025_11_22_400002_create_blog_categories_table.php
      2025_11_22_400003_create_blog_comments_table.php

    ... (one folder per feature)
```

---

## SECURITY CONSIDERATIONS

### Connection Isolation
- Each user's database is completely isolated
- No cross-user data access possible
- Database credentials same as main, but different database name

### Permission Checks
- Always verify user owns the website before database operations
- Check active database matches the website being edited
- Prevent database switching without explicit user action

### Backup & Recovery
- Provide database export before deletion
- SQL dump downloadable by user
- Optional: Automated backups every 24 hours

---

## EDGE CASES

### Case 1: User Deletes Website but Keeps Database
- Not allowed - deleting website must delete database too
- Or: Prompt user to delete database first

### Case 2: User Changes Tier (Downgrade)
- If downgraded tier doesn't support installed features:
  - Warning shown
  - Features disabled but data preserved
  - User must upgrade to re-enable

### Case 3: Database Connection Failure
- Show user-friendly error
- Log to admin panel
- Provide "Test Connection" button

### Case 4: User Exceeds Database Size Limit
- Set max database size per tier (e.g., Trial: 50MB, Pro: 10GB)
- Monitor database size
- Alert user before hitting limit
- Block new data if limit exceeded

---

## TESTING CHECKLIST

- [ ] Create database successfully
- [ ] Install feature with database
- [ ] Block template creation when database active
- [ ] Delete database successfully
- [ ] Database deletion unpublishes website
- [ ] Cannot create second database
- [ ] Feature installation fails without database
- [ ] Migrations run correctly on user database
- [ ] Database isolation (user A cannot access user B's data)
- [ ] Export database backup works
- [ ] Connection switching works correctly

---

## DEPLOYMENT NOTES

### IONOS Server Requirements
- MySQL user must have `CREATE DATABASE` privilege
- Sufficient storage for multiple databases
- Monitor total database count
- Set up automated backups for user databases

### Environment Variables
```env
# Main database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=pagevoo_core
DB_USERNAME=root
DB_PASSWORD=

# User database limits
MAX_USER_DATABASES_PER_SERVER=1000
MAX_DATABASE_SIZE_MB_TRIAL=50
MAX_DATABASE_SIZE_MB_BROCHURE=500
MAX_DATABASE_SIZE_MB_NICHE=2000
MAX_DATABASE_SIZE_MB_PRO=10000
```

---

**This is a CRITICAL architectural decision that affects ALL script features.**
