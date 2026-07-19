package crudLogin

import "cafe-app-backend/model"

// GetByUsername looks up a single account by username, regardless of role.
// The caller (login handler) is responsible for checking the role and
// comparing the password hash.
func (s *Store) GetByUsername(username string) (*model.LoginItem, error) {
	var u model.LoginItem
	err := s.db.QueryRow(
		"SELECT id, username, password_hash, role, name FROM users WHERE username = $1",
		username,
	).Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.Name)
	if err != nil {
		return nil, err
	}
	return &u, nil
}
