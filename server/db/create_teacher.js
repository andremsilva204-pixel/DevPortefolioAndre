const bcrypt = require("bcrypt");
const db = require("./connection");

async function createTeacher() {
    const name = "Formador";
    const email = "formador@devportefolio.pt";
    const password = "Formador123!";

    try {
        const existingUser = await db.execute({
            sql: "SELECT id FROM users WHERE email = ?",
            args: [email]
        });

        if (existingUser.rows.length > 0) {
            console.log("O formador já existe.");
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
                "teacher"
            ]
        });

        console.log("Formador criado com sucesso!");

    } catch (error) {
        console.error("Erro ao criar formador:", error);
    }
}

createTeacher();
