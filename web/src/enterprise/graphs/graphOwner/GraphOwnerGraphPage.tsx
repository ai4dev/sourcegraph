import React, { useCallback, useMemo } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { map } from 'rxjs/operators'
import { RouteComponentProps } from 'react-router'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { GraphOwnerGraphResult, GraphOwnerGraphVariables } from '../../../graphql-operations'
import { EditGraphForm } from '../form/EditGraphForm'
import { Link } from 'react-router-dom'

interface Props extends RouteComponentProps<{ id: string }>, NamespaceAreaContext {}

export const GraphOwnerGraphPage: React.FunctionComponent<Props> = ({
    match: {
        params: { id },
    },
}) => {
    const graph = useObservable(
        useMemo(
            () =>
                requestGraphQL<GraphOwnerGraphResult, GraphOwnerGraphVariables>(
                    gql`
                        query GraphOwnerGraph($id: ID!) {
                            node(id: $id) {
                                ... on Graph {
                                    id
                                    name
                                    description
                                    spec
                                    editURL
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

    return (
        <div className="container">
            {graph === null || graph === undefined ? (
                <LoadingSpinner />
            ) : (
                <>
                    <h2>{graph.name}</h2>
                    {graph.description && <p>{graph.description}</p>}
                    <pre>
                        <code>{graph.spec}</code>
                    </pre>
                    <Link to={graph.editURL} className="btn btn-secondary">
                        Edit
                    </Link>
                </>
            )}
        </div>
    )
}
