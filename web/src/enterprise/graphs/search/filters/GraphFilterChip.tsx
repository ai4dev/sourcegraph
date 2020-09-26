import React, { useCallback } from 'react'
import { FilterChip } from '../../../../search/FilterChip'
import { SelectableGraph } from '../../selector/graphSelectionProps'

interface Props {
    graph: SelectableGraph
    isSelected: boolean
    onSelect: (graph: SelectableGraph) => void
}

export const GraphFilterChip: React.FunctionComponent<Props> = ({ graph, isSelected, onSelect }) => {
    const onFilterChosen = useCallback(() => onSelect(graph), [])
    return (
        <FilterChip
            name={graph.name}
            onFilterChosen={onFilterChosen}
            //
            // hack to show selected graph
            query={isSelected ? 'x' : ''}
            value="x"
        />
    )
}
