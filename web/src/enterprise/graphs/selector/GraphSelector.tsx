import {
    ListboxButton,
    ListboxGroupLabel,
    ListboxInput,
    ListboxList,
    ListboxOption,
    ListboxPopover,
} from '@reach/listbox'
import VisuallyHidden from '@reach/visually-hidden'
import { uniqueId } from 'lodash'
import React, { useCallback, useMemo } from 'react'
import { cold } from 'react-hot-loader'
import { Link } from 'react-router-dom'
import { map } from 'rxjs/operators'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { ViewerGraphsResult, ViewerGraphsVariables } from '../../../graphql-operations'
import { SourcegraphContext } from '../../../jscontext'
import { GraphSelectionProps } from './graphSelectionProps'

interface Props
    extends Omit<GraphSelectionProps, 'contributeContextualGraphs'>,
        Partial<Pick<SourcegraphContext, 'graphsEnabled'>> {}

export const GraphSelector: React.FunctionComponent<Props> =
    // Wrap in cold(...) to work around https://github.com/reach/reach-ui/issues/629.
    cold(
        ({
            selectedGraph,
            setSelectedGraph,
            contextualGraphs,

            // If this uses an optional chain, there is an error `_window$context is not defined`.
            //
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            graphsEnabled = window.context && window.context.graphsEnabled,
        }) => {
            const viewerGraphs = useObservable(
                useMemo(
                    () =>
                        requestGraphQL<ViewerGraphsResult, ViewerGraphsVariables>(
                            gql`
                                query ViewerGraphs {
                                    graphs(affiliated: true) {
                                        nodes {
                                            id
                                            name
                                            description
                                        }
                                    }
                                }
                            `,
                            {}
                        ).pipe(
                            map(dataOrThrowErrors),
                            map(data => data.graphs.nodes)
                        ),
                    []
                )
            )

            const NO_SELECTION_ID = 'everything'
            const NO_SELECTION_LABEL = 'Everything'

            const onChange = useCallback(
                (graphID: string) => {
                    setSelectedGraph(graphID === NO_SELECTION_ID ? null : { id: graphID })
                },
                [setSelectedGraph]
            )

            const allGraphs = useMemo(
                () =>
                    viewerGraphs !== undefined && contextualGraphs !== undefined
                        ? [...contextualGraphs, ...viewerGraphs]
                        : viewerGraphs,
                [contextualGraphs, viewerGraphs]
            )

            const labelId = `GraphSelector--${useMemo(() => uniqueId(), [])}`
            return graphsEnabled ? (
                <>
                    <VisuallyHidden id={labelId}>Select graph</VisuallyHidden>
                    <ListboxInput
                        value={selectedGraph ? selectedGraph.id : NO_SELECTION_ID}
                        onChange={onChange}
                        aria-labelledby={labelId}
                    >
                        <ListboxButton
                            className="btn btn-secondary btn-sm d-inline-flex text-nowrap h-100"
                            arrow={true}
                        >
                            {selectedGraph !== null
                                ? allGraphs?.find(graph => graph.id === selectedGraph.id)?.name
                                : NO_SELECTION_LABEL}
                        </ListboxButton>
                        <ListboxPopover style={{ maxWidth: '10rem' }}>
                            <ListboxList>
                                {allGraphs === undefined ? (
                                    <ListboxGroupLabel>Loading...</ListboxGroupLabel>
                                ) : (
                                    <>
                                        <ListboxOption value={NO_SELECTION_ID}>{NO_SELECTION_LABEL}</ListboxOption>
                                        {allGraphs.map(graph => (
                                            <ListboxOption key={graph.id} value={graph.id} title={graph.description}>
                                                {graph.name}
                                            </ListboxOption>
                                        ))}
                                        <ListboxGroupLabel
                                            className="border-top small mt-2 pt-2"
                                            style={{ whiteSpace: 'unset', minWidth: '10rem' }}
                                        >
                                            <p className="text-muted mb-0">
                                                A graph defines the scope of search and code navigation.
                                            </p>
                                            <Link className="btn btn-secondary btn-sm mt-1" to="TODO">
                                                Manage graphs
                                            </Link>
                                        </ListboxGroupLabel>
                                    </>
                                )}
                            </ListboxList>
                        </ListboxPopover>
                    </ListboxInput>
                </>
            ) : null
        }
    )
