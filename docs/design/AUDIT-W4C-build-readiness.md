# AUDIT-W4C: Build Readiness
**Date**: 2026-02-17
**Auditor**: Claude Code (Opus 4.6)
**Scope**: Compile/build verification, missing resources, deployment configs, code signing

---

## Summary

| Project | Build Status | Errors | Warnings |
|---------|-------------|--------|----------|
| iOS App | **PASS** | 0 | 1 (informational) |
| Game Server | **PASS** | 0 | 0 |
| Admin Dashboard | **PASS** | 0 | 0 |
| Edge Functions | **PASS** (structural) | 0 | 0 |

All four projects compile successfully. The iOS app builds and code-signs for the Simulator. The game server TypeScript compiles cleanly. The admin dashboard produces an optimized Next.js production build. All 24 Edge Functions have valid `index.ts` files with consistent import patterns.

**However, there are significant missing-resource gaps that will block App Store submission.** See Critical Build Blockers below.

---

## 1. iOS App

### Build Result

```
xcodebuild -project ChaosCreatures/ChaosCreatures.xcodeproj \
  -scheme ChaosCreatures \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
  -configuration Debug build

** BUILD SUCCEEDED **
```

- **Build target**: arm64-apple-ios17.0-simulator
- **Xcode version**: 17C52 (Xcode 26.2)
- **Swift packages resolved**: Supabase 2.41.1, swift-crypto 4.2.0, swift-http-types 1.5.1, swift-asn1 1.5.1, swift-clocks 1.0.6, swift-concurrency-extras 1.3.2, xctest-dynamic-overlay 1.8.1
- **Frameworks linked**: SpriteKit, StoreKit, GameplayKit
- **Signing**: "Sign to Run Locally" (ad-hoc for Simulator)
- **Warnings**: 1 informational only (AppIntents metadata extraction skipped -- no AppIntents dependency, expected)
- **Total Swift files**: 78
- **Total Swift LOC**: ~17,515

### Info.plist Check

| Key | Value | Expected | Status |
|-----|-------|----------|--------|
| CFBundleIdentifier | `$(PRODUCT_BUNDLE_IDENTIFIER)` -> `com.chaoscreatures.app` | Valid reverse-DNS | PASS |
| CFBundleShortVersionString | `0.1.0` | Semantic version | PASS |
| CFBundleVersion | `1` | Integer build number | PASS |
| LSRequiresIPhoneOS | `true` | Required for iOS | PASS |
| UISupportedInterfaceOrientations | Portrait only | Correct for card game | PASS |
| UIApplicationSupportsMultipleScenes | `false` | Single-window app | PASS |
| UILaunchScreen | `{}` (empty dict) | Minimal launch screen | WARN -- see note |
| SUPABASE_URL | `$(SUPABASE_URL)` from xcconfig | Resolved at build | PASS |
| SUPABASE_ANON_KEY | `$(SUPABASE_ANON_KEY)` from xcconfig | Resolved at build | PASS |
| POSTHOG_API_KEY | `$(POSTHOG_API_KEY)` from xcconfig | Resolved at build | PASS |
| R2_PUBLIC_URL | `$(R2_PUBLIC_URL)` from xcconfig | Resolved at build | PASS |
| GAME_SERVER_URL | `$(GAME_SERVER_URL)` from xcconfig | Resolved at build | PASS |
| UIAppFonts | **MISSING** | Required if custom fonts used | WARN |
| ITSAppUsesNonExemptEncryption | **MISSING** | Required for App Store (avoid export compliance prompt) | BLOCKER |
| NSPrivacyTracking / PrivacyInfo.xcprivacy | **MISSING** | Required by Apple starting Spring 2024 | BLOCKER |

**Notes**:
- The empty `UILaunchScreen` dict means iOS will generate a plain white/black launch screen. For polish, a custom launch storyboard or SwiftUI launch view is recommended.
- `UIAppFonts` is not currently needed because no custom `.ttf`/`.otf` fonts are bundled (Cinzel + Alegreya from CLAUDE.md are planned but not yet added). Once fonts are added, this key must be populated.
- `ITSAppUsesNonExemptEncryption` set to `false` (the app uses HTTPS but no custom encryption) will avoid App Store Connect prompts on every build upload.
- A `PrivacyInfo.xcprivacy` manifest is now required by Apple for apps using certain APIs (including `UserDefaults`, `NSURLSession`, etc.).

### Missing Resources

| Resource Category | Directory Exists | Files Present | Status |
|-------------------|-----------------|---------------|--------|
| Asset Catalog (`Assets.xcassets`) | Yes | Partial | WARN |
| App Icon (`AppIcon.appiconset`) | Yes | **No image file** (Contents.json only, no 1024x1024 PNG) | BLOCKER |
| Card Backs (`CardBacks/`) | Yes (empty) | 0 files | WARN |
| Faction Icons (`FactionIcons/`) | Yes (empty) | 0 files | WARN |
| Keyword Icons (`KeywordIcons/`) | Yes (empty) | 0 files | WARN |
| Shard Icons (`ShardIcons/`) | Yes (empty) | 0 files | WARN |
| Fonts (`Resources/Fonts/`) | Yes (empty) | 0 `.ttf`/`.otf` files | WARN |
| Sounds (`Resources/Sounds/`) | Yes (empty) | 0 `.wav`/`.caf` files | WARN |
| Particles (`Resources/Particles/`) | Yes (empty) | 0 `.sks` files | OK (particles are programmatic) |
| Audio directory (`Resources/Audio/`) | **Does not exist** | N/A | NOTE |

**Detail on missing audio**: `BattleAudioManager.swift` references 18 SFX files (e.g., `sfx_card_play.wav`, `sfx_attack.wav`, `sfx_damage.wav`, etc.) and faction music stems (`{faction}_base`, `{faction}_tension`, `{faction}_chaos`, `{faction}_victory`). The code is written to be a no-op when files are missing, so this does not cause crashes. However, the game will be completely silent until audio assets are added.

**Detail on particles**: `ParticleEffects.swift` creates all `SKEmitterNode` instances programmatically (no `.sks` files needed). This is a good pattern -- no missing resources here.

**Detail on images**: The app primarily uses `Image(systemName:)` SF Symbols and `AsyncImage` / `UIImage(data:)` for remote card art loaded from R2 CDN. No local image files are referenced directly, so the empty asset catalog subdirectories do not cause crashes.

### Code Signing

| Property | Value | Status |
|----------|-------|--------|
| `CODE_SIGN_STYLE` | `Automatic` | PASS |
| `CODE_SIGN_IDENTITY` | `iPhone Developer` | PASS |
| `DEVELOPMENT_TEAM` | **Not set** | BLOCKER for device/distribution |
| Provisioning Profile | Not specified (Automatic Signing) | OK for Simulator |
| `IPHONEOS_DEPLOYMENT_TARGET` | `17.0` | PASS (matches iOS 17+ requirement) |
| Bundle ID | `com.chaoscreatures.app` | PASS |

**Note**: `DEVELOPMENT_TEAM` is not set in `project.pbxproj`. This is fine for Simulator builds but will fail when attempting to build for a physical device or create an archive for App Store submission. The team ID must be set to the Apple Developer account team identifier.

### xcconfig

- `ChaosCreatures/Config.xcconfig` exists on disk
- Referenced in `project.pbxproj` as `baseConfigurationReference` for both Debug and Release
- Properly gitignored (`.gitignore` includes `*.xcconfig`)
- Not tracked by git (confirmed via `git ls-files`)
- Contains URL workaround using `$()` to avoid `//` comment stripping

### SPM Dependencies

Single package reference: `supabase-swift` from `https://github.com/supabase/supabase-swift`. Resolves to v2.41.1 with 6 transitive dependencies. All resolved successfully during build.

---

## 2. Game Server

### Build Result

```
$ npm run build
> chaos-creatures-game-server@0.1.0 build
> tsc

(no errors)
```

- **TypeScript version**: 5.9.3
- **Target**: ES2022, CommonJS modules
- **Output**: `./dist/`
- **Strict mode**: Enabled
- **Build time**: Clean, zero errors, zero warnings

### package.json Scripts

| Script | Command | Status |
|--------|---------|--------|
| `build` | `tsc` | PASS |
| `start` | `node dist/index.js` | PASS |
| `dev` | `tsx watch src/index.ts` | PASS |
| `test` | `vitest run` | Present |
| `typecheck` | `tsc --noEmit` | Present |
| `validate-balance` | `tsx src/scripts/validate-balance.ts` | Present |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@supabase/supabase-js` | 2.95.3 | Database client |
| `express` | 4.22.1 | HTTP server |
| `ws` | 8.19.0 | WebSocket server |
| `zod` | 3.25.76 | Runtime validation |
| `@aws-sdk/client-s3` | 3.991.0 | R2 storage uploads |
| `typescript` | 5.9.3 | Build |
| `tsx` | 4.21.0 | Dev runner |
| `vitest` | 2.1.9 | Testing |

### npm Audit

**25 vulnerabilities** (5 moderate, 20 high) -- all in `@aws-sdk` transitive dependencies (`@aws-sdk/nested-clients`, `@aws-sdk/token-providers`). These are upstream AWS SDK issues, not direct security risks for this application. Fixable via `npm audit fix`.

### tsconfig.json

| Setting | Value | Status |
|---------|-------|--------|
| `target` | ES2022 | PASS |
| `module` | commonjs | PASS |
| `strict` | true | PASS |
| `outDir` | `./dist` | PASS |
| `rootDir` | `./src` | PASS |
| `sourceMap` | true | PASS |
| `declaration` | true | PASS |
| `skipLibCheck` | true | PASS |

---

## 3. Admin Dashboard

### Build Result

```
$ npm run build
> chaos-creatures-admin-dashboard@0.1.0 build
> next build

  ▲ Next.js 14.2.35
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types ...
 ✓ Generating static pages (21/21)

Route (app)                              Size     First Load JS
┌ ƒ /                                    177 B          96.1 kB
├ ƒ /analytics                           1.39 kB        88.7 kB
├ ƒ /cards                               4.49 kB        91.8 kB
├ ƒ /economy                             2.13 kB        89.4 kB
├ ƒ /evolution                           177 B          96.1 kB
├ ƒ /login                               1.06 kB        88.3 kB
├ ƒ /seasons                             1.96 kB        89.2 kB
├ ƒ /settings                            138 B          87.4 kB
└ ƒ /validate                            2.17 kB        89.4 kB
+ First Load JS shared by all            87.3 kB
```

- **Next.js version**: 14.2.35
- **Output mode**: `standalone` (configured in `next.config.js`)
- **21 pages** generated (including API routes)
- **Zero compilation errors, zero warnings**
- **Middleware**: 27 kB

### Pages Inventory

| Page | Type | Status |
|------|------|--------|
| `/` (Dashboard) | Dynamic | PASS |
| `/login` | Dynamic | PASS |
| `/cards` | Dynamic | PASS |
| `/economy` | Dynamic | PASS |
| `/analytics` | Dynamic | PASS |
| `/evolution` | Dynamic | PASS |
| `/seasons` | Dynamic | PASS |
| `/settings` | Dynamic | PASS |
| `/validate` | Dynamic | PASS |
| `/api/auth` | API Route | PASS |
| `/api/economy-config` | Static | PASS |
| `/api/economy-config/audit` | Static | PASS |
| `/api/factions` | Static | PASS |
| `/api/generate-batch` | Dynamic | PASS |
| `/api/generation-jobs` | Dynamic | PASS |
| `/api/health` | Static | PASS |
| `/api/season` | Dynamic | PASS |
| `/api/validate-balance` | Dynamic | PASS |

### Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `next` | 14.2.35 | Framework |
| `react` | 18.3.1 | UI |
| `react-dom` | 18.3.1 | DOM rendering |
| `@supabase/supabase-js` | 2.95.3 | Database client |
| `tailwindcss` | 3.4.19 | Styling |
| `typescript` | 5.9.3 | Build |

### npm Audit

**1 high severity vulnerability** in `next@14.2.35` (HTTP request deserialization DoS, Image Optimizer DoS). Fix requires major upgrade to `next@16.x` (breaking change). Low risk for an admin-only dashboard not exposed to untrusted users.

---

## 4. Edge Functions

### Function Inventory

24 functions found, all with valid `index.ts` files:

| Function | Lines | Imports Valid | Category |
|----------|-------|-------------|----------|
| `batch-generate` | 509 | Yes | Content generation |
| `check-missed-achievements` | 48 | Yes | Player progression |
| `complete-evolution` | 241 | Yes | Card evolution |
| `evaluate-achievements` | 259 | Yes | Player progression |
| `evaluate-quests` | 199 | Yes | Player progression |
| `generate-card-art` | 399 | Yes | Content generation |
| `generate-card-text` | 395 | Yes | Content generation |
| `generate-evolution-art` | 359 | Yes | Content generation |
| `get-card` | 63 | Yes | Data retrieval |
| `get-collection` | 98 | Yes | Data retrieval |
| `get-decks` | 38 | Yes | Data retrieval |
| `get-economy-status` | 60 | Yes | Data retrieval |
| `get-quests` | 53 | Yes | Data retrieval |
| `join-queue` | 123 | Yes | Matchmaking |
| `leave-queue` | 37 | Yes | Matchmaking |
| `monthly-rewards` | 138 | Yes | Economy |
| `open-pack` | 176 | Yes | Economy |
| `purchase-shards` | 134 | Yes | Economy |
| `refresh-daily-quests` | 214 | Yes | Player progression |
| `save-deck` | 154 | Yes | Deck management |
| `start-evolution` | 247 | Yes | Card evolution |
| `sync-entitlements` | 123 | Yes | IAP/StoreKit |
| `update-mastery` | 169 | Yes | Player progression |
| `validate-deck` | 52 | Yes | Deck management |

**Total**: 24 functions, 4,337 lines of code

### Shared Modules

6 shared modules in `_shared/`:

| Module | Purpose |
|--------|---------|
| `auth.ts` | `verifyServiceRole()`, JWT verification |
| `errors.ts` | Error/success response helpers, CORS |
| `supabase.ts` | `createServiceClient()` factory |
| `types.ts` | Shared TypeScript types |
| `deck-validator.ts` | Deck validation rules |
| `prompts.ts` | AI generation prompt templates |

### Import Pattern Consistency

- All 24 functions import `serve` from `https://deno.land/std@0.208.0/http/server.ts` (consistent version)
- All use relative imports to `../_shared/` modules (no cross-function imports detected)
- No `npm:` or `node:` imports detected (pure Deno)

### Known Bug

The `verifyServiceRole()` function in `_shared/auth.ts` returns 403 consistently in production due to `Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")` mismatch. This blocks the content generation pipeline (batch-generate, generate-card-art, generate-card-text, generate-evolution-art) in production. Workaround: local generation scripts in `scripts/`.

---

## 5. Deployment Configs

| Service | Config File | Exists | Valid | Issues |
|---------|------------|--------|-------|--------|
| Railway | `packages/game-server/railway.json` | Yes | Yes | None |
| Railway | `packages/game-server/Dockerfile` | Yes | Yes | None |
| Vercel | `packages/admin-dashboard/next.config.js` | Yes | Yes | None |
| Supabase | `supabase/config.toml` | Yes | Yes | None |

### Railway Config (`railway.json`)

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "node dist/index.js",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 10,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

- Uses multi-stage Dockerfile (node:20-slim builder + runtime)
- Health check configured at `/health`
- Restart policy with retry limit
- Exposes port 3001

### Vercel Config (`next.config.js`)

```js
const nextConfig = {
  output: 'standalone',
};
```

- Standalone output mode for Vercel deployment
- No `vercel.json` present (uses Vercel auto-detection for Next.js)
- This is a valid and common configuration

### Supabase Config (`supabase/config.toml`)

- Database: PostgreSQL 17, port 54322
- Auth: Email signup disabled, Apple sign-in enabled
- Edge Runtime: enabled, `per_worker` policy
- Storage: 50MiB file size limit
- Analytics: disabled (using PostHog instead)
- 14 migration files present in `supabase/migrations/`

---

## 6. Security / Gitignore Verification

| Sensitive File | Gitignored | Tracked by Git | Status |
|---------------|-----------|---------------|--------|
| `ChaosCreatures/Config.xcconfig` | Yes (`*.xcconfig`) | No | PASS |
| `.env` | Yes (`.env`) | No | PASS |
| `.env.*` | Yes (`.env.*`) | No | PASS |
| `*.xcuserdata` | Yes | No | PASS |

---

## Critical Build Blockers

These items **must** be resolved before App Store submission:

### BLOCKER 1: No App Icon
The `AppIcon.appiconset` has a `Contents.json` but no actual 1024x1024 PNG image. App Store Connect will reject the upload.

**Fix**: Generate a 1024x1024 app icon via fal.ai and add it to `ChaosCreatures/ChaosCreatures/Resources/Assets.xcassets/AppIcon.appiconset/`.

### BLOCKER 2: No DEVELOPMENT_TEAM
`DEVELOPMENT_TEAM` is not set in `project.pbxproj`. Without this, Xcode cannot sign the app for device deployment or archive for distribution.

**Fix**: Set `DEVELOPMENT_TEAM = {Apple Developer Team ID}` in the Xcode project or via `Config.xcconfig`.

### BLOCKER 3: Missing ITSAppUsesNonExemptEncryption
This key is not in Info.plist. Without it, every TestFlight and App Store upload will prompt for manual export compliance confirmation.

**Fix**: Add `<key>ITSAppUsesNonExemptEncryption</key><false/>` to Info.plist.

### BLOCKER 4: Missing PrivacyInfo.xcprivacy
Apple requires a privacy manifest for apps using covered APIs (the app uses `URLSession`, `UserDefaults`, and likely other covered APIs). App Store review may reject without it.

**Fix**: Create a `PrivacyInfo.xcprivacy` file declaring API usage reasons.

### BLOCKER 5: No .entitlements File
No app-level `.entitlements` file exists in the ChaosCreatures source. StoreKit 2 IAP requires the `com.apple.developer.in-app-purchases` entitlement enabled via an entitlements file. Simulator builds work without it, but device/distribution builds will fail for IAP functionality.

**Fix**: Create `ChaosCreatures.entitlements` with in-app purchase capability.

---

## Non-Blocking Warnings (Pre-Launch Polish)

### WARN 1: All Audio Assets Missing
`BattleAudioManager.swift` references 18 SFX files and 12 music stems (4 stems x 3 factions). All directories are empty. The code gracefully handles missing files (no-ops), but the game will be completely silent.

**Impact**: Poor user experience. Silent gameplay.
**Priority**: High (before launch).

### WARN 2: All Visual Assets Missing from Asset Catalog
`CardBacks/`, `FactionIcons/`, `KeywordIcons/`, `ShardIcons/` directories are all empty. The code uses SF Symbols as fallbacks and loads card art remotely, so this does not crash the app, but the UI will look unfinished.

**Impact**: Placeholder-quality visuals.
**Priority**: High (before launch).

### WARN 3: No Custom Fonts Bundled
The design spec calls for Cinzel + Alegreya (Google Fonts). The `Resources/Fonts/` directory exists but is empty. No `UIAppFonts` key in Info.plist. The app currently uses system fonts.

**Impact**: Cards and UI will not match the intended classical/fantasy aesthetic.
**Priority**: Medium (before launch).

### WARN 4: npm Vulnerabilities
- Game server: 25 vulnerabilities (all in @aws-sdk transitive deps)
- Admin dashboard: 1 high-severity Next.js vulnerability

**Impact**: Low risk for this use case. The admin dashboard is not public-facing, and the AWS SDK vulnerabilities are in token management code paths unlikely to be exploited.
**Priority**: Low. Run `npm audit fix` when convenient.

### WARN 5: Launch Screen is Blank
`UILaunchScreen` is set to an empty dictionary, producing a plain white/black launch screen.

**Impact**: Unprofessional first impression.
**Priority**: Medium (before launch).

---

## Build Environment Reference

| Component | Version |
|-----------|---------|
| Xcode | 26.2 (17C52) |
| iOS Simulator SDK | 26.2 |
| Swift | 6.2 |
| Node.js | v24.x |
| TypeScript | 5.9.3 |
| Next.js | 14.2.35 |
| Supabase Swift SDK | 2.41.1 |
| Deno (Edge Functions runtime) | 2.6 (per CLAUDE.md) |

---

## Revision Log
| Date | Change |
|------|--------|
| 2026-02-17 | Initial audit -- all 4 projects build successfully. 5 blockers, 5 warnings identified. |
