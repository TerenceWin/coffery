package database

import (
	"database/sql"
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
		cost INTEGER
	)`

	// Defer executes once the return statement is executed. Executed by LIFO
	statement, err := database.Prepare(query)
	if err != nil {
		panic(err)
	}
	defer statement.Close()

	_, err = statement.Exec()
	if err != nil {
		panic(err)
	}

	return database
}
