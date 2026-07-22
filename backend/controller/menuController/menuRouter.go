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
	// imagesDir string // ── image upload: path to Render disk folder (disabled for study)
}

func RegisterMenuRoutes(router *gin.Engine, db *sql.DB, h *hub.Hub) {
	ctrl := &MenuController{
		store: crudMenu.NewStore(db),
		hub:   h,
		// imagesDir: imagesDir, // ── image upload: stored on the struct so UploadImage can use it
	}

	menu := router.Group("/menu-items")
	{
		menu.GET("", ctrl.GetAll)
		menu.POST("", ctrl.Create)
		menu.POST("/:code/availability", ctrl.UpdateAvailability)
		menu.PATCH("/:code/cost", ctrl.UpdateCost)
		menu.PATCH("/:code/name", ctrl.UpdateName)
		menu.DELETE("/:code", ctrl.Delete)
	}

	// ── image upload route (disabled for study) ───────────────────────────────
	// Receives the image file from the frontend and calls UploadImage in uploadRouter.go
	// router.POST("/upload-image", ctrl.UploadImage)
	// ─────────────────────────────────────────────────────────────────────────
}
