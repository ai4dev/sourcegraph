import React from 'react'
import { Link } from 'react-router-dom'
import { GraphListItem as GraphListItemFragment } from '../../../../graphql-operations'
import { GraphIcon } from '../../icons'
import { gql } from '../../../../../../shared/src/graphql/graphql'

export const GraphListItemFragmentGQL = gql`
    fragment GraphListItem on Graph {
        id
        name
        description
        url
        editURL
    }
`

interface Props {
    node: GraphListItemFragment
    className?: string
}

export const GraphListItem: React.FunctionComponent<Props> = ({ node: graph, className = '' }) => (
    <li className={`d-flex align-items-start ${className}`}>
        <GraphIcon className="mt-1 mr-2 icon-inline text-muted" />
        <header className="flex-1 mr-3">
            <h3 className="mb-0">
                <Link to={graph.url}>{graph.name}</Link>
            </h3>
            {graph.description && <small className="text-muted">{graph.description}</small>}
        </header>
        <Link to={graph.editURL} className="btn btn-secondary btn-sm">
            Edit
        </Link>
    </li>
)
