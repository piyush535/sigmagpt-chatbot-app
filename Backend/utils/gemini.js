import "dotenv/config";

const systemInstruction = `
When generating a flowchart, use Mermaid syntax.

Requirements:
- Return valid Mermaid syntax.
- Use flowchart ID.
- Every arrow must have a valid destination node.
- Never end a line with "-->", "---", "-.->", or "==>".
- Do not leave incomplete nodes or brackets.
- Keep node IDs simple: A, B, C, D, etc.
- Put descriptive text inside quotes.
- Make sure the entire Mermaid diagram is syntactically complete before returning it.
`;

const getGeminiAPIResponse = async (message) => {
    const options = {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY,
        },

        body: JSON.stringify({
            contents: [
                {
                    role: "user",
                    parts: [
                        {
                            text: `${systemInstruction} User request: ${message}`,
                        },
                    ],
                },
            ],
        }),
    };

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            options
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                `Gemini API error: ${data.error?.message || "Unknown error"}`
            );
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.log("Gemini error:", error);
        throw error;
    }
};

export default getGeminiAPIResponse;