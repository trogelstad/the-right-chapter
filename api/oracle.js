<<<<<<< v2-build
/* ═══════════════════════════════════════════
   The Right Chapter — api/oracle.js
   Vercel serverless function

   IMPORTANT: Uses module.exports (not export default).
   Vercel Node.js runtime requires CommonJS syntax.

   Environment variable required:
     ANTHROPIC_API_KEY — set in Vercel project settings
═══════════════════════════════════════════ */

=======
>>>>>>> main
module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, books } = req.body || {};

<<<<<<< v2-build
  if (!input || !books || !books.length) {
    return res.status(400).json({ error: 'Missing input or books' });
  }

  /* Build the numbered shelf list for the prompt */
  const bookList = books
    .slice(0, 50) /* Safety cap */
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format || 'print'}]`)
    .join('\n');

  /*
   * THE ORACLE PROMPT
   * Everything goes into the user message — no separate system field.
   * Three-part oracle message + one-sentence summary field.
   * Model is instructed to always return a specific page number.
   */
=======
if (!input) {
    return res.status(400).json({ error: 'Missing input' });
  }

  const activeBooks = (books && books.length) ? books : [
    { title: 'Daily Reflections', author: 'Alcoholics Anonymous', format: 'print' },
    { title: 'The Four Agreements', author: 'Don Miguel Ruiz', format: 'print' },
    { title: 'Atomic Habits', author: 'James Clear', format: 'print' },
    { title: 'This Naked Mind', author: 'Annie Grace', format: 'print' },
    { title: 'The Alchemist', author: 'Paulo Coelho', format: 'print' },
    { title: 'The Road Less Traveled', author: 'M. Scott Peck', format: 'print' },
    { title: 'Alcohol Explained', author: 'William Porter', format: 'print' },
    { title: 'Becoming Supernatural', author: 'Dr. Joe Dispenza', format: 'print' },
    { title: 'Alcoholics Anonymous', author: 'Alcoholics Anonymous', format: 'print' },
    { title: 'Twelve Steps and Twelve Traditions', author: 'Alcoholics Anonymous', format: 'print' },
  ];

  const bookList = activeBooks
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format}]`)
    .join('\n');

>>>>>>> main
  const prompt = `You are The Right Chapter oracle. A person has come to you carrying something real. Read what they wrote, feel the weight of it, and find the exact book and page they need from their shelf.

THE SHELF:
${bookList}

WHAT THEY ARE CARRYING:
"${input}"

<<<<<<< v2-build
YOUR ORACLE MESSAGE has three parts, written as one flowing block of prose with no headers, no labels, no line breaks between parts:

PART ONE — WHAT YOU SEE (3-4 sentences):
Read beneath the surface of what they wrote. Name what is actually happening emotionally. Not a summary — a deeper reading. Be specific and human. Sound like someone who has lived through something similar.

PART TWO — WHY THIS BOOK (2-3 sentences):
Connect their exact emotional state to the specific quality of this book that meets this moment. Do not give a generic book description. Make the connection feel inevitable — like of course it is this book, right now.

PART THREE — HOW TO ENTER (2 sentences):
Tell them how to approach the reading. Something like: "Read slowly. Let the first sentence that lands, land." or "Don't rush. Read it twice if you need to." Make it feel like instruction from someone wise.

YOUR SUMMARY is one single crisp sentence — a distillation of what this reading offers this person right now. It should feel like the caption beneath the experience. Examples: "This is about learning to hold your love without trying to carry his journey." or "This is permission to stop performing and start becoming." or "This is the map for the territory you are already in."

PAGE REFERENCE RULES:
You know the approximate length of most published books. Use that knowledge.
- Give a specific page number always. Never say "the first third" or "somewhere in the middle" — those phrases are forbidden.
- Use emotional judgment: grief and endings open in the final third, restlessness opens in the middle, new beginnings open in the first third.
- If estimating, say "around page 94" — still a number, not a range.
- Never invent chapter titles or section names.

RESPONSE: Return valid JSON only. No markdown. No explanation. Just this object:
=======
You will return six fields. Each one matters. Do them all with care.

FIELD 1 — oracleMessage:
Three parts written as one flowing block of prose, no headers, no labels:
Part one (3-4 sentences): Read beneath the surface. Name what is actually happening emotionally — not a summary, a deeper reading. Be specific and human.
Part two (2-3 sentences): Connect their exact emotional state to why this specific book meets this moment. Make it feel inevitable.
Part three (2 sentences): Tell them how to approach the reading — slowly, twice, out loud, whatever fits.

FIELD 2 — summary:
One crisp sentence. A distillation of what this reading offers right now.

FIELD 3 — pageRef:
A specific page number always. You know the approximate length of most published books — use that knowledge. Never say "the first third" or "somewhere in the middle." Say "Page 87" or "Around page 112."

FIELD 4 — pageWhy:
2-3 sentences explaining why you chose this specific page. Be concrete — what will they find there?

FIELD 5 — afterReading:
A single specific action for after they read. Tied directly to what they are carrying.

FIELD 6 — reflectionPrompt:
A single pointed question for their reflection journal. Not generic — specific to their situation.

RESPONSE: Return valid JSON only. No markdown. No explanation. Just this object:

>>>>>>> main
{
  "title": "exact title from the shelf",
  "author": "exact author from the shelf",
  "format": "print or audio or ebook",
<<<<<<< v2-build
  "oracleMessage": "All three parts as one flowing block of prose — emotionally precise, no headers, no line breaks between parts",
  "summary": "One crisp sentence distilling what this reading offers right now",
  "pageRef": "Page 92",
  "pageRefType": "number"
=======
  "oracleMessage": "three-part flowing prose",
  "summary": "one crisp sentence",
  "pageRef": "Page 87",
  "pageRefType": "number",
  "pageWhy": "2-3 sentences explaining why this page",
  "afterReading": "one specific post-reading action",
  "reflectionPrompt": "one pointed personal reflection question"
>>>>>>> main
}`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
<<<<<<< v2-build
      method:  'POST',
=======
      method: 'POST',
>>>>>>> main
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
<<<<<<< v2-build
        max_tokens: 1000,
=======
        max_tokens: 1400,
>>>>>>> main
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
<<<<<<< v2-build
      console.error('Anthropic API error:', errText);
=======
      console.error('Anthropic error:', errText);
>>>>>>> main
      return res.status(500).json({ error: 'API error', detail: errText });
    }

    const apiData  = await apiResponse.json();
    const rawText  = apiData.content?.[0]?.text || '';

<<<<<<< v2-build
    console.log('Raw oracle response:', rawText);

    /* Strip any accidental markdown fences before parsing */
    let parsed;
    try {
      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('JSON parse failed. Raw was:', rawText);
      return res.status(500).json({ error: 'Parse error', raw: rawText });
    }

    /* Validate required fields */
    if (!parsed.title || !parsed.oracleMessage || !parsed.pageRef) {
      console.error('Incomplete oracle response:', parsed);
=======
    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Parse failed. Raw was:', rawText);
      return res.status(500).json({ error: 'Parse error', raw: rawText });
    }

    if (!parsed.title || !parsed.oracleMessage || !parsed.pageRef) {
>>>>>>> main
      return res.status(500).json({ error: 'Incomplete response', parsed });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
