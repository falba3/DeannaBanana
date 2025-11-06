import { NextRequest, NextResponse } from "next/server";
import { MySQLConnector, BookData } from "../../../lib/mysql";

export async function POST(req: NextRequest) {
  const { cloth, person } = await req.json();

  if (!cloth || !person) {
    return NextResponse.json(
      { error: "Missing cloth or person image" },
      { status: 400 }
    );
  }

  try {
    const db = new MySQLConnector();
    await db.connect();

    const now = new Date();
    const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');

    const clothName = cloth.split('/').pop()?.split('.')[0] || 'unknown_cloth';
    const personName = person.split('/').pop()?.split('.')[0] || 'unknown_person';
    const uniqueTimestamp = Date.now();

    const bookName = `DeannaBanana Virtual Try-On`;
    const bookDescription = `Virtual Try-On generated images`;

    const newBookData: BookData = {
      user_id: 221, // Default user ID, can be made dynamic later
      name: bookName,
      slug: `deannabanana-virtual-try-on-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${now.toTimeString().slice(0, 8).replace(/:/g, '')}`,
      rendered: 0,
      version: 1,
      category_id: 19, // Men's Fashion from frank.py
      modified: formattedDate,
      addEnd: 1,
      coverImage: "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png", // Placeholder
      sharing: 0,
      coverColor: 2,
      dollarsGiven: 0,
      privacy: 0,
      type: 0,
      created: formattedDate,
      coverHexColor: "#336699",
      numLikers: 0,
      description: bookDescription,
      tags: "",
      thumbnailImage: "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png", // Placeholder
      numClips: 0,
      numViews: 0,
      userLanguage: "es-ES",
      embed_code: null,
      thumbnailImageSmall: "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png", // Placeholder
      humanModified: formattedDate,
      coverV3: 1,
      typeFilters: "a:0:{}"
    };

    const bookId = await db.createBook(newBookData);
    await db.disconnect();

    if (bookId) {
      const bookSlug = newBookData.slug; // Get the generated slug
      return NextResponse.json({ bookId, bookSlug }, { status: 200 });
    } else {
      return NextResponse.json(
        { error: "Failed to create book" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create book" },
      { status: 500 }
    );
  }
}
