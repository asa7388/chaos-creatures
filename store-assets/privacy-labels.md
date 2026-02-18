# App Privacy Nutrition Labels — Chaos Creatures

Apple requires developers to declare what data their app collects, how it is used, and whether it is linked to user identity. This document specifies the exact answers for the App Store Connect privacy questionnaire.

## Data Collection Declaration

**Does your app collect data?** Yes

---

## Data Types Collected

### 1. Contact Info — Email Address

| Field | Value |
|-------|-------|
| Data Type | Contact Info > Email Address |
| Collection | Collected via Apple Sign-In. Apple may provide the user's real email or a private relay address depending on user preference. Stored in Supabase Auth. |
| Used For | App Functionality |
| Linked to Identity | Yes |
| Tracking | No |

**Details**: Email is collected solely for account creation and authentication via Apple Sign-In. It is not used for marketing, advertising, or shared with third parties. Users who choose "Hide My Email" during Apple Sign-In receive a private relay address instead.

### 2. Identifiers — User ID

| Field | Value |
|-------|-------|
| Data Type | Identifiers > User ID |
| Collection | A UUID is assigned to each user account by Supabase Auth upon sign-up. |
| Used For | App Functionality, Analytics |
| Linked to Identity | Yes |
| Tracking | No |

**Details**: The user ID links the player to their card collection, match history, decks, and progression data. It is also used as the distinct ID in PostHog analytics to associate usage events with a user session.

### 3. Usage Data — Product Interaction

| Field | Value |
|-------|-------|
| Data Type | Usage Data > Product Interaction |
| Collection | PostHog analytics records screens visited, features used, match outcomes, and in-app actions (e.g., cards evolved, packs opened, decks built). Sent via PostHog HTTP API (no SDK). |
| Used For | Analytics |
| Linked to Identity | Yes |
| Tracking | No |

**Details**: Product interaction data is used exclusively for internal analytics — understanding player behavior, retention, feature adoption, and game balance. It is not shared with third parties for advertising. PostHog is self-serve analytics; no data is sold or used for cross-app tracking.

### 4. Purchases — Purchase History

| Field | Value |
|-------|-------|
| Data Type | Purchases > Purchase History |
| Collection | StoreKit 2 transaction records for subscriptions (Mid/High tier) and one-time cosmetic purchases. Transaction verification via Apple's App Store Server API. Purchase state synced to Supabase via Edge Function. |
| Used For | App Functionality |
| Linked to Identity | Yes |
| Tracking | No |

**Details**: Purchase history is used to determine the player's active subscription tier and owned cosmetic items. It is required for entitlement management (granting the correct modifier selection breadth, collection capacity, and cosmetic access). Purchase data is not shared with third parties.

### 5. Diagnostics — Performance Data

| Field | Value |
|-------|-------|
| Data Type | Diagnostics > Performance Data |
| Collection | Basic app performance metrics (screen load times, API response times) are captured via PostHog events. No third-party crash reporting SDK is currently integrated. |
| Used For | App Functionality |
| Linked to Identity | No |
| Tracking | No |

**Details**: Performance data helps identify slow screens, failing API calls, and degraded user experiences. It is not linked to individual user identity for diagnostic purposes. Apple's built-in crash reporting (Xcode Organizer) provides additional crash data that Apple collects independently.

---

## Data NOT Collected

The following data types are explicitly **not collected** by Chaos Creatures:

| Data Type | Status |
|-----------|--------|
| Health & Fitness | Not collected |
| Financial Info (other than purchases) | Not collected |
| Location (precise or coarse) | Not collected |
| Sensitive Info | Not collected |
| Contacts | Not collected |
| User Content (photos, videos, etc.) | Not collected |
| Browsing History | Not collected |
| Search History | Not collected |
| Diagnostics > Crash Data | Not collected (Apple collects this independently via Xcode Organizer; no third-party crash SDK in the app) |
| Other Data | Not collected |

---

## Tracking Declaration

**Does your app track users?** No

Chaos Creatures does not track users as defined by Apple's App Tracking Transparency framework. Specifically:
- No advertising SDKs are integrated.
- No data is shared with data brokers.
- No device identifiers (IDFA) are collected.
- PostHog analytics data is first-party only and not linked to third-party data for advertising or ad measurement.
- The app does not request ATT (App Tracking Transparency) permission because it does not track.

---

## Third-Party Services and Data Handling

| Service | Data Received | Purpose | Data Sharing |
|---------|--------------|---------|--------------|
| Supabase (Auth + Database) | Email, user ID, game data | Authentication, game state storage | No third-party sharing |
| PostHog | User ID, product interaction events, performance metrics | Internal analytics | No third-party sharing |
| Apple (StoreKit 2) | Purchase transactions | In-app purchase processing | Apple processes payments per their privacy policy |
| Cloudflare R2 | None (CDN serves static card art) | Card art delivery | No user data sent to R2 |
| fal.ai | None from client (server-side only) | AI art generation (server-side, not client) | No user data sent to fal.ai |
| OpenAI | None from client (server-side only) | AI text generation (server-side, not client) | No user data sent to OpenAI |

**Note**: fal.ai and OpenAI are called from server-side Edge Functions and the admin dashboard, never from the iOS client. No user data is sent to these services.

---

## Summary for App Store Connect Entry

When filling out the privacy questionnaire in App Store Connect, select:

1. **Contact Info > Email Address** -- App Functionality -- Linked to Identity -- Not Tracking
2. **Identifiers > User ID** -- App Functionality, Analytics -- Linked to Identity -- Not Tracking
3. **Usage Data > Product Interaction** -- Analytics -- Linked to Identity -- Not Tracking
4. **Purchases > Purchase History** -- App Functionality -- Linked to Identity -- Not Tracking
5. **Diagnostics > Performance Data** -- App Functionality -- Not Linked to Identity -- Not Tracking

**Privacy Policy URL**: To be hosted at a public URL (e.g., GitHub Pages or Cloudflare Pages) before submission. Current draft at `legal/privacy-policy.html`.
