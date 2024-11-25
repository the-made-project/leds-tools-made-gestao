import * as dotenv from 'dotenv';
import { resolve } from 'path';

export class EnvLoader {

    constructor(envFolderPath: string) {
        const envPath = resolve(envFolderPath, '.env');
        dotenv.config({ path: envPath });
     } 


  static getEnvVariable(key: string): string | undefined {
    return process.env[key];
  }

  static getRequiredEnvVariable(key: string): string {
    const value = process.env[key];
   
    if (!value) {
      throw new Error(`Environment variable ${key} is required`);
    }
    return value;
  }
}
