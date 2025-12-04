export default async function handler(req, res) {
  const { startLat, startLng, endLat, endLng } = req.query;
  
  if (!startLat || !startLng || !endLat || !endLng) {
    return res.status(400).json({ error: 'Missing coordinates' });
  }

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
  
  if (!GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Directions API error:', error);
    res.status(500).json({ error: 'Failed to fetch route' });
  }
}
