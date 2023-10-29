package internal

import "embed"

//go:embed templates/app/* templates/app/assets/* templates/app/css/* templates/app/js/*
var Files embed.FS
