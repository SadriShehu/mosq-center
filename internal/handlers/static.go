package handlers

import (
	"bytes"
	"io/fs"
	"net/http"
	"path"
	"strings"
	"time"
)

// adminPages are the static pages that need a session (when auth is enabled).
var adminPages = map[string]bool{
	"lagjet":           true,
	"familjet":         true,
	"pagesat":          true,
	"pagesat-pakryera": true,
	"user":             true,
}

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

// isAdminPath reports whether the request path belongs to an admin page.
func isAdminPath(p string) bool {
	seg := strings.SplitN(strings.TrimPrefix(path.Clean("/"+p), "/"), "/", 2)[0]
	// Any extension (.html, .txt RSC payloads, ...) still belongs to the page.
	if i := strings.Index(seg, "."); i >= 0 {
		seg = seg[:i]
	}
	return adminPages[seg]
}
