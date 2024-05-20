const database = require("./Database.js")

async function searchEvent(req,res){
    let searchString = "SELECT * FROM EVENT";
    let fileterOptions="";
    for(let name in req.body)
    {
        if(name =="search")
        {
            fileterOptions+= " name LIKE '" + req.body[name]+"'";
        }
        
        else
        {
            if(Array.isArray(req.body[name]))
            {
                fileterOptions+= name + " BETWEEN "+ req.body[name][0] + " AND " + req.body[name][1];
            }
            else
            {
                fileterOptions+= " "+name + " == '" + req.body[name]+"'";
            }
            
        }
        fileterOptions += " AND"
    }
    fileterOptions = fileterOptions.substring(0,fileterOptions.length-3)
    if(fileterOptions!="")
    {
        searchString+= " WHERE" + fileterOptions;
    }

    console.log(searchString)
    res.send(searchString)
    
   
}

async function createEvent(req,res)
{
    	
}

module.exports={searchEvent};