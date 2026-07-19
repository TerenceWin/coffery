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

// GetByID looks up a single account by id - used for self-service password changes.
func (s *Store) GetByID(id int) (*model.LoginItem, error) {
	var u model.LoginItem
	err := s.db.QueryRow(
		"SELECT id, username, password_hash, role, name FROM users WHERE id = $1",
		id,
	).Scan(&u.ID, &u.Username, &u.PasswordHash, &u.Role, &u.Name)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetAll returns every login account, newest first. Password hashes are
// never selected here - and even if they were, LoginItem's json:"-" tag
// would keep them out of any response.
func (s *Store) GetAll() ([]model.LoginItem, error) {
	rows, err := s.db.Query("SELECT id, username, role, name FROM users ORDER BY id DESC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []model.LoginItem
	for rows.Next() {
		var u model.LoginItem
		if err := rows.Scan(&u.ID, &u.Username, &u.Role, &u.Name); err != nil {
			continue
		}
		users = append(users, u)
	}
	return users, nil
}
