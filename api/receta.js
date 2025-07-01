export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sólo se permite el método POST' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt inválido' });
  }

  // Simulamos IA: recetas "predefinidas"
  const recetasBase = {
    tarta: `Ingredientes:
- 1 masa para tarta
- 3 huevos
- 200g de queso cremoso
- 1 lata de atún

Pasos:
1. Mezclar los huevos con el queso y el atún.
2. Volcar sobre la masa y hornear 30 min a 180°C.`,

    budín: `Ingredientes:
- 2 bananas maduras
- 2 huevos
- 1 taza de harina sin gluten
- 1/2 taza de azúcar

Pasos:
1. Pisá las bananas y mezclalas con el resto de los ingredientes.
2. Volcá en un molde y horneá 40 min a 180°C.`,
  };

  const clave = Object.keys(recetasBase).find(k => prompt.toLowerCase().includes(k));
  const receta = clave ? recetasBase[clave] : 'Not Found';

  // Si no se encontró receta
  if (receta === 'Not Found') {
    return res.status(200).json({ receta: 'Not Found', productos: {} });
  }

  // Buscar productos en VTEX por ingredientes
  const ingredientes = extraerIngredientes(receta);
  const productos = {};

  for (const ingrediente of ingredientes) {
    const url = `https://www.carrefour.com.ar/api/catalog_system/pub/products/search/${encodeURIComponent(ingrediente)}`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      productos[ingrediente] = (data || []).slice(0, 3).map(prod => ({
        nombre: prod.productName,
        precio: prod.items?.[0]?.sellers?.[0]?.commertialOffer?.Price,
        imagen: prod.items?.[0]?.images?.[0]?.imageUrl,
        link: `https://www.carrefour.com.ar/${prod.linkText}/p`,
      }));
    } catch (e) {
      productos[ingrediente] = [];
    }
  }

  return res.status(200).json({ receta, productos });
}

// Función simple que detecta ingredientes de la receta
function extraerIngredientes(recetaTexto) {
  const posibles = [
    'huevos', 'banana', 'azúcar', 'harina', 'atún', 'queso', 'cebolla', 'masa',
  ];

  const normalizado = recetaTexto.toLowerCase();
  return posibles.filter(i => normalizado.includes(i));
}
