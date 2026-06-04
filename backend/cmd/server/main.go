package main

import (
	"log"

	"github.com/coffery/coffee-shop-app/internal/config"
	"github.com/coffery/coffee-shop-app/internal/database"
	"github.com/coffery/coffee-shop-app/internal/handlers"
	"github.com/coffery/coffee-shop-app/internal/middleware"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using environment variables")
	}

	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}

	if err := database.Migrate(db); err != nil {
		log.Fatalf("failed to run migrations: %v", err)
	}

	if cfg.Env == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	r.Use(middleware.CORS())

	api := r.Group("/api")
	{
		api.GET("/health", handlers.Health)

		menu := api.Group("/menu")
		{
			menu.GET("", handlers.NewMenuHandler(db).List)
		}

		auth := api.Group("/auth")
		{
			auth.POST("/register", handlers.NewAuthHandler(db, cfg).Register)
			auth.POST("/login", handlers.NewAuthHandler(db, cfg).Login)
		}

		protected := api.Group("/")
		protected.Use(middleware.Auth(cfg.JWTSecret))
		{
			protected.GET("/me", handlers.NewAuthHandler(db, cfg).Me)
		}
	}

	log.Printf("Server starting on :%s", cfg.Port)
	if err := r.Run(":" + cfg.Port); err != nil {
		log.Fatalf("server error: %v", err)
	}
}
