package handlers

import (
	"bytes"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"
)

// StaticHandler serves the Next.js export: /x -> x.html, / -> index.html,
// unknown paths -> 404.html with status 404.
func StaticHandler(files fs.FS) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		if req.Method != http.MethodGet && req.Method != http.MethodHead {
			w.Header().Set("Allow", "GET, HEAD")
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}

		// path.Clean on a rooted path removes any ".." segments.
		clean := path.Clean("/" + req.URL.Path)
		name := strings.TrimPrefix(clean, "/")
		if name == "" {
			name = "index.html"
		}

		if !strings.HasPrefix(clean, "/api/") {
			if f := findFile(files, name); f != "" {
				serveFile(w, req, files, f, http.StatusOK)
				return
			}
			if f := findFile(files, "404.html"); f != "" {
				serveFile(w, req, files, f, http.StatusNotFound)
				return
			}
		}

		http.NotFound(w, req)
	})
}

// findFile resolves name to an existing regular file: exact, then name.html.
func findFile(files fs.FS, name string) string {
	for _, c := range []string{name, name + ".html"} {
		if !fs.ValidPath(c) {
			continue
		}
		if st, err := fs.Stat(files, c); err == nil && !st.IsDir() {
			return c
		}
	}
	return ""
}

func serveFile(w http.ResponseWriter, req *http.Request, files fs.FS, name string, status int) {
	data, err := fs.ReadFile(files, name)
	if err != nil {
		http.NotFound(w, req)
		return
	}

	if strings.HasPrefix(name, "_next/static/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
	} else {
		w.Header().Set("Cache-Control", "no-cache")
	}

	if status != http.StatusOK {
		// ServeContent cannot set a custom status, so set type and write directly.
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		w.WriteHeader(status)
		if req.Method != http.MethodHead {
			w.Write(data)
		}
		return
	}

	http.ServeContent(w, req, name, time.Time{}, bytes.NewReader(data))
}

// publicAssetExts are static assets served from the web root without a session.
// Page payloads (.html, .txt) are deliberately not in this list.
var publicAssetExts = map[string]bool{
	".ico": true, ".png": true, ".svg": true, ".jpg": true, ".jpeg": true,
	".webp": true, ".woff": true, ".woff2": true, ".webmanifest": true,
}

// isPublicPath is the allowlist of paths reachable without a session:
// the public prayer-times page, build assets, the auth routes, the health
// check and the public API. Everything else (including unknown routes) needs
// a session when auth is enabled.
func isPublicPath(p string) bool {
	clean := path.Clean("/" + p)

	switch clean {
	case "/", "/index.html", "/index.txt", "/404.html",
		"/login", "/callback", "/logout", "/api/v1/health":
		return true
	}

	for _, prefix := range []string{"/_next/", "/_not-found", "/api/v1/public/"} {
		if strings.HasPrefix(clean, prefix) {
			return true
		}
	}

	// Root-level files only: the home page's RSC payloads (__next.*.txt) and images.
	if rest := strings.TrimPrefix(clean, "/"); !strings.Contains(rest, "/") {
		if strings.HasPrefix(rest, "__next.") {
			return true
		}
		if publicAssetExts[strings.ToLower(path.Ext(rest))] {
			return true
		}
	}

	return false
}
