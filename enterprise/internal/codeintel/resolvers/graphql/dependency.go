package graphql

import (
	"fmt"

	gql "github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend"
	"github.com/sourcegraph/sourcegraph/enterprise/internal/codeintel/resolvers"
)

type DependencyResolver struct {
	dependency resolvers.AdjustedDependency
}

func NewDependencyResolver(dependency resolvers.AdjustedDependency) gql.DependencyResolver {
	return &DependencyResolver{
		dependency: dependency,
	}
}

func (r *DependencyResolver) Foo() string {
	return fmt.Sprintf("%s@%s (%s)", r.dependency.Dependency.Name, r.dependency.Dependency.Version, r.dependency.Dependency.Manager)
}
