package menuController

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

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

// UpdateName renames a menu item and broadcasts the change so every open
// customer/boss menu view updates live.
func (ctrl *MenuController) UpdateName(c *gin.Context) {
	code := c.Param("code")
	var input struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	name := strings.TrimSpace(input.Name)
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name cannot be empty"})
		return
	}

	if err := ctrl.store.UpdateName(code, name); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// json.Marshal (not fmt.Sprintf) because unlike code/avail, name is
	// free-form user text and must be properly escaped for the WS payload.
	payload, err := json.Marshal(struct {
		Type string `json:"type"`
		Code string `json:"code"`
		Name string `json:"name"`
	}{Type: "name_update", Code: code, Name: name})
	if err == nil {
		ctrl.hub.Broadcast(payload)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Name updated successfully"})
}
