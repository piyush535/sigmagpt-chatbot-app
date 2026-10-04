import { classifyWithGemini } from "./gemini.js";
import { ALLOWED_CATEGORIES } from "../constants/categories.js";


function cleanGeminiJson(response) {
    if (!response) {
        throw new Error("Empty classification response");
    }

    return response
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();
}


function validateClassification(result) {
    if (!result || typeof result !== "object") {
        throw new Error("Invalid classification object");
    }

    const rawCategory = String(
        result.primaryCategory || ""
    ).trim();

    const matchedCategory = ALLOWED_CATEGORIES.find(
        cat => cat.toLowerCase() === rawCategory.toLowerCase()
    );

    const primaryCategory = matchedCategory || "General";

    const tags = Array.isArray(result.tags)
        ? result.tags
            .filter(tag => typeof tag === "string")
            .map(tag => tag.trim())
            .filter(Boolean)
            .slice(0, 5)
        : [];

    const confidence =
        typeof result.confidence === "number" &&
        result.confidence >= 0 &&
        result.confidence <= 1
            ? result.confidence
            : null;

    return {
        title:
            typeof result.title === "string" &&
            result.title.trim()
                ? result.title.trim()
                : "New Chat",

        primaryCategory,

        tags,

        summary:
            typeof result.summary === "string"
                ? result.summary.trim()
                : "",

        confidence
    };
}


async function classifyConversation(messages) {
    if (!messages || messages.length === 0) {
        throw new Error("No messages available for classification");
    }

    const conversationText = messages
        .map(message => {
            const role =
                message.role === "assistant"
                    ? "Assistant"
                    : "User";

            return `${role}: ${message.content}`;
        })
        .join("\n");


    const prompt = `
Classify the following conversation into exactly ONE category.

ALLOWED CATEGORIES:
${ALLOWED_CATEGORIES.map(category => `- ${category}`).join("\n")}

IMPORTANT:
- primaryCategory MUST be copied EXACTLY from the allowed category list.
- Do NOT create a new category.
- Do NOT change capitalization.
- Choose the category that best represents the user's main intent.
- Consider the entire conversation.
- Return ONLY valid JSON.
- Do NOT use Markdown.
- Do NOT use code fences.
- Do NOT include any explanation outside the JSON.

Return exactly this structure:

{
  "title": "short descriptive title",
  "primaryCategory": "one exact allowed category",
  "tags": ["tag1", "tag2"],
  "summary": "short summary of the conversation",
  "confidence": 0.95
}

CONVERSATION:
${conversationText}
`;


    console.log("========== CLASSIFICATION START ==========");
    console.log("Conversation:");
    console.log(conversationText);
    console.log("==========================================");


    try {
        const rawResponse = await classifyWithGemini(prompt);

        console.log("RAW CLASSIFICATION RESPONSE:");
        console.log(rawResponse);


        const cleanedResponse = cleanGeminiJson(rawResponse);

        console.log("CLEANED CLASSIFICATION RESPONSE:");
        console.log(cleanedResponse);


        let parsed;

        try {
            parsed = JSON.parse(cleanedResponse);
        } catch (jsonError) {
            console.error("JSON PARSE ERROR:", jsonError);
            throw new Error(
                `Gemini returned invalid JSON: ${cleanedResponse}`
            );
        }


        const classification = validateClassification(parsed);

        console.log("FINAL CLASSIFICATION:");
        console.log(classification);

        console.log("========== CLASSIFICATION END ==========");

        return classification;

    } catch (error) {

        console.error(
            "CLASSIFICATION FAILED:",
            error
        );

        // IMPORTANT:
        // Do NOT silently convert classification failures to General.
        throw error;
    }
}


export { classifyConversation };