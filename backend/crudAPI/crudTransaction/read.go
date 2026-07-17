package crudTransaction

import (
	"cafe-app-backend/model"
)

func (s *Store) GetAllTransactions() ([]model.Transaction, error) {
	rows, err := s.db.Query(
		`SELECT id, table_num, items, total, status, created_by, created_at
		 FROM transactions
		 ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []model.Transaction
	for rows.Next() {
		var t model.Transaction
		err := rows.Scan(&t.ID, &t.TableNum, &t.Items, &t.Total, &t.Status, &t.CreatedBy, &t.CreatedAt)
		if err != nil {
			continue // Log error or handle later
		}
		txs = append(txs, t)
	}

	return txs, nil
}
