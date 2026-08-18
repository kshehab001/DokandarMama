# Dokandar Mama

PROJECT: DOKANDAR MAMA

Existing production retail management application — incremental feature update only.

IMPORTANT:

This is an EXISTING WORKING APPLICATION.

DO NOT rebuild the application from scratch.

DO NOT replace the existing architecture unnecessarily.

DO NOT redesign the existing UI.

DO NOT change the existing visual identity, layout, navigation structure, typography, spacing, colors, components, or user experience unless specifically required by the features below.

First inspect the uploaded project completely and understand the existing architecture, database schema, authentication, API structure, routes, components, services, and current functionality.

The current application is already deployed and working on Render.

The goal is to preserve everything that already works and implement the following updates cleanly into the existing system.

==================================================

1. EXISTING TECHNOLOGY STACK

==================================================

The existing project uses a monorepo architecture with:

Frontend:

- React

- TypeScript

- Vite

- Tailwind CSS

- Radix UI components

- React Query

- Wouter

- Recharts

- Framer Motion

- Lucide icons

Backend:

- Node.js

- Express

- TypeScript

- REST API architecture

Database:

- PostgreSQL

- Drizzle ORM

Authentication:

- Clerk

Project management:

- pnpm workspace / monorepo

Deployment:

- Render

Existing functionality includes:

- Dashboard

- Products

- Inventory

- Customers

- Sales

- Billing

- Reports

- Baki / customer ledger

- Barcode scanning

- Voice assistant

- Shop onboarding

- Counter/POS

- Restock suggestions

- Analytics

Preserve this architecture whenever possible.

==================================================

2. CORE PRODUCT CONCEPT

==================================================

Dokandar Mama is a digital shop assistant for Bangladeshi small retailers.

The system should feel like a digital "mama/chotu" helping the shopkeeper manage:

- Inventory

- Billing

- Sales

- Customers

- Baki

- Cash

- Reports

- Product management

- Business insights

- Voice interaction

The interface should remain simple enough for a traditional Bangladeshi shopkeeper.

Bangla-first usability is important.

The existing product philosophy is:

Voice-first

Simple

Culturally familiar

Assistive rather than complicated

Retail-focused

Do not turn the application into a generic ERP.

==================================================

3. SHOP ONBOARDING

==================================================

After Clerk sign-in, a new user should complete shop onboarding.

Required information:

1. Owner/User Name

2. Shop Name

3. Shop Category

Shop categories should include:

- Mudi Shop / মুদি দোকান

- Pharmacy / ফার্মেসি

- Clothing Shop

- Accessories Shop

- Cosmetics Shop

- Super Shop

- General Store

- Electronics Shop

- Stationery Shop

- Hardware Shop

- Restaurant/Food Shop

- Other

The selected shop category should personalize the application.

Examples:

Pharmacy:

- Medicines

- Expiry

- Batch

- Manufacturer

- Medicine-related terminology

Mudi:

- FMCG

- Grocery

- Household products

- Food items

Clothing:

- Size

- Color

- Brand

- Clothing category

Cosmetics:

- Brand

- Shade/type

- Expiry

Electronics:

- Brand

- Model

- Warranty

- Serial number where applicable

Do not create completely separate applications for each category.

Use a shared system with category-specific terminology, starter products and fields where appropriate.

==================================================

4. SHOP-SPECIFIC THEMING

==================================================

Keep the existing Dokandar Mama visual identity.

However, allow subtle personalization based on shop category.

Do not redesign the interface.

Use tasteful accent-color changes and small visual differences only.

Examples:

Mudi:

warm orange / green accents

Pharmacy:

clean blue/teal accents

Clothing:

purple/rose accents

Cosmetics:

pink/magenta accents

Electronics:

blue/indigo accents

Super Shop:

orange/blue professional accents

The Dokandar Mama brand/logo must remain consistent.

==================================================

5. MULTI-TENANT DATABASE

==================================================

This is extremely important.

Different shops MUST have completely separated transactional data.

A shop must never see another shop's:

- Products

- Inventory

- Customers

- Sales

- Baki

- Ledger

- Cashbox

- Reports

Every tenant-scoped table must be associated with the correct shop/organization.

Use Clerk identity for authentication and the application's shop/organization relationship for authorization and data isolation.

The existing project already introduced a shops table and shop_id relationships.

Preserve and strengthen this architecture.

==================================================

6. SUPER SHOP / CHAIN SHOP SUPPORT

==================================================

Support two business structures:

A. Individual Shop

One owner → one shop → one dataset.

B. Organization / Chain

One organization can contain:

Organization

 ├── Store 1

 ├── Store 2

 ├── Store 3

 └── Store N

Each store maintains its own operational data.

But the organization can access aggregated data across all stores.

For example:

Organization Dashboard:

Total Sales

Total Inventory

Top Products

Store Comparison

Area-wise Sales

Customer Statistics

Stock Movement

A chain shop should be able to see:

Store A

Store B

Store C

individually and combined.

Do not merge individual store inventory incorrectly.

Use organization_id + shop_id relationships where appropriate.

==================================================

7. GLOBAL MASTER PRODUCT DATABASE

==================================================

Implement a separate GLOBAL PRODUCT MASTER DATABASE.

This is NOT the same as a shop's inventory.

The architecture should conceptually be:

GLOBAL PRODUCT MASTER

        |

        | barcode

        |

        +------ Shop A Inventory

        |

        +------ Shop B Inventory

        |

        +------ Shop C Inventory

The global master database should contain reusable product information such as:

- Barcode

- Product name

- Category

- Brand

- Manufacturer

- Unit

- Product image

- Generic product information

- Supplier/manufacturer where applicable

Shop-specific information remains private:

- Purchase price

- Selling price

- Current stock

- Expiry

- Location

- Profit

- Sales history

A shop must NOT see another shop's private commercial information.

The global master database should only provide product identity/information.

==================================================

8. BARCODE INVENTORY FLOW

==================================================

Improve the existing barcode scanner.

When a shopkeeper scans a barcode while adding a product:

STEP 1:

Read barcode.

STEP 2:

Search the GLOBAL PRODUCT MASTER DATABASE.

STEP 3:

If barcode exists:

Automatically display:

- Product name

- Category

- Brand

- Unit

- Manufacturer

- Other available product information

The shopkeeper should NOT have to manually enter those fields.

Then ask only for shop-specific information:

- Purchase price / কেনা দাম

- Selling price / বিক্রি দাম

- Can selling price change during sales? Yes/No

- Expiry date

- Quantity

- Shop location/shelf if applicable

STEP 4:

If barcode does NOT exist:

Treat it as a new product.

Ask the shopkeeper to enter:

- Product name

- Category

- Brand

- Unit

- Manufacturer/seller

- Barcode

- Purchase price

- Selling price

- Expiry

- Quantity

After saving, optionally add the product identity to the GLOBAL PRODUCT MASTER DATABASE after appropriate validation.

Never expose private shop-specific pricing or inventory information globally.

==================================================

9. BARCODE SCANNER FIX

==================================================

The current barcode scanner has reliability issues.

Improve it without changing the existing design.

Requirements:

- Prefer rear/main camera

- Correct camera selection

- Fast detection

- Proper camera permission handling

- Camera teardown after closing scanner

- No camera remaining active after navigation

- Duplicate scan protection

- Mobile browser compatibility

- iOS playsInline

- Android compatibility

- HTTPS compatibility

- Manual barcode input fallback

- Clear error states

- Clear permission instructions

- Rectangular scanning area suitable for real product barcodes

Do not unnecessarily replace the current barcode library if the existing implementation can be fixed.

==================================================

10. PURCHASE INVOICE / BILL IMAGE → INVENTORY

==================================================

NEW MAJOR FEATURE.

Allow the shopkeeper to add inventory by uploading a photo of the supplier's purchase invoice/bill.

Flow:

Inventory

→ Add Stock

→ Upload Purchase Bill

Allow:

- Camera capture

- Image upload

- JPG

- PNG

- PDF if supported

The system should perform OCR/document extraction.

Extract:

- Product name

- Barcode if available

- Quantity

- Purchase price

- Unit

- Supplier

- Invoice number

- Invoice date

- Expiry date if present

Then show a REVIEW SCREEN before saving.

Example:

Detected Products:

Product | Barcode | Qty | Purchase Price | Expiry

The shopkeeper must be able to edit incorrect OCR results.

IMPORTANT:

Never automatically modify inventory without user confirmation.

Flow:

Upload

→ OCR

→ Extract

→ Review

→ User confirms

→ Inventory update

If barcode exists in the global product master, match it automatically.

If barcode is unknown, allow creation of a new product.

==================================================

11. OCR SAFETY

==================================================

OCR can make mistakes.

Therefore:

- Highlight uncertain fields.

- Allow manual editing.

- Show confidence where possible.

- Never silently create incorrect stock.

- Require confirmation before final inventory update.

If the invoice is unreadable:

Show:

"Could not confidently read this invoice. Please upload a clearer image or enter the information manually."

==================================================

12. CASH BOX

==================================================

Fix and complete the Cash Box functionality.

Every morning on the shopkeeper's first login:

Show:

"Day starts with"

Opening Cash Balance.

Example:

Opening Balance:

৳ 5,000

Then throughout the day:

Cash sales

Expenses

Cash withdrawals

Cash additions

Other cash movements

At day end:

Show:

Opening Balance

+ Cash Sales

+ Cash Added

- Expenses

- Cash Withdrawals

= Expected Cash

Then ask:

"Actual Cash in Box"

Compare:

Expected Cash

vs

Actual Cash

Show:

Difference / Shortage / Excess

This should be recorded in the Cash Box history.

The Cash Box must be shop-specific.

For organizations, each store has its own cash box.

==================================================

13. BILLING PAYMENT METHOD

==================================================

When receiving payment for a bill:

Two primary options:

1. Cash Payment

2. Digital Payment

For Digital Payment:

Fields:

Payment Method

Amount

Payment methods may include:

- bKash

- Nagad

- Rocket

- Card

- Bank

- Other

The amount should automatically populate from the bill total.

But the user must be able to change it.

Then show:

Bill Total

Paid Amount

Remaining Balance

If paid amount is lower:

Remaining amount becomes Baki.

If paid amount is higher:

Show appropriate change/refund calculation.

==================================================

14. CUSTOMER VERIFICATION

==================================================

Add customer verification capability.

Customer profile should support:

- Name

- Mobile number

- Verification status

- Baki balance

- Purchase history

- Ledger

For Bangladesh phone numbers, validate appropriate Bangladeshi mobile number formats.

Do not unnecessarily block legitimate users.

Customer verification should be configurable according to subscription plan.

==================================================

15. USER ROLES

==================================================

Implement multi-level user access.

Roles:

ADMIN

MANAGER

SHOPKEEPER

Admin:

- Full access

- Shop settings

- Users

- Subscription

- Reports

- Inventory

- Customers

- Sales

- Cashbox

- Organization management

Manager:

- Inventory

- Customers

- Sales

- Reports

- Cashbox

- Limited settings

Shopkeeper:

- Billing

- Counter

- Inventory operations

- Customer operations

- Baki

- Limited reports

Authorization must be enforced server-side.

Do not rely only on frontend hiding buttons.

==================================================

16. VOICE ASSISTANT

==================================================

Upgrade the existing voice assistant.

Current issue:

It mainly detects Bangla.

It must support:

1. Bangla

2. English

3. Banglish

Examples:

Bangla:

"আজকে কত বিক্রি হয়েছে?"

English:

"Show today's sales."

Banglish:

"Aajke amar koto sale hoise?"

The assistant should normalize Banglish and mixed-language commands into structured intents.

Examples:

"ajke sales koto?"

"আজকে sales কত?"

"how much baki ase Rahim er?"

should all be understood where possible.

Voice should support commands related to:

- Sales

- Inventory

- Low stock

- Customer baki

- Customer search

- Product search

- Reports

- Cashbox

- Billing

- Product addition

- Navigation

The system should respond both visually and verbally where supported.

IMPORTANT:

Do not create a fake AI assistant that only displays static responses.

Voice commands should execute real application actions through existing APIs/business logic.

For destructive actions:

Ask for confirmation.

Example:

"Do you want to remove this product?"

==================================================

17. SUBSCRIPTION SYSTEM

==================================================

Add a Subscription page and subscription management UI.

IMPORTANT:

Do NOT enforce SKU/product limits yet.

The numbers below are marketing/package positioning only.

For now, every plan should be technically capable of unlimited data.

Plans:

--------------------------------

BASIC — FREE

--------------------------------

Price:

৳0/month

Features:

- Billing

- Manual inventory setup

- Baki হিসাব

- Single user

- Basic sales tracking

- Low stock alerts

No customer verification.

Display capacity:

300 SKU

20,000 products

IMPORTANT:

These are display/package limits only.

DO NOT technically block users based on these limits yet.

--------------------------------

STANDARD

--------------------------------

Price:

৳399/month

Features:

- Voice Command

- Billing

- Admin + Assistant access

- 2 users

- Full dashboard

- Customer verification

- AI-based product recommendations

- Inventory management

Display capacity:

500 SKU

50,000 products

Again:

DO NOT enforce these limits yet.

Cashbox:

Additional ৳200/month.

Therefore show:

Standard:

৳399/month

Cashbox Add-on:

+৳200/month

--------------------------------

PREMIUM

--------------------------------

Price:

৳699/month

Features:

- Fully functional database

- Download reports

- 5 user access

- Customer verification

- AI analysis

- Full AI voice interaction

- Inventory creation by uploading purchase invoice

- AI-based top-selling inventory insights

- Cashbox

- Inventory management

Display capacity:

1,000 SKU

100,000 products

Do not technically enforce these limits yet.

--------------------------------

ORGANIZATION

--------------------------------

For:

- Super Shops

- Chain Shops

- Multiple Branches

- Large Retail Businesses

Pricing:

Custom

Features:

- Multiple stores

- Organization dashboard

- Store-wise data

- Combined organization analytics

- User management

- Role management

- Central product master

- Store comparison

- Area-wise sales

- Central reporting

- Custom configuration

==================================================

18. SUBSCRIPTION UI

==================================================

Create a polished subscription page consistent with the existing UI.

Show:

Current Plan

Plan Comparison

Upgrade

Downgrade

Add-ons

Billing status

Use clear Bangla/English labels.

Do not implement real payment gateway unless already present.

For now:

- Subscription state can be stored in database.

- Plan selection can be simulated/configured.

- Architecture should be ready for future payment gateway integration.

==================================================

19. DASHBOARD DOWNLOAD

==================================================

Add report/data download functionality.

Users with appropriate permissions should be able to download:

- Sales report

- Inventory report

- Customer report

- Baki report

- Cashbox report

- Product report

Preferred formats:

CSV

Excel

PDF where practical

Respect user/shop/organization permissions.

==================================================

20. AI PRODUCT RECOMMENDATION

==================================================

Use existing sales and inventory data to generate useful recommendations.

Examples:

- Fast-moving products

- Low-stock products

- Products likely to run out

- Slow-moving products

- Deadstock

- Top-selling products

- Suggested restocking

Do not fabricate recommendations when there is insufficient data.

Clearly distinguish:

Actual data

vs

AI-generated recommendation.

==================================================

21. TOP-SELLING INVENTORY

==================================================

Create analytics showing:

Top-selling products

Top categories

Sales quantity

Revenue contribution

Stock remaining

Sales trend

For organizations:

Compare:

Store A

Store B

Store C

and organization-wide totals.

==================================================

22. DATA STRUCTURE

==================================================

Preserve the existing database where possible.

Extend it safely.

Conceptual structure:

User / Clerk Identity

        |

        ↓

Organization

        |

        ├── Shop

        │    ├── Users

        │    ├── Inventory

        │    ├── Customers

        │    ├── Sales

        │    ├── Ledger

        │    ├── Cashbox

        │    └── Reports

        |

        └── Other Shops

Separate global:

GLOBAL PRODUCT MASTER

        |

        ├── Barcode

        ├── Product identity

        ├── Brand

        ├── Category

        └── Manufacturer

Do not duplicate private transactional data into the global master.

Use proper foreign keys and indexes.

==================================================

23. SECURITY

==================================================

Security is critical.

Implement:

- Server-side authorization

- Shop ownership verification

- Organization membership verification

- Role-based access control

- Input validation

- API validation

- No cross-shop data leakage

- Secure file upload validation

- OCR upload restrictions

- Proper error handling

Never trust shop_id sent by the frontend.

Derive/verify the user's authorized shop or organization on the server.

==================================================

24. FILE UPLOAD SECURITY

==================================================

For invoice uploads:

Allow only safe file types.

Validate:

- File type

- File size

- Image dimensions where appropriate

Do not execute uploaded files.

Store uploaded invoice images securely.

Use temporary storage where appropriate.

==================================================

25. UI/UX PRESERVATION

==================================================

THIS IS VERY IMPORTANT.

The current Dokandar Mama design is already approved.

Do not redesign it.

Do not:

- Change the logo

- Change the main navigation

- Replace the existing dashboard design

- Change the overall layout

- Introduce a completely different theme

- Replace existing components unnecessarily

Only add new UI where required.

New pages/features should visually feel like they were always part of Dokandar Mama.

==================================================

26. RESPONSIVE DESIGN

==================================================

The application must remain usable on:

- Desktop

- Laptop

- Tablet

- Android phones

- iPhones

Barcode scanner and invoice camera upload must work especially well on mobile.

==================================================

27. EXISTING FUNCTIONALITY MUST NOT BREAK

==================================================

Before modifying anything, inspect and preserve:

- Dashboard

- Products

- Inventory

- Customers

- Sales

- Reports

- Baki

- Counter

- Authentication

- Shop onboarding

- Existing API

- Existing database

- Existing Render deployment configuration

After implementation:

Run:

- Type checking

- Frontend build

- Backend build

- Database schema validation

- API tests where available

Do not remove existing functionality to make new features easier.

==================================================

28. IMPLEMENTATION PRIORITY

==================================================

Implement in this order:

PHASE 1:

Understand existing architecture.

PHASE 2:

Fix/verify multi-shop data isolation.

PHASE 3:

Complete user roles.

PHASE 4:

Fix shop onboarding and category personalization.

PHASE 5:

Fix barcode scanner.

PHASE 6:

Implement global product master + barcode matching.

PHASE 7:

Implement invoice OCR inventory entry.

PHASE 8:

Fix Cash Box.

PHASE 9:

Improve payment/billing flow.

PHASE 10:

Improve multilingual voice assistant.

PHASE 11:

Implement subscription UI and plan architecture.

PHASE 12:

Implement dashboard downloads.

PHASE 13:

Implement AI recommendations and top-selling analytics.

PHASE 14:

Organization/chain shop functionality.

==================================================

29. DO NOT OVERENGINEER

==================================================

Prefer the existing libraries and architecture.

Do not replace working technologies simply because another technology is newer.

Do not migrate from:

React/Vite

Express

Drizzle

PostgreSQL

Clerk

unless there is a genuine technical blocker.

Use the existing API patterns and database conventions.

==================================================

30. FINAL ACCEPTANCE CRITERIA

==================================================

The updated Dokandar Mama should allow:

1. User signs in.

2. User creates/selects a shop.

3. Shop category determines terminology and subtle theme.

4. Different shops have isolated data.

5. Admin/Manager/Shopkeeper roles work.

6. Counter works.

7. Billing works.

8. Cash/Digital payment works.

9. Baki works.

10. Cashbox works.

11. Barcode scanning works reliably.

12. Existing barcode automatically identifies known products.

13. Unknown barcode creates a new product workflow.

14. Invoice image can be uploaded.

15. OCR extracts purchase information.

16. User reviews OCR results.

17. Confirmed invoice updates inventory.

18. Voice understands Bangla.

19. Voice understands English.

20. Voice understands Banglish/mixed commands where possible.

21. Subscription page exists.

22. Basic/Standard/Premium/Organization plans are displayed correctly.

23. SKU limits are NOT technically enforced yet.

24. Reports can be downloaded.

25. AI recommendations use actual shop data.

26. Top-selling products are shown.

27. Organization accounts can manage multiple stores.

28. Organization analytics can aggregate store data.

29. Global product master is separated from private shop data.

30. Existing application design remains intact.

31. Existing working features remain functional.

32. Production deployment remains compatible with Render.

==================================================

31. IMPORTANT DEVELOPMENT RULE

==================================================

Before making large changes, inspect the repository and provide a concise implementation map identifying:

- Existing frontend structure

- Existing backend structure

- Existing database schema

- Existing authentication flow

- Existing shop/tenant architecture

- Existing barcode implementation

- Existing voice implementation

- Existing Cashbox implementation

- Existing subscription-related code

- Files that will need modification

- Database migrations required

Then implement the changes incrementally.

Do not blindly rewrite files.

The priority is:

STABILITY > FEATURE COMPLETENESS > VISUAL CHANGES.

Dokandar Mama is already a working product.

Treat this as a production application receiving a major feature update, not a new project.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://mama-bazar-buddy.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/02581981-7dbf-4c87-9458-e1fce43de1da).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
