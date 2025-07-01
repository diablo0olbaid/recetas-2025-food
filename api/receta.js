export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Solo POST permitido" });
    }

    const prompt = req.body.prompt || "una receta de tarta de atún";
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Falta la clave de Hugging Face" });
    }

    const response = await fetch("https://api-inference.huggingface.co/models/cognitivecomputations/dolphin-2.5-mixtral-8x7b-dpo", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: `Generá una receta casera en español para: ${prompt}. Incluir ingredientes y pasos.`,
      }),
    });

    const data = await response.json();

    let receta = "";
    if (Array.isArray(data) && data[0]?.generated_text) {
      receta = data[0].generated_text;
    } else {
      receta = "No se pudo generar la receta.";
    }

    const ingredientes = extraerIngredientes(receta);
    const productos = {};
    for (let i = 0; i < ingredientes.length; i++) {
      const nombre = ingredientes[i];
      const resultado = await buscarVTEX(nombre);
      productos[nombre] = resultado;
    }

    return res.status(200).json({ receta, productos });

  } catch (error) {
    console.error("Error en /api/receta:", error);
    return res.status(500).json({ error: "Error interno", detalle: error.message });
  }
}

function extraerIngredientes(texto) {
  const matches = texto.match(/- (.+)/g) || [];
  return matches.map(i => i.replace("- ", "").split(" ")[0].toLowerCase());
}

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
