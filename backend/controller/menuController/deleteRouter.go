package menuController

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Delete handles removing a specific item from the menu via its code
func (ctrl *MenuController) Delete(c *gin.Context) {
	code := c.Param("code")

	if err := ctrl.store.RemoveEntry(code); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": fmt.Sprintf("Item %s deleted successfully", code)})
}
