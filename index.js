const express=require('express');
const jwt=require('jsonwebtoken');
const Joi=require('joi');
const SwaggerUi=require('swagger-ui-express');
const debug=require('debug')('app:startup');
const bodyParser = require('body-parser');
const swaggerDocument=require('./swagger.json');
const {express_jwt}=require('express-jwt');
const config = require('./config');
const mysql2 = require('mysql2');
const { validateData } = require('./validation');
const cors = require('cors');

const app= express();
const PORT=process.env.PORT||3000;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended:true }));
app.use(express.json());
app.use(cors());

app.use('/api-docs',SwaggerUi.serve,SwaggerUi.setup(swaggerDocument));

// app.post('/api/login',(req,res)=>{

//     const schema = Joi.object({
//         username:Joi.string().required(),
//         password:Joi.string().required()
//     });

//     const{ error }= schema.validate(req.body);
//     if(error) return res.status(400).send(error.details[0].message);

//     //authenticate user
//     //In real application,you would verify credentials against a database


//     const user={username: req.body.username, id:1,role:'admin'};
//     const token=jwt.sign(user,config.get('jwtPrivateKey'));
//     res.send(token);

// });

const configurations = config.jwtConfig;

const jwtToken = jwt.sign({ userId: 8 }, configurations.jwtSecret);


const database =  config.database;

//require mysql2

const conn = mysql2.createConnection({
    host: database.host,
    user:database.user,
    password:database.password,
    database:database.database
});

conn.connect((error)=>{
    if(error) throw error;
    console.log("Connected to the database.");
})

function authenticate(req, res, next) {
    // Check for JWT token in the Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader) return res.status(401).send('Access denied. No token provided.');
  
    // Extract the token from the Authorization header
    const token = authHeader.split(' ')[1];
  
    try {
      // Verify the token
      const decoded = jwt.verify(token, configurations.jwtSecret);
      req.user = decoded;
      next();
    } catch (ex) {
      res.status(400).send('Invalid token.');
    }
  }
  

app.post('/login', (req, res) => {
    /*
    const { id, firstName, lastName, country } = req.body;
    const userData = {
        id: id || null,
        firstName: firstName || 'Kamali',
        lastName: lastName || 'Washington',
        country: country || 'USA',
    };
 */
    const { error, value } = validateData(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = value;
    const query = 'INSERT INTO users (username, password) VALUES (?, ?)';
    const values = [  username, password];
    conn.query(query, values, (error, result) => {
        if (error) {
            console.error('Error inserting data', error);
            res.status(500).json({ error: 'Error inserting data' });
            return;
        }
        const id = result.userId;
        const token = jwt.sign({ userId: id }, configurations.jwtSecret, { expiresIn: configurations.jwtExpiration });
        res.status(201).json({ token });
    });
});

app.get('/api/protected', authenticate, (req, res) => {
    sql = "SELECT * FROM users LIMIT 2";
    
    conn.query(sql, (error, result) => {
        if (error) {
            res.status(500).json({ error: "Error retrieving data" });
            return;
        }
        res.status(200).json({ result });
    });
});


app.listen(PORT,()=>{
    debug(`Server running on port ${PORT}`)
})