const express = require("express");
const bcrypt = require("bcrypt");

const db = require("../db/connection");

const router = express.Router();


// ======================================================
// REGISTO
// ======================================================

router.post("/register", async (req, res) => {

    try {

        const {
            name,
            email,
            password,
            role
        } = req.body;


        // Validar campos obrigatórios

        if (!name || !email || !password || !role) {

            return res.status(400).json({
                success: false,
                message: "Preenche todos os campos."
            });

        }


        // Apenas duas roles são permitidas

        if (
            role !== "student" &&
            role !== "teacher"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "A role deve ser student ou teacher."
            });

        }


        // Password mínima

        if (password.length < 4) {

            return res.status(400).json({
                success: false,
                message:
                    "A password deve ter pelo menos 4 caracteres."
            });

        }


        // Normalizar dados

        const normalizedName =
            name.trim();

        const normalizedEmail =
            email.trim().toLowerCase();


        // Verificar se o email já existe

        const existingUser =
            await db.execute({

                sql: `
                    SELECT id
                    FROM users
                    WHERE email = ?
                `,

                args: [
                    normalizedEmail
                ]

            });


        if (existingUser.rows.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    "Este email já está registado."
            });

        }


        // Encriptar password

        const hashedPassword =
            await bcrypt.hash(
                password,
                12
            );


        // Criar utilizador

        const result =
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
                    normalizedName,
                    normalizedEmail,
                    hashedPassword,
                    role
                ]

            });


        // Log do registo

        console.log("=================================");
        console.log("REGISTO REALIZADO");
        console.log("ID:", Number(result.lastInsertRowid));
        console.log("Nome:", normalizedName);
        console.log("Email:", normalizedEmail);
        console.log("Role:", role);
        console.log("=================================");


        // Resposta

        return res.status(201).json({

            success: true,

            message:
                "Conta criada com sucesso.",

            user: {

                id:
                    Number(result.lastInsertRowid),

                name:
                    normalizedName,

                email:
                    normalizedEmail,

                role:
                    role

            }

        });


    } catch (error) {

        console.error(
            "Erro no registo:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Ocorreu um erro ao criar a conta."

        });

    }

});


// ======================================================
// LOGIN
// ======================================================

router.post("/login", async (req, res) => {

    try {

        console.log("");
        console.log("=================================");
        console.log("PEDIDO DE LOGIN");
        console.log("Email recebido:", req.body.email);
        console.log("=================================");


        const {
            email,
            password
        } = req.body;


        if (!email || !password) {

            return res.status(400).json({

                success: false,

                message:
                    "Preenche o email e a password."

            });

        }


        const normalizedEmail =
            email.trim().toLowerCase();


        // Procurar utilizador

        const result =
            await db.execute({

                sql: `
                    SELECT
                        id,
                        name,
                        email,
                        password,
                        role
                    FROM users
                    WHERE email = ?
                `,

                args: [
                    normalizedEmail
                ]

            });


        if (result.rows.length === 0) {

            console.log("LOGIN FALHOU: utilizador não encontrado.");

            return res.status(401).json({

                success: false,

                message:
                    "Email ou password incorretos."

            });

        }


        const user =
            result.rows[0];


        // Verificar password

        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!passwordCorrect) {

            console.log("LOGIN FALHOU: password incorreta.");

            return res.status(401).json({

                success: false,

                message:
                    "Email ou password incorretos."

            });

        }


        // Guardar sessão

        req.session.user = {

            id:
                Number(user.id),

            name:
                user.name,

            email:
                user.email,

            role:
                user.role

        };


        // ==================================================
        // LOG DO LOGIN
        // ==================================================

        console.log("");
        console.log("=================================");
        console.log("LOGIN REALIZADO COM SUCESSO");
        console.log("Session ID:", req.sessionID);
        console.log("Utilizador:", req.session.user);
        console.log("=================================");


        return res.json({

            success: true,

            message:
                "Login efetuado com sucesso.",

            user:
                req.session.user

        });


    } catch (error) {

        console.error(
            "Erro no login:",
            error
        );


        return res.status(500).json({

            success: false,

            message:
                "Ocorreu um erro ao efetuar o login."

        });

    }

});


// ======================================================
// UTILIZADOR AUTENTICADO
// ======================================================

router.get("/me", (req, res) => {


    // ==================================================
    // LOG DA SESSÃO
    // ==================================================

    console.log("");
    console.log("=================================");
    console.log("PEDIDO /AUTH/ME");
    console.log("Session ID:", req.sessionID);
    console.log("Session:", req.session);
    console.log("User:", req.session.user);
    console.log("=================================");


    if (!req.session.user) {

        console.log("AUTH/ME → NÃO AUTENTICADO");

        return res.status(401).json({

            success: false,

            message:
                "Não autenticado."

        });

    }


    console.log("AUTH/ME → UTILIZADOR AUTENTICADO");


    return res.json({

        success: true,

        user:
            req.session.user

    });

});


// ======================================================
// LOGOUT
// ======================================================

router.post("/logout", (req, res) => {

    console.log("");
    console.log("=================================");
    console.log("LOGOUT");
    console.log("Session ID:", req.sessionID);
    console.log("User:", req.session.user);
    console.log("=================================");


    req.session.destroy((error) => {

        if (error) {

            console.error(
                "Erro ao terminar sessão:",
                error
            );


            return res.status(500).json({

                success: false,

                message:
                    "Não foi possível terminar a sessão."

            });

        }


        res.clearCookie(
            "connect.sid"
        );


        return res.json({

            success: true,

            message:
                "Logout efetuado com sucesso."

        });

    });

});


module.exports = router;