import { useId } from '@reach/auto-id'
import {
    ListboxButton,
    ListboxGroupLabel,
    ListboxInput,
    ListboxList,
    ListboxOption,
    ListboxPopover,
} from '@reach/listbox'
import VisuallyHidden from '@reach/visually-hidden'
import React from 'react'
import { SourcegraphContext } from '../../../jscontext'
import { GraphIcon } from '../icons'

interface Props extends Partial<Pick<SourcegraphContext, 'graphsEnabled'>> {}

export const GraphSelector: React.FunctionComponent<Props> = ({
    graphsEnabled = window.context && window.context.graphsEnabled,
}) => {
    const labelId = `GraphSelector--${useId()}`
    return graphsEnabled ? (
        <div>
            <VisuallyHidden id={labelId}>Select graph</VisuallyHidden>
            <ListboxInput value="foo" onChange={() => console.log('2TODO')} aria-labelledby={labelId}>
                <ListboxButton className="btn btn-secondary d-inline-flex" arrow={true}>
                    <GraphIcon className="icon-inline" aria-hidden={true} />
                </ListboxButton>
                <ListboxPopover portal={false}>
                    <ListboxList>
                        <ListboxGroupLabel disabled={true}>Title</ListboxGroupLabel>
                        <ListboxOption value="foo">Foo</ListboxOption>
                    </ListboxList>
                </ListboxPopover>
            </ListboxInput>
        </div>
    ) : null
}
