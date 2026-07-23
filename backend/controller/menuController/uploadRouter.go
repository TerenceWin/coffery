package menuController

import (
	"crypto/rand"
	"encoding/hex"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"github.com/gin-gonic/gin"
)

// UploadImage saves a multipart image to the Render disk and returns its public URL
func (ctrl *MenuController) UploadImage(c *gin.Context) {

	// "image" must match formData.append('image', file) on the frontend
	file, header, err := c.Request.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}
	defer file.Close()

	// Grab original extension (.jpg, .png, etc.), fallback to .jpg
	ext := filepath.Ext(header.Filename)
	if ext == "" {
		ext = ".jpg"
	}

	// Generate 8 random bytes → 16 hex chars → unique filename e.g. "a3f8c2d1e4b5f6a7.jpg"
	// This prevents two uploads with the same filename from overwriting each other
	b := make([]byte, 8)
	rand.Read(b)
	uniqueName := hex.EncodeToString(b) + ext

	// Create the file on the Render disk at /var/data/images/<uniqueName>
	dst, err := os.Create(filepath.Join(ctrl.imagesDir, uniqueName))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}
	defer dst.Close()

	// Stream the uploaded bytes into the file (like copy-paste for binary data)
	io.Copy(dst, file)

	// Build and return the public URL the frontend will store in the database
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "https://coffery.onrender.com"
	}
	c.JSON(http.StatusOK, gin.H{"url": baseURL + "/images/" + uniqueName})
}
