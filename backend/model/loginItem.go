package model

type loginItem struct {
	ID           int    `json:"id"`
	Username     string `json:"username"`
	PasswordHash string `json:"-"` // dash to signal to not include with the json
	Role         string `json:"role"`
	Name         string `json:"name"`
}
