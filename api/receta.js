export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo se permite el método POST" });
    }

    const prompt = req.body.prompt || "Quiero una receta simple";
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Falta la clave de OpenRouter (OPENROUTER_API_KEY)" });
    }

    // 🧠 LLAMADA A OPENROUTER (IA GRATIS)
    const respuestaIA = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-3.5-turbo", // podés cambiar a mistralai/mixtral-8x7b si querés
        messages: [
          {
            role: "system",
            content: "Sos un chef que da recetas simples, claras y en español argentino.",
          },
          { role: "user", content: `Generá una receta para: ${prompt}` },
        ],
        temperature: 0.7,
      }),
    });

    const data = await respuestaIA.json();

    if (!data.choices || !data.choices[0]?.message?.content) {
      return res.status(500).json({ error: "Error al recibir respuesta de OpenRouter", detalle: data });
    }

    const receta = data.choices[0].message.content;

    // 🍳 EXTRAER INGREDIENTES
    const ingredientes = extraerIngredientes(receta);

    // 🛒 BUSCAR PRODUCTOS EN VTEX
    const productos = {};
    for (let i = 0; i < ingredientes.length; i++) {
      const nombre = ingredientes[i];
      const resultado = await buscarVTEX(nombre);
      productos[nombre] = resultado;
    }

    return res.status(200).json({ receta, productos });

  } catch (error) {
    console.error("Error en /api/receta:", error);
    return res.status(500).json({ error: "Error interno del servidor", detalle: error.message });
  }
}

// 🧪 Extraer ingredientes de la receta
function extraerIngredientes(texto) {
  const matches = texto.match(/- (.+)/g) || [];
  return matches.map(i => i.replace("- ", "").split(" ")[0].toLowerCase());
}

// 🔎 Buscar productos reales en VTEX Carrefour
async function buscarVTEX(termino) {
  try {
    const response = await fetch(`https://www.carrefour.com.ar/api/catalog_system/pub/products/search/${encodeURIComponent(termino)}`);
    const data = await response.json();
    return data.slice(0, 3).map(producto => {
      const item = producto.items?.[0];
      const seller = item?.sellers?.[0];
      return {
        nombre: producto.productName,
        imagen: item?.images?.[0]?.imageUrl || "",
        precio: seller?.commertialOffer?.Price || null,
        link: `/checkout/cart/add?sku=${item?.itemId}&qty=1&seller=1&sc=1`
      };
    });
  } catch (err) {
    console.error("Error al buscar en VTEX para:", termino, err);
    return [];
  }
}
