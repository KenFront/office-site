import { http, HttpResponse } from 'msw'

export const mockGetGithubFileList = http.get(
  'https://api.github.com/repos/kenfront/kenfront.github.io/contents/assets',
  () =>
    HttpResponse.json([
      {
        name: 'test.js',
        path: 'assets/123.js',
        sha: 'a63531ccc07cf27ae7617f6de6e7eb2faffcab0b',
        size: 905,
        url: 'https://api.github.com/repos/KenFront/kenfront.github.io/contents/assets/Collapse-CUWcCDU5.js?ref=main',
        html_url:
          'https://github.com/KenFront/kenfront.github.io/blob/main/assets/Collapse-CUWcCDU5.js',
        git_url:
          'https://api.github.com/repos/KenFront/kenfront.github.io/git/blobs/a63531ccc07cf27ae7617f6de6e7eb2faffcab0b',
        download_url:
          'https://raw.githubusercontent.com/KenFront/kenfront.github.io/main/assets/Collapse-CUWcCDU5.js',
        type: 'file',
        _links: {
          self: 'https://api.github.com/repos/KenFront/kenfront.github.io/contents/assets/Collapse-CUWcCDU5.js?ref=main',
          git: 'https://api.github.com/repos/KenFront/kenfront.github.io/git/blobs/a63531ccc07cf27ae7617f6de6e7eb2faffcab0b',
          html: 'https://github.com/KenFront/kenfront.github.io/blob/main/assets/Collapse-CUWcCDU5.js'
        }
      }
    ])
)
