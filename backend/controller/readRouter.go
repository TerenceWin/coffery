package controller

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (ctrl *MenuController) GetAll(c *gin.Context) {
	// This is where you actually call your database package!
	items, err := ctrl.store.GetAllItems()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch menu"})
		return
	}
	c.JSON(http.StatusOK, items)
}
