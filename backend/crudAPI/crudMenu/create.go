package crudMenu

import (
	"cafe-app-backend/model"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5/pgconn"
	_ "github.com/jackc/pgx/v5/stdlib"
)

type localMenuItem model.MenuItem

// InsertEntry adds a new item to the menu
func (s *Store) InsertEntry(item string, code string, cost int, imagePath string) error {
	_, err := s.db.Exec("INSERT INTO menu (item, code, cost, imagePath) VALUES ($1, $2, $3, $4)", item, code, cost, imagePath)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return fmt.Errorf("duplicate! The code '%s' already exists", code)
		}
		return err
	}
	return nil
}
