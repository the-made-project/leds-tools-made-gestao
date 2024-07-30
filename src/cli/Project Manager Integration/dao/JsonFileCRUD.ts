import fs from "fs";

//Class to create a json file X.Y.Z
export class JsonFileCRUD {
    
  filePath:string

    constructor(filePath: string) {
      this.filePath = filePath;
      this.createFileIfNotExists();
    }
  
    public append(key: string | number, newData: any) {
      const data = this.read();
      if (!data[key]) {
        data[key] = newData;
      }else{
        Object.assign(data[key], newData);
      }
      
      this.write(data);
    }
    
    public idExists(id: string | number) {
      const data = this.read();
      return !!data[id]; // Returns true if the ID exists, false otherwise
    }

    private createFileIfNotExists() {
      try {
        if (!fs.existsSync(this.filePath)) {
          const initialData = {};
          this.write(initialData);
        }
      } catch (error) {
        console.error(`Error creating JSON file: ${(error as Error).message}`);
      }
    }
    // Read data from the JSON file
    public read() {
      try {
        const data = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        console.error(`Error reading JSON file: ${(error as Error).message}`);
        return {};
      }
    }
  
    // Write data to the JSON file
    public write(data: {}) {
      try {
        const json = JSON.stringify(data, null, 2);
        fs.writeFileSync(this.filePath, json, 'utf8');
        console.log('Data written to JSON file successfully.');
      } catch (error) {
        console.error(`Error writing JSON file: ${(error as Error).message}`);
      }
    }
  
    // Create a new record in the JSON file
    public async create(key: string | number, value:any) {
      const data = this.read();
      data[key] = value;
      this.append(key,value);
    }
  
    // Read all records from the JSON file
    public readAll() {
      return this.read();
    }
  
    // Read a specific record by its key
    public readByKey(key:string) {
      const data = this.read();
      return data[key];
    }

    public readbyPartOfKey(key:string){
      const data = this.read();
      const values = []
      
      for (const id in data){
        
        if (id.startsWith(key)){
          
          values.push (data[id])
        
        }
      }

      return values
      
    }
  
    // Update a record in the JSON file
    public update(key:string, updatedValue:any) {
      const data = this.read();
      data[key] = updatedValue;
      this.write(data);
    }
  
    // Delete a record from the JSON file
    public delete(key:string ) {
      const data = this.read();
      delete data[key];
      this.write(data);
    }
  }