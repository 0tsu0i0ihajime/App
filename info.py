from yt_dlp import YoutubeDL
import sys

url = sys.argv[1:]
opts = {
    'ignoreerrors': True,
    'extract_flat': True
}
links = []


def is_playlist(link):
    with YoutubeDL(opts) as ydl:
        for U in link:
            info = ydl.extract_info(U, download=False)
            if 'entries' in info:
                # pprint(info)
                for i in range(len(info['entries'])):
                    links.append(info['entries'][i]['url'])
            else:
                links.append(U)
    # return links

is_playlist(url)
print(links)
