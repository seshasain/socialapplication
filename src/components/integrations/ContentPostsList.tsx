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
  useTheme,
  alpha,
  Tooltip,
  Avatar,
  AvatarGroup,
  Divider,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Schedule as ScheduleIcon,
  Link as LinkIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { ContentPost } from '../../types/integrations';
import { formatDistanceToNow, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/apiClient';

interface ContentPostsListProps {
  sourceId?: string;
}

const ContentPostsList: React.FC<ContentPostsListProps> = ({ sourceId }) => {
  const [posts, setPosts] = useState<ContentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    if (sourceId) {
      fetchPosts();
    }
  }, [sourceId]);

  const fetchPosts = async () => {
    try {
      const response = await api.get(`/api/integrations/posts/${sourceId}`);
      if (response.data) {
        setPosts(response.data.posts);
      }
    } catch (err) {
      setError('Failed to load posts');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedPostId(postId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedPostId(null);
  };

  const getStatusIcon = (status: string): React.ReactElement | undefined => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon fontSize="small" />;
      case 'draft':
        return <WarningIcon fontSize="small" />;
      case 'error':
        return <ErrorIcon fontSize="small" />;
      default:
        return undefined;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'published':
        return '#4caf50'; // success green
      case 'draft':
        return '#ff9800'; // warning orange
      case 'error':
        return '#f44336'; // error red
      default:
        return '#9e9e9e'; // grey
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!sourceId) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="400px"
        sx={{ 
          backgroundColor: alpha(theme.palette.background.default, 0.5),
          borderRadius: 3,
          p: 4,
        }}
      >
        <VisibilityIcon 
          sx={{ 
            fontSize: 48, 
            color: theme.palette.text.secondary,
            mb: 2,
          }} 
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Select a content source to view posts
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center">
          Choose a content source from the list to view its associated posts and manage them
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        p={3} 
        bgcolor={alpha(theme.palette.error.main, 0.1)}
        borderRadius={2}
        border={`1px solid ${theme.palette.error.main}`}
      >
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <AnimatePresence>
      <Grid container spacing={3}>
        {posts.map((post, index) => (
          <Grid item xs={12} key={post.id}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className="group"
                sx={{
                  borderRadius: 3,
                  background: 'white',
                  transition: 'all 0.3s ease',
                  border: '1px solid',
                  borderColor: 'rgba(0,0,0,0.08)',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                    borderColor: 'transparent',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                    {/* Post Preview Image */}
                    {post.featuredImage && (
                      <Grid item xs={12} sm={3}>
                        <Box
                          sx={{
                            width: '100%',
                            paddingTop: '56.25%',
                            borderRadius: 2,
                            backgroundColor: alpha(theme.palette.primary.main, 0.1),
                            backgroundImage: `url(${post.featuredImage})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                          }}
                        />
                      </Grid>
                    )}

                    {/* Post Content */}
                    <Grid item xs={12} sm={post.featuredImage ? 9 : 12}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box>
                          <Typography variant="h6" fontWeight="600" gutterBottom>
                            {post.title}
                          </Typography>
                          <Box display="flex" gap={2} mb={2}>
                            <Chip
                              icon={getStatusIcon(post.status)}
                              label={post.status.toUpperCase()}
                              size="small"
                              sx={{
                                backgroundColor: alpha(getStatusColor(post.status), 0.1),
                                color: getStatusColor(post.status),
                                fontWeight: 500,
                                borderRadius: '6px',
                                '& .MuiChip-icon': {
                                  color: 'inherit',
                                },
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.5,
                                color: 'text.secondary',
                              }}
                            >
                              <CalendarIcon sx={{ fontSize: 14 }} />
                              {format(new Date(post.publishedAt || post.createdAt), 'MMM d, yyyy')}
                            </Typography>
                          </Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 2,
                            }}
                          >
                            {post.excerpt || post.content}
                          </Typography>
                        </Box>
                        <Box>
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, post.id)}
                            size="small"
                            sx={{
                              backgroundColor: alpha(theme.palette.action.active, 0.1),
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.action.active, 0.2),
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>

                      <Box 
                        sx={{ 
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 2,
                          pt: 2,
                          borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                        }}
                      >
                        <Box display="flex" alignItems="center" gap={2}>
                          {post.url && (
                            <Tooltip title="View Original">
                              <IconButton
                                size="small"
                                href={post.url}
                                target="_blank"
                                sx={{
                                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                  '&:hover': {
                                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                                  },
                                }}
                              >
                                <LinkIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {post.authors && post.authors.length > 0 && (
                            <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24, fontSize: '0.75rem' } }}>
                              {post.authors.map((author, idx) => (
                                <Tooltip key={idx} title={author.name}>
                                  <Avatar 
                                    alt={author.name} 
                                    src={author.avatar}
                                    sx={{
                                      backgroundColor: theme.palette.primary.main,
                                    }}
                                  >
                                    {author.name.charAt(0)}
                                  </Avatar>
                                </Tooltip>
                              ))}
                            </AvatarGroup>
                          )}
                        </Box>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                          }}
                        >
                          <ScheduleIcon sx={{ fontSize: 14 }} />
                          Updated {formatDistanceToNow(new Date(post.updatedAt))} ago
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            boxShadow: theme.shadows[8],
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
      >
        <MenuItem onClick={handleMenuClose}>
          <EditIcon sx={{ mr: 2, fontSize: 20 }} />
          Edit Post
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <VisibilityIcon sx={{ mr: 2, fontSize: 20 }} />
          Preview
        </MenuItem>
        <Divider />
        <MenuItem 
          onClick={handleMenuClose}
          sx={{ 
            color: theme.palette.error.main,
            '&:hover': {
              backgroundColor: alpha(theme.palette.error.main, 0.1),
            },
          }}
        >
          <DeleteIcon sx={{ mr: 2, fontSize: 20 }} />
          Delete
        </MenuItem>
      </Menu>
    </AnimatePresence>
  );
};

export default ContentPostsList; 