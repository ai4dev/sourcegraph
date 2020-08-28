package bg

import (
	"fmt"
	"os"

	"github.com/sourcegraph/sourcegraph/internal/db/dbtesting"
	secretsPkg "github.com/sourcegraph/sourcegraph/internal/secrets"
)

func init() {
	dbtesting.DBNameSuffix = "bgdb"

	err := secretsPkg.Init()
	if err != nil {
		fmt.Println("Failed to init secrets package:", err)
		os.Exit(1)
	}
}
