import { useQuery } from '@tanstack/react-query'

import { getGithubFileList } from 'api/github'

const useGetGithubFileList = (
  owner = 'kenfront',
  repo = 'kenfront.github.io',
  path = 'assets',
  brach = 'main'
) => {
  const { data } = useQuery({
    queryKey: ['useGetGithubFileList'],
    queryFn: () => getGithubFileList({ owner, repo, path, brach })
  })

  return { data }
}

export default useGetGithubFileList
