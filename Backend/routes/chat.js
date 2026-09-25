import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAPIResponse from "../utils/gemini.js";
import { classifyConversation } from "../utils/classification.js";
import { ALLOWED_CATEGORIES } from "../constants/categories.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

function shouldClassifyThread(thread) {
    const messageCount = thread.messages.length;

    // First classification after first user-assistant exchange
    if (messageCount === 2) {
        return true;
    }

    // Reclassify after every 10 messages
    if (messageCount > 2 && messageCount % 10 === 0) {
        return true;
    }

    return false;
}

/**
 * Get all threads for the authenticated user
 * GET /api/thread
 */
router.get("/thread", requireAuth, async (req, res) => {
  try {
    // Fetch only threads belonging to the authenticated user, sorted by most recent
    const threads = await Thread.find({ userId: req.user.userId }).sort({
      updatedAt: -1,
    }).populate("categoryId");
    res.json(threads);
  } catch (error) {
    console.error("Error fetching threads:", error);
    res.status(500).json({ error: "Failed to fetch threads from DB" });
  }
});

/**
 * Search the authenticated user's threads by keyword and/or category
 * GET /api/thread/search?q=keyword&category=Programming
 */
router.get("/thread/search", requireAuth, async (req, res) => {
  const { q, category } = req.query;

  try {
    const filter = { userId: req.user.userId };

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    if (category && category !== "All") {
      filter.primaryCategory = category;
    }

    const threads = await Thread.find(filter)
      .sort({ updatedAt: -1 })
      .limit(50)
      .populate("categoryId");

    res.json(threads);
  } catch (error) {
    console.error("Search failed:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

/**
 * Manually update a thread's category
 * PATCH /api/thread/:threadId/category
 */
router.patch("/thread/:threadId/category", requireAuth, async (req, res) => {
  const { threadId } = req.params;
  const { category } = req.body;

  if (!ALLOWED_CATEGORIES.includes(category)) {
    return res.status(400).json({ error: "Invalid category" });
  }

  try {
    const thread = await Thread.findOneAndUpdate(
      { threadId, userId: req.user.userId },
      {
        primaryCategory: category,
        manuallyCategorized: true,
      },
      { returnDocument: "after" }
    );

    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }

    res.json(thread);
  } catch (error) {
    console.error("Failed to update category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
});

/**
 * Get a specific thread by its ID for the authenticated user
 * GET /api/thread/:threadId
 */
router.get("/thread/:threadId", requireAuth, async (req, res) => {
  const { threadId } = req.params;
  try {
    const thread = await Thread.findOne({ threadId, userId: req.user.userId });
    if (!thread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.json(thread.messages);
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({ error: "Failed to fetch chat from DB" });
  }
});

/**
 * Delete a specific thread by its ID for the authenticated user
 * DELETE /api/thread/:threadId
 */
router.delete("/thread/:threadId", requireAuth, async (req, res) => {
  const { threadId } = req.params;
  try {
    const deletedThread = await Thread.findOneAndDelete({
      threadId,
      userId: req.user.userId,
    });
    if (!deletedThread) {
      return res.status(404).json({ error: "Thread not found" });
    }
    res.status(200).json({ message: "Thread deleted successfully" });
  } catch (error) {
    console.error("Error deleting thread:", error);
    res.status(500).json({ error: "Failed to delete thread from DB" });
  }
});

/**
 * Handle chat messages
 * POST /api/chat
 * Supports both authenticated users (saves to user's thread) and guest users (generates reply directly)
 */
router.post("/chat", optionalAuth, async (req, res) => {
  const { threadId, message } = req.body;

  if (!threadId || !message) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const assistantReply = await getGeminiAPIResponse(message);

    // If authenticated, persist the conversation under the user's account
    if (req.user && threadId) {
      let thread = await Thread.findOne({ threadId, userId: req.user.userId });

      if (!thread) {
        // Create a new thread for this user
        thread = new Thread({
          userId: req.user.userId,
          threadId,
          title: message.length > 35 ? message.slice(0, 35) + "..." : message,
          primaryCategory: "General",
          tags: [],
          summary: "",
          classificationConfidence: null,
          manuallyCategorized: false,
          messages: [
            { role: "user", content: message },
            { role: "assistant", content: assistantReply },
          ],
        });
      } else {
        // Append both messages to the existing user thread
        thread.messages.push({ role: "user", content: message });
        thread.messages.push({ role: "assistant", content: assistantReply });
        thread.updatedAt = new Date();
      }

      // Classify after the first user-assistant exchange.
      // Later, classify again every 5 messages if needed.
      if (shouldClassifyThread(thread) && !thread.manuallyCategorized) {
        const recentMessages = thread.messages.slice(-10);

        const classification = await classifyConversation(recentMessages);

        thread.title = classification.title;
        thread.primaryCategory = classification.primaryCategory;
        thread.tags = classification.tags;
        thread.summary = classification.summary;
        thread.classificationConfidence = classification.confidence;
      }

      thread.updatedAt = new Date();

      await thread.save();

      res.status(200).json({
        reply: assistantReply,

        thread: {
          threadId: thread.threadId,
          title: thread.title,
          primaryCategory: thread.primaryCategory,
          tags: thread.tags,
          summary: thread.summary,
          classificationConfidence: thread.classificationConfidence,
        },
      });
    } else {
      // Guest chats are not persisted, but still need a response for the client.
      res.status(200).json({ reply: assistantReply });
    }
  } catch (error) {
    console.error("Error in chat route:", error);
    res.status(500).json({ error: "Failed to process chat message" });
  }
});

export default router;
