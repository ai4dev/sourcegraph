import { NamespaceAreaRoute } from '../../../namespaces/NamespaceArea'
import { NavItemWithIconDescriptor } from '../../../util/contributions'
import { lazyComponent } from '../../../util/lazyComponent'
import { GraphIcon } from '../icons'

export const graphOwnerAreaRoutes: readonly NamespaceAreaRoute[] = [
    {
        path: '/graphs',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerGraphListPage'), 'GraphOwnerGraphListPage'),
    },
    {
        path: '/graphs/:id/edit',
        exact: true,
        render: lazyComponent(() => import('./GraphOwnerGraphEditPage'), 'GraphOwnerGraphEditPage'),
    },
]

export const graphOwnerNavItems: readonly NavItemWithIconDescriptor[] = [
    {
        to: '/graphs',
        label: 'Graphs',
        icon: GraphIcon,
    },
]
