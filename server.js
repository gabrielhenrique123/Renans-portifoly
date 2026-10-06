const express = require("express");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   CONFIGURAÇÕES
===================================================== */

app.use(cors({
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));

app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));

/*
    Permite servir arquivos estáticos caso o servidor
    também seja acessado diretamente.
*/
app.use(express.static(__dirname));


/* =====================================================
   CONFIGURAÇÃO DO GMAIL
===================================================== */

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,

    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },

    tls: {
        family: 4
    }
});

/* =====================================================
   VERIFICAÇÃO DO GMAIL
===================================================== */

transporter.verify((error) => {

    if (error) {

        console.error("");
        console.error("================================");
        console.error(" ERRO AO CONECTAR AO GMAIL");
        console.error("================================");
        console.error(error.message);
        console.error("");

    } else {

        console.log("");
        console.log("================================");
        console.log(" GMAIL CONECTADO COM SUCESSO");
        console.log("================================");
        console.log("");

    }

});


/* =====================================================
   ROTA PRINCIPAL
===================================================== */

app.get("/", (req, res) => {

    res.sendFile(
        path.join(__dirname, "index.html")
    );

});


/* =====================================================
   STATUS DA API
===================================================== */

app.get("/api/status", (req, res) => {

    res.status(200).json({

        online: true,

        message: "Servidor funcionando corretamente."

    });

});


/* =====================================================
   ENVIO DO FORMULÁRIO
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


        /* =============================================
           VALIDAÇÃO
        ============================================= */

        if (
            !name ||
            !email ||
            !project ||
            !subject ||
            !message
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Preencha todos os campos obrigatórios."

            });

        }


        if (!isValidEmail(email)) {

            return res.status(400).json({

                success: false,

                message:
                    "Digite um endereço de e-mail válido."

            });

        }


        if (String(name).length > 100) {

            return res.status(400).json({

                success: false,

                message:
                    "O nome é muito grande."

            });

        }


        if (String(email).length > 200) {

            return res.status(400).json({

                success: false,

                message:
                    "O e-mail é muito grande."

            });

        }


        if (String(subject).length > 200) {

            return res.status(400).json({

                success: false,

                message:
                    "O assunto é muito grande."

            });

        }


        if (String(message).length > 5000) {

            return res.status(400).json({

                success: false,

                message:
                    "A mensagem é muito grande."

            });

        }


        /* =============================================
           PROTEÇÃO HTML
        ============================================= */

        const safeName =
            escapeHtml(name);

        const safeEmail =
            escapeHtml(email);

        const safeProject =
            escapeHtml(project);

        const safeBudget =
            escapeHtml(
                budget || "Não informado"
            );

        const safeSubject =
            escapeHtml(subject);

        const safeMessage =
            escapeHtml(message)
                .replace(/\n/g, "<br>");


        /* =============================================
           CONFIGURAÇÃO DO E-MAIL
        ============================================= */

        const mailOptions = {

            from:
                `"Portfólio Renan" <${process.env.EMAIL_USER}>`,

            to:
                "renanrochafosterdesenvolvedor@gmail.com",

            replyTo:
                email,

            subject:
                `[Portfólio] ${subject}`,

            /* =========================================
               VERSÃO TEXTO
            ========================================= */

            text: `
Nova mensagem recebida pelo portfólio.

Nome:
${name}

E-mail:
${email}

Tipo de projeto:
${project}

Orçamento:
${budget || "Não informado"}

Assunto:
${subject}

Mensagem:
${message}
            `,


            /* =========================================
               VERSÃO HTML
            ========================================= */

            html: `

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        Nova mensagem pelo portfólio
    </title>

</head>


<body
style="
    margin: 0;
    padding: 30px;
    background: #fff7fa;
    font-family: Arial, sans-serif;
    color: #292126;
"
>


<div
style="
    max-width: 700px;
    margin: auto;
    background: white;
    border: 1px solid #f1dce6;
    border-radius: 16px;
    overflow: hidden;
"
>


    <!-- CABEÇALHO -->

    <div
    style="
        background: #ff4f9a;
        padding: 25px;
        color: white;
    "
    >

        <h2
        style="
            margin: 0;
        "
        >

            Nova mensagem pelo portfólio

        </h2>


        <p
        style="
            margin-bottom: 0;
            opacity: .9;
        "
        >

            Uma pessoa entrou em contato
            através do site.

        </p>

    </div>


    <!-- CONTEÚDO -->

    <div
    style="
        padding: 25px;
    "
    >


        <p>

            <strong>
                Nome:
            </strong>

            <br>

            ${safeName}

        </p>


        <p>

            <strong>
                E-mail:
            </strong>

            <br>

            ${safeEmail}

        </p>


        <p>

            <strong>
                Tipo de projeto:
            </strong>

            <br>

            ${safeProject}

        </p>


        <p>

            <strong>
                Orçamento:
            </strong>

            <br>

            ${safeBudget}

        </p>


        <p>

            <strong>
                Assunto:
            </strong>

            <br>

            ${safeSubject}

        </p>


        <hr
        style="
            border: 0;
            border-top: 1px solid #f1dce6;
            margin: 25px 0;
        "
        >


        <h3>
            Mensagem
        </h3>


        <p
        style="
            line-height: 1.7;
        "
        >

            ${safeMessage}

        </p>


    </div>


</div>


</body>

</html>

            `

        };


        /* =============================================
           ENVIA O E-MAIL
        ============================================= */

        await transporter.sendMail(
            mailOptions
        );


        /* =============================================
           LOG
        ============================================= */

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            " NOVA MENSAGEM ENVIADA"
        );

        console.log(
            "================================"
        );

        console.log(
            `Nome: ${name}`
        );

        console.log(
            `E-mail: ${email}`
        );

        console.log(
            `Projeto: ${project}`
        );

        console.log(
            `Assunto: ${subject}`
        );

        console.log(
            "================================"
        );

        console.log("");


        /* =============================================
           RESPOSTA PARA O SITE
        ============================================= */

        return res.status(200).json({

            success: true,

            message:
                "Mensagem enviada com sucesso! Renan entrará em contato em breve."

        });


    } catch (error) {


        /* =============================================
           ERRO
        ============================================= */

        console.error("");

        console.error(
            "================================"
        );

        console.error(
            " ERRO AO ENVIAR E-MAIL"
        );

        console.error(
            "================================"
        );

        console.error(
            error
        );

        console.error(
            "================================"
        );

        console.error("");


        return res.status(500).json({

            success: false,

            message:
                "Não foi possível enviar a mensagem. Verifique a configuração do e-mail no servidor."

        });

    }

});


/* =====================================================
   TRATAMENTO DE ROTAS NÃO ENCONTRADAS
===================================================== */

app.use((req, res) => {

    /* ---------------------------------------------
       Se for uma rota da API
    --------------------------------------------- */

    if (req.path.startsWith("/api/")) {

        return res.status(404).json({

            success: false,

            message:
                "Rota da API não encontrada."

        });

    }


    /* ---------------------------------------------
       Outras páginas
    --------------------------------------------- */

    res.status(404).send(`

<!DOCTYPE html>

<html lang="pt-BR">

<head>

    <meta charset="UTF-8">

    <title>
        Página não encontrada
    </title>

</head>


<body
style="
    font-family: Arial;
    text-align: center;
    padding: 80px;
"
>

    <h1>
        404
    </h1>


    <p>
        Página não encontrada.
    </p>


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


/*
    Validação simples de e-mail
*/

function isValidEmail(email) {

    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        String(email)
    );

}


/*
    Proteção contra HTML
*/

function escapeHtml(text) {

    return String(text)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   INICIA O SERVIDOR
===================================================== */

app.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log("");

        console.log(
            "================================"
        );

        console.log(
            " RENAN PORTFÓLIO"
        );

        console.log(
            "================================"
        );

        console.log(
            `Servidor rodando na porta ${PORT}`
        );

        console.log(
            `API: /api/status`
        );

        console.log(
            "================================"
        );

        console.log("");

    }
);