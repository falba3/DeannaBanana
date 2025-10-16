# DeannaBanana

Two‑image virtual try‑on using Google's Gemini 2.5 image model.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Provide your API key (choose one):

   - Option A: Create a `.env` file in the project root with:

     ```
     GEMINI_API_KEY=your_api_key_here
     ```

   - Option B: Export it in your shell (no .env):

     ```bash
     export GEMINI_API_KEY=your_api_key_here
     ```

## Usage

Run the try‑on from the command line, providing a face/person image and a clothing image:

```bash
python gemini_utils.py --face /path/to/face.jpg --clothing /path/to/clothing.png --prompt "Put the shirt on me, realistic lighting" --out output.png
```

- `--face`: path to the person/face image
- `--clothing`: path to the clothing image
- `--prompt` (optional): extra guidance for the model
- `--out` (optional): the first saved output path (subsequent frames get suffixed)

The script streams results and saves any returned images to disk. If no image is returned, it raises an error.

## Notes

- Model: `gemini-2.5-flash-image`
- Responses may include text; the script prints any textual output while saving images.
