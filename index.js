const express = require('express');
const sql = require('mssql');
require('dotenv').config();

const app = express();
app.use(express.json());

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // Debes asegurarte de que esta solo tenga la dirección del servidor sin el puerto
    port: 19903, // El puerto debe ser un número y especificarse aquí
    database: process.env.DB_NAME,
    options: {
      encrypt: true, // Esta debe ser la opción correcta para solicitar la encriptación
      trustServerCertificate: true // Esto es necesario si el certificado no es de una CA reconocida
    }
  };

app.post('/login', async (req, res) => {
  const { username, ipAddress, password } = req.body;
  if (req.headers.authorization !== `Bearer ${process.env.AUTH_TOKEN}`) {
    return res.status(401).send('Unauthorized');
  }

  try {
    await sql.connect(config);
    const result = await sql.query`exec LOGIN ${username}, ${ipAddress}, ${password}`;
    sql.close();

    if (result.recordset[0].message === 'Exito') {
      res.json({
        message: 'Exito',
        nombre: result.recordset[0].nombre,
        nombre: result.recordset[0].Condominio
      });
    } else {
      res.status(404).send('No existe');
    }
  } catch (err) {
    sql.close();
    res.status(500).send(err);
  }
});
app.post('/getdata', async (req, res) => {
    // Autenticación basada en el encabezado 'Authorization'
    if (req.headers.authorization !== `Bearer ${process.env.AUTH_TOKEN}`) {
      return res.status(401).send('Unauthorized');
    }
  
    // Obtiene el valor 'Condominio' del cuerpo de la petición
    const { Condominio } = req.body;
  
    // Validación simple de que 'Condominio' fue proporcionado
    if (!Condominio) {
      return res.status(400).send('El campo Condominio es requerido.');
    }
  
    try {
      // Establece la conexión a la base de datos
      await sql.connect(config);
  
      // Ejecuta el procedimiento almacenado con el parámetro 'Condominio'
      const result = await sql.query`exec GetData ${Condominio}`;
      sql.close();
  
      // Verifica que se hayan obtenido resultados
      if (result.recordset.length > 0) {
        res.json(result.recordset); // Envía los resultados como respuesta JSON
      } else {
        res.status(404).send('No se encontraron datos.');
      }
    } catch (err) {
      // Cierra la conexión si hubo un error
      sql.close();
      console.error(err);
      res.status(500).send('Error al realizar la consulta en la base de datos.');
    }
  });
  
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
