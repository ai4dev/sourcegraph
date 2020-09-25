import React, { useCallback, useMemo, useState } from 'react'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { useObservable } from '../../../../../shared/src/util/useObservable'
import { requestGraphQL } from '../../../backend/graphql'
import { NamespaceAreaContext } from '../../../namespaces/NamespaceArea'
import { map } from 'rxjs/operators'
import { RouteComponentProps } from 'react-router'
import { Form } from '../../../components/Form'
import { LoadingSpinner } from '@sourcegraph/react-loading-spinner'
import {
    GraphToEditResult,
    GraphToEditVariables,
    UpdateGraphResult,
    UpdateGraphVariables,
} from '../../../graphql-operations'
import { isErrorLike } from '../../../../../shared/src/util/errors'

interface Props extends RouteComponentProps<{ id: string }>, NamespaceAreaContext {}

export const GraphOwnerGraphEditPage: React.FunctionComponent<Props> = ({
    match: {
        params: { id },
    },
    history,
}) => {
    const graph = useObservable(
        useMemo(
            () =>
                requestGraphQL<GraphToEditResult, GraphToEditVariables>(
                    gql`
                        query GraphToEdit($id: ID!) {
                            node(id: $id) {
                                ... on Graph {
                                    id
                                    name
                                    description
                                    spec
                                }
                            }
                        }
                    `,
                    { id }
                ).pipe(
                    map(dataOrThrowErrors),
                    map(data => data.node)
                ),
            [id]
        )
    )

    const [name, setName] = useState<string>()
    const onNameChange = useCallback<React.ChangeEventHandler<HTMLInputElement>>(
        event => setName(event.target.value),
        []
    )

    const [description, setDescription] = useState<string>()
    const onDescriptionChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(
        event => setDescription(event.target.value),
        []
    )

    const [spec, setSpec] = useState<string>()
    const onSpecChange = useCallback<React.ChangeEventHandler<HTMLTextAreaElement>>(
        event => setSpec(event.target.value),
        []
    )

    const [opState, setOpState] = useState<boolean | Error>(false)
    const onSubmit = useCallback<React.FormEventHandler>(
        async event => {
            event.preventDefault()
            setOpState(true)
            try {
                const graph = await requestGraphQL<UpdateGraphResult, UpdateGraphVariables>(
                    gql`
                        mutation UpdateGraph($input: UpdateGraphInput!) {
                            updateGraph(input: $input) {
                                url
                            }
                        }
                    `,
                    { input: { id, name, description, spec } }
                )
                    .pipe(
                        map(dataOrThrowErrors),
                        map(data => data.updateGraph)
                    )
                    .toPromise()
                history.push(graph.url)
            } catch (error) {
                setOpState(error)
            }
        },
        [description, history, id, name, spec]
    )

    return (
        <div className="container">
            <h2>Edit graph</h2>
            {graph === null || graph === undefined ? (
                <LoadingSpinner />
            ) : (
                <Form className="w-100" onSubmit={onSubmit}>
                    <div className="form-group">
                        <label htmlFor="GraphOwnerGraphEditPage__name">Name</label>
                        <input
                            id="GraphOwnerGraphEditPage__name"
                            type="text"
                            className="form-control"
                            value={name !== undefined ? name : graph.name}
                            onChange={onNameChange}
                            required={true}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="GraphOwnerGraphEditPage__description">Description</label>
                        <textarea
                            id="GraphOwnerGraphEditPage__description"
                            className="form-control"
                            value={description !== undefined ? description : graph.description}
                            onChange={onDescriptionChange}
                            rows={3}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="GraphOwnerGraphEditPage__spec">Repositories</label>
                        <textarea
                            id="GraphOwnerGraphEditPage__spec"
                            className="form-control"
                            value={spec !== undefined ? spec : graph.spec}
                            onChange={onSpecChange}
                            rows={5}
                        />
                        <small className="form-text text-muted">List repositories by name (one per line).</small>
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={opState === true}>
                        Save
                    </button>
                    {isErrorLike(opState) && <div className="mt-3 alert alert-danger">Error: {opState.message}</div>}
                </Form>
            )}
        </div>
    )
}
