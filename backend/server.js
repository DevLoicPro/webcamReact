const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs'); // Ajouter fs pour vérifier et créer des dossiers

const app = express();
app.use(cors());
const port = 5000;

// Configurer la taille maximale de la requête JSON
app.use(express.json({ limit: '100mb' })); // Limite de 100MB pour les données JSON
app.use(express.urlencoded({ limit: '100mb', extended: true })); // Limite de 100MB pour les formulaires URL-encodés

// Middleware pour parser les données JSON
app.use(bodyParser.json());

// Configurer Multer pour gérer les fichiers (les images)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const theme = req.body.theme; // Obtenir le thème à partir du body
    const uploadPath = path.join(__dirname, 'uploads', theme); // Créer un chemin dynamique en fonction du thème

    // Vérifier si le dossier du thème existe, sinon le créer
    fs.exists(uploadPath, (exists) => {
      if (!exists) {
        // Créer le dossier si il n'existe pas
        fs.mkdir(uploadPath, { recursive: true }, (err) => {
          if (err) {
            console.error('Erreur lors de la création du dossier:', err);
            return cb(err, null); // Retourner l'erreur à multer
          }
          cb(null, uploadPath); // Dossier créé avec succès
        });
      } else {
        cb(null, uploadPath); // Dossier existe déjà
      }
    });
  },
  filename: (req, file, cb) => {
    const fileExtension = path.extname(file.originalname); // Obtenir l'extension du fichier
    const nom = req.body.nom;  // Nom de l'image
    const page = req.body.page; // Numéro de l'image (page)
    
    // Créer un nom de fichier unique en concaténant nom et page
    const fileName = `${nom}-${page}${fileExtension}`;  // Par exemple: image-1.jpg

    cb(null, fileName);  // Enregistrer l'image sous ce nom
  }
});

const upload = multer({ storage });

// Configurer la connexion à la base de données MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',      // Votre utilisateur MySQL
  password: '',      // Votre mot de passe MySQL
  database: 'user'   // Nom de la base de données
});

// Connecter à la base de données MySQL
db.connect((err) => {
  if (err) {
    console.error('Erreur de connexion à MySQL:', err);
  } else {
    console.log('Connecté à MySQL');
  }
});

// Endpoint pour enregistrer l'image et ses informations dans la base de données
app.post('/images', upload.single('image'), (req, res) => {
  const { nom, page, theme } = req.body; // Récupérer les autres informations depuis le body
  const path = req.file ? req.file.path : null;  // Chemin du fichier téléchargé

  // Vérifier que toutes les informations sont présentes
  if (!nom || !page || !theme || !path) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  // Insérer les informations dans la base de données
  const query = 'INSERT INTO images (nom, page, chemin, theme) VALUES (?, ?, ?, ?)';
  const values = [nom, page, path, theme];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Erreur lors de l\'enregistrement dans la base de données:', err);
      return res.status(500).json({ message: 'Erreur lors de l\'enregistrement' });
    }

    res.status(200).json({
      message: 'Image enregistrée avec succès',
      data: { id: result.insertId, nom, page, path, theme },
    });
  });
});

// Lancer le serveur
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
