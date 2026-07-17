package menuController

import (
	"cafe-app-backend/crudAPI/crudMenu"
	"cafe-app-backend/hub"
	"database/sql"

	"github.com/gin-gonic/gin"
)

type MenuController struct {
	store *crudMenu.Store
	hub   *hub.Hub
}

// RegisterOwnerRoutes maps out clear RESTful endpoints bound to resource methods
func RegisterMenuRoutes(router *gin.Engine, db *sql.DB, h *hub.Hub) {
	ctrl := &MenuController{
		store: crudMenu.NewStore(db),
		hub:   h,
	}

	// Standardized resource-based API paths
	menu := router.Group("/menu-items")
	{
		menu.GET("", ctrl.GetAll)
		menu.POST("", ctrl.Create)
		menu.PATCH("/:code/availability", ctrl.UpdateAvailability)
		menu.PATCH("/:code/cost", ctrl.UpdateCost)
		menu.DELETE("/:code", ctrl.Delete)
	}
}
