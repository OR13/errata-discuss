/**
 * Unit tests for src/rfc_editor.ts
 */

// import { wait } from '../src/wait'
// import { expect } from '@jest/globals'
import fs from 'fs'

export type errata_status_code = 'Reported' | 'Rejected' | 'Verified' | 'Held for Document Update'

const dotenv = require('dotenv');
dotenv.config();

describe.skip('rfc_editor.ts', () => {
 
  it.skip('request errata', async () => {
    const errata_url = 'https://www.rfc-editor.org/errata.json'
    const errata_list = JSON.parse(fs.readFileSync('./__tests__/data/errata.json').toString())

    for (const errata of errata_list){
      if (errata.errata_status_code === 'Reported'){
        console.log(JSON.stringify(errata, null, 2))
        // {
        //   "errata_id": "8016",
        //   "doc-id": "RFC7413",
        //   "errata_status_code": "Reported",
        //   "errata_type_code": "Technical",
        //   "section": "6.3.3",
        //   "orig_text": "    <...> In fact, power has become such a prominent issue in\r\n   modern Long Term Evolution (LTE) devices that mobile browsers close\r\n   HTTP connections within seconds or even immediately [SOUDERS11].\r\n",
        //   "correct_text": "    <...> In fact, power has become such a prominent issue in\r\n   3G mobile devices that mobile browsers close HTTP connections\r\n   within seconds or even immediately [SOUDERS11].\r\n",
        //   "notes": "Reading the reference: It mentions 3G exclusively.\r\n3G data networks are circuit-switched so energy consumption on idle connections is an issue.\r\n4G/5G (LTE) networks are packet-switched, and radio energy consumption (active carrier?) might not be an issue. 4G and 5G are not mentioned in the reference.",
        //   "submit_date": "2024-07-02",
        //   "submitter_name": "Bart Overkamp",
        //   "verifier_id": "2",
        //   "verifier_name": null,
        //   "update_date": "2024-07-03 15:09:43"
        // }
      }
     
    }
    // const errata_example = errata_list

    // console.log(errata_example)

  })


  // https://docs.github.com/en/graphql/guides/using-the-graphql-api-for-discussions
  it.skip('get discussion categories errata', async () => {
    const { graphql } = await import("@octokit/graphql")
    const owner = 'OR13'
    const repo = 'errata-discuss'
    const response = await graphql({
      query: `
      query ($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          id
          discussionCategories(first: 10) {
            # type: DiscussionCategoryConnection
            nodes {
              # type: DiscussionCategory
              id
              name
            }
          }
        }
      }
    `,
      owner,
      repo,
      headers: {
        authorization: `token ${process.env.GITHUB_PAT}`,
      },
    }) as any;
    console.log(JSON.stringify(response, null, 2))
    // {
    //   "repository": {
    //     "id": "R_kgDOMSguww",
    //     "discussionCategories": {
    //       "nodes": [
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaH",
    //           "name": "Announcements"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84Cgma3",
    //           "name": "Errata"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaI",
    //           "name": "General"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaK",
    //           "name": "Ideas"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaM",
    //           "name": "Polls"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaJ",
    //           "name": "Q&A"
    //         },
    //         {
    //           "id": "DIC_kwDOMSguw84CgmaL",
    //           "name": "Show and tell"
    //         }
    //       ]
    //     }
    //   }
    // }

  })

  it.only('create discussion', async () => {
    const errata = {
      "errata_id": "8016",
      "doc-id": "RFC7413",
      "errata_status_code": "Reported",
      "errata_type_code": "Technical",
      "section": "6.3.3",
      "orig_text": "    <...> In fact, power has become such a prominent issue in\r\n   modern Long Term Evolution (LTE) devices that mobile browsers close\r\n   HTTP connections within seconds or even immediately [SOUDERS11].\r\n",
      "correct_text": "    <...> In fact, power has become such a prominent issue in\r\n   3G mobile devices that mobile browsers close HTTP connections\r\n   within seconds or even immediately [SOUDERS11].\r\n",
      "notes": "Reading the reference: It mentions 3G exclusively.\r\n3G data networks are circuit-switched so energy consumption on idle connections is an issue.\r\n4G/5G (LTE) networks are packet-switched, and radio energy consumption (active carrier?) might not be an issue. 4G and 5G are not mentioned in the reference.",
      "submit_date": "2024-07-02",
      "submitter_name": "Bart Overkamp",
      "verifier_id": "2",
      "verifier_name": null,
      "update_date": "2024-07-03 15:09:43"
    }
    const { graphql } = await import("@octokit/graphql")
    const repositoryId = 'R_kgDOMSguww'
    const categoryId = 'DIC_kwDOMSguw84Cgma3'
    const title = `EID${errata.errata_id}`

    const oldText = errata.orig_text.split(`\r\n`).map((line)=>{
      return `- ${line}`
    }).join('\n')

    const newText = errata.correct_text.split(`\r\n`).map((line)=>{
      return `+ ${line}`
    }).join('\n')
    const body = `

# ${title}

### [RFC Editor Link](https://www.rfc-editor.org/errata/eid${errata.errata_id})

### [AD Verify Link](https://www.rfc-editor.org/verify_errata_select.php?eid=${errata.errata_id})

~~~ diff
${oldText.trim()}
${newText.trim()}
~~~

### Notes

${errata.notes}

    `.trim()
    const { repository } = await graphql(
      {
        query: `
        mutation ($repositoryId: ID!, $categoryId: ID!, $body: String!, $title: String!) {
          createDiscussion(input: {repositoryId: $repositoryId, categoryId: $categoryId, body: $body, title: $title}) {
            discussion {
              title
              url
            }
          }
        }
      `,
      repositoryId,
      categoryId,
      body,
      title,
        headers: {
          authorization: `token ${process.env.GITHUB_PAT}`,
        },
      },
    ) as any;

    console.log(repository)
  })

  // https://docs.github.com/en/search-github/searching-on-github/searching-discussions
  it.skip('find discussion', async () => {
    
    const { graphql } = await import("@octokit/graphql")
    const search = 'repo:OR13/errata-discuss in:title EID8016'
    const response = await graphql({
      query: `
      query ($search: String!) {
        search(query: $search, type: DISCUSSION, first: 1) {
          edges {
            node {
              ... on Discussion {
                id
              }
            }
          }
        }
      }
    `,
      search,
      headers: {
        authorization: `token ${process.env.GITHUB_PAT}`,
      },
    }) as any;

    console.log(JSON.stringify(response, null, 2))
    // {
    //   "search": {
    //     "edges": [
    //       {
    //         "node": {
    //           "id": "D_kwDOMSguw84AaVHo"
    //         }
    //       }
    //     ]
    //   }
    // }

  })

  it.skip('delete discussion', async () => {
    const { graphql } = await import("@octokit/graphql")
    const discussionId = 'D_kwDOMSguw84AaVJc'
    const response = await graphql(
      {
        query: `
        mutation ($discussionId: ID!, ) {
          deleteDiscussion(input: {id: $discussionId}) {
            discussion {
              title
              url
            }
          }
        }
      `,
        discussionId,
        headers: {
          authorization: `token ${process.env.GITHUB_PAT}`,
        },
      },
    ) as any;
    console.log(JSON.stringify(response, null, 2))
  })
})
