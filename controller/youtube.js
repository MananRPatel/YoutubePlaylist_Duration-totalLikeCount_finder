const axios = require("axios");
require("dotenv").config;
const lock = require("async-mutex");
const apimutex = new lock.Mutex();

let totalDurationOfVideo = 0;
let totalLikeCount = 0;
let totalVideo = 0;

getVideoTimeline = (time) => {
  const date = ["H", "M", "S"];
  const timer = [0, 0, 0, 0];

  let D = time.indexOf("D");
  if (D != -1) timer[0] = +time.slice(0 + 1, D);

  (prevIndex = time.indexOf("T")), (nextIndex = 0);

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

const getVideoInfo = async (id) => {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet%2CcontentDetails%2Cstatistics&id=${id}&fields=items(contentDetails(duration)),items(statistics(likeCount))&key=${process.env.YOUTUBE_API}`;
  try {
    const response = await axios.get(url);
    const itm = response.data.items;
    if (itm.length == 0) throw new Error("This is not id of playlist");

    await apimutex.runExclusive(() => {
      totalDurationOfVideo += getVideoTimeline(itm[0].contentDetails.duration);
      totalLikeCount += +itm[0].statistics.likeCount;
    });
  } catch (error) {
    throw new Error(error);
  }
};

const getPlaylistsInfo = async (id, pageToken = null) => {
  let currentToken = "";
  if (pageToken != null) {
    currentToken = `pageToken=${pageToken}`;
  }
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?${currentToken}&part=snippet&maxResults=10&playlistId=${id}&key=${process.env.YOUTUBE_API}&fields=items(snippet(resourceId)),nextPageToken,prevPageToken,pageInfo`;
  try {

    const response = await axios.get(url);
    if (response.statusCode == 400) throw new Error(response.error);

    const nextPageToken =  response.data.nextPageToken;
    const itm = response.data.items;

    if (pageToken == null) totalVideo = +response.data.pageInfo.totalResults;

    for (let index = 0; index < itm.length; index++) {
      await getVideoInfo(itm[index].snippet.resourceId.videoId);
    }
    if (nextPageToken != null) await getPlaylistsInfo(id, nextPageToken);
  } catch (error) {
    throw new Error(error);
  }
};

const statisticsOfVideo = () => {
  obj = {
    totalVideo,
    totalDurationOfVideo,
    avgVideoDuration: Math.round(totalDurationOfVideo / totalVideo),
    totalLikeCount,
    avgLikeCount: Math.round(totalLikeCount / totalVideo),
    __comment__: "Video length is in seconds",
  };
  totalDurationOfVideo = 0;
  totalLikeCount = 0;
  return obj;
};

const get = async function (req, res) {
  await getPlaylistsInfo(req.params.id);
  res.send(statisticsOfVideo());
};

module.exports = get;
