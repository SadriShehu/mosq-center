// Package web embeds the Next.js static export (web/out).
//
// `all:` is required: without it files starting with "_" or "." (notably the
// _next/ directory) are silently dropped. web/out/.gitkeep is a tracked
// placeholder so `go build` works without running `make web`; in that case the
// server only serves a bare 404 for page routes.
package web

import (
	"embed"
	"io/fs"
)

//go:embed all:out
var embedded embed.FS

// Files is the root of the static export.
var Files fs.FS = mustSub()

func mustSub() fs.FS {
	sub, err := fs.Sub(embedded, "out")
	if err != nil {
		panic(err)
	}
	return sub
}
