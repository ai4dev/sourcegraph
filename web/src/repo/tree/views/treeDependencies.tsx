import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { TreeDependenciesResult, TreeDependenciesVariables } from '../../../graphql-operations'
import { DirectoryViewContext, URI } from 'sourcegraph'
import { DeepReplace } from '../../../../../shared/src/util/types'
import { gitReferenceFragments, GitReferenceNode } from '../../GitReference'
import { pluralize } from '../../../../../shared/src/util/strings'

export const treeDependencies = (context: DeepReplace<DirectoryViewContext, URI, string>): Observable<View | null> => {
    const { repoName, filePath } = parseRepoURI(context.viewer.directory.uri)
    // TODO(sqs): add rev to TreeDependencies query
    //
    // TODO(sqs): support commits older than 1y ago
    const dependencies = requestGraphQL<TreeDependenciesResult, TreeDependenciesVariables>(
        gql`
            query TreeDependencies($repoName: String!, $path: String!, $first: Int!) {
                repository(name: $repoName) {
                    defaultBranch {
                        target {
                            commit {
                                tree(path: $path) {
                                    lsif {
                                        dependencies(first: $first) {
                                            nodes {
                                                foo
                                            }
                                            totalCount
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `,
        { repoName, path: filePath || '', first: 10 }
    ).pipe(
        map(dataOrThrowErrors),
        map(data => data.repository?.defaultBranch?.target.commit?.tree?.lsif?.dependencies)
    )

    return dependencies.pipe(
        map(dependencies =>
            dependencies
                ? {
                      title: `${dependencies.totalCount} ${pluralize(
                          'dependency',
                          dependencies.totalCount,
                          'dependencies'
                      )}`,
                      content: [
                          {
                              reactComponent: () => (
                                  <pre>{dependencies.nodes.map(dependency => `Dep ${dependency.foo}`).join('\n')}</pre>
                              ),
                          },
                      ],
                  }
                : null
        )
    )
}
