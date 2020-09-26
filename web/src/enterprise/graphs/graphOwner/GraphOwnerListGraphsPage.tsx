import React, { useMemo } from 'react'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { ListGraphsResult, ListGraphsVariables } from '../../../graphql-operations'
import { map } from 'rxjs/operators'
import { Link } from 'react-router-dom'
import PlusIcon from 'mdi-react/PlusIcon'
import { GraphList } from '../list/GraphList'
import { GraphListItemFragmentGQL } from '../list/GraphListItem'

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
                                            ...GraphListItem
                                        }
                                        totalCount
                                    }
                                }
                            }
                        }
                        ${GraphListItemFragmentGQL}
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
            <GraphList graphs={graphs} />
        </div>
    )
}
