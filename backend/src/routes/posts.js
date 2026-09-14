const express = require('express');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/posts?page=1&limit=9&tag=devops&search=eks
router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 9, 50);
    const offset = (page - 1) * limit;
    const { tag, search } = req.query;

    let where = 'WHERE p.status = "published"';
    const params = {};
    if (tag) {
      where += ' AND p.tag = :tag';
      params.tag = tag;
    }
    if (search) {
      where += ' AND (p.title LIKE :search OR p.excerpt LIKE :search)';
      params.search = `%${search}%`;
    }

    const [rows] = await pool.query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image, p.tag, p.read_minutes,
              p.created_at, u.name AS author_name
       FROM posts p JOIN users u ON u.id = p.author_id
       ${where}
       ORDER BY p.created_at DESC
       LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM posts p ${where}`,
      params
    );

    res.json({ data: rows, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('List posts error:', err.message);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// GET /api/posts/:slug
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS author_name FROM posts p
       JOIN users u ON u.id = p.author_id WHERE p.slug = :slug`,
      { slug: req.params.slug }
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Post not found' });

    const [comments] = await pool.query(
      `SELECT c.id, c.body, c.created_at, u.name AS author_name
       FROM comments c JOIN users u ON u.id = c.author_id
       WHERE c.post_id = :postId ORDER BY c.created_at ASC`,
      { postId: rows[0].id }
    );

    res.json({ ...rows[0], comments });
  } catch (err) {
    console.error('Get post error:', err.message);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// POST /api/posts (auth required)
router.post(
  '/',
  authenticate,
  [
    body('title').trim().isLength({ min: 3 }),
    body('body').trim().isLength({ min: 20 }),
    body('tag').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { title, body: content, excerpt, tag, coverImage } = req.body;
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;
    const readMinutes = Math.max(1, Math.round(content.split(/\s+/).length / 200));

    try {
      const [result] = await pool.query(
        `INSERT INTO posts (title, slug, body, excerpt, cover_image, tag, read_minutes, author_id, status)
         VALUES (:title, :slug, :body, :excerpt, :coverImage, :tag, :readMinutes, :authorId, 'published')`,
        {
          title,
          slug,
          body: content,
          excerpt: excerpt || content.slice(0, 160),
          coverImage: coverImage || null,
          tag: tag || 'general',
          readMinutes,
          authorId: req.user.id,
        }
      );
      res.status(201).json({ id: result.insertId, slug });
    } catch (err) {
      console.error('Create post error:', err.message);
      res.status(500).json({ error: 'Failed to create post' });
    }
  }
);

// POST /api/posts/:slug/comments (auth required)
router.post('/:slug/comments', authenticate, [body('body').trim().isLength({ min: 1 })], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const [posts] = await pool.query('SELECT id FROM posts WHERE slug = :slug', { slug: req.params.slug });
    if (posts.length === 0) return res.status(404).json({ error: 'Post not found' });

    await pool.query(
      'INSERT INTO comments (post_id, author_id, body) VALUES (:postId, :authorId, :body)',
      { postId: posts[0].id, authorId: req.user.id, body: req.body.body }
    );
    res.status(201).json({ message: 'Comment added' });
  } catch (err) {
    console.error('Add comment error:', err.message);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

module.exports = router;
