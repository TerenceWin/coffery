package crudMenu

import (
	"cafe-app-backend/model"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type localMenuItem model.MenuItem

// categoryPrefixes maps a menu category to the prefix used when generating
// its item code (e.g. Coffee -> C001, C002, ...).
var categoryPrefixes = map[string]string{
	"Coffee":         "C",
	"Special Coffee": "SC",
	"Drinks":         "D",
	"Bread":          "B",
	"Fried Food":     "FF",
	"Dessert":        "DS",
	"Others":         "O",
}

// nextCodeForPrefix looks at existing codes matching "^<prefix>[0-9]+$" and
// returns prefix + the next zero-padded number (e.g. "C" -> "C003").
func (s *Store) nextCodeForPrefix(prefix string) (string, error) {
	rows, err := s.db.Query(`SELECT code FROM menu WHERE code ~ ('^' || $1 || '[0-9]+$')`, prefix)
	if err != nil {
		return "", err
	}
	defer rows.Close()

	max := 0
	for rows.Next() {
		var code string
		if err := rows.Scan(&code); err != nil {
			continue
		}
		numPart := strings.TrimPrefix(code, prefix)
		if n, err := strconv.Atoi(numPart); err == nil && n > max {
			max = n
		}
	}
	if err := rows.Err(); err != nil {
		return "", err
	}

	return fmt.Sprintf("%s%03d", prefix, max+1), nil
}

// InsertEntry adds a new item to the menu. The item's code is generated
// server-side from its category (e.g. Coffee -> C001, C002, ...); it is not
// supplied by the caller.
func (s *Store) InsertEntry(item string, category string, cost int, imagePath string) (string, error) {
	prefix, ok := categoryPrefixes[category]
	if !ok {
		return "", fmt.Errorf("invalid category: %s", category)
	}

	// A handful of retries covers the rare race where two requests generate
	// the same code concurrently; the UNIQUE constraint on code catches it.
	for attempt := 0; attempt < 5; attempt++ {
		code, err := s.nextCodeForPrefix(prefix)
		if err != nil {
			return "", err
		}

		_, err = s.db.Exec("INSERT INTO menu (item, code, cost, imagePath) VALUES ($1, $2, $3, $4)", item, code, cost, imagePath)
		if err == nil {
			return code, nil
		}

		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			if pgErr.ConstraintName == "menu_code_key" {
				continue // code collision, try again with a fresh number
			}
			return "", fmt.Errorf("duplicate! The item '%s' already exists", item)
		}
		return "", err
	}

	return "", fmt.Errorf("failed to generate a unique code, please try again")
}
