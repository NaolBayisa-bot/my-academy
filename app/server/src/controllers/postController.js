const { Op } = require('sequelize');
const { User, Category, Post } = require('../models');

// POST /api/posts
// Creates a new post/announcement. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')`.
//
// Permission rules:
//  - category_admin: may ONLY create posts with `category_id` set to their OWN
//    category. A null `category_id` (global) or a foreign category_id is
//    rejected with 403.
//  - super_admin: may create a global post (category_id null) or a post in any
//    specific category of their choosing.
//
// `author_id` is always taken from the authenticated user, never from the body.
exports.createPost = async (req, res, next) => {
  const { category_id, title, content } = req.body;

  try {
    // Re-fetch the authenticated user so we can read the real `role` and
    // `category_id` from the DB (the JWT payload only carries { id, role }).
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Permission: category_admin may only create posts in their own category.
    // null (global) or any other category is forbidden for them.
    if (currentUser.role === 'category_admin') {
      if (category_id === null || currentUser.category_id !== category_id) {
        return res.status(403).json({
          error:
            'Category admin can only create posts in their own category.',
        });
      }
    }

    // When a category_id is supplied, confirm the target category exists.
    if (category_id) {
      const category = await Category.findByPk(category_id);
      if (!category) {
        return res.status(404).json({ error: 'Category not found.' });
      }
    }

    const post = await Post.create({
      author_id: currentUser.id,
      category_id,
      title,
      content,
    });

    return res.status(201).json({
      message: 'Post created successfully.',
      post,
    });
  } catch (error) {
    // Delegate to the centralized error handler in
    // src/middleware/errorHandler.js. Sequelize validation errors are
    // mapped to 400 there.
    next(error);
  }
};

// GET /api/posts
// Returns the posts visible to the authenticated user. Protected by
// `authenticate`; any authenticated role may access.
//
// Visibility rules:
//  - student: posts whose category_id equals their own, OR global (null).
//  - category_admin: the same as student — their category plus global posts.
//  - super_admin: ALL posts, optionally narrowed with ?categoryId=<uuid>.
//
// Results are always ordered by created_at descending.
exports.getPosts = async (req, res) => {
  const { categoryId } = req.query;

  try {
    // Re-fetch the authenticated user for role / category_id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    let where = {};

    if (currentUser.role === 'super_admin') {
      // All posts, optionally filtered to a single category. When a
      // categoryId is supplied only posts in that category are returned.
      if (categoryId) {
        where.category_id = categoryId;
      }
    } else {
      // student & category_admin: their own category OR global (null).
      where = {
        [Op.or]: [
          { category_id: currentUser.category_id },
          { category_id: null },
        ],
      };
    }

    const posts = await Post.findAll({
      where,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'author',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    return res.status(200).json({ posts });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// DELETE /api/posts/:id
// Deletes a post. Protected by `authenticate` +
// `authorize('super_admin', 'category_admin')` at the route level, with an
// additional author check inside.
//
// Permission rules:
//  - super_admin: can delete any post.
//  - category_admin: can delete a post only when they are its author.
exports.deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    // Re-fetch the authenticated user for role / id.
    const currentUser = await User.findByPk(req.user.id);

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    // Permission: only the author or a super_admin may delete the post.
    if (
      currentUser.id !== post.author_id &&
      currentUser.role !== 'super_admin'
    ) {
      return res.status(403).json({
        error: 'Only the author or a super admin can delete this post.',
      });
    }

    await post.destroy();

    return res.status(200).json({
      message: 'Post deleted successfully.',
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
