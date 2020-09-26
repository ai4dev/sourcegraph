import { NamespaceAreaRoute } from '../../../namespaces/NamespaceArea'
import { NavItemWithIconDescriptor } from '../../../util/contributions'
import { lazyComponent } from '../../../util/lazyComponent'
import { GraphIcon } from '../icons'

export const graphOwnerAreaRoutes: readonly NamespaceAreaRoute[] = [
    {
        path: '/graphs',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerListGraphsPage'), 'GraphOwnerListGraphsPage'),
        condition: () => window.context?.graphsEnabled,
    },
    {
        path: '/graphs/new',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerNewGraphPage'), 'GraphOwnerNewGraphPage'),
        condition: () => window.context?.graphsEnabled,
    },
    {
        path: '/graphs/:name',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerGraphPage'), 'GraphOwnerGraphPage'),
        condition: () => window.context?.graphsEnabled,
    },
    {
        path: '/graphs/:name/edit',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerEditGraphPage'), 'GraphOwnerEditGraphPage'),
        condition: () => window.context?.graphsEnabled,
    },
]

export const graphOwnerNavItems: readonly NavItemWithIconDescriptor[] = [
    {
        to: '/graphs',
        label: 'Graphs',
        icon: GraphIcon,
        condition: () => window.context?.graphsEnabled,
    },
]
