export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Falta el prompt" });
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openchat/openchat-7b:free",
        messages: [
          { role: "system", content: "Sos un chef creativo especializado en recetas simples." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();

    if (!data || !data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "No se pudo generar la receta", detalle: data });
    }

    return res.status(200).json({ receta: data.choices[0].message.content });

  } catch (error) {
    console.error("Error al generar receta:", error);
    return res.status(500).json({ error: "Error interno", detalle: error.message });
  }
}
