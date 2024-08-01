import fs from "fs";

export class JsonFileCRUD {
    
  filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.createFileIfNotExists();
  }

  // Adiciona novos dados ao arquivo JSON, se a chave não existir, ou mescla com os dados existentes
  public append(key: string | number, newData: any) {
    const data = this.read();
    if (!data[key]) {
      data[key] = newData;
    } else {
      Object.assign(data[key], newData);
    }
    this.write(data);
  }
    
  // Verifica se um ID já existe no arquivo JSON
  public idExists(id: string | number) {
    const data = this.read();
    return !!data[id]; // Retorna true se o ID existir, false caso contrário
  }

  // Cria o arquivo JSON se ele não existir
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

  // Lê os dados do arquivo JSON
  public read() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error(`Error reading JSON file: ${(error as Error).message}`);
      return {};
    }
  }

  // Escreve os dados no arquivo JSON
  public write(data: {}) {
    try {
      const json = JSON.stringify(data, null, 2);
      fs.writeFileSync(this.filePath, json, 'utf8');
      console.log('Data written to JSON file successfully.');
    } catch (error) {
      console.error(`Error writing JSON file: ${(error as Error).message}`);
    }
  }

  // Cria um novo registro no arquivo JSON
  public async create(key: string | number, value: any) {
    this.append(key, value);
  }

  // Lê todos os registros do arquivo JSON
  public readAll() {
    return this.read();
  }

  // Lê um registro específico pela sua chave
  public readByKey(key: string) {
    const data = this.read();
    return data[key];
  }

  // Lê registros que começam com uma parte da chave
  public readbyPartOfKey(key: string) {
    const data = this.read();
    const values: any[] = [];
    
    for (const id in data) {
      if (id.startsWith(key)) {
        values.push(data[id]);
      }
    }

    return values;
  }

  // Atualiza um registro no arquivo JSON
  public update(key: string, updatedValue: any) {
    const data = this.read();
    data[key] = updatedValue;
    this.write(data);
  }

  // Deleta um registro do arquivo JSON
  public delete(key: string) {
    const data = this.read();
    delete data[key];
    this.write(data);
  }
}
