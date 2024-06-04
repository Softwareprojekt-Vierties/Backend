const apiKey = "-"

module.exports = async(location1,location2,maxdistance) =>{
    const location1Coords = await geocodeAddress(location1,apiKey)
    const location2Coords = await geocodeAddress(location2,apiKey)

    if(location1Coords && location2Coords)
    {
        const distanceData = await getDistance(location1Coords,location2Coords,apiKey)
        if(distanceData)
        {
            console.log(distanceData["routes"][0]["summary"]["distance"]/1000)
            const distance = distanceData["routes"][0]["summary"]["distance"]/1000; // Convert to kilometers
            console.log(maxdistance+" , "+distance)
            if(distance > maxdistance)
            {
                console.log("hallo")
                return "1"
            }
            else
            {
                console.log("hakllo")
                return "0"
            }
        }
        return "42"
    }
}

async function geocodeAddress(address, apiKey) {
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
        return data.features[0].geometry.coordinates;
    } else {
        return null;
    }
}

async function getDistance(originCoords, destinationCoords, apiKey) {
    const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': apiKey
        },
        body: JSON.stringify({
            coordinates: [originCoords, destinationCoords]
        })
    });
    return await response.json();
}
