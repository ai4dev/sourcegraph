import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { Markdown } from '../../../../../shared/src/components/Markdown'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { TreeCommitsResult, TreeCommitsVariables } from '../../../graphql-operations'
import { DirectoryViewContext, URI } from 'sourcegraph'
import { DeepReplace } from '../../../../../shared/src/util/types'
import { gitCommitFragment } from '../../commits/RepositoryCommitsPage'
import { GitCommitNode } from '../../commits/GitCommitNode'

export const treeCommits = (context: DeepReplace<DirectoryViewContext, URI, string>): Observable<View | null> => {
    const u = parseRepoURI(context.viewer.directory.uri)
    // TODO(sqs): add rev to TreeCommits query
    //
    // TODO(sqs): support commits older than 1y ago
    const commits = requestGraphQL<TreeCommitsResult, TreeCommitsVariables>(
        gql`
            query TreeCommits($repoName: String!, $path: String!, $first: Int!, $after: String) {
                repository(name: $repoName) {
                    defaultBranch {
                        target {
                            commit {
                                ancestors(path: $path, first: $first, after: $after) {
                                    nodes {
                                        ...GitCommitFields
                                    }
                                    totalCount
                                }
                            }
                        }
                    }
                }
            }
            ${gitCommitFragment}
        `,
        { repoName: u.repoName, path: u.filePath || '', first: 10, after: '1 year ago' }
    ).pipe(
        map(dataOrThrowErrors),
        map(data => data.repository?.defaultBranch?.target.commit?.ancestors)
    )

    return commits.pipe(
        map(commits =>
            commits && commits.nodes.length > 0
                ? {
                      title: 'Commits',
                      content: [
                          {
                              reactComponent: () => (
                                  <div>
                                      {commits.nodes.map(commit => (
                                          <GitCommitNode
                                              key={commit.id}
                                              node={commit}
                                              compact={true}
                                              className="py-0 pr-1"
                                          />
                                      ))}
                                  </div>
                              ),
                          },
                      ],
                  }
                : null
        )
    )
}
