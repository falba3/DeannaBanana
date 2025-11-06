import fs from 'fs';
import path from 'path';

export async function getImageFileNames(directoryPath: string): Promise<string[]> {
  const publicDirectory = path.join(process.cwd(), 'public');
  const targetDirectory = path.join(publicDirectory, directoryPath);

  try {
    const files = await fs.promises.readdir(targetDirectory);
    const imageFiles = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });
    return imageFiles;
  } catch (error) {
    console.error(`Error reading directory ${targetDirectory}:`, error);
    return [];
  }
}
