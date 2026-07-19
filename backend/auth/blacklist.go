package auth

import (
	"sync"
	"time"
)

// revokedStore tracks tokens (by jti) that were explicitly logged out
// before their natural expiry. In-memory only - it clears on server
// restart, which is an acceptable trade-off since tokens are short-lived
// (24h) anyway. A DB-backed table would be the next step if this needs
// to survive restarts or work across multiple server instances.
type revokedStore struct {
	mu    sync.Mutex
	items map[string]time.Time // jti -> original expiry
}

var revoked = &revokedStore{items: make(map[string]time.Time)}

// Revoke marks a token's jti as logged-out until its natural expiry.
func Revoke(jti string, expiresAt time.Time) {
	revoked.mu.Lock()
	defer revoked.mu.Unlock()
	revoked.items[jti] = expiresAt
	cleanupLocked()
}

// IsRevoked reports whether a jti has been logged out.
func IsRevoked(jti string) bool {
	revoked.mu.Lock()
	defer revoked.mu.Unlock()
	_, found := revoked.items[jti]
	return found
}

// cleanupLocked drops entries past their natural expiry so this map
// doesn't grow forever. Caller must already hold the lock.
func cleanupLocked() {
	now := time.Now()
	for jti, exp := range revoked.items {
		if now.After(exp) {
			delete(revoked.items, jti)
		}
	}
}
