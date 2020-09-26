import React, { useMemo } from 'react'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { map } from 'rxjs/operators'
import { RouteComponentProps } from 'react-router'
import { GraphOwnerGraphResult, GraphOwnerGraphVariables } from '../../../graphql-operations'
import { GraphPage, GraphPageGQLFragment } from '../detail/GraphPage'

interface Props extends RouteComponentProps<{ name: string }>, NamespaceAreaContext {}

export const GraphOwnerGraphPage: React.FunctionComponent<Props> = ({
    match: {
        params: { name: graphName },
    },
    namespace,
}) => {
    const graph = useObservable(
        useMemo(
            () =>
                requestGraphQL<GraphOwnerGraphResult, GraphOwnerGraphVariables>(
                    gql`
                        query GraphOwnerGraph($owner: ID!, $name: String!) {
                            node(id: $owner) {
                                ... on GraphOwner {
                                    graph(name: $name) {
                                        ...GraphPage
                                    }
                                }
                            }
                        }
                        ${GraphPageGQLFragment}
                    `,
                    { owner: namespace.id, name: graphName }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node?.graph)
                ),
            [graphName]
        )
    )

    return <GraphPage graph={graph} />
}
