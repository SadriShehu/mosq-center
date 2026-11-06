[![pipeline](https://github.com/sadrishehu/mosq-center/actions/workflows/pipeline.yml/badge.svg)](https://github.com/sadrishehu/mosq-center/actions/workflows/pipeline.yml)

# Mosq Center

This is a sample project with a single file `go.mod`. 

## Installation

1. Clone the repository
2. Open the project in your preferred IDE
3. Run `go mod tidy` to download the required dependencies

## Usage

This project is intended to be used as a starting point for a Go project. You can modify the `go.mod` file to add or remove dependencies as needed.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).

## Frontend (web/)

The UI is a Next.js static export in `web/`, embedded into the Go binary
(`web/embed.go`, `//go:embed all:out`). `make web` builds it into `web/out`;
`make run` builds it and starts the server. `web/out/.gitkeep` is a tracked
placeholder so `go build` / `go test` work without a web build (pages then
return 404 until `make web` is run). See `web/README.md` for the dev workflow.
