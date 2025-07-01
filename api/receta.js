export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Sólo se permite POST' });
    }

    const { prompt } = req.body;
    const apiKey = process.env.HUGGINGFACE_API_KEY;

    if (!prompt || !apiKey) {
      return res.status(400).json({ error: 'Falta prompt o token' });
    }

    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: `Generá una receta completa en español para: ${prompt}`,
      }),
    });

    const data = await response.json();

    const texto = Array.isArray(data) ? data[0]?.generated_text : null;
    if (!texto) {
      return res.status(500).json({ error: 'No se pudo generar la receta', detalle: data });
    }

    const ingredientes = extraerIngredientes(texto);
    const productos = {};

    for (const ingrediente of ingredientes) {
      const vtRes = await fetch(`https://www.carrefour.com.ar/api/catalog_system/pub/products/search/${encodeURIComponent(ingrediente)}`);
      const vtData = await vtRes.json();
      productos[ingrediente] = (vtData || []).slice(0, 3).map(p => {
        const item = p.items?.[0];
        const seller = item?.sellers?.[0];
        return {
          nombre: p.productName,
          imagen: item?.images?.[0]?.imageUrl || '',
          precio: seller?.commertialOffer?.Price || '',
          link: `/checkout/cart/add?sku=${item?.itemId}&qty=1&seller=1&sc=1`,
        };
      });
    }

    return res.status(200).json({ receta: texto, productos });

  } catch (error) {
    console.error('ERROR /api/receta:', error);
    return res.status(500).json({ error: 'Error interno', detalle: error.message });
  }
}

function extraerIngredientes(texto) {
  const matches = texto.match(/- (.+)/g) || [];
  return matches.map(i => i.replace('- ', '').split(' ')[0].toLowerCase());
}
