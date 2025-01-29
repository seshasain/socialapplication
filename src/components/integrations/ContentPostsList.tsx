import React, { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Schedule as ScheduleIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import { ContentPost, ContentSource } from '../../types/integrations';
import { format } from 'date-fns';

interface ContentPostsListProps {
  sourceId?: string;
}

const ContentPostsList: React.FC<ContentPostsListProps> = ({ sourceId }) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<ContentPost | null>(null);
  const [editedPlatforms, setEditedPlatforms] = useState<string[]>([]);
  const [editedScheduledTime, setEditedScheduledTime] = useState<string>('');

  const fetchPosts = async () => {
    try {
      const url = sourceId
        ? `/api/integrations/posts/${sourceId}`
        : '/api/integrations/posts';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      setPosts(data.posts);
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [sourceId]);

  const handleEditClick = (post: ContentPost) => {
    setSelectedPost(post);
    setEditedPlatforms(post.platforms);
    setEditedScheduledTime(
      post.scheduledTime
        ? format(new Date(post.scheduledTime), "yyyy-MM-dd'T'HH:mm")
        : ''
    );
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPost) return;

    try {
      const response = await fetch(`/api/integrations/posts/${selectedPost.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: editedPlatforms,
          scheduledTime: editedScheduledTime || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update post');

      await fetchPosts();
      setEditDialogOpen(false);
    } catch (err) {
      setError('Failed to update post');
      console.error(err);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      const response = await fetch(`/api/integrations/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete post');
      await fetchPosts();
    } catch (err) {
      setError('Failed to delete post');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Content Posts
        </Typography>
      </Box>

      {error && (
        <Box mb={2}>
          <Typography color="error">{error}</Typography>
        </Box>
      )}

      <Grid container spacing={3}>
        {posts.map((post) => (
          <Grid item xs={12} md={6} lg={4} key={post.id}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" component="h3" noWrap>
                    {post.title}
                  </Typography>
                  <Box>
                    <IconButton onClick={() => handleEditClick(post)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(post.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box mb={2}>
                  <Chip
                    label={post.status}
                    size="small"
                    color={post.status === 'published' ? 'success' : 'default'}
                  />
                  {post.scheduledTime && (
                    <Chip
                      icon={<ScheduleIcon />}
                      label={format(new Date(post.scheduledTime), 'PPp')}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {post.content}
                </Typography>

                <Box display="flex" flexWrap="wrap" gap={1}>
                  {post.platforms.map((platform) => (
                    <Chip
                      key={platform}
                      label={platform}
                      size="small"
                      icon={<ShareIcon />}
                      variant="outlined"
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Post</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Platforms</InputLabel>
              <Select
                multiple
                value={editedPlatforms}
                onChange={(e) => setEditedPlatforms(e.target.value as string[])}
                label="Platforms"
              >
                <MenuItem value="twitter">Twitter</MenuItem>
                <MenuItem value="linkedin">LinkedIn</MenuItem>
                <MenuItem value="facebook">Facebook</MenuItem>
                <MenuItem value="instagram">Instagram</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Schedule Time"
              type="datetime-local"
              value={editedScheduledTime}
              onChange={(e) => setEditedScheduledTime(e.target.value)}
              margin="normal"
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContentPostsList; 