import React, { useCallback, useMemo } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { map } from 'rxjs/operators'
import { RouteComponentProps } from 'react-router'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { GraphOwnerGraphToEditResult, GraphOwnerGraphToEditVariables } from '../../../graphql-operations'
import { EditGraphForm } from '../form/EditGraphForm'
import { GraphSelectionProps } from '../selector/graphSelectionProps'

interface Props
    extends RouteComponentProps<{ name: string }>,
        NamespaceAreaContext,
        Pick<GraphSelectionProps, 'reloadGraphs'> {}

export const GraphOwnerEditGraphPage: React.FunctionComponent<Props> = ({
    match: {
        params: { name: graphName },
    },
    namespace,
    history,
    reloadGraphs,
}) => {
    const graph = useObservable(
        useMemo(
            () =>
                requestGraphQL<GraphOwnerGraphToEditResult, GraphOwnerGraphToEditVariables>(
                    gql`
                        query GraphOwnerGraphToEdit($owner: ID!, $name: String!) {
                            node(id: $owner) {
                                ... on GraphOwner {
                                    graph(name: $name) {
                                        id
                                        name
                                        description
                                        spec
                                    }
                                }
                            }
                        }
                    `,
                    { owner: namespace.id, name: graphName }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node?.graph)
                ),
            [graphName]
        )
    )
    const onUpdate = useCallback((graph: Pick<GQL.IGraph, 'url'>) => history.push(graph.url), [history])

    return (
        <div className="container">
            <h2>Edit graph</h2>
            {graph === null || graph === undefined ? (
                <LoadingSpinner />
            ) : (
                <EditGraphForm initialValue={graph} onUpdate={onUpdate} reloadGraphs={reloadGraphs} />
            )}
        </div>
    )
}
