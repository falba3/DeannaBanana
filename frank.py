import os
from dotenv import load_dotenv

import datetime
import mysql.connector


# Load environment variables from .env file
load_dotenv()


class MySQLConnector:
    def __init__(self):
        self.host = os.getenv("DB_HOST")
        self.port = 3306 # Default to 3306 if not set
        self.username = os.getenv("DB_USERNAME")
        self.password = os.getenv("DB_PASSWORD")
        self.database = os.getenv("DB_DATABASE")
        self.connection = None

    def connect(self):
        try:
            self.connection = mysql.connector.connect(
                host=self.host,
                port=self.port,
                user=self.username,
                password=self.password,
                database=self.database
            )
            print("Connected to the database successfully!")
        except mysql.connector.Error as err:
            print(f"Error connecting to the database: {err}")

    def disconnect(self):
        if self.connection:
            self.connection.close()
            print("Disconnected from the database.")

    def test_connection(self):
        if self.connection:
            print("Connection test successful.")
        else:
            print("No active connection. Please connect first.")

    def test(self):
        self.connect()
        self.test_connection()
        self.disconnect()

    def execute_query(self, sql_query, params=None):
        """
        Executes a SQL query and returns the results.
        Use params for parameterized queries to prevent SQL injection.
        """

        if not self.connection or not self.connection.is_connected():
            print("Not connected to the database. Please connect first.")
            return None

        cursor = None # Initialize cursor to None
        try:
            cursor = self.connection.cursor(dictionary=True)
            cursor.execute(sql_query, params)
            if sql_query.strip().upper().startswith(("SELECT", "SHOW", "DESCRIBE")):
                result = cursor.fetchall()
            else:
                self.connection.commit() # Commit changes for INSERT, UPDATE, DELETE
                result = cursor.rowcount # Return number of affected rows
            return result

        except mysql.connector.Error as err:
            print(f"Error executing query: {err}")
            return None

        finally:
            if cursor:
                cursor.close() 

    def create_book(self, book_data):
        try:
            cursor = self.connection.cursor()
            insert_query = """
                INSERT INTO cliperest_book
                (user_id, name, slug, rendered, version, category_id, modified, addEnd, coverImage, sharing,
                coverColor, dollarsGiven, privacy, type, created, coverHexColor, numLikers, description,
                tags, thumbnailImage, numClips, numViews, userLanguage, embed_code, thumbnailImageSmall,
                humanModified, coverV3, typeFilters)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            cursor.execute(insert_query, tuple(book_data.values()))
            self.connection.commit()
            book_id = cursor.lastrowid  # Obtiene el ID del registro insertado
            print(f"Book record inserted successfully with ID: {book_id}")
            return book_id  # Devuelve el ID del libro insertado
        except mysql.connector.Error as err:
            print(f"Error creating book: {err}")
            return None  # Devuelve None si hay un error
    
    def create_clipping(self, clipping_data):
        try:
            cursor = self.connection.cursor()
            insert_query = """
            INSERT INTO cliperest_clipping
            (book_id, caption, text, thumbnail, useThumbnail, type, url, created, num, migratedS3, modified)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) 
            """

            cursor.execute(insert_query, tuple(clipping_data.values()))
            self.connection.commit()
            print("Clipping record inserted successfully!")
            clip_id = cursor.lastrowid  # Obtiene el ID del registro insertado   
            return clip_id  # Devuelve el ID del libro insertado            
        except mysql.connector.Error as err:
            print(f"Error creating clipping: {err}")
            return None
    
    # Interactive SQL Querier
    def SQL_queries(self):
        if self.connection and self.connection.is_connected():
            print("\n--- Interactive Query Executor ---")

            while True:
                query = input("Enter SQL query (or press ENTER to exit): ").strip()
                if not query:
                    break
                res = self.execute_query(query)
                print("-" * 10)
                if res is not None:
                    if isinstance(res, list):
                        if res:
                            for row in res:
                                print(row)
                        else:
                            print("Query executed successfully, no results to display.")
                    else:
                        print(f"Query executed successfully. Affected rows: {res}")
                else:
                    print("Query failed or returned no data.")
                print("-" * 10)

    

# Test Book

# fechas
fecha_hoy = datetime.datetime.now()
fecha_str = fecha_hoy.strftime("%d/%m/%Y %H:%M")
fecha_str_americana = fecha_hoy.strftime("%Y-%m-%d %H:%M")
fecha_str_slug = fecha_hoy.strftime("%d-%m-%Y_%H-%M")


# BOOK DATA
datos_config= {
    "nombre": "DeannaBanana ",
    "nombre_url": "deanna-banana-",
    "descripcion": "Virtual Try On",
    "codigo_noticias": 19, # Men's Fashion
    "servicio": "DeannaBanana",
    "seccion_codigo": None,
    "tipo_info": None
}

new_book_data = {
        "user_id": 221, # Francisco Alba
        "name": "DeannaBanana" + " " + fecha_str,
        "slug": datos_config["nombre_url"] + fecha_str_slug,
        "rendered": 0,
        "version": 1,
        "category_id": datos_config["codigo_noticias"],
        "modified": fecha_str_americana,
        "addEnd": 1,
        "coverImage": "https://www.deanna2u.com/img/Logo_H_blanco.png",
        "sharing": 0,
        "coverColor": 2,
        "dollarsGiven": 0,
        "privacy": 0,
        "type": 0,
        "created": fecha_str_americana,
        "coverHexColor": "#336699",
        "numLikers": 0,
        "description": datos_config["descripcion"] + " " + fecha_str,
        "tags": "",
        "thumbnailImage": "https://www.deanna2u.com/img/Logo_H_blanco.png",
        "numClips": 1, # SENSITIVE
        "numViews": 0,
        "userLanguage": "es-ES",
        "embed_code": None,
        "thumbnailImageSmall": "https://www.deanna2u.com/img/Logo_H_blanco.png",
        "humanModified": fecha_str_americana,
        "coverV3": 1,
        "typeFilters": "a:0:{}"
    }


    
# SIMULATIONS
db_connection = MySQLConnector()
db_connection.connect()

# SQL QUERIES
# db_connection.SQL_queries()

# NEW BOOK
new_book_id = db_connection.create_book(new_book_data)
print(f"New book number {new_book_id}")

# NEW CLIPPING
new_clipping_data = {
                "book_id": new_book_id, # My sample book
                "caption": "Hello",
                "text": "",
                "thumbnail": "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png",
                "useThumbnail": 1,
                "type": 1,
                "url": "https://www.gstatic.com/lamda/images/gemini_aurora_thumbnail_4g_e74822ff0ca4259beb718.png",
                "created": fecha_str_americana,
                "num": 1,
                "migratedS3": 0,
                "modified": fecha_str_americana
            }
new_clipping_id = db_connection.create_clipping(new_clipping_data)
print(f"New clipping number {new_clipping_id}")

db_connection.disconnect()



    