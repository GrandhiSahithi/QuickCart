function unsplash(id) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=500&q=70`;
}

export const VERTICALS = [
  { key: "FOOD", label: "Food Delivery", emoji: "🍔", color: "#f4b8a8", image: unsplash("photo-1513104890138-7c749659a591") },
  { key: "GROCERY", label: "Grocery", emoji: "🥦", color: "#a8e0bb", image: unsplash("photo-1579113800032-c38bd7635818") },
  { key: "MEDICINE", label: "Medicine", emoji: "💊", color: "#a9d4ec", image: unsplash("photo-1607619056574-7b8d3ee536b2") },
  { key: "SHOP", label: "Shop", emoji: "🛍️", color: "#ecd696", image: unsplash("photo-1616046229478-9901c5536a45") },
  { key: "ELECTRONICS", label: "Electronics", emoji: "🎧", color: "#a3dde0", image: unsplash("photo-1555664424-778a1e5e1b48") },
  { key: "FASHION", label: "Fashion", emoji: "👕", color: "#eab3cd", image: unsplash("photo-1515886657613-9f3515b0c78f") },
  { key: "BEAUTY", label: "Beauty", emoji: "💄", color: "#eebcc0", image: unsplash("photo-1596462502278-27bfdc403348") },
  { key: "PETS", label: "Pet Care", emoji: "🐾", color: "#d9c09a", image: unsplash("photo-1623387641168-d9803ddd3f35") }
];
