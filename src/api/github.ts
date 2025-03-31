export const getGithubFileList = ({
  owner,
  repo,
  path,
  brach
}: {
  owner: string
  repo: string
  path: string
  brach: string
}): Promise<{ name: string }[]> =>
  fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${brach}`,
    {
      headers: {
        Accept: 'application/vnd.github.v3+json'
      }
    }
  ).then((res) => res.json())
