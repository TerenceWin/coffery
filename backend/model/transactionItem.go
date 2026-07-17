package model

type Transaction struct {
	ID        int    `json:"id"`
	TableNum  string `json:"tableNum"`
	Items     string `json:"items"` // raw JSON string jere for the items
	Total     int    `json:"total"`
	Status    string `json:"status"`
	CreatedBy int    `json:"createdBy"`
	CreatedAt string `json:"createdAt"`
}
