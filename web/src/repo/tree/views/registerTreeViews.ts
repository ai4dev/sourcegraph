import { MarkupKind } from '@sourcegraph/extension-api-classes'
import { of, Subscription, Unsubscribable } from 'rxjs'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { ContributableViewContainer } from '../../../../../shared/src/api/protocol'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'

export const registerTreeViews = ({ services }: ExtensionsControllerProps['extensionsController']): Unsubscribable => {
    const subscription = new Subscription()

    subscription.add(
        services.view.register('foo', ContributableViewContainer.Directory, context =>
            of<View>({
                title: 'Foo',
                content: [
                    { value: 'hello', kind: MarkupKind.Markdown },
                    { reactComponent: () => 'REACT COMPONENT HELLO!' },
                ],
            })
        )
    )

    return subscription
}
