package authenticationController

import (
	"cafe-app-backend/auth"
	"cafe-app-backend/crudAPI/crudLogin"
	"database/sql"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AuthController struct {
	store *crudLogin.Store
}

// RegisterAuthRoutes wires up /auth/login (public) and /auth/logout
// (requires a valid token - you can't log out of a session you don't have).
func RegisterAuthRoutes(router *gin.Engine, db *sql.DB) {
	ctrl := &AuthController{store: crudLogin.NewStore(db)}

	authGroup := router.Group("/auth")
	{
		authGroup.POST("/login", ctrl.Login)
		authGroup.POST("/logout", auth.RequireAuth(), ctrl.Logout)
	}
}

func (ctrl *AuthController) Login(c *gin.Context) {
	var input struct {
		Role     string `json:"role" binding:"required"`
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	user, err := ctrl.store.GetByUsername(input.Username)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// A role mismatch (e.g. logging into the staff tab with a boss
	// account) is reported the same as a bad password - never confirm
	// which part of the credentials was wrong.
	if user.Role != input.Role {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to issue token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"name":     user.Name,
			"role":     user.Role,
		},
	})
}

// Logout revokes the exact token that called it, so it can never be
// reused again even if it leaked before its natural 24h expiry - unlike
// just deleting it client-side, which leaves it valid until it expires.
func (ctrl *AuthController) Logout(c *gin.Context) {
	jtiVal, _ := c.Get("jti")
	expVal, _ := c.Get("exp")

	jti, _ := jtiVal.(string)
	exp, _ := expVal.(time.Time)
	if jti != "" {
		auth.Revoke(jti, exp)
	}

	c.JSON(http.StatusOK, gin.H{"message": "Logged out successfully"})
}
