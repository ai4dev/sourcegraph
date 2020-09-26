import React, { useMemo } from 'react'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { ListGraphsResult, ListGraphsVariables } from '../../../graphql-operations'
import { map } from 'rxjs/operators'
import { Link } from 'react-router-dom'
import { GraphIcon } from '../icons'
import PlusIcon from 'mdi-react/PlusIcon'

interface Props extends NamespaceAreaContext {}

export const GraphOwnerListGraphsPage: React.FunctionComponent<Props> = ({ namespace }) => {
    const graphs = useObservable(
        useMemo(
            () =>
                requestGraphQL<ListGraphsResult, ListGraphsVariables>(
                    gql`
                        query ListGraphs($graphOwner: ID!) {
                            node(id: $graphOwner) {
                                ... on GraphOwner {
                                    graphs {
                                        nodes {
                                            id
                                            name
                                            description
                                            url
                                            editURL
                                        }
                                        totalCount
                                    }
                                }
                            }
                        }
                    `,
                    // TODO(sqs): paginate with `first`
                    { graphOwner: namespace.id }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node?.graphs)
                ),
            [namespace.id]
        )
    )

    return (
        <div className="container">
            <div className="d-flex justify-content-end mb-2">
                <Link to={`${namespace.url}/graphs/new`} className="btn btn-secondary">
                    <PlusIcon className="icon-inline" /> New graph
                </Link>
            </div>
            {graphs && graphs.nodes.length > 0 ? (
                <ul className="list-group">
                    {graphs.nodes.map(graph => (
                        <li key={graph.id} className="list-group-item d-flex align-items-start">
                            <GraphIcon className="mt-1 mr-2 icon-inline text-muted" />
                            <header className="flex-1 mr-3">
                                <h3 className="mb-0">{graph.name}</h3>
                                {graph.description && <small className="text-muted">{graph.description}</small>}
                            </header>
                            <Link to={graph.editURL} className="btn btn-secondary">
                                Edit
                            </Link>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="card">
                    <p className="card-body mb-0 text-muted">No graphs.</p>
                </div>
            )}
        </div>
    )
}
