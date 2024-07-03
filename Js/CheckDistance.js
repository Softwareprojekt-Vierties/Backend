const apiKey = "5b3ce3597851110001cf6248a0e410bd9aef4d01b7088f2b257b0bb8"

/**
 * checks if the given Locations are in a certen radius to each ohter.
 * 
 * @param {Number} location1 - the address of Location1
 * @param {Number} location2 - the address of Location2
 * @param {Number} maxdistance - the maxdistance between the to Locations
 * @returns {Boolean} true or false
 */

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
        }
    }
    catch(err)
    {
        console.error(err)
        return false
    }
}

/**
 * get the World Coordinates form the given address.
 * 
 * @param {Number} address - the address for the Coordinates
 * @param {Number} apiKey - the apiKey to use the OpenRouteService REST-API
 * @returns {Number}the Global Coordinats of the given Address
 */
async function geocodeAddress(address, apiKey) {
    const response = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}`);
    const data = await response.json();
    if (data.features && data.features.length > 0) {
        return data.features[0].geometry.coordinates;
    } else {
        return null;
    }
}

/**
 * changes Degrees to Radians.
 * 
 * @param {Number} degrees 
 * @returns {Number} the Radians 
 */
function degreesToRadians(degrees) {
    var radians = (degrees * Math.PI)/180;
    return radians;
  }

/**
 * Calculate the Distance between two Coordinates using the Haversine formula
 * 
 * @param {String} startingCoords - start Coordinates
 * @param {String} destinationCoords - end Coordinates
 * @returns the Beeline in Km
 */
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