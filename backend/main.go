package main

import (
	"cafe-app-backend/controller"
	"cafe-app-backend/database"
	"cafe-app-backend/hub"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {

	db := database.InitializeDB()
	defer db.Close()

	// Initialize the hub
	myHub := hub.NewHub()

	// Initialize the Gin
	router := gin.Default()

	// Allow the frontend to talk to this backend
	router.Use(cors.Default())

	// Register all owner-related handlers from the controller package
	controller.RegisterOwnerRoutes(router, db, myHub)

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
