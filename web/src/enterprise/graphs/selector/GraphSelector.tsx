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
import { GraphIcon } from '../icons'
import { GraphSelectionProps } from './graphSelectionProps'

interface Props extends GraphSelectionProps, Partial<Pick<SourcegraphContext, 'graphsEnabled'>> {}

export const GraphSelector: React.FunctionComponent<Props> =
    // Wrap in cold(...) to work around https://github.com/reach/reach-ui/issues/629.
    cold(
        ({
            selectedGraph,
            setSelectedGraph,

            // If this uses an optional chain, there is an error `_window$context is not defined`.
            //
            // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
            graphsEnabled = window.context && window.context.graphsEnabled,
        }) => {
            const graphs = useObservable(
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

            const NO_SELECTION_ID = 'no-selection'

            const onChange = useCallback(
                (graphID: string) => {
                    setSelectedGraph(graphID === NO_SELECTION_ID ? null : { id: graphID })
                },
                [setSelectedGraph]
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
                            {selectedGraph !== null ? (
                                graphs?.find(graph => graph.id === selectedGraph.id)?.name
                            ) : (
                                <GraphIcon className="icon-inline" aria-hidden={true} />
                            )}
                        </ListboxButton>
                        <ListboxPopover style={{ maxWidth: '10rem' }}>
                            <ListboxList>
                                {graphs === undefined ? (
                                    <ListboxGroupLabel>Loading...</ListboxGroupLabel>
                                ) : (
                                    <>
                                        <ListboxOption value={NO_SELECTION_ID}>Everything</ListboxOption>
                                        {graphs.map(graph => (
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
