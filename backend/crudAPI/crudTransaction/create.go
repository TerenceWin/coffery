package crudTransaction

// InsertEntry adds a new transaction, always starting as "pending"
func (s *Store) InsertEntry(tableNum string, itemsJSON string, total int, createdBy int) (int, error) {
	var id int
	err := s.db.QueryRow(
		`INSERT INTO transactions (table_num, items, total, status, created_by)
		 VALUES ($1, $2, $3, 'pending', $4)
		 RETURNING id`,
		tableNum, itemsJSON, total, createdBy,
	).Scan(&id)

	if err != nil {
		return 0, err
	}
	return id, nil
}
