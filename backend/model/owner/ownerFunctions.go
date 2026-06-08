package owner

import (
	"database/sql"
	"errors"
	"fmt"
	"strconv"

	// Using pgconn for specific Postgres error codes for duplicates
	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

func InsertEntry(database *sql.DB, item string, code string, cost int) error {

	// Making an sql statement with either prepare or query (query returns rows, Exec with a statement does not)
	// Changed placeholders from ? in sqlite3 to $1, $2, $3 for Postgres
	statement, err := database.Prepare("INSERT INTO menu (item, code, cost) VALUES ($1, $2, $3)")

	if err != nil {
		return err
	}
	defer statement.Close() // Added: Prevents connection leaks

	_, err = statement.Exec(item, code, cost)

	if err != nil {
		// Making a variable to hold the error that the postgres library will throw (23505 is the code for unique constraints)
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) {
			if pgErr.Code == "23505" {
				return fmt.Errorf("Duplicate! The code '%s' already exists", code)
			}
		}
		return err
	}
	return nil

}

func RemoveEntry(database *sql.DB, code string) error { // Added: Returns error for the frontend

	// TODO Make check if it was in the database or not! FIXED
	statement, err := database.Prepare("DELETE FROM menu WHERE code = $1")
	if err != nil {
		return err
	}
	defer statement.Close() // Close the statements to remove resource leaks

	result, err := statement.Exec(code)
	if err != nil {
		return err
	}

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affectedRows == 0 {
		return fmt.Errorf("cannot delete: item with code '%s' does not exist", code)
	}

	return nil
}

func UpdateCost(database *sql.DB, code string, newPrice int) error { // Added: Returns error for the frontend

	// TODO Also need some error checking here as well! FIXED

	statement, err := database.Prepare("UPDATE menu SET cost = $1 Where code = $2")
	if err != nil {
		return err
	}
	defer statement.Close()

	result, err := statement.Exec(newPrice, code)
	if err != nil {
		return err
	}

	// Show the change
	affectedRows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affectedRows == 0 {
		return fmt.Errorf("cannot update: item with code '%s' does not exist", code)
	}

	fmt.Printf("Updated %d\n", affectedRows)
	return nil
}

func GetCost(database *sql.DB, code string) (int, error) {

	var cost int
	// Changed placeholder from ? to $1
	err := database.QueryRow("SELECT cost FROM menu WHERE code = $1", code).Scan(&cost)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) { // Optimized: Using errors.Is is cleaner in Go
			return 0, fmt.Errorf("The item with code '%s' does not exist!", code)
		} else {
			return 0, err
		}
	}

	return cost, nil
}

func PrintAllRecords(database *sql.DB) {

	rows, err := database.Query("SELECT id, item, code, cost FROM menu")
	if err != nil {
		fmt.Println("Error querying records:", err)
		return
	}
	defer rows.Close() // SAme as statements, have to close rows when done querying

	var id int
	var item string
	var code string
	var cost int

	for rows.Next() {
		err := rows.Scan(&id, &item, &code, &cost)
		if err != nil {
			fmt.Println("Error scanning row:", err)
			continue
		}
		fmt.Println(strconv.Itoa(id) + ": " + item + " Item code: " + code + " Cost: " + strconv.Itoa(cost) + " yen")
	}
}
