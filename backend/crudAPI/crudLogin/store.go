package crudLogin

import (
	"database/sql"
	"fmt"
)

type Store struct {
	db *sql.DB
}

// NewStore initializes a new database store instance
func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}

func (s *Store) executeUpdate(query string, args ...interface{}) error {
	result, err := s.db.Exec(query, args...)
	if err != nil {
		return err
	}
	affected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affected == 0 {
		return fmt.Errorf("action failed: account not found")
	}
	return nil
}
