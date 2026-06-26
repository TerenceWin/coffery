package controller

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

func (ctrl *MenuController) UpdateAvailability(c *gin.Context) {
	code := c.Param("code")
	var input struct {
		Avail *bool `json:"avail" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if err := ctrl.store.UpdateAvailability(code, *input.Avail); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast the websocket message to the frontend via the hub
	msg := fmt.Sprintf(`{"type": "availability_update", "code": "%s", "available": %t}`, code, *input.Avail)
	ctrl.hub.Broadcast([]byte(msg))

	c.JSON(http.StatusOK, gin.H{"message": "Availability updated successfully"})
}

// UpdateCost updates the pricing information for a specified menu item
func (ctrl *MenuController) UpdateCost(c *gin.Context) {
	code := c.Param("code")
	var input struct {
		Price *int `json:"price" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if err := ctrl.store.UpdateCost(code, *input.Price); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Price updated successfully to %d K", *input.Price),
	})
}
