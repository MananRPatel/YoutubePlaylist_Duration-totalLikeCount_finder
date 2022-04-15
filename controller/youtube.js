const axios = require("axios");
require("dotenv").config;

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
    console.log(error);
  }
};

const get = (req, res) => {
  const time = getVideoInfo(req.params.id).then((length) => {
    console.log("Video Length is " + length+" sec");
    res.send("Project in the Development Mode");
  });
};

module.exports = get;
