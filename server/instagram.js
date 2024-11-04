import { IgApiClient } from 'instagram-private-api';

export const createInstagramClient = (username, password) => {
  const ig = new IgApiClient();
  ig.state.generateDevice(username);
  return ig;
};

export const authenticateInstagram = async (client, username, password) => {
  try {
    await client.simulate.preLoginFlow();
    const loggedInUser = await client.account.login(username, password);
    await client.simulate.postLoginFlow();
    return loggedInUser;
  } catch (error) {
    console.error('Instagram authentication error:', error);
    throw error;
  }
};

export const postToInstagram = async (client, { caption, mediaFiles = [] }) => {
  try {
    if (mediaFiles.length === 0) {
      throw new Error('Instagram requires at least one media file');
    }

    const mediaBuffers = await Promise.all(
      mediaFiles.map(file => fetch(file.url).then(res => res.buffer()))
    );

    let post;
    if (mediaFiles.length === 1) {
      if (mediaFiles[0].type === 'video') {
        post = await client.publish.video({
          video: mediaBuffers[0],
          caption
        });
      } else {
        post = await client.publish.photo({
          file: mediaBuffers[0],
          caption
        });
      }
    } else {
      post = await client.publish.album({
        items: mediaBuffers.map(buffer => ({
          file: buffer
        })),
        caption
      });
    }

    return post;
  } catch (error) {
    console.error('Instagram posting error:', error);
    throw error;
  }
};