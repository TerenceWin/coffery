package crudMenu

import (
	"cafe-app-backend/model"
)

func (s *Store) GetAllItems() ([]model.MenuItem, error) {
	rows, err := s.db.Query("SELECT id, item, code, cost, availability, imagePath FROM menu")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []model.MenuItem
	for rows.Next() {
		var i model.MenuItem
		err := rows.Scan(&i.ID, &i.Item, &i.Code, &i.Cost, &i.Available, &i.ImagePath)
		if err != nil {
			continue // Log error or handle later
		}
		items = append(items, i)
	}

	return items, nil
}
