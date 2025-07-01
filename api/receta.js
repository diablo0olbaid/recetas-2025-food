export default async function handler(req, res) {
  const prompt = req.body.prompt || "Quiero hacer una tarta salada";

  const respuestaIA = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Sos un chef que da recetas simples, claras y en español argentino. Usá listas con guiones y paso a paso." },
        { role: "user", content: `Quiero una receta para: ${prompt}` }
      ],
      temperature: 0.7
    }),
  });

  const data = await respuestaIA.json();
  const texto = data.choices[0]?.message?.content;

  // Extraer ingredientes (muy simple)
  const ingredientes = extraerIngredientes(texto);

  // Buscar productos relacionados con VTEX
  const productos = {};
  for (let i = 0; i < ingredientes.length; i++) {
    const ing = ingredientes[i];
    const productosVTEX = await buscarVTEX(ing);
    productos[ing] = productosVTEX;
  }

  res.status(200).json({ receta: texto, productos });
}

function extraerIngredientes(texto) {
  const matches = texto.match(/- (.+)/g) || [];
  return matches.map(i => i.replace("- ", "").split(" ")[0].toLowerCase());
}

async function buscarVTEX(termino) {
  const response = await fetch(`https://www.carrefour.com.ar/api/catalog_system/pub/products/search/${encodeURIComponent(termino)}`);
  const data = await response.json();
  return data.slice(0, 3).map(p => ({
    nombre: p.productName,
    imagen: p.items[0]?.images[0]?.imageUrl,
    precio: p.items[0]?.sellers[0]?.commertialOffer?.Price,
    link: `/checkout/cart/add?sku=${p.items[0]?.itemId}&qty=1&seller=1&sc=1`
  }));
}
