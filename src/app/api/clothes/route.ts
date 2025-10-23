
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const clothesDirectory = path.join(process.cwd(), 'public/clothes');
  const filenames = fs.readdirSync(clothesDirectory);
  const jpegFiles = filenames.filter((file) => file.endsWith('.jpeg'));
  return NextResponse.json(jpegFiles);
}
