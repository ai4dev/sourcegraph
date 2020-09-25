package graphqlbackend

import (
	"context"
	"strings"

	"github.com/graph-gophers/graphql-go"
	"github.com/graph-gophers/graphql-go/relay"
	"github.com/sourcegraph/sourcegraph/cmd/frontend/graphqlbackend/graphqlutil"
	"github.com/sourcegraph/sourcegraph/internal/conf"
	"github.com/sourcegraph/sourcegraph/schema"
)

// Graph is the GraphQL Graph interface.
type Graph interface {
	ID() graphql.ID
	Name() string
	Description() string
	Spec() string
	URL() string
	EditURL() *string
}

// GraphResolver implements the GraphQL Graph interface.
type GraphResolver struct {
	vc *schema.VersionContext
}

func (g *GraphResolver) ID() graphql.ID {
	// TODO(sqs): pick globally unique
	return relay.MarshalID("Graph", g.vc.Name)
}

func (g *GraphResolver) Name() string {
	return g.vc.Name
}

func (g *GraphResolver) Description() string {
	return g.vc.Description
}

func (g *GraphResolver) Spec() string {
	var repos []string
	for _, rev := range g.vc.Revisions {
		repos = append(repos, rev.Repo)
	}
	return strings.Join(repos, "\n")
}

func (g *GraphResolver) URL() string {
	// TODO(sqs)
	return "/users/sqs/graphs/" + string(g.ID())
}

func (g *GraphResolver) EditURL() *string {
	urlStr := g.URL() + "/edit"
	return &urlStr
}

// GraphByID looks up a graph by ID.
func GraphByID(ctx context.Context, id graphql.ID) (Graph, error) {
	var name string
	if err := relay.UnmarshalSpec(id, &name); err != nil {
		return nil, err
	}

	for _, vc := range conf.Get().ExperimentalFeatures.VersionContexts {
		if vc.Name == name {
			return &GraphResolver{vc}, nil
		}
	}
	return nil, nil
}

// GraphOwner is the interface for the GraphQL GraphOwner interface.
type GraphOwner interface {
	ID() graphql.ID
	Graphs(ctx context.Context, args *GraphConnectionArgs) (*GraphConnection, error)
	URL() string
}

var (
	_ GraphOwner = &UserResolver{}
	_ GraphOwner = &OrgResolver{}
)

type GraphOwnerResolver struct {
	GraphOwner
}

func (r *GraphOwnerResolver) ToUser() (*UserResolver, bool) {
	n, ok := r.GraphOwner.(*UserResolver)
	return n, ok
}

func (r *GraphOwnerResolver) ToOrg() (*OrgResolver, bool) {
	n, ok := r.GraphOwner.(*OrgResolver)
	return n, ok
}

func GraphsForGraphOwner(ctx context.Context, owner GraphOwnerResolver, args GraphConnectionArgs) (*GraphConnection, error) {
	// TODO(sqs): use version contexts
	var graphs []Graph
	for _, vc := range conf.Get().ExperimentalFeatures.VersionContexts {
		graphs = append(graphs, &GraphResolver{vc})
	}
	return &GraphConnection{Args: args, Graphs: graphs}, nil
}

type GraphConnectionArgs struct {
	First *int32
}

// GraphConnection implements the GraphQL GraphConnection type.
type GraphConnection struct {
	Args   GraphConnectionArgs
	Graphs []Graph
}

func (c GraphConnection) Nodes() []Graph {
	graphs := c.Graphs
	if first := c.Args.First; first != nil && int(*first) <= len(graphs) {
		graphs = graphs[:int(*first)]
	}
	return graphs
}
func (c GraphConnection) TotalCount() int32 { return int32(len(c.Graphs)) }
func (c GraphConnection) PageInfo() *graphqlutil.PageInfo {
	return graphqlutil.HasNextPage(len(c.Graphs) > len(c.Nodes()))
}

type UpdateGraphInput struct {
	ID          graphql.ID
	Name        *string
	Description *string
	Spec        *string
}

func (r *schemaResolver) UpdateGraph(ctx context.Context, args *struct{ Input UpdateGraphInput }) (Graph, error) {
	panic("TODO(sqs)")
}

func (r *schemaResolver) DeleteGraph(ctx context.Context, args *struct{ ID graphql.ID }) (*EmptyResponse, error) {
	panic("TODO(sqs)")
}
