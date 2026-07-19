package auth

import (
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims embedded in every access token issued by POST /auth/login.
type Claims struct {
	UserID   int    `json:"userId"`
	Username string `json:"username"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

func secret() []byte {
	s := os.Getenv("JWT_SECRET")
	if s == "" {
		// Dev-only fallback so local runs don't crash without a .env.
		// ALWAYS set a real JWT_SECRET in Render's environment variables -
		// anyone who knows this fallback string could forge valid tokens.
		s = "dev-only-insecure-secret-change-me"
	}
	return []byte(s)
}

// GenerateToken issues a signed JWT valid for 24 hours and returns both
// the signed string and its unique jti (used later to support logout).
func GenerateToken(userID int, username, role string) (string, error) {
	jti := username + "-" + time.Now().Format("20060102150405.000000000")
	claims := Claims{
		UserID:   userID,
		Username: username,
		Role:     role,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secret())
}

// ParseToken validates a token's signature and expiry and returns its claims.
func ParseToken(tokenStr string) (*Claims, error) {
	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenStr, claims, func(t *jwt.Token) (interface{}, error) {
		return secret(), nil
	})
	if err != nil {
		return nil, err
	}
	return claims, nil
}
