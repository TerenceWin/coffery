package controller

import (
	"cafe-app-backend/model/owner"
	"database/sql"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// RegisterOwnerRoutes sets up all the endpoints for the owner's screen
func RegisterOwnerRoutes(router *gin.Engine, db *sql.DB) {

	// Get the cost of an item by its code
	// Example URL: https://cafe-app-test.onrender.com/cost/C01
	router.GET("/cost/:code", func(c *gin.Context) {
		code := c.Param("code")

		cost, err := owner.GetCost(db, code)
		if err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": code,
			"cost": cost,
		})
	})

	// Update the price of an item
	// JSON from the frontend {"code": "C01", "price": 400}
	router.POST("/update-cost", func(c *gin.Context) {
		var input struct {
			Code  string `json:"code" binding:"required"` // Both required makes it so it is needed
			Price *int   `json:"price" binding:"required"`
		}

		// Check if the request is valid
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}

		// Added handling for the error returned from your updated owner package
		err := owner.UpdateCost(db, input.Code, *input.Price)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"message": "Price updated successfully to " + strconv.Itoa(*input.Price) + " K",
		})
	})

	// Add a new item to the menu (Frontend route for InsertEntry)
	// JSON from the frontend {"item": "Espresso", "code": "E01", "cost": 350}
	router.POST("/add-item", func(c *gin.Context) {
		var input struct {
			Item string `json:"item" binding:"required"`
			Code string `json:"code" binding:"required"`
			Cost int    `json:"cost" binding:"required"`
		}

		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
			return
		}

		err := owner.InsertEntry(db, input.Item, input.Code, input.Cost)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item added successfully"})
	})

	// Delete an item from the menu (Frontend route for RemoveEntry)
	// Example URL: https://cafe-app-test.onrender.com/delete-item/C01
	router.DELETE("/delete-item/:code", func(c *gin.Context) {
		code := c.Param("code")

		err := owner.RemoveEntry(db, code)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "Item " + code + " deleted successfully"})
	})
}
