import { Subscription, Unsubscribable } from 'rxjs'
import { ContributableViewContainer } from '../../../../../shared/src/api/protocol'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import H from 'history'
import { treeReadme } from './treeReadme'
import { treeCommits } from './treeCommits'
import { treeReferences } from './treeReferences'

export const registerTreeViews = ({
    extensionsController: { services },
    history,
}: ExtensionsControllerProps & { history: H.History }): Unsubscribable => {
    const subscription = new Subscription()

    subscription.add(
        services.view.register('treeView.references', ContributableViewContainer.Directory, context =>
            treeReferences(context)
        )
    )

    subscription.add(
        services.view.register('treeView.commits', ContributableViewContainer.Directory, context =>
            treeCommits(context)
        )
    )

    subscription.add(
        services.view.register('treeView.readme', ContributableViewContainer.Directory, context =>
            treeReadme(context, history)
        )
    )

    return subscription
}
