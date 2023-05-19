const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const Suscriptor = require('./models/Suscribe');
const bcrypt = require('bcryptjs');
const app = express();
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');


const uploadMiddleware = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024 // 10 megabytes
  }
});

const fs = require('fs');
const dotenv = require('dotenv').config();

const port = process.env.PORT || 4000;
const uri = process.env.REACT_APP_URI

const bodyParser = require('body-parser');

// Usar body-parser para procesar los datos en el cuerpo de las solicitudes entrantes
const jsonParser = bodyParser.json({ limit: '50mb' });
const urlencodedParser = bodyParser.urlencoded({ limit: '50mb', extended: true });

// utilizar los analizadores de cuerpo en la aplicación
app.use(jsonParser);
app.use(urlencodedParser);

const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// app.use(cors({credentials:true,origin:'http://localhost:3000'}));
// sin paquete cors
app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');

  next();
});




// con el  paquete cors

// app.use(cors({
//   origin: 'http://localhost:3000',
//   methods: ['POST', 'PUT', 'GET'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));







mongoose.connect(uri, {
  useNewUrlParser: true,    // usa el nuevo parser de URL
  useUnifiedTopology: true, // utiliza la nueva topología unificada

}).then(() => {
  console.log('Conexión exitosa a la base Mongo database');
}).catch((error) => {
  console.log('Error al conectar a la base de datos:', error);
});


app.post('/register', uploadMiddleware.single('profilePicture'), async (req, res) => {

  const { username, password } = req.body;
  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);
  try {
    const userDoc = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
      profilePicture: newPath,
    });
    res.json(userDoc);
  } catch (e) {
    console.log(e);
    res.status(400).json(e);
  }
});

// Configurar el transporte de correo electrónico
const config = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'sentidospadres@gmail.com',
    pass: process.env.PASS_FOR_MAIL
  },
}
const transport = nodemailer.createTransport(config);
let lastSubscriberId = 0;

app.post('/suscriptores', async (req, res) => {
  const { name, email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'El correo electrónico no puede ser nulo' });
    }

    const existingSubscriber = await Suscriptor.findOne({ email });


    if (existingSubscriber) {
      return res.status(400).json({ error: 'El suscriptor ya existe' });
    }

    const newSuscriptor = new Suscriptor({ name, email });

    // Incrementar el lastSubscriberId antes de guardar
    lastSubscriberId++;
    newSuscriptor.id = lastSubscriberId;

    await newSuscriptor.save();

    const wts = "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/800px-WhatsApp.svg.png";
    const inst = "https://img.freepik.com/vector-gratis/icono-redes-sociales-vector-instagram-7-junio-2021-bangkok-tailandia_53876-136728.jpg?w=360";
    const fb = "https://png.pngtree.com/png-vector/20221018/ourmid/pngtree-facebook-social-media-icon-png-image_6315968.png";

    const sentidos = "https://igtrigo.com/wp-content/uploads/2018/11/labio-leporino-y-paladar-hendido.jpg";
    const year = new Date().getFullYear();

    const mailOptions = {
      from: 'sentidospadres@gmail.com',
      to: email,
      subject: 'Gracias por suscribirte al Post de Sentidos Padres',
      html: `
        <p>¡Hola <b>${name}, como estas?<b>!</p>
        <p>Gracias por suscribirte a Sentidos Padres. A partir de ahora, recibirás un correo electrónico cada vez que se publique un nuevo post.</p>
        <p>Visita nuestra web: <a href="https://sentidos-blog.vercel.app/"><b>https://sentidos-blog.vercel.app/<b></a></p>
    
        <p>O ingresa a nuestras redes : 😎
          <footer>
            <div className="footer-content">
              <div><img className="titulo-footer" src="${sentidos}" style="width: 300px; height: 150px;" alt="Sentidos"></div>
              <h2>Estamos felices de tenerte</h2>
              <div className="footer-social">
                <h4>Nuestras Redes</h4>
                <a className="footer-whatsapp" href="https://api.whatsapp.com/send?phone=543462529718&text=Hola%20me%20encontré%20con%20esta%20página%20y%20quería%20recibir%20información%20sobre%20Sentidos" target="_blank">
               <img className="footer-whatsapp" src="${wts}" alt="WhatsApp" style="width: 50px; height: 50px;" /></a>
                <a className="footer-instagram" href="https://www.instagram.com" target="_blank"><img className="footer-instagram" src="${inst}" alt="Instagram" style="width: 50px; height: 50px;" /></a>
                <a className="footer-facebook" href="https://www.facebook.com/SentidosAsociacion/" target="_blank"><img className="footer-facebook" src="${fb}" alt="Facebook" style="width: 50px; height: 50px;" /></a>
              </div>
            </div> 
            <p className="copy">&copy; ${year} <b>Sentidos</b></p>
          </footer>
      `
    };


    transport.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
        res.status(500).json({ error: 'Error al enviar el correo electrónico' });
      } else {
        res.status(200).json({ message: 'Suscriptor agregado correctamente' });
      }
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: 'Error al procesar la solicitud' });
  }
});





app.post('/login', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const { username, password } = req.body;
  const userDoc = await User.findOne({ username });
  const passOk = bcrypt.compareSync(password, userDoc.password);
  if (passOk) {
    // logged in
    jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
      if (err) throw err;
      res.cookie('token', token).json({
        id: userDoc._id,
        username,
        profilePicture: userDoc.profilePicture // agrega la propiedad profilePicture a la respuesta
      });
    });
  } else {
    res.status(400).json('wrong credentials');
  }
});





app.get('/profile', (req, res) => {

  const { token } = req.cookies;
  if (!token) {
    return res.status(401).json({ message: 'No se proporcionó un token' });
  }
  jwt.verify(token, secret, {}, (err, info) => {
    if (err) {
      return res.status(401).json({ message: 'Token inválido' });
    }
    res.json(info);
    // console.log(info);
  });
});




app.post('/logout', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.cookie('token', '').json('ok');
});


app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  const { originalname, path } = req.file;
  const parts = originalname.split('.');
  const ext = parts[parts.length - 1];
  const newPath = path + '.' + ext;
  fs.renameSync(path, newPath);

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { title, summary, content, profileAvatar } = req.body;
    const postDoc = await Post.create({
      title,
      summary,
      content,
      cover: newPath,
      profilePicture: profileAvatar,
      author: info.id,
    });

    const subscribers = await Suscriptor.find({}, 'email');
    // const titulo = title
    for (const subscriber of subscribers) {
      const subscriberEmail = subscriber.email;

      // Enlace al post
      const postId = postDoc._id; // Suponiendo que el ID del post se encuentra en el campo _id
      const link = `https://sentidos-blog.vercel.app/post/${postId}`;

      // Envío del correo electrónico al suscriptor actual
      const mailOptions = {
        from: 'sentidospadres@gmail.com', // Tu dirección de correo electrónico
        to: subscriberEmail,
        subject: 'Nuevo post creado',
        html: `Hola como estas?, queriamos contarte que se creo un nuevo post:<br><br>
        <h2>Título: ${title}</h2><br>
        Dale click en el siguiente enlace: <br></br><hr><button style="background-color: #66b3ff; color: white; font-weight: bold;border-radius:15px"><a href="${link}" style="color: white; text-decoration: none;">VER EL ARTÍCULO</a></button>`,

      };

      transport.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
        } else {
          console.log('Correo enviado:', info.response);
        }
      });
    }



    res.json(postDoc);
  });
});





app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    newPath = path + '.' + ext;
    fs.renameSync(path, newPath);
  }

  const { token } = req.cookies;
  jwt.verify(token, secret, {}, async (err, info) => {
    if (err) throw err;
    const { id, title, summary, content } = req.body;
    const postDoc = await Post.findById(id);
    const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json('you are not the author');
    }
    await postDoc.update({
      title,
      summary,
      content,
      cover: newPath ? newPath : postDoc.cover,
    });

    res.json(postDoc);
  });

});



app.get('/post', async (req, res) => {
  res.json(
    await Post.find()
      .populate('author', ['username'])
      .sort({ createdAt: -1 })
      .limit(50)
  );
});

app.get('/post/:id', async (req, res) => {
  const { id } = req.params;
  const postDoc = await Post.findById(id).populate('author', ['username']);
  res.json(postDoc);
})




app.listen(port, () => {
  console.log('Runnig SERVER ' + port);
});
//
