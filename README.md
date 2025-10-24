# Virtual Try-On

This is a Next.js application that allows you to virtually try on clothes.

## Getting Started

To get started, you will need to have Node.js and npm installed.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/DeannaBanana/DeannaBanana.git
    ```

2.  **Install the dependencies:**

    ```bash
    npm install
    ```

3.  **Set up your environment variables:**

    Create a `.env.local` file in the root of the project and add your Gemini API key:

    ```
    GEMINI_API_KEY=YOUR_API_KEY
    ```

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## How to use

1.  Choose a clothing item from the left panel.
2.  Choose a person from the right panel or upload your own photo.
3.  Click the "Generate Image" button to see the result.

## Adding more images

You can add more clothing and people images to the application.

*   **Clothing images:** Add your clothing images to the `public/clothes` directory.
*   **People images:** Add your people images to the `public/people` directory.

After adding the images, you will need to update the `clothes` and `people` arrays in the `src/app/page.tsx` file to include the new file names.

# Deployments
- October 24, 2025 - 1:23PM - Failed
- October 24, 2025 - 1:25PM - 