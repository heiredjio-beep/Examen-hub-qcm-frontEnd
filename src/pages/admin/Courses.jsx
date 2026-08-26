import { useEffect, useState } from 'react';
import { apiFetch, ApiError } from '../../api/client';

const FORMULAIRE_VIDE = { code: '', name: '', description: '' };

export default function Courses() {
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [idEnEdition, setIdEnEdition] = useState(null);

  async function chargerCours() {
    setChargement(true);
    try {
      const data = await apiFetch('/courses');
      setCours(data);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerCours();
  }, []);

  function commencerEdition(c) {
    setIdEnEdition(c.id);
    setFormulaire({ code: c.code, name: c.name, description: c.description ?? '' });
  }

  function annulerEdition() {
    setIdEnEdition(null);
    setFormulaire(FORMULAIRE_VIDE);
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreur(null);
    try {
      if (idEnEdition) {
        await apiFetch(`/courses/${idEnEdition}`, { method: 'PUT', body: formulaire });
      } else {
        await apiFetch('/courses', { method: 'POST', body: formulaire });
      }
      annulerEdition();
      await chargerCours();
    } catch (err) {
      // RG-09 / code deja pris : le message du serveur est affiche tel quel.
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    }
  }

  async function supprimer(c) {
    const confirme = window.confirm(`Supprimer le cours "${c.name}" ?`);
    if (!confirme) return;
    setErreur(null);
    try {
      await apiFetch(`/courses/${c.id}`, { method: 'DELETE' });
      await chargerCours();
    } catch (err) {
      // RG-09 : si le cours contient des examens, le serveur renvoie 409
      // avec un message explicite ("Ce cours contient N examens...").
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    }
  }

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Cours</h2>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      <form onSubmit={soumettre} style={{ marginBottom: 20 }}>
        <div className="champ">
          <label htmlFor="code">Code</label>
          <input
            id="code"
            value={formulaire.code}
            onChange={(e) => setFormulaire({ ...formulaire, code: e.target.value })}
            placeholder="PROG2"
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="name">Nom</label>
          <input
            id="name"
            value={formulaire.name}
            onChange={(e) => setFormulaire({ ...formulaire, name: e.target.value })}
            placeholder="Programmation 2"
            required
          />
        </div>
        <div className="champ">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={formulaire.description}
            onChange={(e) => setFormulaire({ ...formulaire, description: e.target.value })}
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
      ) : cours.length === 0 ? (
        <p className="table-vide">Aucun cours pour le moment.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Nom</th>
              <th>Examens</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {cours.map((c) => (
              <tr key={c.id}>
                <td>{c.code}</td>
                <td>{c.name}</td>
                <td>{c.examCount}</td>
                <td>
                  <button className="bouton bouton-secondaire" onClick={() => commencerEdition(c)}>
                    Editer
                  </button>{' '}
                  <button className="bouton bouton-danger" onClick={() => supprimer(c)}>
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}