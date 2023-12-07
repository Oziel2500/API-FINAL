const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bearerToken = require('express-bearer-token');
const app = express();
const cors = require('cors');
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' });
const swaggerUI = require('swagger-ui-express');
const swaggerjsDoc = require('swagger-jsdoc');
app.use(morgan('combined', { stream: accessLogStream }));
app.use(cors());
app.use(express.json());
app.use(bearerToken());

const multer = require('multer');
const folder = path.join(__dirname + '/archivos/');
const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, folder) },
    filename: function (req, file, cb) { cb(null, file.originalname) }
});
const upload = multer({ storage: storage })
app.use(express.urlencoded({ extended: true }));
app.use(upload.single('archivo'));
const PORT = process.env.PORT || 8084
const PORTE = process.env.MYSQLPORT;
const HOST = process.env.MYSQLHOST || 'localhost';
const USER = process.env.MYSQLUSER || 'root';
const PASSWORD = process.env.MYSQLPASSWORD || '19100267';
const DATABASE = process.env.MYSQL_DATABASE || 'autos';
const URL = process.env.URL

const MySqlConnection = { host: HOST, user: USER, password: PASSWORD, database: DATABASE, port: PORTE }
const data = fs.readFileSync(path.join(__dirname, './Options.json'), { encoding: 'utf8', flag: 'r' });
const obj = JSON.parse(data)

const swaggerOptions = {
    definition: obj,
    apis: [`${path.join(__dirname, "./index.js")}`],
}

app.get("/autos", async (req, res) => {
    try {
        const token = req.token;

        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('SELECT * from modelo');
        res.json(rows);

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

app.get("/autos/:ID", async (req, res) => {
   

    const conn = await mysql.createConnection(MySqlConnection);

    const [rows, fields] = await conn.query('SELECT * FROM modelo WHERE ID = ?', [req.params.ID]);

    if (rows.length === 0) {
        res.status(404).json({ mensaje: "No encontramos el auto, en la base de datos" });
    } else {
        res.json(rows);
    }
});

app.post('/insertar', async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);

        const { Nombre, Categoria, Lanzamiento} = req.body;

        const [rows, fields] = await conn.execute('INSERT INTO modelo (Nombre, Categoria, Lanzamiento) VALUES (?, ?, ?)', [Nombre, Categoria, Lanzamiento]);

        res.json({ message: 'Datos insertados del modelo de auto correctamente de ' + Nombre });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al insertar datos' });
    }
});

app.put("/autos/:ID", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const { Nombre, Categoria, Lanzamiento } = req.body;
        console.log(req.body);
        await conn.query('UPDATE modelo SET Nombre = ? , Categoria = ?, Lanzamiento = ? WHERE ID = ?', [Nombre, Categoria, Lanzamiento, req.params.ID]);
        res.json({ mensaje: "ACTUALIZADO " + Nombre });
    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});


app.delete("/autos/:ID", async (req, res) => {
    try {
        const conn = await mysql.createConnection(MySqlConnection);
        const [rows, fields] = await conn.query('DELETE FROM modelo WHERE ID = ?', [req.params.ID]);

        if (rows.affectedRows == 0) {
            res.json({ mensaje: "Registro No Eliminado" });
        } else {
            res.json({ mensaje: "Registro Eliminado" });
        }

    } catch (err) {
        res.status(500).json({ mensaje: err.sqlMessage });
    }
});

const swaggerDocs = swaggerjsDoc(swaggerOptions);

app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocs));
app.get("/options", (req, res) => {
    res.json(data)
})

app.use("/api-docs-json", (req, res) => {
    res.json(swaggerDocs);
});



app.listen(PORT, () => {
    console.log("Servidor express escuchando en el puerto " + PORT);
});