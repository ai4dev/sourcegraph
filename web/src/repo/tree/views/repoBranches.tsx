import React from 'react'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { View } from '../../../../../shared/src/api/client/services/viewService'
import { dataOrThrowErrors, gql } from '../../../../../shared/src/graphql/graphql'
import { parseRepoURI } from '../../../../../shared/src/util/url'
import { requestGraphQL } from '../../../backend/graphql'
import { RepoBranchesResult, RepoBranchesVariables } from '../../../graphql-operations'
import { DirectoryViewContext, URI } from 'sourcegraph'
import { DeepReplace } from '../../../../../shared/src/util/types'
import { gitReferenceFragments } from '../../GitReference'

export const repoBranches = (context: DeepReplace<DirectoryViewContext, URI, string>): Observable<View | null> => {
    const { repoName } = parseRepoURI(context.viewer.directory.uri)
    // TODO(sqs): add rev to RepoBranches query
    //
    // TODO(sqs): support commits older than 1y ago
    const branches = requestGraphQL<RepoBranchesResult, RepoBranchesVariables>(
        gql`
            query RepoBranches($repoName: String!, $first: Int!, $withBehindAhead: Boolean!) {
                repository(name: $repoName) {
                    branches: gitRefs(
                        orderBy: AUTHORED_OR_COMMITTED_AT
                        type: GIT_BRANCH
                        first: $first
                        interactive: true
                    ) {
                        nodes {
                            ...GitRefFields
                        }
                        totalCount
                    }
                }
            }
            ${gitReferenceFragments}
        `,
        { repoName, first: 5, withBehindAhead: true }
    ).pipe(
        map(dataOrThrowErrors),
        map(data => data.repository?.branches)
    )

    return branches.pipe(
        map(branches =>
            branches
                ? {
                      title: 'Branches',
                      content: [
                          {
                              reactComponent: () => (
                                  <div>
                                      {branches.totalCount} branches:
                                      {branches.nodes.map(branch => branch.displayName)}
                                  </div>
                              ),
                          },
                      ],
                  }
                : null
        )
    )
}
