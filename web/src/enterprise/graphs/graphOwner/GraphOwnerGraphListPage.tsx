import React, { useMemo } from 'react'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { ListGraphsResult, ListGraphsVariables } from '../../../graphql-operations'
import { map } from 'rxjs/operators'
import { Link } from 'react-router-dom'
import { GraphIcon } from '../icons'

interface Props extends NamespaceAreaContext {}

export const GraphOwnerGraphListPage: React.FunctionComponent<Props> = ({ namespace }) => {
    const graphs = useObservable(
        useMemo(
            () =>
                requestGraphQL<ListGraphsResult, ListGraphsVariables>(
                    gql`
                        query ListGraphs($graphOwner: ID!, $first: Int) {
                            node(id: $graphOwner) {
                                ... on GraphOwner {
                                    graphs(first: $first) {
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
                    { graphOwner: namespace.id, first: null }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node?.graphs)
                ),
            [namespace.id]
        )
    )

    return (
        <div className="container">
            <ul className="list-group">
                {graphs?.nodes.map(g => (
                    <li key={g.id} className="list-group-item d-flex align-items-start">
                        <GraphIcon className="mt-1 mr-2 icon-inline text-muted" />
                        <header className="flex-1 mr-3">
                            <h3 className="mb-0">{g.name}</h3>
                            {g.description && <small className="text-muted">{g.description}</small>}
                        </header>
                        <Link to={g.editURL} className="btn btn-secondary">
                            Edit
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    )
}
