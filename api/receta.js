export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Validación de método
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Falta el prompt' });
  }

  try {
    const response = await fetch('https://api.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_TOKEN}`, // TOKEN desde variables de entorno
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        provider: "novita",
        model: "meta-llama/Llama-3.1-8B-Instruct",
        messages: [
          {
            role: "user",
            content: "Generá una receta completa para: " + prompt
          }
        ]
      })
    });

    const data = await response.json();

    if (data && data.choices && data.choices[0] && data.choices[0].message) {
      return res.status(200).json({
        receta: data.choices[0].message.content
      });
    } else {
      return res.status(500).json({
        error: 'No se pudo generar una respuesta válida',
        detalle: data
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno del servidor',
      detalle: error.message
    });
  }
}
