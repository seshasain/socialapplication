import { TwitterApi } from 'twitter-api-v2';

const CALLBACK_URL = 'http://localhost:5173/dashboard';

// Use Vite's environment variables
const twitterClient = new TwitterApi({
  appKey: import.meta.env.TWITTER_API_KEY ?? '',
  appSecret: import.meta.env.TWITTER_API_SECRET ?? '',
  accessToken: import.meta.env.TWITTER_ACCESS_TOKEN ?? '',
  accessSecret: import.meta.env.TWITTER_ACCESS_SECRET ?? '',
});

export const getAuthUrl = async () => {
  try {
    const { url, oauth_token, oauth_token_secret } =
      await twitterClient.generateAuthLink(CALLBACK_URL, {
        linkMode: 'authorize',
      });
    return { url, oauth_token, oauth_token_secret };
  } catch (error) {
    console.error('Error generating Twitter auth URL:', error);
    throw error;
  }
};

export const verifyCredentials = async (
  oauth_token: string,
  oauth_verifier: string,
  oauth_token_secret: string
) => {
  try {
    const client = new TwitterApi({
      appKey: import.meta.env.VITE_TWITTER_API_KEY ?? '',
      appSecret: import.meta.env.VITE_TWITTER_API_SECRET ?? '',
      accessToken: oauth_token,
      accessSecret: oauth_token_secret,
    });

    const {
      client: loggedClient,
      accessToken,
      accessSecret,
    } = await client.login(oauth_verifier);
    const user = await loggedClient.v2.me();

    return {
      accessToken,
      accessSecret,
      userId: user.data.id,
      username: user.data.username,
    };
  } catch (error) {
    console.error('Error verifying Twitter credentials:', error);
    throw error;
  }
};
