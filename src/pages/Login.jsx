import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

/**
 * Connexion
 *
 * Proprietaire : P2
 */
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);

    try {
      const utilisateur = await login(email, motDePasse);
      const destination =
        location.state?.depuis ?? (utilisateur.role === 'ADMIN' ? '/admin' : '/student');
      navigate(destination, { replace: true });
    } catch (error) {
      // RG-11 : le message affiche est celui du serveur, tel quel.
      setErreur(error instanceof ApiError ? error.message : 'Connexion impossible.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <section className="carte">
      <h2>Connexion</h2>

      <form onSubmit={soumettre}>
        <div className="champ">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(evenement) => setEmail(evenement.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="champ">
          <label htmlFor="password">Mot de passe</label>
          <input
            id="password"
            type="password"
            value={motDePasse}
            onChange={(evenement) => setMotDePasse(evenement.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {erreur && <p className="message message-erreur">{erreur}</p>}

        <button type="submit" className="bouton" disabled={enCours}>
          {enCours ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>
    </section>
  );
}
