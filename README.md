# YoutubePlaylist_Duration-likeCount_finder
This API use for count total YouTube playlist duration and total like in playlist. This API find data concurrently and synchronized using mutex

## For use of API 
ipaddress:port/api/:playlistId
## Output 
will be in JSON format 
## app deploy 
youtube-playlist-duration-api.herokuapp.com
## [this link for testing purpose](https://youtubeplaylistdurationlikecounter.onrender.com/api/PLLYz8uHU480j37APNXBdPz7YzAi4XlQUF)

## [docker hub image link](https://hub.docker.com/r/hellodockerspacecon/youtubeplaylisttotaldurationlikefinder)

## you can pull the image use below command
```bash
docker pull hellodockerspacecon/youtubeplaylisttotaldurationlikefinder
```
## for run the image use below command

```bash
docker run -option -p hostPort:3000 --env-file envFilePath hellodockerspacecon/youtubeplaylisttotaldurationlikefinder 
```

### .env should contain below  details

```text
YOUTUBE_API="Your Youtube API key"

PORT=5000
```

## Here i use youtube api which is limited request available.
so you can use your YouTube API key also (ipaddress:port/api/:playlistId/:YouTubeAPI key)