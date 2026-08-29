
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

const FORMULAIRE_VIDE = { courseId: '', title: '', description: '', startsAt: '', endsAt: '' };

function calculerStatut(examen) {
  const maintenant = new Date();
  const debut = new Date(examen.startsAt);
  const fin = new Date(examen.endsAt);
  if (maintenant < debut) return { texte: 'A venir', classe: 'badge-alerte' };
  if (maintenant > fin) return { texte: 'Ferme', classe: 'badge' };
  return { texte: 'Ouvert', classe: 'badge-succes' };
}

function formaterLocal(isoUtc) {
  // Format francais explicite, sans les secondes : toLocaleString() sans
  // option suit la locale du navigateur et affiche l'heure a la seconde,
  // ce qui alourdit le tableau sans rien apporter.
  return new Date(isoUtc).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function isoVersChampLocal(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  const decalageMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - decalageMs).toISOString().slice(0, 16);
}

function champLocalVersIso(valeur) {
  if (!valeur) return '';
  return new Date(valeur).toISOString();
}

export default function Exams() {
  const [examens, setExamens] = useState([]);
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [idEnEdition, setIdEnEdition] = useState(null);

  async function chargerTout() {
    setChargement(true);
    try {
      const [donneesExamens, donneesCours] = await Promise.all([
        apiFetch('/exams'),
        apiFetch('/courses'),
      ]);
      setExamens(donneesExamens);
      setCours(donneesCours);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerTout();
  }, []);

  function commencerEdition(e) {
    setIdEnEdition(e.id);
    setFormulaire({
      courseId: e.course.id,
      title: e.title,
      description: e.description ?? '',
      startsAt: isoVersChampLocal(e.startsAt),
      endsAt: isoVersChampLocal(e.endsAt),
    });
  }

  function annulerEdition() {
    setIdEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur(null);
    const corps = {
      title: formulaire.title,
      description: formulaire.description,
      startsAt: champLocalVersIso(formulaire.startsAt),
      endsAt: champLocalVersIso(formulaire.endsAt),
      ...(idEnEdition ? {} : { courseId: Number(formulaire.courseId) }),
    };
    try {
      if (idEnEdition) {
        await apiFetch(`/exams/${idEnEdition}`, { method: 'PUT', body: corps });
      } else {
        await apiFetch('/exams', { method: 'POST', body: corps });
      }
      annulerEdition();
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    }
  }

  async function supprimer(e) {
    const confirme = window.confirm(`Supprimer l'examen "${e.title}" ?`);
    if (!confirme) return;
    setErreur(null);
    try {
      await apiFetch(`/exams/${e.id}`, { method: 'DELETE' });
      await chargerTout();
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    }
  }

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Examens</h2>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      <form onSubmit={soumettre} style={{ marginBottom: 20 }}>
        <div className="champ">
          <label htmlFor="courseId">Cours</label>
          <select
            id="courseId"
            value={formulaire.courseId}
            onChange={(e) => setFormulaire({ ...formulaire, courseId: e.target.value })}
            disabled={Boolean(idEnEdition)}
            required
          >
            <option value="">-- Choisir un cours --</option>
            {cours.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="champ">
          <label htmlFor="title">Titre</label>
          <input
            id="title"
            value={formulaire.title}
            onChange={(e) => setFormulaire({ ...formulaire, title: e.target.value })}
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="startsAt">Ouverture</label>
          <input
            id="startsAt"
            type="datetime-local"
            value={formulaire.startsAt}
            onChange={(e) => setFormulaire({ ...formulaire, startsAt: e.target.value })}
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="endsAt">Fermeture</label>
          <input
            id="endsAt"
            type="datetime-local"
            value={formulaire.endsAt}
            onChange={(e) => setFormulaire({ ...formulaire, endsAt: e.target.value })}
            required
          />
        </div>
        <button type="submit" className="bouton">
          {idEnEdition ? 'Enregistrer' : 'Ajouter'}
        </button>{' '}
        {idEnEdition && (
          <button type="button" className="bouton bouton-secondaire" onClick={annulerEdition}>
            Annuler
          </button>
        )}
      </form>

      {chargement ? (
        <p className="texte-discret">Chargement...</p>
      ) : examens.length === 0 ? (
        <p className="table-vide">Aucun examen pour le moment.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Cours</th>
              <th>Ouverture</th>
              <th>Fermeture</th>
              <th>Statut</th>
              <th>Questions</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {examens.map((e) => {
              const statut = calculerStatut(e);
              return (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{e.course.code}</td>
                  <td>{formaterLocal(e.startsAt)}</td>
                  <td>{formaterLocal(e.endsAt)}</td>
                  <td>
                    <span className={`badge ${statut.classe}`}>{statut.texte}</span>
                  </td>
                  <td>{e.questionCount}</td>
                  <td>
                    <button className="bouton bouton-secondaire" onClick={() => commencerEdition(e)}>
                      Editer
                    </button>{' '}
                    <button className="bouton bouton-danger" onClick={() => supprimer(e)}>
                      Supprimer
                    </button>{' '}
                    <Link to={`/admin/exams/${e.id}/questions`}>Questions</Link>{' '}
                    <Link to={`/admin/exams/${e.id}/results`}>Resultats</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}