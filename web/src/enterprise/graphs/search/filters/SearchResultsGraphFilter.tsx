import React, { useCallback } from 'react'
import { FilterChip } from '../../../../search/FilterChip'
import { GraphSelectionProps } from '../../selector/graphSelectionProps'
import { useGraphs } from '../../selector/useGraphs'

interface Props extends GraphSelectionProps {
    className?: string
    listClassName?: string
    'data-testid'?: string
}

const NULL_GRAPH_ID = 'null'

export const SearchResultsGraphFilter: React.FunctionComponent<Props> = ({
    setSelectedGraph,
    className = '',
    listClassName = '',
    'data-testid': dataTestId,
    ...props
}) => {
    const graphs = useGraphs(props)

    const onFilterChosen = useCallback(
        (value: string): void => setSelectedGraph(value === NULL_GRAPH_ID ? null : value),
        []
    )

    return (
        <div className={className} data-testid={dataTestId}>
            Graphs:
            <div className={listClassName}>
                {graphs.map(graph => (
                    <FilterChip
                        key={graph.id === null ? NULL_GRAPH_ID : graph.id}
                        name={graph.name}
                        query=""
                        value={graph.id === null ? NULL_GRAPH_ID : graph.id}
                        onFilterChosen={onFilterChosen}
                    />
                ))}
            </div>
        </div>
    )
}
