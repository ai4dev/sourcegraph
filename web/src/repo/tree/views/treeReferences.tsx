import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { TreeRefsResult, TreeRefsVariables } from '../../../graphql-operations'
import { DirectoryViewContext, URI } from 'sourcegraph'
import { DeepReplace } from '../../../../../shared/src/util/types'
import { gitReferenceFragments } from '../../GitReference'

export const treeReferences = (context: DeepReplace<DirectoryViewContext, URI, string>): Observable<View | null> => {
    const u = parseRepoURI(context.viewer.directory.uri)
    // TODO(sqs): add rev to TreeRefs query
    //
    // TODO(sqs): support commits older than 1y ago
    const repo = requestGraphQL<TreeRefsResult, TreeRefsVariables>(
        gql`
            query TreeRefs($repoName: String!, $first: Int!, $withBehindAhead: Boolean!) {
                repository(name: $repoName) {
                    branches: gitRefs(orderBy: AUTHORED_OR_COMMITTED_AT, type: GIT_BRANCH, first: $first) {
                        nodes {
                            ...GitRefFields
                        }
                        totalCount
                    }
                    tags: gitRefs(orderBy: AUTHORED_OR_COMMITTED_AT, type: GIT_TAG, first: $first) {
                        nodes {
                            ...GitRefFields
                        }
                        totalCount
                    }
                }
            }
            ${gitReferenceFragments}
        `,
        { repoName: u.repoName, first: 5, withBehindAhead: true }
    ).pipe(
        map(dataOrThrowErrors),
        map(data => data.repository)
    )

    return repo.pipe(
        map(repo =>
            repo
                ? {
                      title: 'Branches & tags',
                      content: [
                          {
                              reactComponent: () => (
                                  <div>
                                      ${repo.branches.totalCount} branches: $
                                      {repo.branches.nodes.map(branch => branch.displayName)}
                                      <br />${repo.tags.totalCount} tags: ${repo.tags.nodes.map(tag => tag.displayName)}
                                  </div>
                              ),
                          },
                      ],
                  }
                : null
        )
    )
}
