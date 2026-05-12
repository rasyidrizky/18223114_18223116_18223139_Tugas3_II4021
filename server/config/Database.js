import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';
import path from 'path';

class Database {
    constructor() {
        if (!Database.instance) {
            // setup database
            this.db = new DatabaseSync('./local_DB.sqlite');

            const schemaPath = path.resolve('./server/schema.sql');
            const schemaFile = fs.readFileSync(schemaPath, 'utf-8');
            
            this.db.exec(schemaFile);
            
            // Auto-migration for existing databases
            try { this.db.exec('ALTER TABLE user ADD COLUMN name TEXT;'); } catch (e) {}
            try { this.db.exec('ALTER TABLE user ADD COLUMN avatar_index INTEGER DEFAULT 0;'); } catch (e) {}
            try { this.db.exec('ALTER TABLE user ADD COLUMN custom_avatar_url TEXT;'); } catch (e) {}

            Database.instance = this;
        }

        return Database.instance;
    }

    getDatabase() {
        return this.db;
    }
}

export default new Database();