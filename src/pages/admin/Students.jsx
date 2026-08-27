import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../api/client';

const MOT_DE_PASSE_MIN = 8;

/**
 * Etudiants
 *
 * Proprietaire : P2
 * Liste, creation, modification, reinitialisation de mot de passe et
 * desactivation (RG-10 : jamais de suppression) des comptes etudiants.
 */
export default function Students() {
  const [etudiants, setEtudiants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreurListe, setErreurListe] = useState(null);
  const [formulaireVisible, setFormulaireVisible] = useState(false);

  async function chargerEtudiants() {
    setChargement(true);
    setErreurListe(null);
    try {
      const donnees = await apiFetch('/students');
      setEtudiants(donnees);
    } catch (error) {
      setErreurListe(error instanceof ApiError ? error.message : 'Chargement impossible.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerEtudiants();
  }, []);

  function surMiseAJour(maj) {
    setEtudiants((liste) => liste.map((etudiant) => (etudiant.id === maj.id ? maj : etudiant)));
  }

  function surCreation(nouveau) {
    setEtudiants((liste) =>
      [...liste, nouveau].sort((a, b) => a.fullName.localeCompare(b.fullName))
    );
    setFormulaireVisible(false);
  }

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Etudiants</h2>
        <button type="button" className="bouton" onClick={() => setFormulaireVisible((v) => !v)}>
          {formulaireVisible ? 'Annuler' : 'Ajouter un etudiant'}
        </button>
      </div>

      {formulaireVisible && <FormulaireCreation onCree={surCreation} />}

      {erreurListe && <p className="message message-erreur">{erreurListe}</p>}

      {chargement ? (
        <p className="texte-discret">Chargement...</p>
      ) : etudiants.length === 0 ? (
        <p className="table-vide">Aucun etudiant pour le moment.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {etudiants.map((etudiant) => (
              <LigneEtudiant key={etudiant.id} etudiant={etudiant} onMisAJour={surMiseAJour} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function FormulaireCreation({ onCree }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const nouveau = await apiFetch('/students', {
        method: 'POST',
        body: { fullName, email, password },
      });
      onCree(nouveau);
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : 'Creation impossible.');
    } finally {
      setEnCours(false);
    }
  }

  return (
    <form onSubmit={soumettre} className="carte">
      <div className="champ">
        <label htmlFor="nouveau-nom">Nom complet</label>
        <input
          id="nouveau-nom"
          value={fullName}
          onChange={(evenement) => setFullName(evenement.target.value)}
          required
        />
      </div>
      <div className="champ">
        <label htmlFor="nouveau-email">Email</label>
        <input
          id="nouveau-email"
          type="email"
          value={email}
          onChange={(evenement) => setEmail(evenement.target.value)}
          required
        />
      </div>
      <div className="champ">
        <label htmlFor="nouveau-password">Mot de passe</label>
        <input
          id="nouveau-password"
          type="password"
          value={password}
          onChange={(evenement) => setPassword(evenement.target.value)}
          minLength={MOT_DE_PASSE_MIN}
          required
        />
      </div>
      {erreur && <p className="message message-erreur">{erreur}</p>}
      <button type="submit" className="bouton" disabled={enCours}>
        {enCours ? 'Creation...' : 'Creer'}
      </button>
    </form>
  );
}

function LigneEtudiant({ etudiant, onMisAJour }) {
  // affichage | edition | reinitialisation | confirmation
  const [mode, setMode] = useState('affichage');
  const [fullName, setFullName] = useState(etudiant.fullName);
  const [email, setEmail] = useState(etudiant.email);
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [enCours, setEnCours] = useState(false);
  const [erreur, setErreur] = useState(null);

  function revenirAAffichage() {
    setErreur(null);
    setMode('affichage');
  }

  async function enregistrerModification(evenement) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      const maj = await apiFetch(`/students/${etudiant.id}`, {
        method: 'PUT',
        body: { fullName, email },
      });
      onMisAJour(maj);
      setMode('affichage');
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : 'Modification impossible.');
    } finally {
      setEnCours(false);
    }
  }

  async function reinitialiser(evenement) {
    evenement.preventDefault();
    setErreur(null);
    setEnCours(true);
    try {
      await apiFetch(`/students/${etudiant.id}/reset-password`, {
        method: 'POST',
        body: { password: nouveauMotDePasse },
      });
      setNouveauMotDePasse('');
      setMode('affichage');
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : 'Reinitialisation impossible.');
    } finally {
      setEnCours(false);
    }
  }

  // RG-10 : cet appel DELETE ne supprime rien cote serveur, il desactive.
  async function desactiver() {
    setErreur(null);
    setEnCours(true);
    try {
      const maj = await apiFetch(`/students/${etudiant.id}`, { method: 'DELETE' });
      onMisAJour(maj);
      setMode('affichage');
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : 'Desactivation impossible.');
    } finally {
      setEnCours(false);
    }
  }

  if (mode === 'edition') {
    return (
      <tr>
        <td colSpan={4}>
          <form onSubmit={enregistrerModification} className="champ">
            <input
              value={fullName}
              onChange={(evenement) => setFullName(evenement.target.value)}
              required
            />
            <input
              type="email"
              value={email}
              onChange={(evenement) => setEmail(evenement.target.value)}
              required
            />
            {erreur && <p className="message message-erreur">{erreur}</p>}
            <button type="submit" className="bouton" disabled={enCours}>
              Enregistrer
            </button>
            <button type="button" className="bouton-discret" onClick={revenirAAffichage}>
              Annuler
            </button>
          </form>
        </td>
      </tr>
    );
  }

  if (mode === 'reinitialisation') {
    return (
      <tr>
        <td colSpan={4}>
          <form onSubmit={reinitialiser} className="champ">
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={nouveauMotDePasse}
              onChange={(evenement) => setNouveauMotDePasse(evenement.target.value)}
              minLength={MOT_DE_PASSE_MIN}
              required
            />
            {erreur && <p className="message message-erreur">{erreur}</p>}
            <button type="submit" className="bouton" disabled={enCours}>
              Reinitialiser
            </button>
            <button type="button" className="bouton-discret" onClick={revenirAAffichage}>
              Annuler
            </button>
          </form>
        </td>
      </tr>
    );
  }

  if (mode === 'confirmation') {
    return (
      <tr>
        <td colSpan={4}>
          <p>
            Desactiver {etudiant.fullName} ? Ses tentatives et resultats restent consultables
            (RG-10).
          </p>
          {erreur && <p className="message message-erreur">{erreur}</p>}
          <button type="button" className="bouton-danger" onClick={desactiver} disabled={enCours}>
            {enCours ? 'Desactivation...' : 'Confirmer la desactivation'}
          </button>
          <button type="button" className="bouton-discret" onClick={revenirAAffichage}>
            Annuler
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td>{etudiant.fullName}</td>
      <td>{etudiant.email}</td>
      <td>
        <span className={`badge ${etudiant.isActive ? 'badge-succes' : 'badge-erreur'}`}>
          {etudiant.isActive ? 'Actif' : 'Desactive'}
        </span>
      </td>
      <td>
        <button type="button" className="bouton-discret" onClick={() => setMode('edition')}>
          Modifier
        </button>
        <button
          type="button"
          className="bouton-discret"
          onClick={() => setMode('reinitialisation')}
        >
          Reinitialiser
        </button>
        {etudiant.isActive && (
          <button type="button" className="bouton-discret" onClick={() => setMode('confirmation')}>
            Desactiver
          </button>
        )}
      </td>
    </tr>
  );
}
