const apiKey = "5b3ce3597851110001cf6248a0e410bd9aef4d01b7088f2b257b0bb8"


module.exports = async(location1,location2,maxdistance) =>{
    try
    {
        const location1Coords = await geocodeAddress(location1,apiKey)
        const location2Coords = await geocodeAddress(location2,apiKey)

        if(location1Coords && location2Coords)
        {
            
            if(calcDistance(location1Coords,location2Coords) <= maxdistance)
            {
                return true
            }
            else
            {
                return false
            }
            
            // const distanceData = await getDistance(location1Coords,location2Coords,apiKey)
            // if(distanceData)
            // {
            //     console.log(distanceData["routes"][0]["summary"]["distance"]/1000)
            //     const distance = distanceData["routes"][0]["summary"]["distance"]/1000; // Convert to kilometers
            //     console.log(maxdistance+" , "+distance)
            //     if(distance > maxdistance)
            //     {
            //         console.log("hallo")
            //         return "1"
            //     }
            //     else
            //     {
            //         console.log("hakllo")
            //         return "0"
            //     }
            // }
            // return "42"
        }
    }
    catch(err)
    {
        console.error(err)
        return false
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

function degreesToRadians(degrees) {
    var radians = (degrees * Math.PI)/180;
    return radians;
  }

// Function takes two objects, that contain coordinates to a starting and destination location.
function calcDistance (startingCoords, destinationCoords){
    
    let startingLat = degreesToRadians(startingCoords[1]);
    let startingLong = degreesToRadians(startingCoords[0]);
    let destinationLat = degreesToRadians(destinationCoords[1]);
    let destinationLong = degreesToRadians(destinationCoords[0]);
  
    // Radius of the Earth in kilometers
    let radius = 6370;
  
    // Haversine equation
    let distanceInKilometers = Math.acos(Math.sin(startingLat) * Math.sin(destinationLat) +
    Math.cos(startingLat) * Math.cos(destinationLat) *
    Math.cos(startingLong - destinationLong)) * radius;
  
    return distanceInKilometers;
}