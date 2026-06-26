package crudMenu

func (s *Store) RemoveEntry(code string) error {
	return s.executeUpdate("DELETE FROM menu WHERE code = $1", code)
}
