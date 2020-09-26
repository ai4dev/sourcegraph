import React, { useCallback, useMemo } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { map } from 'rxjs/operators'
import { RouteComponentProps } from 'react-router'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { GraphToEditResult, GraphToEditVariables } from '../../../graphql-operations'
import { EditGraphForm } from '../form/EditGraphForm'

interface Props extends RouteComponentProps<{ id: string }>, NamespaceAreaContext {}

export const GraphOwnerEditGraphPage: React.FunctionComponent<Props> = ({
    match: {
        params: { id },
    },
    history,
}) => {
    const graph = useObservable(
        useMemo(
            () =>
                requestGraphQL<GraphToEditResult, GraphToEditVariables>(
                    gql`
                        query GraphToEdit($id: ID!) {
                            node(id: $id) {
                                ... on Graph {
                                    id
                                    name
                                    description
                                    spec
                                }
                            }
                        }
                    `,
                    { id }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node)
                ),
            [id]
        )
    )
    const onUpdate = useCallback((graph: Pick<GQL.IGraph, 'url'>) => history.push(graph.url), [history])

    return (
        <div className="container">
            <h2>Edit graph</h2>
            {graph === null || graph === undefined ? (
                <LoadingSpinner />
            ) : (
                <EditGraphForm initialValue={graph} onUpdate={onUpdate} />
            )}
        </div>
    )
}
