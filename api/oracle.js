module.exports = async function handler(req, res) {

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { input, books } = req.body || {};

  if (!input || !books || !books.length) {
    return res.status(400).json({ error: 'Missing input or books' });
  }

  const bookList = books
    .map((b, i) => `${i + 1}. "${b.title}" by ${b.author} [format: ${b.format}]`)
    .join('\n');

  const prompt = `You are The Right Chapter oracle. A person has come to you carrying something real. Read what they wrote, feel the weight of it, and find the exact book and page they need from their shelf.

THE SHELF:
${bookList}

WHAT THEY ARE CARRYING:
"${input}"

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

{
  "title": "exact title from the shelf",
  "author": "exact author from the shelf",
  "format": "print or audio or ebook",
  "oracleMessage": "three-part flowing prose",
  "summary": "one crisp sentence",
  "pageRef": "Page 87",
  "pageRefType": "number",
  "pageWhy": "2-3 sentences explaining why this page",
  "afterReading": "one specific post-reading action",
  "reflectionPrompt": "one pointed personal reflection question"
}`;

  try {
    const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-5',
        max_tokens: 1400,
        messages:   [{ role: 'user', content: prompt }]
      })
    });

    if (!apiResponse.ok) {
      const errText = await apiResponse.text();
      console.error('Anthropic error:', errText);
      return res.status(500).json({ error: 'API error', detail: errText });
    }

    const apiData  = await apiResponse.json();
    const rawText  = apiData.content?.[0]?.text || '';

    let parsed;
    try {
      const cleaned = rawText.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      console.error('Parse failed. Raw was:', rawText);
      return res.status(500).json({ error: 'Parse error', raw: rawText });
    }

    if (!parsed.title || !parsed.oracleMessage || !parsed.pageRef) {
      return res.status(500).json({ error: 'Incomplete response', parsed });
    }

    return res.status(200).json(parsed);

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: err.message });
  }
};
