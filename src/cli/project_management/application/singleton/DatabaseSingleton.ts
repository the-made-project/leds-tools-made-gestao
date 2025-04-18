import path from "path";
import { LowSync } from "lowdb";
import { JSONFileSync } from "lowdb/node";
import { IssuesDTO } from "made-report-lib";

export default class DatabaseSingleton {
    private static instance: LowSync<IssuesDTO>;
    private static DB_PATH: string;

    private constructor() {}

    public static initialize(dbPath: string, jsonFile: string): void {
        if (!this.DB_PATH) {
            this.DB_PATH = path.join(dbPath, jsonFile);
        }
    }

    public static getInstance(): LowSync<IssuesDTO> {
        if (!DatabaseSingleton.instance) {
            if (!this.DB_PATH) {
                throw new Error("DatabaseSingleton is not initialized. Call initialize() first.");
            }
            const adapter = new JSONFileSync<IssuesDTO>(this.DB_PATH);
            const defaultData: IssuesDTO = { data: [] };
            DatabaseSingleton.instance = new LowSync<IssuesDTO>(adapter, defaultData);
            DatabaseSingleton.instance.read();
        }
        return DatabaseSingleton.instance;
    }
}

//export default DatabaseSingleton;