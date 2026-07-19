# NOVA - Premium AI-Powered Planning Workspace

NOVA is a premium, futuristic scheduling and calendar workspace featuring seamless AI task translation. Users can naturally interact with their schedule through conversational AI that translates commands into structured planner actions.

## 🌟 Features Currently Implemented

- **Intelligent Planner UI**: A beautiful, premium dark-mode workspace utilizing glassmorphism and animated glows.
- **Interactive Calendar Grid**: Visual, drag-and-drop-ready calendar views supporting both daily and weekly spreads.
- **Firebase Authentication**: Fully protected routes using Google Sign-In and Email & Password, ensuring private isolated sessions.
- **Gemini AI Action Engine**: An integrated natural language parser (using the official Google Gen AI SDK) that interprets free-form text ("Move my meeting to 5 PM tomorrow") into precise JSON schedule mutations.
- **Real-Time State Management**: Instant UI updates powered by a robust custom React hook and context structure.

## 📂 Repository Structure

NOVA is structured as a monorepo, decoupling the user interface from future scalable microservices.

```text
nova/
├── backend/            # Foundational structure for the future standalone backend service
│   ├── public/         # Static assets
│   └── src/
│       ├── app/        # Next.js App Router & Pages (Login, Planner)
│       ├── frontend/   # Client-side components, hooks, and contexts
│       ├── server/     # Serverless API routes (AI processing)
│       └── services/   # External Integrations
│           ├── firebase/ # Firebase config
│           ├── planner/  # Firestore sync wrapper
│           └── sync/     # Centralized Sync Orchestrator (Google Calendar, etc)
├── frontend/           # The full-stack Next.js application
│   ├── public/         # Static assets
│   └── src/
│       ├── app/        # Next.js App Router & Pages (Login, Planner)
│       ├── frontend/   # Client-side components, hooks, and contexts
│       └── server/     # Temporary Serverless API routes (AI processing)
```

## 🚀 Installation & Setup

### Requirements
- **Node.js**: v18.17 or higher
- **npm**: v9 or higher

### Clone Instructions
```bash
git clone https://github.com/yourusername/nova.git
cd nova/frontend
```

### Install Dependencies
All frontend dependencies must be installed inside the `frontend/` directory.
```bash
npm install
```

### Environment Variables
For the application to run successfully, you must configure two external providers: **Firebase** and **Google Gemini**.

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and fill in your keys (see setups below).

#### Example `.env.local`
```env
# Gemini API Key (Required for AI actions)
GEMINI_API_KEY="AIzaSyYourApiKeyHere..."

# Firebase Config (Required for Authentication)
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyYourFirebaseKey..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="nova-planner.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="nova-planner"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="nova-planner.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234:web:abcd"
```

### Firebase Setup
1. Create a new project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** and add **Google** and **Email/Password** providers.
3. Enable **Firestore Database** in production mode.
4. Go to the **Rules** tab in Firestore and replace the default rules with the following strict isolation rules:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only read and write their own profile
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       // Users can only read and write events inside their own uid collection
       match /events/{userId}/{document=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Enable **Storage** in your Firebase console.
6. Go to the **Rules** tab in Storage and apply the following isolated rules:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /users/{userId}/events/{eventId}/attachments/{allPaths=**} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
7. Register a Web App and copy the configuration snippet provided into your `.env.local`.

### Gemini AI Planner Engine
1. Get a developer API key from [Google AI Studio](https://aistudio.google.com/).
2. Add the key to your `.env.local` file:
   ```bash
   GEMINI_API_KEY="your_api_key_here"
   ```
3. The AI Planner will now analyze your events, detect conflicts, find free time, and propose schedule reorganizations using `gemini-2.5-flash`.
4. All AI suggestions are presented in the **AI Analysis Panel** for your explicit approval before modifying the calendar.

## 📅 Google Calendar Sync Setup

To enable the Two-Way Google Calendar synchronization in NOVA:

1. **Google Cloud Console**: Go to [console.cloud.google.com](https://console.cloud.google.com)
2. **Enable API**: In your Firebase project, go to **APIs & Services > Library** and enable **Google Calendar API**.
3. **OAuth Consent Screen**: Add the scope `https://www.googleapis.com/auth/calendar.events` to your app's consent screen. 
4. **App Integration**: NOVA uses Firebase Auth to request the calendar scope incrementally when a Google-authenticated user clicks "Connect Calendar". Only users who sign in via Google will see this feature.

### Sync Orchestrator Architecture
All synchronization logic is managed centrally via `src/services/sync/syncOrchestrator.ts`. UI components never interface directly with external Calendar APIs. The Sync Orchestrator seamlessly manages debouncing (`syncQueue.ts`), offline detection, secure in-memory OAuth tokens (`googleCalendarSync.ts`), and drift conflicts (`conflictResolver.ts`).

## 🧠 Prompt Registry Architecture

NOVA centralizes all AI prompts into a dedicated **Prompt Registry** located in `src/server/ai/prompts/`. 

### Why Centralize Prompts?
- **Decoupling**: Prevents AI execution logic (`router.ts`) from being cluttered by massive template strings.
- **Maintainability**: AI engineers can tune prompts and system instructions without fear of breaking TypeScript business logic.
- **Observability**: The AI Router automatically logs which version of a prompt was executed, making A/B testing and debugging easier.

### How to Create a New Prompt
1. Create a new module (e.g., `src/server/ai/prompts/email.ts`).
2. Export `PROMPT_VERSION` (e.g., `"1.0.0"`).
3. Export your `SYSTEM_INSTRUCTION` template.
4. Export a typed builder function to assemble the prompt:
   ```typescript
   export interface EmailPromptParams { ... }
   export function buildEmailPrompt(params: EmailPromptParams): string { ... }
   ```
5. Use these exports in your AI feature execution module, passing the final string and version to `aiRouter.generate()`.

### Prompt Versioning
Always increment `PROMPT_VERSION` using Semantic Versioning (SemVer) whenever you alter a `SYSTEM_INSTRUCTION` or prompt structure. The AI Router captures this version and logs it alongside the model used:
```
[AI]
Feature: Email
Model: gemini-2.5-flash
Prompt: Email v1.0.0
```

## 🚀 Quick Start

### Start Development
Start the Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You will be redirected to the secure login page.

## 🛠 Common Troubleshooting

- **`Could not load default credentials`** (Gemini Error): Ensure `GEMINI_API_KEY` is correctly set in your `.env.local`. The system will gracefully block requests and show a UI toast if it is missing.
- **Google Sign-In popup closes immediately**: Ensure popups are allowed for `localhost:3000` in your browser settings.
- **Module not found (`@/server/...`)**: Ensure you are running `npm run dev` from *inside* the `frontend/` directory, not the repository root.

## 🗺 Current Roadmap & Future Architecture

### Current Status
NOVA has achieved a stable Minimum Viable Product (MVP). The core UI, auth structure, and AI logic are finalized and strictly locked.

### Next Phases
1. **Firestore Integration**: Persist events remotely to Cloud Firestore so schedules synchronize across sessions and devices.
2. **Standalone Backend**: Transition the serverless logic located in `frontend/src/server/` into the `backend/` directory using an isolated framework (FastAPI/Express/Go).
3. **Advanced AI**: Introduce multi-step AI reasoning and external integrations (e.g., pulling weather or external Google Calendar feeds).
