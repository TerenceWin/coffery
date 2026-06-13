package controller

import (
	"cafe-app-backend/hub"
	"net/http"
)

// HandleWS allows you to pass your hub instance into the handler
func HandleWS(h *hub.Hub, w http.ResponseWriter, r *http.Request) {
	// This calls the method defined in hub package
	h.HandleConnections(w, r)
}
