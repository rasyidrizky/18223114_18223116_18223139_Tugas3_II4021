import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

class Database {
    constructor() {
        if (!Database.instance) {
            this.db = new DatabaseSync('./local_DB.sqlite');

            const schemaPath = path.resolve('./server/schema.sql');
            const schemaFile = fs.readFileSync(schemaPath, 'utf-8');
            
            this.db.exec(schemaFile);
            
            Database.instance = this;
        }

        return Database.instance;
    }

    getDatabase() {
        return this.db;
    }
}

export default new Database();