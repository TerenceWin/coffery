package crudMenu

// UpdateCost changes the cost of an item matching the code
func (s *Store) UpdateCost(code string, newPrice int) error {
	return s.executeUpdate("UPDATE menu SET cost = $1 WHERE code = $2", newPrice, code)
}

// UpdateAvailability toggles item visibility on the menu
func (s *Store) UpdateAvailability(code string, avail bool) error {
	return s.executeUpdate("UPDATE menu SET availability = $1 WHERE code = $2", avail, code)
}
