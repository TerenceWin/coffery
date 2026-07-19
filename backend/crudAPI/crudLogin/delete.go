package crudLogin

// DeleteUser removes a login account by id.
func (s *Store) DeleteUser(id int) error {
	return s.executeUpdate("DELETE FROM users WHERE id = $1", id)
}
