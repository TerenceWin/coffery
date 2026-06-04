package handlers

import (
	"net/http"

	"github.com/coffery/coffee-shop-app/internal/models"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MenuHandler struct {
	db *gorm.DB
}

func NewMenuHandler(db *gorm.DB) *MenuHandler {
	return &MenuHandler{db: db}
}

func (h *MenuHandler) List(c *gin.Context) {
	var items []models.MenuItem
	query := h.db.Where("available = ?", true)

	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}

	if err := query.Find(&items).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "could not fetch menu"})
		return
	}

	c.JSON(http.StatusOK, items)
}
