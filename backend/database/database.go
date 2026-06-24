package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver
)

func InitializeDB() *sql.DB {

	// connection to the Render database (Environment variable)
	url := os.Getenv("DATABASE_URL")

	// pgx is the driver instead of sqlite3 in the other case
	database, err := sql.Open("pgx", url)

	if err != nil {
		panic(err)
	}

	// Creating the database table menu
	query := `
    CREATE TABLE IF NOT EXISTS menu (
        id SERIAL PRIMARY KEY, 
        item TEXT UNIQUE, 
        code TEXT UNIQUE, 
        cost INTEGER,
        availability BOOLEAN DEFAULT true,
		imagePath TEXT
    )`

	// Defer executes once the return statement is executed. Executed by LIFO
	_, err = database.Exec(query)
	if err != nil {
		panic(err)
	}

	// Remove these manual entries later

	// Automatically add the column if it's missing
	alterQuery := `
    ALTER TABLE menu 
    ADD COLUMN IF NOT EXISTS availability BOOLEAN DEFAULT true;`

	_, err = database.Exec(alterQuery)
	if err != nil {
		fmt.Println("Error adding column:", err) // Just log it, don't panic
	}

	alterQuery2 := `
    ALTER TABLE menu 
    ADD COLUMN IF NOT EXISTS imagePatch TEXT DEFAULT true;`

	_, err = database.Exec(alterQuery2)
	if err != nil {
		fmt.Println("Error adding imagePatch:", err)
	}

	return database
}
