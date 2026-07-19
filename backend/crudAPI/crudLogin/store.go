package crudLogin

import "database/sql"

type Store struct {
	db *sql.DB
}

// NewStore initializes a new database store instance
func NewStore(db *sql.DB) *Store {
	return &Store{db: db}
}
