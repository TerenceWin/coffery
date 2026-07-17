package crudTransaction

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

	affectedRows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if affectedRows == 0 {
		return fmt.Errorf("Execution failed: transaction not found")
	}

	return nil
}
