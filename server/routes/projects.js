const express = require("express");
const db = require("../db/connection");

const {
    requireAuth,
    requireTeacher
} = require("../middleware/auth");

const router = express.Router();


// ==================================================
// GET /api/projects
// Listar todos os projetos
// Público
// ==================================================

router.get("/", async (req, res) => {
    try {

        const result = await db.execute(`
            SELECT
                projects.*,
                users.name AS author
            FROM projects
            JOIN users
                ON projects.user_id = users.id
            ORDER BY projects.created_at DESC
        `);

        res.json({
            success: true,
            projects: result.rows
        });

    } catch (error) {

        console.error("Erro ao listar projetos:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao carregar os projetos."
        });
    }
});


// ==================================================
// GET /api/projects/:id
// Ver um projeto
// Público
// ==================================================

router.get("/:id", async (req, res) => {
    try {

        const result = await db.execute({
            sql: `
                SELECT
                    projects.*,
                    users.name AS author
                FROM projects
                JOIN users
                    ON projects.user_id = users.id
                WHERE projects.id = ?
            `,
            args: [req.params.id]
        });

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Projeto não encontrado."
            });
        }

        res.json({
            success: true,
            project: result.rows[0]
        });

    } catch (error) {

        console.error("Erro ao procurar projeto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao carregar o projeto."
        });
    }
});


// ==================================================
// POST /api/projects
// Criar projeto
// Formando autenticado
// ==================================================

router.post("/", requireAuth, async (req, res) => {
    try {

        const {
            title,
            description,
            long_description,
            image_url,
            github_url,
            live_url,
            level
        } = req.body;

        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Título e descrição são obrigatórios."
            });
        }

        const result = await db.execute({
            sql: `
                INSERT INTO projects (
                    user_id,
                    title,
                    description,
                    long_description,
                    image_url,
                    github_url,
                    live_url,
                    level
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            args: [
                req.session.user.id,
                title.trim(),
                description.trim(),
                long_description || null,
                image_url || null,
                github_url || null,
                live_url || null,
                level || null
            ]
        });

        res.status(201).json({
            success: true,
            message: "Projeto criado com sucesso.",
            projectId: Number(result.lastInsertRowid)
        });

    } catch (error) {

        console.error("Erro ao criar projeto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao criar projeto."
        });
    }
});


// ==================================================
// PUT /api/projects/:id
// Editar projeto
// Dono ou formador
// ==================================================

router.put("/:id", requireAuth, async (req, res) => {
    try {

        const projectId = req.params.id;

        const {
            title,
            description,
            long_description,
            image_url,
            github_url,
            live_url,
            level
        } = req.body;


        // Procurar projeto
        const projectResult = await db.execute({
            sql: `
                SELECT user_id
                FROM projects
                WHERE id = ?
            `,
            args: [projectId]
        });

        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Projeto não encontrado."
            });
        }

        const project = projectResult.rows[0];


        // Verificar permissões
        const isOwner =
            Number(project.user_id) === Number(req.session.user.id);

        const isTeacher =
            req.session.user.role === "teacher";

        if (!isOwner && !isTeacher) {
            return res.status(403).json({
                success: false,
                message: "Não tens permissão para editar este projeto."
            });
        }


        if (!title || !description) {
            return res.status(400).json({
                success: false,
                message: "Título e descrição são obrigatórios."
            });
        }


        await db.execute({
            sql: `
                UPDATE projects
                SET
                    title = ?,
                    description = ?,
                    long_description = ?,
                    image_url = ?,
                    github_url = ?,
                    live_url = ?,
                    level = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `,
            args: [
                title.trim(),
                description.trim(),
                long_description || null,
                image_url || null,
                github_url || null,
                live_url || null,
                level || null,
                projectId
            ]
        });

        res.json({
            success: true,
            message: "Projeto atualizado com sucesso."
        });

    } catch (error) {

        console.error("Erro ao editar projeto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao editar projeto."
        });
    }
});


// ==================================================
// DELETE /api/projects/:id
// Apagar projeto
// Dono ou formador
// ==================================================

router.delete("/:id", requireAuth, async (req, res) => {
    try {

        const projectId = req.params.id;


        const projectResult = await db.execute({
            sql: `
                SELECT user_id
                FROM projects
                WHERE id = ?
            `,
            args: [projectId]
        });


        if (projectResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Projeto não encontrado."
            });
        }


        const project = projectResult.rows[0];


        const isOwner =
            Number(project.user_id) === Number(req.session.user.id);

        const isTeacher =
            req.session.user.role === "teacher";


        if (!isOwner && !isTeacher) {
            return res.status(403).json({
                success: false,
                message: "Não tens permissão para apagar este projeto."
            });
        }


        await db.execute({
            sql: `
                DELETE FROM projects
                WHERE id = ?
            `,
            args: [projectId]
        });


        res.json({
            success: true,
            message: "Projeto apagado com sucesso."
        });

    } catch (error) {

        console.error("Erro ao apagar projeto:", error);

        res.status(500).json({
            success: false,
            message: "Erro ao apagar projeto."
        });
    }
});


module.exports = router;
