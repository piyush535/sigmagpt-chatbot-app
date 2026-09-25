import mongoose from 'mongoose';
import { ALLOWED_CATEGORIES } from '../constants/categories.js';

const MessageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ['user', 'assistant'],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const ThreadSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
        index: true
    },
    threadId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        default: "New Chat"
    },
    // Main category assigned to the conversation
    primaryCategory: {
        type: String,
        enum: ALLOWED_CATEGORIES,
        default: 'General',
        index: true
    },
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
        index: true
    },
    // Additional topics related to the conversation
    tags: {
        type: [String],
        default: []
    },
    // Short AI-generated summary of the conversation
    summary: {
        type: String,
        default: ''
    },
    // AI-generated confidence estimate
    classificationConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: null
    },
    // Prevent AI from overwriting a category selected by the user
    manuallyCategorized: {
        type: Boolean,
        default: false
    },
    messages: [MessageSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for fast lookup of a user's thread by threadId
ThreadSchema.index({
    userId: 1,
    threadId: 1
});

// Index for sorting user's threads by most recent
ThreadSchema.index({
    userId: 1,
    updatedAt: -1
});

// Index for category-based sidebar queries
ThreadSchema.index({
    userId: 1,
    primaryCategory: 1,
    updatedAt: -1
});

// Text index for chat search
ThreadSchema.index({
    title: 'text',
    summary: 'text',
    tags: 'text',
    'messages.content': 'text'
});

export default mongoose.model('Thread', ThreadSchema);