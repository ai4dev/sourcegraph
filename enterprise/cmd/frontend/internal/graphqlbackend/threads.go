package graphqlbackend

import (
	"github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend"
	"github.com/sourcegraph/sourcegraph/enterprise/cmd/frontend/internal/threads"
)

func init() {
	// Contribute the GraphQL type ThreadsMutation.
	graphqlbackend.Threads = threads.GraphQLResolver{}
}
