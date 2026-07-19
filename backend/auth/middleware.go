package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAuth validates the Authorization: Bearer <token> header, rejects
// missing/invalid/expired/revoked tokens, and - if roles are given -
// enforces that the token's role is one of the allowed roles. On success
// it stores the user's id/username/role/jti/exp on the gin context.
func RequireAuth(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if !strings.HasPrefix(header, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Missing or invalid Authorization header"})
			return
		}
		tokenStr := strings.TrimPrefix(header, "Bearer ")

		claims, err := ParseToken(tokenStr)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		if IsRevoked(claims.ID) {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Token has been logged out"})
			return
		}

		if len(roles) > 0 {
			allowed := false
			for _, r := range roles {
				if claims.Role == r {
					allowed = true
					break
				}
			}
			if !allowed {
				c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
				return
			}
		}

		c.Set("userID", claims.UserID)
		c.Set("username", claims.Username)
		c.Set("role", claims.Role)
		c.Set("jti", claims.ID)
		c.Set("exp", claims.ExpiresAt.Time)
		c.Next()
	}
}
