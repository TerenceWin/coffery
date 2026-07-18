package transactionController

import (
	"cafe-app-backend/crudAPI/crudTransaction"
	"cafe-app-backend/hub"
	"database/sql"

	"github.com/gin-gonic/gin"
)

type TransactionController struct {
	store *crudTransaction.Store
	hub   *hub.Hub
}

// RegisterTransactionRoutes maps out clear RESTful endpoints bound to resource methods
func RegisterTransactionRoutes(router *gin.Engine, db *sql.DB, h *hub.Hub) {
	ctrl := &TransactionController{
		store: crudTransaction.NewStore(db),
		hub:   h,
	}

	transactions := router.Group("/transactions")
	{
		transactions.GET("", ctrl.GetAll)
		transactions.POST("", ctrl.Create)
		// NOTE: once auth middleware exists, wrap this route so only
		// staff/boss-role JWTs can call it - customers should never
		// be able to mark their own order "paid".
		transactions.PATCH("/:id/status", ctrl.UpdateStatus)
	}
}
