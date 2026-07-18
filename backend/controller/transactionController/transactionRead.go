package transactionController

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (ctrl *TransactionController) GetAll(c *gin.Context) {
	txs, err := ctrl.store.GetAllTransactions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch transactions"})
		return
	}
	c.JSON(http.StatusOK, txs)
}
