import React from 'react'
import { MarkupKind } from '@sourcegraph/extension-api-classes'
import { of, Subscription, Unsubscribable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { ContributableViewContainer } from '../../../../../shared/src/api/protocol'
import { Markdown } from '../../../../../shared/src/components/Markdown'
import { ExtensionsControllerProps } from '../../../../../shared/src/extensions/controller'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { TreeReadmeResult, TreeReadmeVariables } from '../../../graphql-operations'
import H from 'history'

export const registerTreeViews = ({
    extensionsController: { services },
    history,
}: ExtensionsControllerProps & { history: H.History }): Unsubscribable => {
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

    subscription.add(
        services.view.register('treeView.readme', ContributableViewContainer.Directory, context => {
            const u = parseRepoURI(context.viewer.directory.uri)
            // TODO(sqs): add rev to TreeReadme query
            //
            // TODO(sqs): support readmes other than README.md (eg README, README.txt, ReadMe, etc.)
            const readme = requestGraphQL<TreeReadmeResult, TreeReadmeVariables>(
                gql`
                    query TreeReadme($repoName: String!, $path: String!) {
                        repository(name: $repoName) {
                            defaultBranch {
                                target {
                                    commit {
                                        blob(path: $path) {
                                            richHTML
                                        }
                                    }
                                }
                            }
                        }
                    }
                `,
                { repoName: u.repoName, path: `${u.filePath ? `${u.filePath}/` : ''}README.md` }
            ).pipe(
                map(dataOrThrowErrors),
                map(data => data.repository?.defaultBranch?.target.commit?.blob?.richHTML)
            )

            return readme.pipe(
                map(readme =>
                    readme
                        ? {
                              title: null,
                              content: [
                                  {
                                      reactComponent: () => (
                                          <Markdown
                                              className="view-content__markdown mb-1"
                                              dangerousInnerHTML={readme}
                                              history={history}
                                          />
                                      ),
                                  },
                              ],
                          }
                        : null
                )
            )
        })
    )

    return subscription
}
