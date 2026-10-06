const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"]
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

/* =====================================================
   ARQUIVOS DO SITE
===================================================== */

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

/* =====================================================
   STATUS DA API
===================================================== */

app.get("/api/status", (req, res) => {
    return res.status(200).json({
        online: true,
        message: "Servidor funcionando corretamente."
    });
});

/* =====================================================
   ENVIO DE E-MAIL PELO RESEND
===================================================== */

app.post("/api/contact", async (req, res) => {

    try {

        const {
            name,
            email,
            project,
            budget,
            subject,
            message
        } = req.body;

        /* =================================================
           VALIDAÇÃO
        ================================================= */

        if (
            !name ||
            !email ||
            !project ||
            !subject ||
            !message
        ) {
            return res.status(400).json({
                success: false,
                message: "Preencha todos os campos obrigatórios."
            });
        }

        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: "Digite um endereço de e-mail válido."
            });
        }

        if (String(name).length > 100) {
            return res.status(400).json({
                success: false,
                message: "O nome é muito grande."
            });
        }

        if (String(email).length > 200) {
            return res.status(400).json({
                success: false,
                message: "O e-mail é muito grande."
            });
        }

        if (String(subject).length > 200) {
            return res.status(400).json({
                success: false,
                message: "O assunto é muito grande."
            });
        }

        if (String(message).length > 5000) {
            return res.status(400).json({
                success: false,
                message: "A mensagem é muito grande."
            });
        }

        /* =================================================
           VERIFICA API KEY
        ================================================= */

        if (!process.env.RESEND_API_KEY) {

            console.error("RESEND_API_KEY não configurada.");

            return res.status(500).json({
                success: false,
                message: "O servidor de e-mail não está configurado."
            });
        }

        /* =================================================
           DADOS SEGUROS
        ================================================= */

        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safeProject = escapeHtml(project);
        const safeBudget = escapeHtml(
            budget || "Não informado"
        );
        const safeSubject = escapeHtml(subject);
        const safeMessage = escapeHtml(message)
            .replace(/\n/g, "<br>");

        /* =================================================
           ENVIO PELO RESEND
        ================================================= */

        const resendResponse = await fetch(
            "https://api.resend.com/emails",
            {
                method: "POST",

                headers: {
                    "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },

                body: JSON.stringify({

                    /*
                     * Para começar usando o Resend gratuitamente,
                     * utilize o remetente de teste do Resend.
                     */
                    from: "Renan.dev <onboarding@resend.dev>",

                    /*
                     * E-mail que receberá as mensagens
                     */
                    to: [
                        "renanrochafosterdesenvolvedor@gmail.com"
                    ],

                    subject: `[Portfólio] ${subject}`,

                    reply_to: email,

                    text: `
Nova mensagem recebida pelo portfólio.

Nome: ${name}

E-mail: ${email}

Tipo de projeto: ${project}

Orçamento: ${budget || "Não informado"}

Assunto: ${subject}

Mensagem:
${message}
                    `,

                    html: `
<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

</head>

<body
style="
margin:0;
padding:30px;
background:#fff7fa;
font-family:Arial,sans-serif;
color:#292126;
"
>

<div
style="
max-width:700px;
margin:auto;
background:white;
border:1px solid #f1dce6;
border-radius:16px;
overflow:hidden;
"
>

<div
style="
background:#ff4f9a;
padding:25px;
color:white;
"
>

<h2 style="margin:0;">
Nova mensagem pelo portfólio
</h2>

<p style="margin-bottom:0;opacity:.9;">
Uma pessoa entrou em contato através do site.
</p>

</div>

<div style="padding:25px;">

<p>
<strong>Nome:</strong><br>
${safeName}
</p>

<p>
<strong>E-mail:</strong><br>
${safeEmail}
</p>

<p>
<strong>Tipo de projeto:</strong><br>
${safeProject}
</p>

<p>
<strong>Orçamento:</strong><br>
${safeBudget}
</p>

<p>
<strong>Assunto:</strong><br>
${safeSubject}
</p>

<hr
style="
border:0;
border-top:1px solid #f1dce6;
margin:25px 0;
"
>

<h3>
Mensagem
</h3>

<p style="line-height:1.7;">
${safeMessage}
</p>

</div>

</div>

</body>

</html>
                    `
                })
            }
        );

        /* =================================================
           RESPOSTA DO RESEND
        ================================================= */

        const resendText = await resendResponse.text();

        console.log(
            "Resend status:",
            resendResponse.status
        );

        console.log(
            "Resend resposta:",
            resendText
        );

        let resendData = {};

        if (resendText.trim()) {

            try {
                resendData = JSON.parse(resendText);
            } catch (error) {

                console.error(
                    "Resposta do Resend não é JSON:",
                    resendText
                );
            }
        }

        /* =================================================
           ERRO DO RESEND
        ================================================= */

        if (!resendResponse.ok) {

            console.error(
                "Erro retornado pelo Resend:",
                resendData
            );

            return res.status(500).json({
                success: false,
                message:
                    resendData.message ||
                    resendData.error?.message ||
                    "O Resend não conseguiu enviar o e-mail."
            });
        }

        /* =================================================
           SUCESSO
        ================================================= */

        console.log("");
        console.log("================================");
        console.log("NOVA MENSAGEM ENVIADA");
        console.log("================================");
        console.log(`Nome: ${name}`);
        console.log(`E-mail: ${email}`);
        console.log(`Projeto: ${project}`);
        console.log(`Assunto: ${subject}`);
        console.log(`Resend ID: ${resendData.id || "não informado"}`);
        console.log("================================");
        console.log("");

        return res.status(200).json({

            success: true,

            message:
                "Mensagem enviada com sucesso! Renan entrará em contato em breve."

        });

    } catch (error) {

        console.error("");
        console.error("================================");
        console.error("ERRO AO ENVIAR E-MAIL");
        console.error("================================");
        console.error(error);
        console.error("================================");
        console.error("");

        return res.status(500).json({

            success: false,

            message:
                "Não foi possível enviar a mensagem. Tente novamente mais tarde."

        });
    }
});

/* =====================================================
   ROTA 404
===================================================== */

app.use((req, res) => {

    if (req.path.startsWith("/api/")) {

        return res.status(404).json({

            success: false,

            message: "Rota da API não encontrada."

        });
    }

    return res.status(404).send(`
<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<title>Página não encontrada</title>

</head>

<body
style="
font-family:Arial;
text-align:center;
padding:80px;
"
>

<h1>404</h1>

<p>Página não encontrada.</p>

<a href="/">
Voltar para o portfólio
</a>

</body>

</html>
    `);
});

/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email)
    );
}

function escapeHtml(text) {

    return String(text)

        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/* =====================================================
   SERVIDOR
===================================================== */

app.listen(PORT, () => {

    console.log("");
    console.log("================================");
    console.log(" RENAN PORTFÓLIO");
    console.log("================================");
    console.log(
        `Servidor rodando na porta ${PORT}`
    );
    console.log(
        "API: /api/status"
    );
    console.log("================================");
    console.log("");

});