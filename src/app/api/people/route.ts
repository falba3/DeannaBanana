import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const peopleDirectory = path.join(process.cwd(), 'public/people');
  const filenames = fs.readdirSync(peopleDirectory);
  const jpegFiles = filenames.filter((file) => file.endsWith('.jpg') || file.endsWith('.jpeg'));
  return NextResponse.json(jpegFiles);
}
