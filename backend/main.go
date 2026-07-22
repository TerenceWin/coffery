package main

import (
	"cafe-app-backend/controller"
	"cafe-app-backend/controller/authenticationController"
	"cafe-app-backend/controller/menuController"
	"cafe-app-backend/controller/transactionController"
	"cafe-app-backend/database"
	"cafe-app-backend/hub"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Take gin off of debug mode
	// gin.SetMode(gin.ReleaseMode)

	db := database.InitializeDB()
	defer db.Close()

	myHub := hub.NewHub()

	// Resolve the images directory (Render disk mounts at /var/data)
	imagesDir := os.Getenv("IMAGES_DIR")
	if imagesDir == "" {
		imagesDir = "/var/data/images"
	}
	if err := os.MkdirAll(imagesDir, 0755); err != nil {
		panic("cannot create images dir: " + err.Error())
	}

	// Initialize the Gin
	router := gin.Default()
	router.SetTrustedProxies(nil)

	// Allow the frontend to talk to this backend.
	// cors.Default() only allows Origin/Content-Length/Content-Type headers -
	// it does NOT allow "Authorization", which the frontend now sends on
	// every request once logged in. Without this, the browser blocks the
	// actual request after a successful-looking preflight.
	router.Use(cors.New(cors.Config{
		AllowOrigins:  []string{"https://hanacoffee.onrender.com", "http://localhost:3000", "https://coffery.onrender.com"},
		AllowMethods:    []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:    []string{"Origin", "Content-Length", "Content-Type", "Authorization"},
		ExposeHeaders:   []string{"Content-Length"},
	}))

	// Serves uploaded images as static files at /images/*
	router.Static("/images", imagesDir)

	// Register all owner-related handlers from the controller package
	menuController.RegisterMenuRoutes(router, db, myHub, imagesDir)

	// Register order/transaction handlers
	transactionController.RegisterTransactionRoutes(router, db, myHub)

	// Register login/logout handlers
	authenticationController.RegisterAuthRoutes(router, db)

	// Register boss-only account management (create/list/delete staff accounts)
	authenticationController.RegisterUserRoutes(router, db)

	// Exposes the websocket so can update when changed
	router.GET("/ws", func(c *gin.Context) {
		controller.HandleWS(myHub, c.Writer, c.Request)
	})

	// Simple health check to see the app is live
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy"})
	})

	// Getting the port that can be assigned dynamically in Render or defaulting to local
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start the server (This loops the main function! Needed for continuous running)
	router.Run(":" + port)
}
