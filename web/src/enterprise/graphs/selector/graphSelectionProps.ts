import { useCallback, useMemo, useState } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { Scalars } from '../../../graphql-operations'
import { useLocalStorage } from '../../../util/useLocalStorage'

type GraphWithID = Pick<GQL.IGraph, 'id'>
type GraphWithName = Pick<GQL.IGraph, 'id' | 'name' | 'description'>

export interface GraphSelectionProps {
    selectedGraph: GraphWithID | null
    setSelectedGraph: (graph: GraphWithID | null) => void

    /**
     * Reload the graphs loaded from the remote server. Call this when a component might have
     * modified any of the graphs that would be shown in the graph selector.
     */
    reloadGraphs: () => void
    reloadGraphsSeq: number

    /**
     * Contribute graphs to the list from any React component.
     *
     * @returns A destructor function that removes the contributed graphs. Tip: Use this as the
     * return value for your useEffect callback when contributing contextual graphs in a React
     * component.
     */
    contributeContextualGraphs: (graphs: GraphWithName[]) => () => void

    /**
     * A list of contextual graphs contributed with
     * {@link GraphSelectionProps#contributeContextualGraphs}.
     */
    contextualGraphs: GraphWithName[] | undefined
}

export const useGraphSelectionFromLocalStorage = (): GraphSelectionProps => {
    const [selectedGraphID, setSelectedGraphID] = useLocalStorage<Scalars['ID'] | null>(
        'sourcegraph-selected-graph',
        null
    )

    const [reloadGraphsSeq, setReloadGraphsSeq] = useState(0)
    const reloadGraphs = useCallback((): void => setReloadGraphsSeq(previous => previous + 1), [])

    const [contextualGraphs, setContextualGraphs] = useState<GraphWithName[]>()
    const contributeContextualGraphs = useCallback<GraphSelectionProps['contributeContextualGraphs']>(graphs => {
        setContextualGraphs(previous => (previous ? [...previous, ...graphs] : graphs))
        return () => {
            // This is the destructor function, so remove the graphs that we added.
            setContextualGraphs(previous => {
                const keep = previous?.filter(previousGraph => !graphs.includes(previousGraph))
                return keep && keep.length > 0 ? keep : undefined
            })
        }
    }, [])

    return useMemo<GraphSelectionProps>(
        () => ({
            selectedGraph: selectedGraphID === null ? null : { id: selectedGraphID },
            setSelectedGraph: graph => setSelectedGraphID(graph === null ? null : graph.id),
            reloadGraphs,
            reloadGraphsSeq,
            contributeContextualGraphs,
            contextualGraphs,
        }),
        [contextualGraphs, contributeContextualGraphs, selectedGraphID, setSelectedGraphID]
    )
}
