import fs from "fs";
import path from 'path';


export class Util {
  
  public static appendValue(value: string, array:string[]): string[]{
    array.push(value)
    return array
  }

  public static appendFile (fileDirectory:string, fileName:string, value:string){

    fs.appendFileSync(fileDirectory+"/"+fileName, value,'utf-8')
  }

  public static createFile(fileDirectory:string, fileName:string, map:Map<string,string>){
       
    const mapArray = Array.from(map);
    const data = JSON.stringify(mapArray,null,2)
    
    fs.writeFileSync(path.join(fileDirectory, `/${fileName}`), data, 'utf-8')
  }

  public static mkdirSync(fileDirectory:string){
    try{
      fs.mkdirSync(fileDirectory, {recursive:true});
    }catch(error){
      throw new Error(`Error fetching data: ${(error as Error).message}`);
    }
    
  }

  public static readFiletoMap(filePath:string, map: Map<string,string>){
    try{
      
      const data = fs.readFileSync(filePath,'utf8')
      const objects = JSON.parse(data)
      map = new Map(Object.entries(objects))

    }catch(error){
      throw new Error(`Error fetching data: ${(error as Error).message}`);
    }
  }

  public static existFile(filePath: string):boolean{
      try{
      fs.accessSync(filePath, fs.constants.F_OK);
        return true
      }
      catch(error){
        return false
    }
  }

    public static convertDateFormat(inputDate: string) {
        // Split the input date string into day, month, and year
    const [day, month, year] = inputDate.split('/');
      
        // Create a new Date object with the given values
       return  `${year}-${month}-${day}T00:00:00.000+00:00`;
      
               
      }

      public static async get (URL: string, email:string, apitoken:string){
        try{
            const response = await fetch(`${URL}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${email}:${apitoken}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
              })
            

      if (!response.ok) {
                const message = await response.json()
                
                throw new Error(`HTTP error! Status: ${response.status}-${JSON.stringify(message)}`);
      }

      return await response.json();

        }catch (error) {
      throw new Error(`Error fetching data: ${(error as Error).message}`);
    }
        
    }

    public static async send (URL: string, email:string, apitoken:string, data: any, method: string, status_response: boolean){
        try{
            const response = await fetch(`${URL}`, {
                method: `${method}`,
        headers: {
          'Authorization': `Basic ${Buffer.from(`${email}:${apitoken}`).toString('base64')}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
                body: data
              })

      if (!response.ok) {
                if (response.json.length){
                  const message = await response.json()
                
                  throw new Error(`HTTP error! Status: ${response.status}-${JSON.stringify(message)}`);
      }
            }
            if (status_response)
              return await response.json();
            return "Não sei o que era pra retornar"

        }catch (error) {
            throw new Error(`Error fetching data: ${(error as Error).message}`);
      }

    }


  
}