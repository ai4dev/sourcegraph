import SearchIcon from 'mdi-react/SearchIcon'
import React, { useCallback } from 'react'
import { GraphSelectionProps, SelectableGraph } from '../selector/graphSelectionProps'

interface Props extends Pick<GraphSelectionProps, 'setSelectedGraph'> {
    graph: SelectableGraph
    query?: string
    className?: string
    buttonClassName?: string
}

export const SearchInThisGraphButton: React.FunctionComponent<Props> = ({
    graph,
    query,
    setSelectedGraph,
    className = '',
    buttonClassName = '',
    children,
}) => {
    const onClick = useCallback<React.MouseEventHandler>(
        event => {
            event.preventDefault()

            setSelectedGraph(graph.id)

            // TODO(sqs): hack
            const searchInput = document.querySelector<HTMLInputElement>('.query-input2 input')
            if (searchInput) {
                searchInput.focus()
                searchInput.value = query ? `${query} ` : ''
                searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length)
            }
        },
        [graph.id, query, setSelectedGraph]
    )

    return window.context?.graphsEnabled ? (
        <div className={`d-flex align-items-center ${className}`}>
            <span className="mr-2 text-muted">Search in:</span>
            <button type="button" className={`btn btn-outline-secondary mr-2 ${buttonClassName}`} onClick={onClick}>
                <SearchIcon className="icon-inline" /> This repository
            </button>
            <button type="button" className={`btn btn-outline-secondary mr-2 ${buttonClassName}`} onClick={onClick}>
                <SearchIcon className="icon-inline" /> This repository + dependencies
            </button>
            <button type="button" className={`btn btn-outline-secondary mr-2 ${buttonClassName}`} onClick={onClick}>
                <SearchIcon className="icon-inline" /> This repository + dependents
            </button>
        </div>
    ) : null
}
