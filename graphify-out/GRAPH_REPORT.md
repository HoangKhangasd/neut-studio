# Graph Report - Neut-Studio  (2026-11-16)

## Corpus Check
- 135 files · ~51,802 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 10 file(s) not represented in the graph (top: (none) 6, .example 1, .ico 1)

## Summary
- 801 nodes · 1336 edges · 50 communities (31 shown, 19 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.85)
- Token cost: 1,650 input · 1,100 output

## Community Hubs (Navigation)
- Storefront UI & Pages
- Drizzle ORM Relational Schema
- Frontend Dependencies & Styling
- Catalog DTOs & Products
- Authentication Guards & Decorators
- HTML & ERD Build Scripts
- Docker Infrastructure Stack
- Root Project Config & Linter
- Stores & Phone Leads DTOs
- NestJS Core App Module
- Auth Controller & Endpoints
- MinIO S3 Storage Service
- NestJS CLI Dev Dependencies
- API TypeScript Configuration
- Database NPM Scripts
- Web TypeScript Configuration
- Backend Runtime Dependencies
- Base TypeScript Compiler Options
- Backend Package Metadata
- JWT & Passport Auth Strategy
- Shared Types Package
- Shared TypeScript Type Definitions
- Prettier Code Formatting
- System Architecture & Guidelines
- Master ERD Reports & Diagrams
- Oxlint TypeScript Rules
- API Build TypeScript Config
- API Root TypeScript Config
- Nest CLI Build Options
- Pnpm Workspace Configuration
- Drizzle Database Migration Tooling
- Vitest Testing Framework
- Streetwear Design System
- Oxlint Static Analysis
- Source Map Support
- Supertest API Testing
- PostCSS Styling Config
- Next.js Agent Guidelines
- File Vector Icon
- Globe Vector Icon
- Vercel Platform Logo
- Window Vector Icon
- Instant Search Drawer Spec
- Join Movement Phone Banner
- Mini-Cart Drawer Spec
- Lookbook Hotspot Spec

## God Nodes (most connected - your core abstractions)
1. `@nestjs/common` - 26 edges
2. `react` - 22 edges
3. `compilerOptions` - 20 edges
4. `lucide-react` - 20 edges
5. `scripts` - 19 edges
6. `next` - 19 edges
7. `drizzle-orm` - 17 edges
8. `compilerOptions` - 16 edges
9. `formatVND()` - 15 edges
10. `ProductsService` - 14 edges

## Surprising Connections (you probably didn't know these)
- `Product Variants Entity` --references--> `productVariants`  [EXTRACTED]
  docs/ERD.md → apps/api/src/database/schema/product-variants.schema.ts
- `Smart Fit Finder Spec` --implements--> `FitFinderModal()`  [EXTRACTED]
  docs/PROJECT_SPEC.md → apps/web/src/components/store/FitFinderModal.tsx
- `Categories Entity` --references--> `categories`  [EXTRACTED]
  docs/ERD.md → apps/api/src/database/schema/categories.schema.ts
- `Collections Entity` --references--> `collections`  [EXTRACTED]
  docs/ERD.md → apps/api/src/database/schema/categories.schema.ts
- `Collection Products Join Entity` --references--> `collectionProducts`  [EXTRACTED]
  docs/ERD.md → apps/api/src/database/schema/categories.schema.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Authentication & Identity Management** — docs_erd_users, docs_erd_user_addresses, docs_erd_wishlists [EXTRACTED 0.85]
- **E-Commerce Checkout & Payment Flow** — docs_erd_orders, docs_erd_order_items, docs_erd_payment_transactions, docs_erd_carts [EXTRACTED 0.85]
- **Product Catalog & Lookbook Hotspots** — docs_erd_products, docs_erd_product_variants, docs_erd_categories, docs_erd_lookbooks [EXTRACTED 0.85]

## Communities (50 total, 19 thin omitted)

### Community 0 - "Storefront UI & Pages"
Cohesion: 0.05
Nodes (76): nextConfig, AdminPage(), CheckoutPage(), geistMono, geistSans, metadata, RootLayout(), OrderSuccessPage() (+68 more)

### Community 1 - "Drizzle ORM Relational Schema"
Cohesion: 0.06
Nodes (48): DRIZZLE, categories, coupons, couponUsages, lookbookHotspots, lookbooks, cartItems, carts (+40 more)

### Community 2 - "Frontend Dependencies & Styling"
Cohesion: 0.05
Nodes (48): eslintConfig, dependencies, canvas-confetti@^1.9.4, clsx@^2.1.1, lucide-react@^1.61.0, next@16.4.3, react@19.3.0, react-dom@19.3.0 (+40 more)

### Community 3 - "Catalog DTOs & Products"
Cohesion: 0.09
Nodes (11): collectionProducts, collections, productReviews, CreateReviewDto, FitFinderDto, ProductQueryDto, ProductsController, ProductsService (+3 more)

### Community 4 - "Authentication Guards & Decorators"
Cohesion: 0.08
Nodes (7): CurrentUser, JwtAuthGuard, CreateOrderDto, OrderItemDto, OrdersController, OrdersService, @nestjs/common

### Community 5 - "HTML & ERD Build Scripts"
Cohesion: 0.07
Nodes (19): sections, args, svgContent, targetHeight, targetWidth, viewBoxMatch, doc, args (+11 more)

### Community 6 - "Docker Infrastructure Stack"
Cohesion: 0.06
Nodes (32): MINIO_ROOT_PASSWORD, MINIO_ROOT_USER, POSTGRES_DB, POSTGRES_PASSWORD, POSTGRES_USER, command, container_name, environment (+24 more)

### Community 7 - "Root Project Config & Linter"
Cohesion: 0.07
Nodes (30): description, devDependencies, docx@^9.14.0, eslint@^9.20.0, @eslint/js@^9.20.0, prettier@^3.5.0, typescript@^5.7.3, eslint (+22 more)

### Community 8 - "Stores & Phone Leads DTOs"
Cohesion: 0.09
Nodes (6): class-validator@^0.15.1, PhoneSubscribeDto, StoresController, StoresModule, StoresService, class-validator

### Community 9 - "NestJS Core App Module"
Cohesion: 0.09
Nodes (11): @nestjs/core@^12.0.1, @nestjs/testing@^12.0.1, AppController, AppModule, AppService, DatabaseModule, AuthModule, OrdersModule (+3 more)

### Community 10 - "Auth Controller & Endpoints"
Cohesion: 0.10
Nodes (4): AuthController, AuthService, LoginDto, RegisterDto

### Community 11 - "MinIO S3 Storage Service"
Cohesion: 0.09
Nodes (9): @aws-sdk/client-s3@^3.1156.0, @aws-sdk/s3-request-presigner@^3.1156.0, PresignedUrlDto, StorageController, StorageModule, StorageService, @aws-sdk/client-s3, @aws-sdk/s3-request-presigner (+1 more)

### Community 12 - "NestJS CLI Dev Dependencies"
Cohesion: 0.09
Nodes (23): devDependencies, @nestjs/cli@^12.0.0, @nestjs/mau@^0.2.6, @nestjs/schematics@^12.0.0, prettier@^3.4.2, tsx@^4.23.15, @types/bcryptjs@^2.4.6, @types/passport-jwt@^4.0.1 (+15 more)

### Community 13 - "API TypeScript Configuration"
Cohesion: 0.10
Nodes (20): compilerOptions, allowSyntheticDefaultImports, declaration, emitDecoratorMetadata, esModuleInterop, experimentalDecorators, incremental, isolatedModules (+12 more)

### Community 14 - "Database NPM Scripts"
Cohesion: 0.11
Nodes (19): scripts, build, db:generate, db:push, db:studio, deploy, dev, format (+11 more)

### Community 15 - "Web TypeScript Configuration"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 16 - "Backend Runtime Dependencies"
Cohesion: 0.11
Nodes (18): dependencies, bcryptjs@^3.0.3, class-transformer@^0.5.1, drizzle-orm@^0.45.4, @nestjs/common@^12.0.1, @nestjs/platform-express@^12.0.1, @nestjs/swagger@^12.0.3, passport@^0.7.0 (+10 more)

### Community 17 - "Base TypeScript Compiler Options"
Cohesion: 0.12
Nodes (16): compilerOptions, declaration, declarationMap, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, lib, module (+8 more)

### Community 18 - "Backend Package Metadata"
Cohesion: 0.12
Nodes (15): author, description, oxlint-tsgolint@^7.0.2001, @types/express@^5.0.0, @types/node@^24.0.0, vite@^8.0.0, @types/node, license (+7 more)

### Community 19 - "JWT & Passport Auth Strategy"
Cohesion: 0.18
Nodes (9): @nestjs/config@^12.0.1, @nestjs/jwt@^12.0.3, @nestjs/passport@^12.0.0, passport-jwt@^4.0.1, JwtStrategy, @nestjs/config, @nestjs/jwt, @nestjs/passport (+1 more)

### Community 20 - "Shared Types Package"
Cohesion: 0.18
Nodes (11): devDependencies, typescript@^5.7.0, typescript, main, name, private, scripts, build (+3 more)

### Community 21 - "Shared TypeScript Type Definitions"
Cohesion: 0.18
Nodes (10): CartItem, Category, Collection, Product, ProductImage, ProductReview, ProductVariant, QuickSize (+2 more)

### Community 22 - "Prettier Code Formatting"
Cohesion: 0.22
Nodes (8): arrowParens, bracketSpacing, endOfLine, printWidth, semi, singleQuote, tabWidth, trailingComma

### Community 23 - "System Architecture & Guidelines"
Cohesion: 0.25
Nodes (7): NestJS Backend API, Next.js Framework Logo Vector, Next.js 15 Web Frontend, Monorepo System Architecture, Infrastructure Service Ports Specification, Docker Compose Infrastructure Stack, Neut-Studio Monorepo Project

### Community 24 - "Master ERD Reports & Diagrams"
Cohesion: 0.25
Nodes (8): Master Entity-Relationship Diagram (22 Tables), Master ERD Standalone Report, Master ERD Diagram Image, Master ERD Vector Graphic, Master ERD Vertical Diagram, Local Mermaid Template Viewer, Vertical Clean ERD Test Page, Vertical ERD Interactive Viewer

### Community 25 - "Oxlint TypeScript Rules"
Cohesion: 0.29
Nodes (6): env, node, rules, typescript/no-explicit-any, typescript/no-floating-promises, $schema

### Community 26 - "API Build TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, rootDir, exclude, extends, include, ./tsconfig.json

### Community 27 - "API Root TypeScript Config"
Cohesion: 0.29
Nodes (6): compilerOptions, outDir, rootDir, extends, include, ../../tsconfig.base.json

### Community 28 - "Nest CLI Build Options"
Cohesion: 0.33
Nodes (5): collection, compilerOptions, deleteOutDir, $schema, sourceRoot

### Community 29 - "Pnpm Workspace Configuration"
Cohesion: 0.33
Nodes (5): allowBuilds, esbuild, @scarf/scarf, unrs-resolver, packages

### Community 30 - "Drizzle Database Migration Tooling"
Cohesion: 0.40
Nodes (4): dotenv@^18.0.9, drizzle-kit@^0.31.11, dotenv, drizzle-kit

## Knowledge Gaps
- **38 isolated node(s):** `./tsconfig.json`, `../../tsconfig.base.json`, `NestJS Backend API`, `Next.js Agent Guidelines`, `Infrastructure Service Ports Specification` (+33 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 330 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **19 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@nestjs/common` connect `Authentication Guards & Decorators` to `Drizzle ORM Relational Schema`, `Catalog DTOs & Products`, `Stores & Phone Leads DTOs`, `NestJS Core App Module`, `MinIO S3 Storage Service`, `Backend Runtime Dependencies`, `Backend Package Metadata`, `JWT & Passport Auth Strategy`?**
  _High betweenness centrality (0.072) - this node is a cross-community bridge._
- **What connects `./tsconfig.json`, `../../tsconfig.base.json`, `NestJS Backend API` to the rest of the system?**
  _38 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Storefront UI & Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.051748009691934924 - nodes in this community are weakly interconnected._
- **Why does `drizzle-orm` connect `Drizzle ORM Relational Schema` to `Backend Runtime Dependencies`, `Backend Package Metadata`, `Catalog DTOs & Products`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Should `Drizzle ORM Relational Schema` be split into smaller, more focused modules?**
  _Cohesion score 0.061507936507936505 - nodes in this community are weakly interconnected._
- **Why does `@nestjs/swagger` connect `MinIO S3 Storage Service` to `Catalog DTOs & Products`, `Authentication Guards & Decorators`, `Stores & Phone Leads DTOs`, `NestJS Core App Module`, `Auth Controller & Endpoints`, `Backend Runtime Dependencies`, `Backend Package Metadata`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Should `Frontend Dependencies & Styling` be split into smaller, more focused modules?**
  _Cohesion score 0.05254901960784314 - nodes in this community are weakly interconnected._