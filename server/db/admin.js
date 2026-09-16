const bcrypt = require("bcrypt");
const db = require("./connection");

async function createAdmin() {
    const name = "Administrador";
    const email = "admin@mestre.com";
    const password = "admin123.";
    
    try {
        const existingUser = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email]
        });

        if (existingUser.rows.length > 0) {
            console.log("O administrador já existe.");
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        await db.execute({
            sql: `
                INSERT INTO users (
                    name,
                    email,
                    password,
                    role
                )
                VALUES (?, ?, ?, ?)
            `,
            args: [
                name,
                email,
                hashedPassword,
                "Administrador"
            ]
        });

        console.log("Administrador criado com sucesso!");

    } catch (error) {
        console.error("Erro ao criar administrador:", error);
    }
}

createAdmin();