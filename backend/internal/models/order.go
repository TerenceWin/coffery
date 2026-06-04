package models

import "gorm.io/gorm"

type OrderStatus string

const (
	StatusPending    OrderStatus = "pending"
	StatusPreparing  OrderStatus = "preparing"
	StatusReady      OrderStatus = "ready"
	StatusCompleted  OrderStatus = "completed"
	StatusCancelled  OrderStatus = "cancelled"
)

type Order struct {
	gorm.Model
	UserID     uint        `gorm:"not null;index" json:"user_id"`
	User       User        `json:"user,omitempty"`
	Status     OrderStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	TotalPrice float64     `gorm:"not null" json:"total_price"`
	Notes      string      `json:"notes,omitempty"`
	Items      []OrderItem `json:"items,omitempty"`
}

type OrderItem struct {
	gorm.Model
	OrderID    uint     `gorm:"not null;index" json:"order_id"`
	MenuItemID uint     `gorm:"not null" json:"menu_item_id"`
	MenuItem   MenuItem `json:"menu_item,omitempty"`
	Quantity   int      `gorm:"not null;default:1" json:"quantity"`
	UnitPrice  float64  `gorm:"not null" json:"unit_price"`
}
