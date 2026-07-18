package transactionController

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

var validStatuses = map[string]bool{
	"pending":   true,
	"paid":      true,
	"cancelled": true,
}

// UpdateStatus flips a transaction's status
// once cash/card has actually been collected at the counter.
func (ctrl *TransactionController) UpdateStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid transaction id"})
		return
	}

	var input struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
		return
	}

	if !validStatuses[input.Status] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be pending, paid, or cancelled"})
		return
	}

	if err := ctrl.store.UpdateStatus(id, input.Status); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Broadcast so every connected dashboard updates in real time
	msg := fmt.Sprintf(`{"type": "transaction_status_update", "id": %d, "status": "%s"}`, id, input.Status)
	ctrl.hub.Broadcast([]byte(msg))

	c.JSON(http.StatusOK, gin.H{"message": "Status updated successfully"})
}
