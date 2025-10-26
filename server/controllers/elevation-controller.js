class ElevationController {
    async getElevation(req, res, next) {
        try {
            const { lat, lng } = req.query;
            

            if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid coordinates provided'
                });
            }
            
            const latitude = parseFloat(lat);
            const longitude = parseFloat(lng);
            

            if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
                return res.status(400).json({
                    success: false,
                    error: 'Coordinates out of valid range'
                });
            }
            

            const response = await fetch(
                `https://api.open-meteo.com/v1/elevation?latitude=${latitude}&longitude=${longitude}`
            );
            
            if (!response.ok) {
                throw new Error(`Elevation API responded with status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.elevation || data.elevation.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Elevation data not found for these coordinates'
                });
            }
            

            res.json({
                success: true,
                elevation: data.elevation[0],
                coordinates: {
                    lat: latitude,
                    lng: longitude
                },
                unit: 'meters'
            });
            
        } catch (error) {
            console.error('Elevation controller error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch elevation data',
                details: error.message
            });
        }
    }
}

module.exports = new ElevationController();