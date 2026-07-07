# NOVA Backend

This directory contains the foundational structure for the future NOVA backend microservice.
Currently, the application runs via Next.js serverless API routes located within the `frontend/` directory.

## Future Architecture

When the backend is implemented (e.g., via FastAPI, Express, or Go), it will adhere to the following architecture:

- **`/src/ai`**: Core AI logic, prompt engineering, and LLM orchestration (e.g., Gemini integrations).
- **`/src/planner`**: The scheduling engine, conflict resolution, and calendar generation algorithms.
- **`/src/services`**: Third-party integrations (Google Calendar, etc.) and core business services.
- **`/src/routes`**: API endpoints and controller logic for the frontend to consume.
- **`/src/types`**: Shared types and data contracts.
- **`/src/utils`**: Helper functions, formatters, and shared utilities.

*Note: Do not place frontend UI components or client-side logic in this directory.*
