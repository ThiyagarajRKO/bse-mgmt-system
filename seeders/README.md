# Database Seeders

Seeders populate initial and test data into the database. They run **after migrations** to ensure all tables exist.

## Directory Structure

```
seeders/
├── README.md (this file)
├── utils/
│   └── seeder-helpers.js          # Common utilities for all seeders
│
├── 01-auth/                       # Authentication & User Management
│   ├── 20221215100636-users.js
│   ├── 20221215100637-role_master.js
│   └── 20221215100638-user_profiles.js
│
├── 02-organization/               # Company & Organization Setup
│   └── 20251121105159-company_master.js
│
├── 03-masters/                    # Master Data (Grades, Sizes, Units)
│   ├── 20251127100002-grade-and-size-master.js
│   ├── 20251201120002-create-grade-size-mapping.js
│   └── 20240330122203-module_master.js
│
├── 04-products/                   # Product Categories & Products
│   ├── 20251127100003-product-category-and-product-master.js
│   ├── 20251201-add-comprehensive-product-categories.js
│   ├── 20251201-add-comprehensive-seafood-species.js
│   ├── 20251201120003-product-category-grade-mapping-seeder.js
│   └── 20251204-populate-product-categories.js
│
├── 05-accounting/                 # Accounting & Financial Setup
│   ├── 20251125000001-sample-accounting-data.js
│   ├── 20251125165148-add-seafood-gst-records.js
│   └── 20251201000000-accounting-tax-gst-master.js
│
└── DEPRECATED/                    # Old/Redundant Seeders (DELETED)
    ✅ 20251201-consolidated-size-master.js (REMOVED - logic moved to 20251127100002 & 20251201120002)
```

## Execution Order

Seeders must run in dependency order:

### 1️⃣ Phase 1: Authentication & Users (REQUIRED FIRST)

```bash
npx sequelize-cli db:seed --seed 20221215100636-users
npx sequelize-cli db:seed --seed 20221215100637-role_master
npx sequelize-cli db:seed --seed 20221215100638-user_profiles
```

**Why First:** Other seeders depend on valid `user_profiles.id` for `created_by` fields.

### 2️⃣ Phase 2: Organization Setup

```bash
npx sequelize-cli db:seed --seed 20251121105159-company_master
```

### 3️⃣ Phase 3: Master Data (Grades, Sizes, Modules)

```bash
npx sequelize-cli db:seed --seed 20251127100002-grade-and-size-master
npx sequelize-cli db:seed --seed 20251201120002-create-grade-size-mapping
npx sequelize-cli db:seed --seed 20240330122203-module_master
```

**Note:** Phase 3b (grade-size mappings) depends on Phase 3a (grades & sizes) being seeded first.

### 4️⃣ Phase 4: Product Categories & Species

```bash
npx sequelize-cli db:seed --seed 20251201-add-comprehensive-seafood-species
npx sequelize-cli db:seed --seed 20251201-add-comprehensive-product-categories
```

### 5️⃣ Phase 5: Products & Mappings

```bash
npx sequelize-cli db:seed --seed 20251127100003-product-category-and-product-master
npx sequelize-cli db:seed --seed 20251201120003-product-category-grade-mapping-seeder
npx sequelize-cli db:seed --seed 20251204-populate-product-categories
```

### 6️⃣ Phase 6: Accounting & Financial Setup

```bash
npx sequelize-cli db:seed --seed 20251125000001-sample-accounting-data
npx sequelize-cli db:seed --seed 20251125165148-add-seafood-gst-records
npx sequelize-cli db:seed --seed 20251201000000-accounting-tax-gst-master
```

## Quick Start

### Run All Seeders (Recommended Order)

```bash
# Run all seeders in sequence (follows execution order above)
npx sequelize-cli db:seed:all
```

### Run Specific Phase

```bash
# Run only user/auth seeders
npx sequelize-cli db:seed --seed 20221215100636-users
npx sequelize-cli db:seed --seed 20221215100637-role_master
npx sequelize-cli db:seed --seed 20221215100638-user_profiles
```

### Run Single Seeder

```bash
# Run specific seeder
npx sequelize-cli db:seed --seed 20251127100002-grade-and-size-master
```

### Undo Seeders (Rollback)

```bash
# Undo all seeders
npx sequelize-cli db:seed:undo:all

# Undo specific seeder
npx sequelize-cli db:seed:undo --seed 20251127100002-grade-and-size-master

# Undo last 3 seeders
npx sequelize-cli db:seed:undo
npx sequelize-cli db:seed:undo
npx sequelize-cli db:seed:undo
```

## Seeder Details

### Authentication Seeders (Required)

- **20221215100636-users.js** - Creates default user in `auth.users`
- **20221215100637-role_master.js** - Creates default roles
- **20221215100638-user_profiles.js** - Creates user profile records

### Organization Seeders

- **20251121105159-company_master.js** - Creates company records

### Master Data Seeders

- **20251127100002-grade-and-size-master.js** - Creates grades (A, B, C, Premium, etc.) and sizes
- **20240330122203-module_master.js** - Creates application modules

### Product Seeders

- **20251201-add-comprehensive-seafood-species.js** - Creates seafood species (Fish, Shrimp, Crab, etc.)
- **20251201-add-comprehensive-product-categories.js** - Creates product categories (Whole, Fillets, etc.)
- **20251127100003-product-category-and-product-master.js** - Creates individual products
- **20251201120003-product-category-grade-mapping-seeder.js** - Maps categories to grades
- **20251204-populate-product-categories.js** - Auto-populates categories for species without any

### Accounting Seeders

- **20251125000001-sample-accounting-data.js** - Sample accounting data
- **20251125165148-add-seafood-gst-records.js** - GST records for seafood
- **20251201000000-accounting-tax-gst-master.js** - Tax and GST master data

## Helper Functions

All seeders have access to common utilities from `seeders/utils/seeder-helpers.js`:

```javascript
const {
  getOrCreateUser, // Get or create admin user
  logSection, // Log formatted section header
  logSuccess, // Log success message
  logWarning, // Log warning
  logError, // Log error
  logInfo, // Log info
  countExisting, // Count existing records
  safeBulkInsert, // Insert with duplicate checking
  safeBulkDelete, // Delete with protection
  logCompletion, // Log completion summary
  uuidv4, // UUID generator
} = require("./utils/seeder-helpers");
```

## Best Practices

✅ **DO:**

- Always require a `user_profiles` user before inserting data
- Use `getOrCreateUser()` helper for user lookup
- Use `logSection()` and `logSuccess()` for consistent logging
- Use `ON CONFLICT DO NOTHING` or `ignoreDuplicates: true` for safety
- Include comprehensive JSDoc comments
- Add meaningful timestamps with `new Date()`
- Document seeder purpose and dependencies in header comment

❌ **DON'T:**

- Don't hardcode user IDs without fallback
- Don't skip error handling
- Don't create seeders without `down()` method
- Don't assume table existence (migrations run first)
- Don't insert duplicate data without checking
- Don't forget to handle null/undefined values

## Adding New Seeders

1. **Create file** in appropriate phase directory:

   ```bash
   touch seeders/04-products/20251205-new-seeder.js
   ```

2. **Use template:**

   ```javascript
   "use strict";

   const {
     getOrCreateUser,
     logSection,
     logSuccess,
     logCompletion,
   } = require("../utils/seeder-helpers");

   module.exports = {
     up: async (queryInterface, Sequelize) => {
       logSection("New Seeder", "🌱");

       try {
         const userId = await getOrCreateUser(queryInterface);

         // Insert data here

         logCompletion("New Seeder", { "Records created": 10 });
       } catch (error) {
         logError("Error in seeder");
         throw error;
       }
     },

     down: async (queryInterface, Sequelize) => {
       // Rollback logic
     },
   };
   ```

3. **Update execution order** in this README
4. **Add to version control** with other seeders

## Troubleshooting

### Error: "User profile not found"

**Solution:** Run user seeders first (Phase 1)

### Error: "Duplicate key value"

**Solution:** Seeders use `ignoreDuplicates: true` by default. Safe to re-run.

### Error: "Table does not exist"

**Solution:** Run migrations first: `npx sequelize-cli db:migrate`

### Want to reset everything?

```bash
# Option 1: Rollback and restart
npx sequelize-cli db:migrate:undo:all
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

# Option 2: Undo only seeders (keep schema)
npx sequelize-cli db:seed:undo:all
npx sequelize-cli db:seed:all
```

## Dependencies

### Required Before Seeders

- ✅ All migrations must complete successfully
- ✅ `user_profiles` table must exist
- ✅ `auth.users` table must exist

### Seeder Dependencies

1. Users → Roles → Profiles → Everything else
2. Grades → Products (grades are referenced by products)
3. Species → Categories → Products
4. Companies → All company-specific data

## Performance Notes

- Seeders run sequentially (one after another)
- Use `bulkInsert` for multiple records (faster than individual inserts)
- `ignoreDuplicates: true` prevents errors on re-runs
- Most seeders complete in <1 second

## Contributing

When adding new seeders:

1. Follow naming convention: `YYYYMMDD-hhmm-description.js`
2. Include JSDoc header comment
3. Use helper functions from `seeder-helpers.js`
4. Add to appropriate phase directory
5. Update this README with execution order
6. Test with fresh database: `npm run db:reset` (if available)

---

**Last Updated:** December 4, 2025
**Total Seeders:** 15
**Phases:** 6
