const express = require("express");
const path = require("path");
const session = require("express-session");

require("dotenv").config();


const db =
    require("./server/db/connection");


const authRoutes =
    require("./server/routes/auth");


const projectRoutes =
    require("./server/routes/projects");


const app =
    express();


const PORT =
    process.env.PORT || 3000;


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(
    express.json()
);


app.use(
    express.urlencoded({
        extended: true
    })
);


// ======================================================
// SESSÃO
// ======================================================

app.use(
    session({

        secret:
            process.env.SESSION_SECRET,

        resave:
            false,

        saveUninitialized:
            false,

        cookie: {

            httpOnly:
                true,

            secure:
                false,

            maxAge:
                1000 * 60 * 60 * 24

        }

    })
);


// ======================================================
// ROTAS
// ======================================================

app.use(
    "/api/auth",
    authRoutes
);


app.use(
    "/api/projects",
    projectRoutes
);


// ======================================================
// PUBLIC
// ======================================================

app.use(
    express.static(
        path.join(
            __dirname,
            "public"
        )
    )
);


// ======================================================
// TESTE DA API
// ======================================================

app.get(
    "/api/test",
    (req, res) => {

        res.json({

            success: true,

            message:
                "DevPortefolio API está a funcionar!"

        });

    }
);


// ======================================================
// TESTE DA BD
// ======================================================

app.get(
    "/api/test-db",
    async (req, res) => {

        try {

            const result =
                await db.execute(
                    "SELECT 1 AS test"
                );


            res.json({

                success: true,

                message:
                    "Ligação à Turso funcionando!",

                result:
                    result.rows

            });


        } catch (error) {

            console.error(
                "Erro na base de dados:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Erro ao ligar à base de dados."

            });

        }

    }
);


// ======================================================
// SERVIDOR
// ======================================================

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(
            `Servidor iniciado em http://localhost:${PORT}`
        );
    });
}

module.exports = app;

