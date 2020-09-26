import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import React from 'react'
import { GraphListItem as GraphListItemFragment } from '../../../graphql-operations'
import { GraphListItem } from './GraphListItem'

interface Props {
    /** Graphs, or `undefined` if loading. */
    graphs: { nodes: GraphListItemFragment[] } | undefined
}

export const GraphList: React.FunctionComponent<Props> = ({ graphs }) =>
    graphs ? (
        graphs.nodes.length > 0 ? (
            <ul className="list-group">
                {graphs.nodes.map(graph => (
                    <GraphListItem key={graph.id} node={graph} className="list-group-item" />
                ))}
            </ul>
        ) : (
            <div className="card">
                <p className="card-body mb-0 text-muted">No graphs.</p>
            </div>
        )
    ) : (
        <LoadingSpinner className="icon-inline" />
    )
