import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { RepoTagsResult, RepoTagsVariables } from '../../../graphql-operations'
import { DirectoryViewContext, URI } from 'sourcegraph'
import { DeepReplace } from '../../../../../shared/src/util/types'
import { gitReferenceFragments } from '../../GitReference'

export const repoTags = (context: DeepReplace<DirectoryViewContext, URI, string>): Observable<View | null> => {
    const { repoName } = parseRepoURI(context.viewer.directory.uri)
    // TODO(sqs): add rev to RepoTags query
    //
    // TODO(sqs): support commits older than 1y ago
    const tags = requestGraphQL<RepoTagsResult, RepoTagsVariables>(
        gql`
            query RepoTags($repoName: String!, $first: Int!, $withBehindAhead: Boolean!) {
                repository(name: $repoName) {
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
        { repoName, first: 5, withBehindAhead: false }
    ).pipe(
        map(dataOrThrowErrors),
        map(data => data.repository?.tags)
    )

    return tags.pipe(
        map(tags =>
            tags
                ? {
                      title: 'Tags',
                      content: [
                          {
                              reactComponent: () => (
                                  <div>
                                      {tags.totalCount} tags: {tags.nodes.map(tag => tag.displayName)}
                                  </div>
                              ),
                          },
                      ],
                  }
                : null
        )
    )
}
