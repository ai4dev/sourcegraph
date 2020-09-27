import React from 'react'
import { gql } from '../../../../../shared/src/graphql/graphql'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import { GraphPage as GraphPageFragment } from '../../../graphql-operations'
import { Link } from 'react-router-dom'

export const GraphPageGQLFragment = gql`
    fragment GraphPage on Graph {
        id
        name
        description
        spec
        url
        editURL
    }
`

interface Props {
    graph: GraphPageFragment | undefined | null
}

/**
 * A page that shows a single graph.
 */
export const GraphPage: React.FunctionComponent<Props> = ({ graph }) => (
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