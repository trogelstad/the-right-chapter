/* ═══════════════════════════════════════════
   The Right Chapter — api/oracle.js
   Vercel serverless function
   Stage 3: Personal shelf oracle
═══════════════════════════════════════════ */

module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, books } = req.body;

  if (!input || !books || !books.length) {
    return res.status(400).json({ error: 'Missing input or books' });
  }

  /* ── Build the book list string ── */
  const bookList = books.map((b, i) =>
    `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format}]`
  ).join('\n');

  const systemPrompt = `You are The Right Chapter oracle.

Your only job: read what the user is carrying emotionally and match them to the single most resonant book from their personal shelf.

THE USER'S SHELF:
${bookList}

MATCHING RULES:
1. Choose ONLY from the books listed above. Never suggest a book not on the shelf.
2. Choose the single best match. Do not offer multiple options or explain your reasoning.
3. If no book is a perfect match, choose the least-wrong one. Always choose. Never refuse.

ORACLE MESSAGE RULES:
- Write 2 to 3 sentences in second person, direct and emotionally specific.
- Respond to what the user WROTE, not to what the book IS.
- Do not describe the book. Speak to the person in front of you.
- Do not use phrases like "this book will help you" or "I recommend" or "you might find".
- Sound like something that already knew. Quiet. Certain. Human.
- Be specific or be silent. No generic affirmations.

GOOD oracle message example:
"You are in the part where nothing moves and the waiting feels like failure. It is not. Open this book somewhere in the middle and read the first paragraph that stops you."

BAD oracle message example:
"This is a great book for personal growth. It covers many topics people find helpful during difficult times."

PAGE REFERENCE RULES:
- If pages are known: suggest a specific page number. Use emotional judgment — grief opens near the end, restlessness opens in the middle, new beginnings open in the first third.
- If pages are not known: use ONLY one of these four phrases exactly as written:
  "Open somewhere in the first third."
  "Open somewhere in the middle."
  "Open somewhere in the final third."
  "Open anywhere. Let the page find you."
- NEVER invent chapter titles. NEVER invent section names. NEVER say "Chapter 3" or any chapter reference.

RESPONSE FORMAT:
Respond with valid JSON only. No explanation, no preamble, no markdown. Just the JSON object.

{
  "title": "exact book title from the shelf",
  "author": "exact author name from the shelf",
  "format": "print or audio or ebook — match what is listed for that book",
  "oracleMessage": "2 to 3 sentence oracle message",
  "pageRef": "Page 67 or one of the four approved section phrases",
  "pageRefType": "number or section"
}`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 600,
        messages: [
          {
            role:    'user',
            content: `Here is what I am carrying right now:\n\n"${input}"\n\nPlease find my chapter.`
          }
        ],
        system: systemPrompt
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return res.status(500).json({ error: 'Oracle API error', detail: err });
    }

    const data = await response.json();
    const raw  = data.content?.[0]?.text || '';

    /* ── Parse the JSON response ── */
    let parsed;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse error. Raw response:', raw);
      return res.status(500).json({ error: 'Could not parse oracle response', raw });
    }

    /* ── Validate required fields ── */
    const required = ['title', 'author', 'oracleMessage', 'pageRef', 'pageRefType'];
    for (const field of required) {
      if (!parsed[field]) {
        return res.status(500).json({ error: `Missing field: ${field}`, parsed });
      }
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Unexpected oracle error:', err);
    return res.status(500).json({ error: 'Unexpected error', message: err.message });
  }
};
