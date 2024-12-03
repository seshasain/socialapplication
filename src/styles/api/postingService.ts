import { platformApi } from './platformApis';
import type { Post, Platform, PostType, PlatformSettings, PostValidationError } from '../../types/posts';
import type { MediaFile } from '../../types/media';
import { validatePlatformContent } from '../../utils/platformValidation';

interface PublishOptions {
  caption?: string;
  mediaFiles: MediaFile[];
  settings?: PlatformSettings;
  hashtags?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

class PostingService {
  async validatePost(
    caption: string,
    platforms: Platform[],
    postType: PostType,
    mediaFiles: MediaFile[],
    settings?: PlatformSettings
  ): Promise<PostValidationError[]> {
    const errors: PostValidationError[] = [];

    for (const platform of platforms) {
      const platformErrors = validatePlatformContent(platform, caption, mediaFiles);
      errors.push(...platformErrors);
    }

    return errors;
  }

  async createPost(post: Post): Promise<Post> {
    try {
      // First validate the post
      const errors = await this.validatePost(
        post.caption,
        post.platforms.map(p => p.platform),
        'post',
        post.mediaFiles
      );

      if (errors.length > 0) {
        throw new Error('Post validation failed: ' + errors.map(e => e.message).join(', '));
      }

      // Create the post
      const createdPost = await platformApi.createPost(post);

      // Handle immediate publishing if needed
      if (!post.scheduledDate) {
        await this.publishPost(createdPost);
      }

      return createdPost;
    } catch (error) {
      console.error('Failed to create post:', error);
      throw error;
    }
  }

  private createPostRequest(options: PublishOptions, type: PostType) {
    return {
      caption: options.caption || '',
      mediaFiles: options.mediaFiles,
      settings: options.settings,
      hashtags: options.hashtags,
      scheduledDate: options.scheduledDate,
      scheduledTime: options.scheduledTime,
      postType: type,
    };
  }

  private async publishPost(post: Post): Promise<void> {
    for (const platform of post.platforms) {
      try {
        const postData = this.createPostRequest({
          caption: post.caption,
          mediaFiles: post.mediaFiles,
          settings: platform.settings,
          hashtags: post.hashtags,
          scheduledDate: post.scheduledDate,
          scheduledTime: platform.scheduledTime,
        }, 'post');

        await this.publishToPlatform(platform.platform, postData);
      } catch (error) {
        console.error(`Failed to publish to ${platform.platform}:`, error);
        platform.status = 'failed';
        platform.error = error instanceof Error ? error.message : 'Unknown error';
      }
    }
  }

  private async publishToPlatform(platform: Platform, data: ReturnType<typeof this.createPostRequest>) {
    switch (platform) {
      case 'twitter':
        return platformApi.postToTwitter(data);
      case 'instagram':
        return platformApi.postToInstagram(data);
      case 'facebook':
        return platformApi.postToFacebook(data);
      case 'linkedin':
        return platformApi.postToLinkedIn(data);
      case 'tiktok':
        return platformApi.postToTikTok(data);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  async publishTwitterThread(
    posts: Array<{ content: string; mediaFiles: MediaFile[] }>,
    settings?: PlatformSettings['twitter']
  ) {
    const threadPosts = posts.map(post => 
      this.createPostRequest({
        caption: post.content,
        mediaFiles: post.mediaFiles,
        settings: { twitter: settings },
      }, 'thread')
    );

    return platformApi.postTwitterThread(threadPosts);
  }

  async publishStory(
    platform: Platform,
    caption: string,
    mediaFiles: MediaFile[],
    settings?: PlatformSettings
  ) {
    const storyData = this.createPostRequest({
      caption,
      mediaFiles,
      settings,
    }, 'story');

    switch (platform) {
      case 'instagram':
        return platformApi.postInstagramStory(storyData);
      case 'facebook':
        return platformApi.postFacebookStory(storyData);
      default:
        throw new Error(`Stories not supported for platform: ${platform}`);
    }
  }

  async publishReel(
    platform: Platform,
    caption: string,
    mediaFiles: MediaFile[],
    settings?: PlatformSettings
  ) {
    const reelData = this.createPostRequest({
      caption,
      mediaFiles,
      settings,
    }, 'reel');

    switch (platform) {
      case 'instagram':
        return platformApi.postInstagramReel(reelData);
      default:
        throw new Error(`Reels not supported for platform: ${platform}`);
    }
  }

  async retryFailedPost(postId: string): Promise<Post> {
    return platformApi.retryPost(postId);
  }
}

export const postingService = new PostingService();