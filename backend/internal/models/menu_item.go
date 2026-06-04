package models

import "gorm.io/gorm"

type MenuItem struct {
	gorm.Model
	Name        string  `gorm:"not null" json:"name"`
	Description string  `json:"description"`
	Price       float64 `gorm:"not null" json:"price"`
	Category    string  `gorm:"index" json:"category"`
	Available   bool    `gorm:"default:true" json:"available"`
	ImageURL    string  `json:"image_url,omitempty"`
}
