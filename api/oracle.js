/* ═══════════════════════════════════════════
   The Right Chapter — api/oracle.js
   Vercel serverless function
   Version 2.0 · Personal shelf + Sample shelf oracle

   Environment variable required:
     ANTHROPIC_API_KEY — set in your Vercel project settings
═══════════════════════════════════════════ */

export default async function handler(req, res) {

  /* ── Only accept POST ── */
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, books } = req.body;

  /* ── Validate payload ── */
  if (!input || typeof input !== 'string' || input.trim().length < 3) {
    return res.status(400).json({ error: 'Missing or too-short input' });
  }

  if (!books || !Array.isArray(books) || books.length === 0) {
    return res.status(400).json({ error: 'Missing or empty books array' });
  }

  /* ── Sanity cap: never send more than 50 books to the prompt ── */
  const safeBooks = books.slice(0, 50);

  /* ── Build the numbered book list string ── */
  const bookList = safeBooks
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format || 'print'}${b.pages ? `, ${b.pages} pages` : ''}]`)
    .join('\n');

  /* ══════════════════════════════════════════
     SYSTEM PROMPT — The Right Chapter Oracle
     Keep the voice: wise, modern, emotionally
     precise, lightly mystical, and human.
  ══════════════════════════════════════════ */
  const systemPrompt = `You are The Right Chapter oracle.

Your only job: read what the user is carrying emotionally and match them to the single most resonant book from the shelf provided.

THE SHELF:
${bookList}

MATCHING RULES:
1. Choose ONLY from the books listed above. Never suggest a book not on the shelf.
2. Choose the single best match. Do not offer multiple options or explain your reasoning.
3. If no book is a perfect match, choose the least-wrong one. Always choose. Never refuse.
4. Variety matters across sessions — try not to always pick the most obvious book.

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
- If the book entry includes a page count: suggest a specific page number. Use emotional judgment — grief opens near the end, restlessness opens in the middle, new beginnings open in the first third.
- If the book entry has no page count: use ONLY one of these four phrases exactly as written:
    "Open somewhere in the first third."
    "Open somewhere in the middle."
    "Open somewhere in the final third."
    "Open anywhere. Let the page find you."
- NEVER invent chapter titles. NEVER invent section names. NEVER say "Chapter 3" or any chapter reference.

RESPONSE FORMAT:
Respond with valid JSON only. No explanation, no preamble, no markdown fences. Just the raw JSON object.

{
  "title": "exact book title from the shelf",
  "author": "exact author name from the shelf",
  "format": "print or audio or ebook — match what is listed for that book",
  "oracleMessage": "2 to 3 sentence oracle message written to the person",
  "pageRef": "Page 67 or one of the four approved section phrases",
  "pageRefType": "number or section"
}`;

  /* ── Call the Anthropic API ── */
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 600,
        system:     systemPrompt,
        messages: [
          {
            role:    'user',
            content: `Here is what I am carrying right now:\n\n"${input.trim()}"\n\nPlease find my chapter.`
          }
        ]
      })
    });

    /* ── Handle upstream API errors ── */
    if (!response.ok) {
      const errText = await response.text();
      console.error('Anthropic API error:', response.status, errText);
      return res.status(502).json({
        error:  'Oracle API error',
        status: response.status
      });
    }

    const apiData = await response.json();
    const rawText = apiData.content?.[0]?.text || '';

    /* ── Parse the JSON response ── */
    let parsed;
    try {
      /* Strip any accidental markdown fences the model might add */
      const clean = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(clean);
    } catch (parseErr) {
      console.error('JSON parse error. Raw response was:', rawText);
      return res.status(500).json({
        error: 'Could not parse oracle response',
        hint:  'The model returned non-JSON text'
      });
    }

    /* ── Validate required fields ── */
    const required = ['title', 'author', 'oracleMessage', 'pageRef', 'pageRefType'];
    for (const field of required) {
      if (!parsed[field]) {
        console.error(`Missing required field: ${field}`, parsed);
        return res.status(500).json({
          error: `Oracle response missing field: ${field}`
        });
      }
    }

    /* ── Validate the book actually came from the shelf ── */
    const matchedBook = safeBooks.find(
      b => b.title.toLowerCase().trim() === parsed.title.toLowerCase().trim()
    );

    if (!matchedBook) {
      /* Model hallucinated a book — return a soft error rather than bad data */
      console.error('Oracle returned a book not on the shelf:', parsed.title);
      return res.status(500).json({
        error: 'Oracle returned a book not on your shelf — please try again'
      });
    }

    /* ── Enrich the response with the matched book's format (source of truth) ── */
    parsed.format = matchedBook.format || 'print';

    /* ── All good — return the oracle response ── */
    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Unexpected oracle error:', err);
    return res.status(500).json({
      error:   'Unexpected server error',
      message: err.message
    });
  }
}
