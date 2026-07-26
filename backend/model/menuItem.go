package model

type MenuItem struct {
	ID        int    `json:"id"`
	Item      string `json:"item"`
	Code      string `json:"code"`
	Category  string `json:"category"`
	Cost      int    `json:"cost"`
	Available bool   `json:"available"`
	ImagePath string `json:"imagePath"`
}
