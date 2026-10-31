
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      return jsonResponse({ error: "GEMINI_API_KEY mungon." }, 500);
    }

    const { topic, difficulty = "medium", language = "sq" } =
      await req.json();

    if (!topic || typeof topic !== "string" || topic.trim().length > 300) {
      return jsonResponse({ error: "Shkruaje një temë deri në 300 karaktere." }, 400);
    }

    const prompt = `
Create exactly 5 original multiple-choice quiz questions about:
"${topic.trim()}"

Difficulty: ${difficulty}
Language: ${language === "sq" ? "Albanian" : language}

Return ONLY valid JSON in this exact format:
{
  "title": "Quiz title",
  "questions": [
    {
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "answerIndex": 0,
      "explanation": "Short explanation"
    }
  ]
}

Rules:
- Create exactly 5 relevant, distinct questions.
- Every question must have exactly 4 options.
- answerIndex must be a number from 0 to 3.
- Only one option may be correct.
- Explanations must be in the requested language.
- Do not include Markdown or text outside the JSON.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    const result = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", result);
      return jsonResponse({
        error: result.error?.message || "Gemini nuk mundi ta krijojë kuizin.",
      }, response.status);
    }

    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return jsonResponse({ error: "Gemini nuk ktheu pyetje. Provo përsëri." }, 502);
    }

    const quiz = JSON.parse(text);

    if (
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 5 ||
      !quiz.questions.every((q: any) =>
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Number.isInteger(q.answerIndex) &&
        q.answerIndex >= 0 &&
        q.answerIndex <= 3
      )
    ) {
      return jsonResponse({ error: "Formati i kuizit nuk është i saktë. Provo përsëri." }, 502);
    }

    return jsonResponse({ quiz });
  } catch (error) {
    console.error("ai-exam-coach error:", error);
    return jsonResponse({ error: "Ndodhi një gabim. Provo përsëri." }, 500);
  }
});
