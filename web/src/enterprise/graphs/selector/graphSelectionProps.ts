import { useMemo } from 'react'
import * as GQL from '../../../../../shared/src/graphql/schema'
import { Scalars } from '../../../graphql-operations'
import { useLocalStorage } from '../../../util/useLocalStorage'

export interface GraphSelectionProps {
    selectedGraph: Pick<GQL.IGraph, 'id'> | null
    setSelectedGraph: (graph: Pick<GQL.IGraph, 'id'> | null) => void
}

export const useGraphSelectionFromLocalStorage = (): GraphSelectionProps => {
    const [selectedGraphID, setSelectedGraphID] = useLocalStorage<Scalars['ID'] | null>(
        'sourcegraph-selected-graph',
        null
    )

    return useMemo<GraphSelectionProps>(
        () => ({
            selectedGraph: selectedGraphID === null ? null : { id: selectedGraphID },
            setSelectedGraph: graph => setSelectedGraphID(graph === null ? null : graph.id),
        }),
        [selectedGraphID, setSelectedGraphID]
    )
}
