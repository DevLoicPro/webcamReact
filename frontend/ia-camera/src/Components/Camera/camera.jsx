import { useState, useRef } from "react"; // Importation de hooks React pour gérer l'état et les références
import Webcam from "react-webcam"; // Importation du composant Webcam pour capturer des images via la caméra
import "./Camera.css"; // Importation du fichier CSS pour le style de l'interface

function WebcamCapture() {
	// Déclaration des états pour gérer les données du formulaire et les messages
	const [nom, setNom] = useState(""); // État pour le nom de l'image
	const [theme, setTheme] = useState(""); // État pour le thème de l'image
	const [page, setPage] = useState(1); // État pour le numéro de l'image, initialisé à 1
	const [loading, setLoading] = useState(false); // État pour indiquer si le chargement est en cours
	const [error, setError] = useState(""); // État pour afficher les messages d'erreur
	const [successMessage, setSuccessMessage] = useState(""); // État pour afficher les messages de succès
	const [isFormVisible, setIsFormVisible] = useState(true); // État pour afficher ou masquer le formulaire
	const webcamRef = useRef(null); // Référence pour accéder au composant Webcam

	// Fonction asynchrone pour capturer et enregistrer l'image
	const captureAndSave = async () => {
		// Capture de l'image à partir de la webcam
		const imageSrc = webcamRef.current.getScreenshot();

		// Validation pour vérifier que tous les champs sont remplis
		if (!nom || !theme || !page || !imageSrc) {
			setError("Tous les champs sont obligatoires, y compris l'image"); // Message d'erreur si des champs sont vides
			setTimeout(() => {
				setError(""); // Effacer le message d'erreur après 5 secondes
			}, 5000);
			return;
		}

		setLoading(true); // Affiche le message de chargement
		setError(""); // Réinitialise le message d'erreur
		setSuccessMessage(""); // Réinitialise le message de succès

		try {
			// Conversion de l'image (en Base64) en un objet Blob pour l'envoyer
			const blob = await fetch(imageSrc)
				.then((res) => res.blob())
				.catch((err) => {
					throw new Error("Erreur de conversion de l'image : " + err.message);
				});

			// Création d'un objet FormData pour envoyer les données et l'image au serveur
			const formData = new FormData();
			formData.append("nom", nom); // Ajout du nom au formulaire
			formData.append("theme", theme); // Ajout du thème au formulaire
			formData.append("page", page); // Ajout du numéro de l'image
			formData.append("image", blob, `${nom}.jpg`); // Ajout de l'image sous le nom fourni

			// Envoi de la requête POST pour sauvegarder les données et l'image sur le serveur
			const response = await fetch("http://localhost:5000/images", {
				method: "POST",
				body: formData,
			});

			const result = await response.json(); // Conversion de la réponse en JSON

			if (response.ok) { // Si l'envoi est réussi
				setSuccessMessage("Image enregistrée avec succès !"); // Message de succès
				setPage((prevPage) => prevPage + 1); // Incrémente le numéro de page
				setTimeout(() => {
					setSuccessMessage(""); // Efface le message de succès après 2 secondes
				}, 2000);
			} else {
				setError(result.message || "Une erreur est survenue"); // Affiche l'erreur reçue
				setTimeout(() => {
					setError(""); // Efface le message d'erreur après 5 secondes
				}, 5000);
			}
		} catch (err) {
			setError("Erreur lors de l'envoi de l'image: " + err.message); // Message d'erreur en cas d'échec
			setTimeout(() => {
				setError(""); // Efface le message d'erreur après 5 secondes
			}, 5000);
		} finally {
			setLoading(false); // Cache le message de chargement
		}
	};

	return (
		<div className="container">
			<h1>Caméra IA</h1>

			{/* Formulaire pour entrer les informations de l'image */}
			{isFormVisible && (
				<div className="form">
					<div>
						<label htmlFor="theme">
							Thème de l&apos;image:
							<input
								type="text"
								value={theme}
								onChange={(e) => setTheme(e.target.value)}
								id="theme"
								placeholder="Thème de l'image"
							/>
						</label>
					</div>

					<div>
						<label htmlFor="title">
							Titre de l&apos;image:
							<input
								type="text"
								value={nom}
								onChange={(e) => setNom(e.target.value)}
								id="title"
								placeholder="Titre de l'image"
							/>
						</label>
					</div>

					<div>
						<label htmlFor="page">
							Numéro de l&apos;image:
							<input
								type="number" // Défini le champ comme type numérique
								value={page}
								onChange={(e) => setPage(parseInt(e.target.value))}
								id="page"
								placeholder="Numéro de l'image"
							/>
						</label>
					</div>
				</div>
			)}

			{/* Bouton pour afficher/masquer le formulaire */}
			<button onClick={() => setIsFormVisible(!isFormVisible)}>
				{isFormVisible ? "Masquer le formulaire" : "Afficher le formulaire"}
			</button>

			{/* Affichage du message d'erreur si présent */}
			{error && <p className="error">{error}</p>}

			{/* Affichage du message de succès si présent */}
			{successMessage && (
				<div className="success-message">
					<p>{successMessage}</p>
				</div>
			)}

			{/* Affichage de la webcam en mode "environnement" (caméra arrière) */}
			<div className="webcam-container">
				<Webcam
					audio={false}
					ref={webcamRef}
					screenshotFormat="image/jpeg"
					videoConstraints={{
						facingMode: "environment" // Utilise la caméra arrière pour les téléphones mobiles
					}}
					width="100%"
					height="auto"
				/>
			</div>

			{/* Bouton pour capturer et enregistrer l'image */}
			<button onClick={captureAndSave}>
				{loading ? "Enregistrement..." : "Prendre une photo et enregistrer"}
			</button>
		</div>
	);
}

export default WebcamCapture; // Exportation du composant pour l'utiliser dans d'autres parties de l'application
