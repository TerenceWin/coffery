package crudLogin

// InsertUser adds a new login account and returns its new id.
func (s *Store) InsertUser(username, passwordHash, role, name string) (int, error) {
	var id int
	err := s.db.QueryRow(
		"INSERT INTO users (username, password_hash, role, name) VALUES ($1, $2, $3, $4) RETURNING id",
		username, passwordHash, role, name,
	).Scan(&id)
	if err != nil {
		return 0, err
	}
	return id, nil
}
