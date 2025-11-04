import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export interface BookData {
    user_id: number;
    name: string;
    slug: string;
    rendered: number;
    version: number;
    category_id: number;
    modified: string;
    addEnd: number;
    coverImage: string;
    sharing: number;
    coverColor: number;
    dollarsGiven: number;
    privacy: number;
    type: number;
    created: string;
    coverHexColor: string;
    numLikers: number;
    description: string;
    tags: string;
    thumbnailImage: string;
    numClips: number;
    numViews: number;
    userLanguage: string;
    embed_code: string | null;
    thumbnailImageSmall: string;
    humanModified: string;
    coverV3: number;
    typeFilters: string;
}

export interface ClippingData {
    book_id: number;
    caption: string;
    text: string;
    thumbnail: string;
    useThumbnail: number;
    type: number;
    url: string;
    created: string;
    num: number;
    migratedS3: number;
    modified: string;
}

export class MySQLConnector {
    private connection: mysql.Connection | null = null;
    private host: string;
    private port: number;
    private username: string;
    private password?: string;
    private database: string;

    constructor() {
        this.host = process.env.DB_HOST || 'localhost';
        this.port = parseInt(process.env.DB_PORT || '3306', 10);
        this.username = process.env.DB_USERNAME || 'root';
        this.password = process.env.DB_PASSWORD;
        this.database = process.env.DB_DATABASE || 'cliperest';
    }

    public async connect(): Promise<void> {
        try {
            this.connection = await mysql.createConnection({
                host: this.host,
                port: this.port,
                user: this.username,
                password: this.password,
                database: this.database,
            });
            console.log('Connected to the database successfully!');
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error connecting to the database: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while connecting to the database: ${err}`);
            }
            this.connection = null;
        }
    }

    public async disconnect(): Promise<void> {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
            console.log('Disconnected from the database.');
        }
    }

    public async executeQuery<T>(sqlQuery: string, params?: (string | number | boolean | null)[]): Promise<T | null> {
        if (!this.connection) {
            console.error('Not connected to the database. Please connect first.');
            return null;
        }

        try {
            const [rows] = await this.connection.execute(sqlQuery, params);
            if (sqlQuery.trim().toUpperCase().startsWith('SELECT') || sqlQuery.trim().toUpperCase().startsWith('SHOW') || sqlQuery.trim().toUpperCase().startsWith('DESCRIBE')) {
                return rows as T;
            } else {
                // For INSERT, UPDATE, DELETE, rows typically contains OkPacket
                const okPacket = rows as mysql.OkPacket;
                return okPacket.affectedRows as T;
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error executing query: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while executing query: ${err}`);
            }
            return null;
        }
    }

    public async createBook(bookData: BookData): Promise<number | null> {
        if (!this.connection) {
            console.error('Not connected to the database. Please connect first.');
            return null;
        }

        const insertQuery = `
            INSERT INTO cliperest_book
            (user_id, name, slug, rendered, version, category_id, modified, addEnd, coverImage, sharing,
            coverColor, dollarsGiven, privacy, type, created, coverHexColor, numLikers, description,
            tags, thumbnailImage, numClips, numViews, userLanguage, embed_code, thumbnailImageSmall,
            humanModified, coverV3, typeFilters)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = Object.values(bookData);

        try {
            const [result] = await this.connection.execute(insertQuery, values);
            const okPacket = result as mysql.OkPacket;
            console.log(`Book record inserted successfully with ID: ${okPacket.insertId}`);
            return okPacket.insertId;
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error creating book: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while creating book: ${err}`);
            }
            return null;
        }
    }

    public async createClipping(clippingData: ClippingData): Promise<number | null> {
        if (!this.connection) {
            console.error('Not connected to the database. Please connect first.');
            return null;
        }

        const insertQuery = `
            INSERT INTO cliperest_clipping
            (book_id, caption, text, thumbnail, useThumbnail, type, url, created, num, migratedS3, modified)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = Object.values(clippingData);

        try {
            const [result] = await this.connection.execute(insertQuery, values);
            const okPacket = result as mysql.OkPacket;
            console.log(`Clipping record inserted successfully with ID: ${okPacket.insertId}`);
            return okPacket.insertId;
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error creating clipping: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while creating clipping: ${err}`);
            }
            return null;
        }
    }

    public async findOrCreateBook(userId: number, bookName: string, description: string, coverImage: string, thumbnailImage: string, userLanguage: string): Promise<number | null> {
        if (!this.connection) {
            console.error('Not connected to the database. Please connect first.');
            return null;
        }

        // Try to find an existing book
        const selectQuery = "SELECT id FROM cliperest_book WHERE user_id = ? AND name = ?";
        try {
            const [rows] = await this.connection.execute(selectQuery, [userId, bookName]);
            const existingBook = rows as mysql.RowDataPacket[];
            if (existingBook.length > 0 && existingBook[0] && existingBook[0].id) {
                console.log(`Found existing book with ID: ${existingBook[0].id}`);
                return existingBook[0].id;
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error finding book: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while finding book: ${err}`);
            }
            // Continue to create if finding fails
        }

        // If no existing book, create a new one
        const now = new Date();
        const formattedDate = now.toISOString().slice(0, 19).replace('T', ' ');
        const slugDate = now.toISOString().slice(0, 10).replace(/-/g, '') + '-' + now.toTimeString().slice(0, 8).replace(/:/g, '');

        const newBookData: BookData = {
            user_id: userId,
            name: bookName,
            slug: `${bookName.toLowerCase().replace(/ /g, '-')}-${slugDate}`,
            rendered: 0,
            version: 1,
            category_id: 19, // Men's Fashion from frank.py
            modified: formattedDate,
            addEnd: 1,
            coverImage: coverImage,
            sharing: 0,
            coverColor: 2,
            dollarsGiven: 0,
            privacy: 0,
            type: 0,
            created: formattedDate,
            coverHexColor: "#336699",
            numLikers: 0,
            description: description,
            tags: "",
            thumbnailImage: thumbnailImage,
            numClips: 0, // Initial numClips is 0
            numViews: 0,
            userLanguage: userLanguage,
            embed_code: null,
            thumbnailImageSmall: thumbnailImage,
            humanModified: formattedDate,
            coverV3: 1,
            typeFilters: "a:0:{}"
        };

        return this.createBook(newBookData);
    }

    public async incrementBookNumClips(bookId: number): Promise<boolean> {
        if (!this.connection) {
            console.error('Not connected to the database. Please connect first.');
            return false;
        }

        const updateQuery = `
            UPDATE cliperest_book
            SET numClips = numClips + 1
            WHERE id = ?
        `;

        try {
            const [result] = await this.connection.execute(updateQuery, [bookId]);
            const okPacket = result as mysql.OkPacket;
            if (okPacket.affectedRows > 0) {
                console.log(`numClips incremented for book ID: ${bookId}`);
                return true;
            } else {
                console.warn(`Book with ID ${bookId} not found, numClips not updated.`);
                return false;
            }
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error(`Error incrementing numClips for book ID ${bookId}: ${err.message}`);
            } else {
                console.error(`An unknown error occurred while incrementing numClips for book ID ${bookId}: ${err}`);
            }
            return false;
        }
    }
}
