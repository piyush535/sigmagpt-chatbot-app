import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },

        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 50
        },

        isSystemCategory: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

// Prevent duplicate category names for the same user
CategorySchema.index(
    {
        userId: 1,
        name: 1
    },
    {
        unique: true
    }
);

export default mongoose.model('Category', CategorySchema);