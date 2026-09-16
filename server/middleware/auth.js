function requireAuth(req, res, next) {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "É necessário iniciar sessão."
        });
    }

    next();
}

function requireTeacher(req, res, next) {

    if (!req.session.user) {
        return res.status(401).json({
            success: false,
            message: "É necessário iniciar sessão."
        });
    }

    if (req.session.user.role !== "teacher") {
        return res.status(403).json({
            success: false,
            message: "Acesso reservado ao formador."
        });
    }

    next();
}

module.exports = {
    requireAuth,
    requireTeacher
};
