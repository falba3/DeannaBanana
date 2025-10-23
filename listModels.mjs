
import 'dotenv/config'

async function listGenerativeAIModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log("Available Generative AI Models:");
    data.models.forEach((model) => {
      console.log(`- Name: ${model.name}, Supported Methods: ${model.supportedGenerationMethods.join(', ')}`);
    });
  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listGenerativeAIModels();
