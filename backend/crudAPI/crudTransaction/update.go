package crudTransaction

// UpdateStatus changes a transaction's status (e.g. pending -> paid, pending -> cancelled)
func (s *Store) UpdateStatus(id int, newStatus string) error {
	return s.executeUpdate("UPDATE transactions SET status = $1 WHERE id = $2", newStatus, id)
}
