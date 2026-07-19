package authenticationController

import (
	"cafe-app-backend/auth"
	"cafe-app-backend/crudAPI/crudLogin"
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserController struct {
	store *crudLogin.Store
}

// RegisterUserRoutes wires up account management: listing, creating, and
// removing staff/boss accounts. Every route here requires a valid "boss"
// role JWT - staff can never create or see other accounts.
func RegisterUserRoutes(router *gin.Engine, db *sql.DB) {
	ctrl := &UserController{store: crudLogin.NewStore(db)}

	users := router.Group("/users", auth.RequireAuth("boss"))
	{
		users.GET("", ctrl.GetAll)
		users.POST("", ctrl.Create)
		users.DELETE("/:id", ctrl.Delete)
	}
}

func (ctrl *UserController) GetAll(c *gin.Context) {
	users, err := ctrl.store.GetAll()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch accounts"})
		return
	}
	c.JSON(http.StatusOK, users)
}

func (ctrl *UserController) Create(c *gin.Context) {
	var input struct {
		Username string `json:"username" binding:"required"`
		Password string `json:"password" binding:"required"`
		Role     string `json:"role" binding:"required"`
		Name     string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	if input.Role != "boss" && input.Role != "staff" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role must be 'boss' or 'staff'"})
		return
	}
	if len(input.Password) < 6 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 6 characters"})
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to secure password"})
		return
	}

	id, err := ctrl.store.InsertUser(input.Username, string(hash), input.Role, input.Name)
	if err != nil {
		if strings.Contains(err.Error(), "duplicate key") {
			c.JSON(http.StatusConflict, gin.H{"error": "That username is already taken"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create account"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Account created", "id": id})
}

func (ctrl *UserController) Delete(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid account id"})
		return
	}

	// Don't let a boss delete their own account through this route -
	// avoids accidentally locking themselves out with no other boss left.
	if requesterID, ok := c.Get("userID"); ok {
		if rid, ok2 := requesterID.(int); ok2 && rid == id {
			c.JSON(http.StatusBadRequest, gin.H{"error": "You cannot delete your own account"})
			return
		}
	}

	if err := ctrl.store.DeleteUser(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Account deleted"})
}
