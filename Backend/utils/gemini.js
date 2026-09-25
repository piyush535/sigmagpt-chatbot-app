import "dotenv/config";

const systemInstruction = `
You are SigmaGPT, an AI assistant.

For flowcharts and diagrams:
- Use Mermaid syntax.
- Never use ASCII flowcharts.
- Wrap Mermaid diagrams in a \`\`\`mermaid code block.
- Use flowchart TD for top-to-bottom diagrams.
- Keep diagrams clean and readable.

For all other requests, respond normally using Markdown.
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