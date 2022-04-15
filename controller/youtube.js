const axios = require("axios");
require("dotenv").config;


let count=0;

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
    return getVideoTimeline(itm[0].contentDetails.duration);
  } catch (error) {
    throw new Error(error);
  }
};

const getPlaylistsInfo = async (id, pageToken = null) => {
  let currentToken = "";
  if (pageToken != null) {
    currentToken = `pageToken=${pageToken}`;
  }
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?${currentToken}&part=snippet&maxResults=10&playlistId=${id}&key=${process.env.YOUTUBE_API}&fields=items(snippet(resourceId)),nextPageToken,prevPageToken`;
  try {
    const response = await axios.get(url);
    if (response.statusCode == 400) throw new Error(response.error);

    const nextPageToken = await response.data.nextPageToken;
    const prevPageToken = response.data.prevPageToken;
    const itm = response.data.items;

    itm.forEach(async (element) => {
      console.log(await getVideoInfo(element.snippet.resourceId.videoId));
    });


    if(nextPageToken !=null) getPlaylistsInfo(id, nextPageToken);

    console.log("END");
  } catch (error) {
    throw new Error(error);
  }
};

const get = (req, res) => {
  console.log("Start");
  getPlaylistsInfo(req.params.id);
  res.send("Project in the Development Mode");
};

module.exports = get;
