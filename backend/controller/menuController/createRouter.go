package menuController

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// Create handles incoming POST requests to add a new item to the menu.
// The item's code is generated server-side from its category.
func (ctrl *MenuController) Create(c *gin.Context) {
	var input struct {
		Item      string `json:"item" binding:"required"`
		Category  string `json:"category" binding:"required"`
		Cost      int    `json:"cost" binding:"required"`
		ImagePath string `json:"imagePath" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// Calls the Store method inside your package crudMenu
	code, err := ctrl.store.InsertEntry(input.Item, input.Category, input.Cost, input.ImagePath)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Item added successfully", "code": code})
}
