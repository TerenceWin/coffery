package database

import (
	"database/sql"
	"fmt"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver
	"golang.org/x/crypto/bcrypt"
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
    ADD COLUMN IF NOT EXISTS imagePath TEXT DEFAULT true;`

	_, err = database.Exec(alterQuery2)
	if err != nil {
		fmt.Println("Error adding imagePath:", err)
	}

	// Creating the table for transactions/orders
	transactionsQuery := `
    CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        table_num TEXT NOT NULL,
        items JSONB NOT NULL,
        total INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT now()
    )`

	_, err = database.Exec(transactionsQuery)
	if err != nil {
		panic(err)
	}

	// Creating the table for login accounts
	usersQuery := `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL
    )`

	_, err = database.Exec(usersQuery)
	if err != nil {
		panic(err)
	}

	seedDefaultUsers(database)

	return database
}

// seedDefaultUsers creates the demo boss/staff accounts the first time the
// app runs against a fresh database, so the login screen's hinted demo
// credentials keep working. It's a no-op if accounts already exist.
func seedDefaultUsers(database *sql.DB) {
	defaults := []struct {
		username string
		password string
		role     string
		name     string
	}{
		{"boss", "boss123", "boss", "Admin Boss"},
		{"staff001", "staff123", "staff", "Staff 1"},
	}

	for _, u := range defaults {
		var exists int
		err := database.QueryRow("SELECT COUNT(*) FROM users WHERE username = $1", u.username).Scan(&exists)
		if err != nil {
			fmt.Println("Error checking for existing user:", err)
			continue
		}
		if exists > 0 {
			continue
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Println("Error hashing default password:", err)
			continue
		}

		_, err = database.Exec(
			"INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)",
			u.username, string(hash), u.role, u.name,
		)
		if err != nil {
			fmt.Println("Error seeding default user:", err)
		}
	}
}
