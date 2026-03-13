package main

import (
	_ "github.com/joho/godotenv/autoload"
	"github.com/marcopollivier/techagenda/cmd"
)

func main() {
	cmd.Execute()
}
