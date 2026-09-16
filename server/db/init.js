const fs = require("fs");
const path = require("path");

const db = require("./connection");

async function initializeDatabase() {
    try {
        const schemaPath = path.join(__dirname, "schema.sql");

        const schema = fs.readFileSync(schemaPath, "utf8");

        const statements = schema
            .split(";")
            .map(statement => statement.trim())
            .filter(statement => statement.length > 0);

        for (const statement of statements) {
            await db.execute(statement);
        }

        console.log("Tabelas criadas com sucesso!");

    } catch (error) {
        console.error("Erro ao criar as tabelas:");
        console.error(error);
        process.exit(1);
    }
}