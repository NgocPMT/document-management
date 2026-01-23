# Document Management System

A robust document management application built with Encore.ts, designed to handle file uploads, organization, sharing, and advanced processing features. This system leverages modern technologies for scalability, security, and performance.

## Features

### Core Features

- **File Upload and Storage**: Secure upload of documents with support for various file types, stored in AWS S3.
- **File Metadata Management**: Track and update document metadata such as name, size, and status.
- **Document Organization**: Organize documents into folders for better categorization.
- **Document Sharing**: Share documents with other users with expiration dates.
- **Document Search**: Full-text search across document names and content.

### Advanced Features

- **Background Processing**: Asynchronous jobs to process uploaded files, including metadata extraction and PDF conversion.
- **Caching**: Redis-based caching for frequently accessed documents and user data to improve performance.
- **AI-Powered Summarization**: Generate concise summaries of documents using Google Gemini AI.
- **External Integrations**: Integration with document conversion APIs (e.g., SharpAPIs) for file normalization.

## API Endpoints

### Authentication

- `POST /v1/auth/register` - Register a new user
- `POST /v1/auth/login` - Login and obtain a session token

### Folders

- `GET /v1/folders` - List folders for the authenticated user
- `POST /v1/folders` - Create a new folder
- `PUT /v1/folders/:id` - Update a folder
- `DELETE /v1/folders/:id` - Delete a folder

### Documents

- `POST /v1/documents` - List documents (with filters and pagination)
- `GET /v1/documents/:id` - Get document details
- `POST /v1/documents/upload` - Upload a new document
- `GET /v1/documents/:id/download` - Download document via presigned URL
- `PUT /v1/documents/:id` - Update document metadata
- `DELETE /v1/documents/:id` - Delete a document
- `POST /v1/documents/:id/share` - Share document with another user
- `POST /v1/documents/search` - Search documents
- `GET /v1/documents/:id/summary` - Get AI-generated summary

## Tech Stack

- **Framework**: Encore.dev (TypeScript)
- **Database**: PostgreSQL with Drizzle ORM
- **Storage**: AWS S3
- **Caching**: Redis with Keyv
- **AI**: Google Gemini AI
- **Workflows**: DBOS SDK
- **Authentication**: Better Auth
- **External APIs**: SharpAPIs for PDF conversion
- **Testing**: Vitest
- **Containerization**: Docker
- **Rate Limiting**: rate-limiter-flexible

## Folder Structure

```
├── src
│   ├── AI
│   ├── api
│   │   ├── auth
│   │   ├── documents
│   │   └── folders
│   ├── cache
│   ├── db
│   ├── jobs
│   │   └── pdf-conversion
│   ├── storage
│   └── workflows
├── tests
│    ├── fixtures
│    └── unit
├── .env
├── .env.example
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── encore.app
├── package.json
├── README.md
├── response.txt
├── tsconfig.json
```

## Prerequisites

- Docker and Docker Compose
- Node.js (for local development, if not using Docker)
- Bun (for package management)
- AWS account with S3 bucket configured
- Redis instance
- Google Gemini API key
- SharpAPIs credentials

## Setup and Running Locally

1. **Clone the repository**:

   ```bash
   git clone <repository-url>
   cd document-management
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `.env` and fill in the required secrets (e.g., `REDIS_URL`, `AWS_BUCKET_NAME`, `GEMINI_API_KEY`, etc.).

3. **Run Docker Compose** (recommended):

   ```bash
   docker compose up -d
   ```

   This will start the application along with all dependencies (database, Redis, etc.).

4. **Run Application**

   ```bash
   encore run
   ```

5. **Access the application**:
   - API endpoints: Available at `http://localhost:4000`
   - Encore Developer Dashboard: `http://localhost:9400`

---

For local development without Docker:

1. Install dependencies:

   ```bash
   bun install
   ```

2. Run the application:

   ```bash
   encore run
   ```

## Deployment

Deploy to Encore's cloud or your own infrastructure:

```bash
git add -A
git commit -m 'Commit message'
git push encore
```

Monitor deployments via the [Encore Cloud Dashboard](https://app.encore.dev).
