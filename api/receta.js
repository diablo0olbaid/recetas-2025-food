export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // Habilitar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const promptUser = req.body.prompt;

    const body = {
      model: "meta-llama/Llama-3.1-8B-Instruct",
      provider: "novita",
      messages: [
        {
          role: "user",
          content: "Generá una receta completa para: " + promptUser
        }
      ]
    };

    const response = await fetch("https://api.huggingface.co/v1/inference/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": "Bearer TU_TOKEN_AQUI", // <-- reemplazá esto
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data && data.choices && data.choices[0]) {
      const mensaje = data.choices[0].message.content;
      return res.status(200).json({ receta: mensaje });
    } else {
      return res.status(500).json({
        error: 'No se pudo generar la receta',
        detalle: data
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Error interno',
      detalle: error.message
    });
  }
}
