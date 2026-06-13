package hub

import (
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

type Hub struct {

	// A single map to track all clients that are active
	clients map[*Client]struct{}
	mu      sync.RWMutex
}

type Client struct {
	Conn *websocket.Conn
}

var upgrader = websocket.Upgrader{

	CheckOrigin: func(r *http.Request) bool { return true },
}

func NewHub() *Hub {

	return &Hub{
		clients: make(map[*Client]struct{}),
	}
}

func (h *Hub) HandleConnections(w http.ResponseWriter, r *http.Request) {

	conn, _ := upgrader.Upgrade(w, r, nil)
	client := &Client{Conn: conn}

	h.mu.Lock()
	h.clients[client] = struct{}{}
	h.mu.Unlock()

	defer func() {
		h.mu.Lock()
		delete(h.clients, client)
		h.mu.Unlock()
		conn.Close()
	}()

	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// Broadcast to every user
func (h *Hub) Broadcast(message []byte) {
	h.mu.RLock()
	// Make a copy of the clients slice or just iterate carefully (Taken from tutorial site. Needs further clarification)
	for client := range h.clients {
		client.Conn.WriteMessage(websocket.TextMessage, message)
	}
	h.mu.RUnlock()
}
