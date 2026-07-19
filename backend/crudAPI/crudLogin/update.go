package crudLogin

// UpdatePasswordHash overwrites a user's stored password hash.
func (s *Store) UpdatePasswordHash(id int, newHash string) error {
	return s.executeUpdate("UPDATE users SET password_hash = $1 WHERE id = $2", newHash, id)
}
