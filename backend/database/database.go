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

// seedDefaultUsers creates an initial boss/staff account ONLY if the
// corresponding environment variables are set - there is no hardcoded
// username/password anywhere in this codebase. If you don't set these
// env vars, no accounts are created and nobody can log in until you
// insert one yourself.
//
// Set these in Render's environment variables (never commit them):
//
//	SEED_BOSS_USERNAME, SEED_BOSS_PASSWORD, SEED_BOSS_NAME
//	SEED_STAFF_USERNAME, SEED_STAFF_PASSWORD, SEED_STAFF_NAME (optional -
//	once a boss account exists, new staff should be created through the
//	app's account management instead)
func seedDefaultUsers(database *sql.DB) {
	type seed struct {
		usernameEnv  string
		passwordEnv  string
		nameEnv      string
		role         string
		fallbackName string
	}

	seeds := []seed{
		{"SEED_BOSS_USERNAME", "SEED_BOSS_PASSWORD", "SEED_BOSS_NAME", "boss", "Admin Boss"},
		{"SEED_STAFF_USERNAME", "SEED_STAFF_PASSWORD", "SEED_STAFF_NAME", "staff", "Staff"},
	}

	for _, s := range seeds {
		username := os.Getenv(s.usernameEnv)
		password := os.Getenv(s.passwordEnv)
		if username == "" || password == "" {
			continue // not configured for this role - expected until you set the env vars
		}
		name := os.Getenv(s.nameEnv)
		if name == "" {
			name = s.fallbackName
		}

		var exists int
		err := database.QueryRow("SELECT COUNT(*) FROM users WHERE username = $1", username).Scan(&exists)
		if err != nil {
			fmt.Println("Error checking for existing user:", err)
			continue
		}
		if exists > 0 {
			continue
		}

		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			fmt.Println("Error hashing seed password:", err)
			continue
		}

		_, err = database.Exec(
			"INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4)",
			username, string(hash), s.role, name,
		)
		if err != nil {
			fmt.Println("Error seeding default user:", err)
		}
	}
}
