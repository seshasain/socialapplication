import { google } from 'googleapis';
import { Client } from '@notionhq/client';
import axios from 'axios';
import { oauthConfig } from '../config/oauth';
import prisma from '../lib/prisma';
import { randomBytes } from 'crypto';

// Initialize Google OAuth2 client
const googleOAuth2Client = new google.auth.OAuth2(
  oauthConfig.google.clientId,
  oauthConfig.google.clientSecret,
  oauthConfig.google.redirectUri
);

export class OAuthService {
  // Generate OAuth URLs
  static getGoogleAuthUrl(userId: string): string {
    const state = this.encodeState({ userId, provider: 'google' });
    return googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: oauthConfig.google.scopes,
      state,
      prompt: 'consent'
    });
  }

  static getNotionAuthUrl(userId: string): string {
    const state = this.encodeState({ userId, provider: 'notion' });
    const params = new URLSearchParams({
      client_id: oauthConfig.notion.clientId!,
      redirect_uri: oauthConfig.notion.redirectUri,
      response_type: 'code',
      state
    });
    return `${oauthConfig.notion.authUrl}?${params.toString()}`;
  }

  static getWordPressAuthUrl(userId: string): string {
    const state = this.encodeState({ userId, provider: 'wordpress' });
    // For WordPress.com OAuth
    return `https://public-api.wordpress.com/oauth2/authorize?client_id=${
      oauthConfig.wordpress.clientId
    }&redirect_uri=${encodeURIComponent(
      oauthConfig.wordpress.redirectUri
    )}&response_type=code&state=${state}`;
  }

  // Handle OAuth callbacks
  static async handleGoogleCallback(code: string, state: string) {
    const { userId } = this.decodeState(state);
    
    const { tokens } = await googleOAuth2Client.getToken(code);
    
    // Store the integration
    return await prisma.integration.create({
      data: {
        userId,
        type: 'google_docs',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        scope: tokens.scope,
        status: 'active',
        metadata: {
          tokenType: tokens.token_type,
          idToken: tokens.id_token
        }
      }
    });
  }

  static async handleNotionCallback(code: string, state: string) {
    const { userId } = this.decodeState(state);
    
    // Exchange code for access token
    const response = await axios.post(oauthConfig.notion.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: oauthConfig.notion.redirectUri
    }, {
      auth: {
        username: oauthConfig.notion.clientId!,
        password: oauthConfig.notion.clientSecret!
      }
    });

    const { access_token, workspace_id, owner } = response.data;

    // Store the integration
    return await prisma.integration.create({
      data: {
        userId,
        type: 'notion',
        accessToken: access_token,
        status: 'active',
        metadata: {
          workspaceId: workspace_id,
          owner
        }
      }
    });
  }

  static async handleWordPressCallback(code: string, state: string) {
    const { userId } = this.decodeState(state);
    
    // Exchange code for access token (WordPress.com OAuth)
    const response = await axios.post('https://public-api.wordpress.com/oauth2/token', {
      client_id: oauthConfig.wordpress.clientId,
      client_secret: oauthConfig.wordpress.clientSecret,
      redirect_uri: oauthConfig.wordpress.redirectUri,
      code,
      grant_type: 'authorization_code'
    });

    const { access_token, blog_id, blog_url } = response.data;

    // Store the integration
    return await prisma.integration.create({
      data: {
        userId,
        type: 'wordpress',
        accessToken: access_token,
        status: 'active',
        metadata: {
          blogId: blog_id,
          blogUrl: blog_url
        }
      }
    });
  }

  // Token refresh methods
  static async refreshGoogleToken(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!integration?.refreshToken) {
      throw new Error('No refresh token available');
    }

    googleOAuth2Client.setCredentials({
      refresh_token: integration.refreshToken
    });

    const { credentials } = await googleOAuth2Client.refreshAccessToken();

    return await prisma.integration.update({
      where: { id: integrationId },
      data: {
        accessToken: credentials.access_token!,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        metadata: {
          ...integration.metadata,
          tokenType: credentials.token_type,
          idToken: credentials.id_token
        }
      }
    });
  }

  // Helper methods
  private static encodeState(data: { userId: string; provider: string }): string {
    const stateStr = JSON.stringify(data);
    return Buffer.from(stateStr).toString('base64');
  }

  private static decodeState(state: string): { userId: string; provider: string } {
    const stateStr = Buffer.from(state, 'base64').toString();
    return JSON.parse(stateStr);
  }

  // Revoke access
  static async revokeAccess(integrationId: string) {
    const integration = await prisma.integration.findUnique({
      where: { id: integrationId }
    });

    if (!integration) {
      throw new Error('Integration not found');
    }

    switch (integration.type) {
      case 'google_docs':
        await googleOAuth2Client.revokeToken(integration.accessToken);
        break;
      case 'notion':
        // Notion doesn't have a token revocation endpoint
        break;
      case 'wordpress':
        // WordPress.com token revocation
        await axios.post('https://public-api.wordpress.com/oauth2/token/revoke', {
          client_id: oauthConfig.wordpress.clientId,
          client_secret: oauthConfig.wordpress.clientSecret,
          token: integration.accessToken
        });
        break;
    }

    return await prisma.integration.update({
      where: { id: integrationId },
      data: {
        status: 'revoked',
        accessToken: '',
        refreshToken: null
      }
    });
  }
} 