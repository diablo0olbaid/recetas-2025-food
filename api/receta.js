export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  try {
    const hfToken = process.env.HUGGINGFACE_TOKEN;

    const response = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: "novita",
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data?.choices?.[0]?.message?.content) {
      res.status(200).json({ receta: data.choices[0].message.content });
    } else {
      res.status(500).json({ error: 'No se pudo generar la receta', detalle: data });
    }
  } catch (err) {
    res.status(500).json({ error: 'Error al generar receta', detalle: err.message });
  }
}
