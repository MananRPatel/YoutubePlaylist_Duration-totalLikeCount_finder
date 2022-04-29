const axios = require("axios");
require("dotenv").config;

class Youtube {
  Youtube() {
    this.lock = require("async-mutex");
    this.apimutex = new this.lock.Mutex();
    this.countmutex = new this.lock.Mutex();
    this.sendmutex = new this.lock.Mutex();

    this.mainResponse = 0;
    this.totalDurationOfVideo = 0;
    this.totalLikeCount = 0;
    this.totalVideo = 0;
    this.videoInPlaylist = 0;
    this.YoutubeAPI = 0;
  }

  getVideoTimeline = (time) => {
    const date = ["H", "M", "S"];
    const timer = [0, 0, 0, 0];

    let D = time.indexOf("D");
    if (D != -1) timer[0] = +time.slice(0 + 1, D);

    let prevIndex = time.indexOf("T"),
      nextIndex = 0;

    for (let i = 0; i < date.length; i++) {
      nextIndex = time.indexOf(date[i]);
      if (nextIndex !== -1) {
        timer[i + 1] = +time.slice(prevIndex + 1, nextIndex);
        prevIndex = nextIndex;
      }
    }
    return (
      24 * 60 * 60 * timer[0] + 60 * 60 * timer[1] + 60 * timer[2] + timer[3]
    );
  };

  async getVideoInfo(id) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${id}&fields=items(contentDetails(duration)),items(statistics(likeCount))&key=${this.YoutubeAPI}`;

    try {
      const countmutex = this.countmutex;
      const response = await axios.get(url);
      const itm = response.data.items;
      if (+itm.length == 0) {
        await countmutex.runExclusive(() => {
          this.totalVideo--;
        });
        return;
      }
      await this.apimutex.runExclusive(() => {
        this.totalDurationOfVideo += this.getVideoTimeline(
          itm[0].contentDetails.duration
        );
        if (Object.keys(itm[0].statistics).length != 0)
          this.totalLikeCount += +itm[0].statistics.likeCount;
        countmutex.runExclusive(() => {
          this.totalVideo--;

          if (this.totalVideo == 0) {
            if (!this.sendmutex.isLocked())
              this.sendmutex.acquire().then((release) => {
                this.mainResponse.send(this.statisticsOfVideo());
              });
          }
        });
      });
    } catch (error) {
      if (!this.sendmutex.isLocked())
        this.sendmutex.acquire().then((release) => {
          if (error.response.data == null) this.SendError(500);
          else this.SendError(error.response.data.error.code);
        });
    }
  }

  async getPlaylistsInfo(id, pageToken = null) {
    let currentToken = "";
    if (pageToken != null) {
      currentToken = `pageToken=${pageToken}`;
    }
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?${currentToken}&part=snippet&maxResults=50&playlistId=${id}&key=${this.YoutubeAPI}&fields=items(snippet(resourceId)),nextPageToken,prevPageToken,pageInfo`;
    try {
      const response = await axios.get(url);
      const nextPageToken = await response.data.nextPageToken;
      const itm = response.data.items;
      if (pageToken == null)
        this.countmutex.runExclusive(() => {
          this.totalVideo = +response.data.pageInfo.totalResults;
          this.videoInPlaylist = this.totalVideo;
        });

      for (let index = 0; index < itm.length; index++) {
        this.getVideoInfo(itm[index].snippet.resourceId.videoId);
      }
      if (nextPageToken != null)
        this.countmutex.runExclusive(() => {
          this.getPlaylistsInfo(id, nextPageToken);
        });
    } catch (error) {
      if (!this.sendmutex.isLocked())
        this.sendmutex.acquire().then((release) => {
          if (error.response.data == null) this.SendError(500);
          else this.SendError(error.response.data.error.code);
        });
    }
  }

  statisticsOfVideo() {
    const videoInPlaylist = this.videoInPlaylist;
    const totalDurationOfVideo = this.totalDurationOfVideo;
    const avgVideoDuration = Math.round(
      this.totalDurationOfVideo / this.videoInPlaylist
    );
    const totalLikeCount = this.totalLikeCount;
    const avgLikeCount = Math.round(this.totalLikeCount / this.videoInPlaylist);

    const obj = {
      videoInPlaylist,
      totalDurationOfVideo,
      avgVideoDuration,
      totalLikeCount,
      avgLikeCount,
      __comment__: "Video Duration is in seconds",
    };
    return obj;
  }

  SendError(code) {
    switch (code) {
      case 400:
        this.mainResponse.status(code).send({ error: "wrong API key entered" });
        break;
      case 403:
        this.mainResponse.status(code).send({
          error: "Here my api key quota is overed so pleased add your API key",
        });
        break;
      case 404:
        this.mainResponse.status(code).send({ error: "Wrong PlaylistId" });
        break;
      default:
        this.mainResponse
          .status(code)
          .send({ error: "Error can't resolve now" });
    }
  }
}

const get = async function (req, res) {
  let youtube = new Youtube();
  youtube.Youtube();
  youtube.YoutubeAPI =
    req.params.api == undefined ? process.env.YOUTUBE_API : req.params.api;
  youtube.mainResponse = res;
  await youtube.getPlaylistsInfo(req.params.id);
};

module.exports = get;
