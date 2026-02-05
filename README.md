# DeannaBanana Virtual Try-On Application

## Project Overview

The DeannaBanana Virtual Try-On Application is a Next.js project designed to provide an interactive virtual clothing try-on experience powered by Google's Generative AI. Users can select clothing items, upload their own photo, and see themselves virtually "wearing" the chosen garments. Beyond basic try-on, the application can generate various contextual "situation" images of the user in the new outfit, enhancing the visualization experience. All generated images are stored in AWS S3, and metadata related to try-on sessions ("books") and generated images ("clippings") is managed in a MySQL database.

## Key Features

*   **Multi-step Virtual Try-On:** A guided user interface to select clothing, upload a personal photo, and view results.
*   **AI-Powered Image Compositing:** Utilizes Google's Gemini-2.5-Flash-Image model to realistically composite clothing onto a person's image, removing existing garments.
*   **Situation Generation:** Creates diverse contextual images (e.g., in a cafe, subway, gym) of the user in the virtual outfit, using AI to adapt the background and pose while preserving the outfit.
*   **Image Storage:** All original and generated images are stored and served from AWS S3.
*   **Session Management:** "Books" and "Clippings" stored in MySQL to track try-on sessions and their generated images.
*   **Scalable Architecture:** Built with Next.js, leveraging API routes for AI and database interactions, suitable for serverless deployment.

## Technology Stack

*   **Framework:** Next.js (React.js)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, `@radix-ui` (Shadcn/ui components)
*   **Generative AI:** Google Gemini (via `@google/generative-ai` SDK)
*   **Database:** MySQL (via `mysql2/promise`)
*   **Cloud Storage:** AWS S3 (via `@aws-sdk/client-s3`)
*   **Environment Management:** `dotenv`
*   **Utilities:** `clsx`, `tailwind-merge`

## Architecture Highlights

The application follows a hybrid Next.js architecture:

*   **Frontend (Pages Router):** The main interactive `virtual-try-on` experience is built using Next.js Pages Router, offering a multi-step user flow. Static props are used to fetch initial image lists at build time.
*   **Backend (App Router API Routes):** Core business logic, AI interactions, database operations, and S3 uploads are handled by Next.js App Router API routes (`/app/api/*`). These routes act as a secure and efficient layer between the frontend and external services.
*   **Shared Libraries (`/lib`):** Contains reusable modules for database connectivity (`mysql.ts`), S3 client initialization (`s3-client.ts`), image upload logic (`upload-image.ts`), and general utilities (`utils.ts`, `image-utils.ts`).
*   **AI Orchestration:** The `/api/orchestrate-try-on` endpoint is a central hub that coordinates multiple steps: creating a database record, generating the primary virtual try-on image, uploading it to S3, and then (optionally) generating multiple "situation" images based on the primary try-on result.

## Project Structure

```
.
├── app/
│   └── api/                  # Next.js App Router API routes
│       ├── create-book/      # API to create a new "book" (try-on session)
│       ├── generate/         # API to generate a virtual try-on image
│       ├── generate-situations/ # API to generate contextual "situation" images
│       └── orchestrate-try-on/  # Orchestrates the full try-on and situation generation workflow
├── components/
│   ├── ui/                   # Shadcn/ui components
│   └── try-on/               # Specific components for the virtual try-on steps
│       ├── StepOne.tsx
│       ├── StepTwo.tsx
│       └── StepThree.tsx
├── lib/                      # Core utility functions and modules
│   ├── image-utils.ts        # Utilities for handling image file names
│   ├── mysql.ts              # MySQL database connector and data models
│   ├── s3-client.ts          # AWS S3 client initialization
│   ├── upload-image.ts       # Logic for uploading images to S3
│   └── utils.ts              # General utilities (e.g., Tailwind CSS class merger)
├── pages/                    # Next.js Pages Router pages
│   ├── _app.tsx
│   ├── 404.tsx
│   ├── index.tsx             # Landing page
│   └── virtual-try-on.tsx    # Main interactive virtual try-on interface
├── public/                   # Static assets (images, fonts, etc.)
│   ├── clothes/              # Sample clothing images
│   ├── people/               # Sample people images
│   └── generated_images/     # (Placeholder) Generated images will be stored here in S3
├── styles/
│   └── globals.css           # Global CSS and Tailwind directives
├── workloads/
│   └── s3.ts                 # S3 bucket configuration (via @monolayer/sdk)
├── next.config.js            # Next.js configuration
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── ...                       # Other configuration files (.gitignore, postcss.config.js, tailwind.config.ts)
```

## Setup and Installation

### Prerequisites

*   Node.js (v18 or later) & npm / bun
*   Access to an AWS Account for S3 (S3 Bucket name: `bananabucketdev`)
*   Access to Google Cloud/AI Studio for Gemini API Key
*   A running MySQL Database instance

### Environment Variables

Create a `.env.local` file in the root of your project with the following:

```dotenv
# Google Generative AI
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
# OR
# GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

# MySQL Database Configuration
DB_HOST="YOUR_DB_HOST"
DB_PORT="YOUR_DB_PORT"         # e.g., 3306
DB_USERNAME="YOUR_DB_USERNAME"
DB_PASSWORD="YOUR_DB_PASSWORD" # Optional, if your DB requires it
DB_DATABASE="cliperest"        # Default database name, as seen in lib/mysql.ts
```

### Database Schema

The application expects a MySQL database with tables `cliperest_book` and `cliperest_clipping`. The schema can be inferred from the `BookData` and `ClippingData` interfaces in `lib/mysql.ts`. You will need to create these tables manually or via a migration script before running the application.

*   `cliperest_book` table for `BookData` fields.
*   `cliperest_clipping` table for `ClippingData` fields.

### AWS S3 Configuration

The application uses an S3 bucket named `bananabucketdev`. Ensure this bucket exists in your AWS account.
The `workloads/s3.ts` file configures public read access for specific paths within this bucket (`generated_images/*`, `situations/*`). You may need to adjust your S3 bucket policy to allow public `GetObject` for these paths, or configure CloudFront with an Origin Access Control (OAC) to access a private bucket.

### Installation

```bash
# Using npm
npm install

# Or using bun
bun install
```

## Running the Application

### Development Mode

```bash
npm run dev
# or
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
npm run build
# or
bun run build

npm start
# or
bun start
```

## API Endpoints

The following are the primary API endpoints:

*   **`POST /api/create-book`**: Initiates a new try-on session by creating a "book" entry in the database.
*   **`POST /api/generate`**: Generates a single virtual try-on image by compositing a clothing item onto a person's photo using AI. Uploads the result to S3 and records it as a clipping.
*   **`POST /api/generate-situations`**: Takes a base image (e.g., a generated try-on) and creates multiple contextual "situation" images using AI. Uploads results to S3 and records them as clippings.
*   **`POST /api/orchestrate-try-on`**: The main orchestration endpoint. It combines the functionality of `create-book`, `generate`, and `generate-situations` to provide an end-to-end workflow from input images to a complete try-on session with optional situation images.

## Deployment

This project is a Next.js application designed for server-side rendering (SSR) or incremental static regeneration (ISR) environments. When deploying behind a CDN like AWS CloudFront, ensure your CloudFront distribution is configured to:

1.  **Point to your Next.js server as the origin.** (e.g., an EC2 instance, a container service, or Vercel/Netlify deployment).
2.  **Forward necessary headers, cookies, and query strings** to your Next.js origin, especially for the `/_next/image` path, to allow Next.js image optimization to function correctly.
3.  **Ensure your Next.js server is running and accessible** from the CloudFront origin. A common deployment issue is a 502 Bad Gateway error if the Next.js server is not responding to CloudFront's requests, particularly for image assets.

Consider using platforms like Vercel or Netlify for easier Next.js deployments, which handle most of the server and CDN configurations automatically.
