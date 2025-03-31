import useGetGithubFileList from 'hooks/api/useGetGithubFileList'

const Diary = () => {
  const { data } = useGetGithubFileList()

  return (
    <div className="grid grid-cols-1 gap-4 py-2">
      {data?.map((item: { name: string }) => (
        <div key={item.name}>{item.name}</div>
      ))}
    </div>
  )
}

export default Diary
