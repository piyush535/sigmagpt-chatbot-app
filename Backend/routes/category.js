import express from 'express';
import Category from '../models/Category.js';
import Thread from '../models/Thread.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
    try {
        const categories = await Category.find({
            userId: req.user.userId
        }).sort({ name: 1 });

        res.json(categories);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to fetch categories'
        });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                error: 'Category name is required'
            });
        }

        const categoryName = name.trim();

        if (categoryName.length > 50) {
            return res.status(400).json({
                error: 'Category name cannot exceed 50 characters'
            });
        }

        const category = await Category.create({
            userId: req.user.userId,
            name: categoryName,
            isSystemCategory: false
        });

        res.status(201).json(category);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                error: 'Category already exists'
            });
        }

        console.error(error);

        res.status(500).json({
            error: 'Failed to create category'
        });
    }
});

router.delete('/:categoryId', async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findOneAndDelete({
            _id: categoryId,
            userId: req.user.userId,
            isSystemCategory: false
        });

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        await Thread.updateMany(
            {
                categoryId,
                userId: req.user.userId
            },
            {
                $set: {
                    categoryId: null,
                    manuallyCategorized: false
                }
            }
        );

        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to delete category'
        });
    }
});

router.patch('/:threadId', async (req, res) => {
    try {
        const { threadId } = req.params;
        const { categoryId } = req.body;

        const category = await Category.findOne({
            _id: categoryId,
            userId: req.user.userId
        });

        if (!category) {
            return res.status(404).json({
                error: 'Category not found'
            });
        }

        const thread = await Thread.findOneAndUpdate(
            {
                threadId,
                userId: req.user.userId
            },
            {
                categoryId,
                manuallyCategorized: true
            },
            {
                returnDocument: 'after'
            }
        ).populate('categoryId');

        if (!thread) {
            return res.status(404).json({
                error: 'Thread not found'
            });
        }

        res.json(thread);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'Failed to move conversation'
        });
    }
});

export default router;