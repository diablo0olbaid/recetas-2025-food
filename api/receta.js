export default async function handler(req, res) {
  res.status(200).json({ receta: "Hola desde tu backend de recetas" });
}
