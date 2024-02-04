package cmd

import (
	"crypto/ed25519"
	"encoding/base64"
	"fmt"

	"github.com/spf13/cobra"
)

func init() {
	rootCmd.AddCommand(generateJWTKey)
}

var (
	generateJWTKey = &cobra.Command{
		Use:   "key-gen",
		Short: "Generate a private and a public ED25519 key",
		RunE: func(cmd *cobra.Command, args []string) (err error) {
			pub, pk, err := ed25519.GenerateKey(nil)
			if err != nil {
				return err
			}

			pkb64 := base64.StdEncoding.EncodeToString(pk)
			pubb64 := base64.StdEncoding.EncodeToString(pub)

			fmt.Printf("PK: %s\n", pkb64)
			fmt.Printf("PUB: %s\n", pubb64)
			return nil
		},
	}
)
