import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

function calculerStatut(examen) {
  const maintenant = new Date();
  const debut = new Date(examen.startsAt);
  const fin = new Date(examen.endsAt);
  if (maintenant < debut) return { texte: 'A venir', classe: 'badge-alerte' };
  if (maintenant > fin) return { texte: 'Ferme', classe: 'badge' };
  return { texte: 'Ouvert', classe: 'badge-succes' };
}

function formaterLocal(isoUtc) {
  return new Date(isoUtc).toLocaleString();
}

export default function Exams() {
  const [examens, setExamens] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState(null);

  async function chargerExamens() {
    setChargement(true);
    try {
      const data = await apiFetch('/exams');
      setExamens(data);
      setErreur(null);
    } catch (err) {
      setErreur(err instanceof ApiError ? err.message : 'Erreur inattendue.');
    } finally {
      setChargement(false);
    }
  }

  useEffect(() => {
    chargerExamens();
  }, []);

  return (
    <section className="carte">
      <div className="carte-entete">
        <h2>Examens</h2>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

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