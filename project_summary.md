# Project Summary: DeannaBanana Virtual Try-On Platform

This document summarizes the key aspects of the DeannaBanana project, serving as a quick reference for future development.

## 1. Project Type & Structure

*   **Framework:** Next.js 
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS, utilizing Radix UI components (via `components/ui/`).
*   **Primary Goal:** To provide a virtual try-on experience using AI-powered image generation, integrated with persistent storage and a database.

## 2. Core Functionality

The application's core revolves around a "Virtual Try-On" feature, allowing users to interact with clothing and person images to generate new AI-composited images.

### AI-Powered Image Generation

*   **Model:** Google Gemini AI (`gemini-2.5-flash-image`).
*   **Capabilities:**
    *   Compositing new clothing items onto a person's image, completely removing existing attire.
    *   Generating lifestyle scenarios (e.g., "subway", "cafe", "gym") where a person's original outfit is retained and placed into a new scene.

## 3. Key Technologies

*   **Frontend:** React, Next.js
*   **Backend:** Next.js API Routes, Node.js runtime.
*   **AI:** Google Generative AI (`@google/generative-ai`).
*   **Database:** MySQL (`mysql2/promise`) for structured data.
*   **Cloud Storage:** AWS S3 (`@aws-sdk/client-s3`) for storing generated images.
*   **UI Components:** Radix UI primitives integrated with Tailwind CSS.
*   **State Management:** React's `useState`, potentially `@tanstack/react-query` based on `package.json`.

## 4. API Endpoints (Located in `app/api/`)

These are Next.js API routes handling backend logic.

*   **`/api/create-book` (POST):**
    *   **Purpose:** Creates a new "book" entry in the MySQL database. A "book" likely acts as a container or session for a series of try-on interactions.
    *   **Inputs:** `cloth`, `person` (image references).
    *   **Output:** `bookId`, `bookSlug`.
    *   **Dependencies:** `lib/mysql.ts`.

*   **`/api/generate` (POST):**
    *   **Purpose:** Performs the core virtual try-on functionality by compositing new clothing onto a person's image.
    *   **Inputs:** `cloth`, `person` (image data/URLs), `book_id`.
    *   **AI Interaction:** Uses Gemini AI to generate the composite image.
    *   **Storage:** Uploads the generated image to AWS S3.
    *   **Database:** Creates a "clipping" record in MySQL linked to the `book_id`, and increments `numClips` for the book.
    *   **Dependencies:** `lib/mysql.ts`, `lib/upload-image.ts`.

*   **`/api/generate-situations` (POST):**
    *   **Purpose:** Generates multiple AI-powered lifestyle images of a person within various predefined scenes, *retaining* their original clothing.
    *   **Inputs:** `baseImage` (data URL of person), `book_id`, `clothing_id`, `sceneId`.
    *   **AI Interaction:** Uses Gemini AI with scene-specific prompts.
    *   **Storage:** Uploads generated images to AWS S3.
    *   **Database:** Creates a "clipping" record in MySQL linked to the `book_id` and `clothing_id`, and increments `numClips` for the book.
    *   **Dependencies:** `lib/mysql.ts`, `lib/upload-image.ts`.

*   **`/api/orchestrate-try-on` (POST):**
    *   **Purpose:** Orchestrates the entire virtual try-on process in a single atomic operation. It combines the functionality of `/api/create-book`, `/api/generate`, and `/api/generate-situations`.
    *   **Inputs:** `clothImageUrl`, `personImageUrl`, `userId`, `generateSituations`, `situationDescription`, `situationCount`.
    *   **Flow:**
        1.  Creates a "book" to act as a session container.
        2.  Generates a virtual try-on image by compositing the cloth onto the person.
        3.  Uploads the generated try-on image to S3 and creates a "clipping" record in the database.
        4.  (Optional) If `generateSituations` is true, it uses the newly generated try-on image as a base to create multiple "situation" images (e.g., person in a cafe, subway).
        5.  Uploads each situation image to S3 and creates corresponding "clipping" records.
    *   **Output:** `bookId`, `bookSlug`, `tryOnImageUrl`, `situationImageUrls`.
    *   **Dependencies:** `lib/mysql.ts`, `lib/upload-image.ts`.

## 5. Main UI Components (`components/`)

*   **`ClothingGrid.tsx`:** Displays a grid of clothing items for user selection, likely part of the try-on setup. Manages selection state and provides visual feedback.
*   **`ProductCard.tsx`:** Displays an individual product with an image, name, price, category, and "Add to Cart" / "Like" functionality. Suggests a product catalog or e-commerce aspect.
*   **`ResultsGrid.tsx`:** Presents the AI-generated images (results from try-on or situations) to the user, offering download and sharing options.
*   **`try-on/StepOne.tsx`:** The first step in a multi-step virtual try-on flow, responsible for clothing item selection. (Other `StepTwo`, `StepThree` components likely handle person selection and generation initiation).
*   **`Header.tsx`, `Navbar.tsx`, `Hero.tsx`, `Cart.tsx`:** Standard UI elements for navigation, prominent sections, and potential e-commerce cart display.

## 6. Utility Functions (`lib/`, `utils/`)

*   **`lib/mysql.ts`:**
    *   **Purpose:** Centralized module for all MySQL database interactions.
    *   **Features:** Connect/disconnect, execute queries, `createBook`, `createClipping`, `findOrCreateBook`, `incrementBookNumClips`.
    *   **Data Structures:** Defines `BookData` and `ClippingData` interfaces for database records.
*   **`lib/upload-image.ts`:**
    *   **Purpose:** Handles uploading image buffers to AWS S3.
    *   **Features:** Takes image data, a key, and content type, returns a public S3 URL.
*   **`lib/s3-client.ts`:** Configures and exports the AWS S3 client instance.
*   **`lib/utils.ts`:** Contains general utility functions, including `cn` for concatenating Tailwind CSS classes.
*   **`utils/verifyAwsCredentials.ts`:** Likely checks and verifies AWS credentials.

## 7. Database Schema (Implied)

*   **`cliperest_book` table:** Stores metadata about "books" or try-on sessions (e.g., `user_id`, `name`, `slug`, `description`, `numClips`).
*   **`cliperest_clipping` table:** Stores metadata about individual generated images ("clippings") linked to a book (e.g., `book_id`, `caption`, `text`, `thumbnail`, `url`, `type`).

## 8. S3 Bucket Usage

*   Stores AI-generated images (from `generate` and `generate-situations` API routes).
*   Bucket name is retrieved from `BananaBucket.name` (from `@/workloads/s3`).
*   Images are organized under prefixes like `generated_images/clippings/` and `situations/`.
