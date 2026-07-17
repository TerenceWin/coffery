package controller

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

// Create handles incoming POST requests to place a new order/transaction.
// Every transaction starts as "pending" - status changes happen via a
// separate, staff-only endpoint (see transactionUpdate.go).
func (ctrl *TransactionController) Create(c *gin.Context) {
	var input struct {
		TableNum string `json:"tableNum" binding:"required"`
		Items    []struct {
			Name  string `json:"name"`
			Price int    `json:"price"`
			Qty   int    `json:"qty"`
		} `json:"items" binding:"required"`
		Total     int `json:"total" binding:"required"`
		CreatedBy int `json:"createdBy"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	itemsJSON, err := json.Marshal(input.Items)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid items payload"})
		return
	}

	id, err := ctrl.store.InsertEntry(input.TableNum, string(itemsJSON), input.Total, input.CreatedBy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Let the staff/boss dashboard know a new order just came in
	ctrl.hub.Broadcast([]byte(`{"type": "new_transaction", "id": ` + strconv.Itoa(id) + `}`))

	c.JSON(http.StatusCreated, gin.H{"message": "Order placed successfully", "id": id})
}
