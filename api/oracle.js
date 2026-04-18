/* ═══════════════════════════════════════════
   The Right Chapter — api/oracle.js
   Vercel serverless function

   CRITICAL: Uses module.exports — NOT export default.
   Vercel Node.js requires CommonJS syntax.

   Env var required: ANTHROPIC_API_KEY
═══════════════════════════════════════════ */

module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, books } = req.body || {};

  if (!input || !books || !books.length) {
    return res.status(400).json({ error: 'Missing input or books' });
  }

  const bookList = books
    .slice(0, 50)
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format || 'print'}]`)
    .join('\n');

  const prompt = `You are The Right Chapter oracle. A person has come to you carrying something real. Read what they wrote, feel the weight of it, and find the exact book and page they need from their shelf.

THE SHELF:
${bookList}

WHAT THEY ARE CARRYING:
"${input}"

You must return a JSON object with these 7 fields. Every field is required.

FIELD 1 — title
The exact book title from the shelf.

FIELD 2 — author
The exact author name from the shelf.

FIELD 3 — format
"print" or "audio" or "ebook" — match what is listed for that book.

FIELD 4 — oracleMessage
A three-part oracle message written as one flowing block of prose. No headers, no labels, no line breaks between parts. The three parts are:

PART ONE — WHAT YOU SEE (3–4 sentences): Read beneath the surface of what they wrote. Name what is actually happening emotionally. Not a summary — a deeper reading. Be specific and human. Sound like someone who has lived through something similar.

PART TWO — WHY THIS BOOK (2–3 sentences): Connect their exact emotional state to the specific quality of this book that meets this moment. Do not describe the book generically. Make the connection feel inevitable — like of course it is this book, right now.

PART THREE — HOW TO ENTER (2 sentences): Tell them how to approach the reading. Something like: "Read slowly. Let the first sentence that lands, land." Make it feel like instruction from someone wise.

FIELD 5 — pageRef
A specific page number. You know the approximate page counts of most published books — use that knowledge. Never say "the first third" or "somewhere in the middle" — those phrases are forbidden. Use emotional judgment: grief and endings open in the final third, restlessness opens in the middle, new beginnings open in the first third. Format as "Page 47" or "Around page 112".

FIELD 6 — pageNote
2–3 sentences that explain what the reader will find at or around that page and why it speaks to this moment. This is NOT a repeat of the oracle message. This is practical and specific — it tells them what they are walking into on that page. Example: "Around page 117, you'll find the chapter written for families — not the person drinking, but the people who love them. It doesn't promise you can fix this. It offers something rarer: a way to stay present without drowning, to care without controlling."

FIELD 7 — afterReading
A single specific, actionable post-reading nudge. This should feel like a wise mentor giving them one concrete thing to do after they close the book. It must be directly tied to what they shared and what the book offers. Do NOT make it generic journaling. Examples of the right tone: "After reading, write down one boundary you need to hold this week — not to punish him, but to protect your own ground." or "After reading, name the one thing you have been waiting for permission to begin. You have it now." or "After reading, send the message you have been drafting in your head but not sending. Today is the day."

FIELD 8 — reflectionPrompt
A single custom reflection question, written specifically for this person's situation. It should NOT be generic like "What did this bring up for you?" It should be precise and personal — something that could only have been written for them, today, given what they shared. Examples: "What would it mean to stop carrying someone else's journey as if it were your own?" or "Where in your life are you still waiting for the floor to drop — and what if it doesn't?"

FIELD 9 — summary
One crisp sentence that distills what this reading offers right now. It should feel like the caption beneath the experience. Example: "This is permission to stop performing and start becoming."

RESPONSE FORMAT — return valid JSON only. No markdown fences, no explanation, no preamble. Just this object:
{
  "title": "exact title from the shelf",
  "author": "exact author from the shelf",
  "format": "print or audio or ebook",
  "oracleMessage": "Three-part oracle message as one flowing block of prose",
  "pageRef": "Page 47",
  "pageNote": "2-3 sentences about what they will find at that page and why",
  "afterReading": "One specific actionable nudge tied to their situation",
  "reflectionPrompt": "One custom reflection question written for this person",
  "summary": "One crisp sentence distillation"
}`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1200,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Anthropic API error:', errText);
      return res.status(500).json({ error: 'API error', detail: errText });
    }

    const apiData = await apiResponse.json();
    const rawText = apiData.content?.[0]?.text || '';
    console.log('Raw oracle response:', rawText);

    let parsed;
    try {
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse failed. Raw was:', rawText);
      return res.status(500).json({ error: 'Parse error', raw: rawText });
    }

    if (!parsed.title || !parsed.oracleMessage || !parsed.pageRef) {
      console.error('Incomplete oracle response:', parsed);
      return res.status(500).json({ error: 'Incomplete response', parsed });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
