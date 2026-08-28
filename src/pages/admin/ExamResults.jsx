import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../../api/client';

/**
 * Resultats de l'examen
 *
 * Proprietaire : P4
 *
 * - Tableau : etudiant, note/total, pourcentage, date de soumission
 * - Bandeau d'en-tete avec la moyenne de la classe et le nombre de
 *   tentatives, tous deux calcules en SQL par le backend (AVG, COUNT) -
 *   cette page ne fait qu'afficher ce que l'API renvoie, aucun recalcul
 *   en JavaScript.
 * - RG-10 : les etudiants desactives restent dans la liste, un badge les
 *   distingue sans masquer leur resultat.
 * - Tri par note (cliquer sur l'en-tete de colonne inverse l'ordre).
 */

function formaterDate(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ExamResults() {
  const { id } = useParams();

  const [resultats, setResultats] = useState([]);
  const [resume, setResume] = useState({ average: 0, attemptsCount: 0 });
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [ordreCroissant, setOrdreCroissant] = useState(false);

  useEffect(() => {
    let annule = false;

    async function charger() {
      setChargement(true);
      setErreur('');
      try {
        const donnees = await apiFetch(`/exams/${id}/results`);
        if (annule) return;
        setResultats(donnees.results);
        setResume(donnees.summary);
      } catch (erreurApi) {
        if (annule) return;
        setErreur(
          erreurApi instanceof ApiError ? erreurApi.message : 'Impossible de charger les resultats.'
        );
      } finally {
        if (!annule) setChargement(false);
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, [id]);

  function inverserTri() {
    setOrdreCroissant((precedent) => !precedent);
  }

  const resultatsTries = [...resultats].sort((a, b) =>
    ordreCroissant ? a.score - b.score : b.score - a.score
  );

  return (
    <section>
      <div className="carte">
        <div className="carte-entete">
          <div>
            <h2>Resultats de l'examen</h2>
            <p className="texte-discret">
              Moyenne de la classe : <strong>{resume.average.toFixed(2)}</strong> — {resume.attemptsCount}{' '}
              tentative{resume.attemptsCount > 1 ? 's' : ''}
            </p>
          </div>
          <Link to="/admin/exams" className="bouton bouton-secondaire">
            Retour aux examens
          </Link>
        </div>

        {erreur && <div className="message message-erreur">{erreur}</div>}

        {chargement ? (
          <p className="texte-discret">Chargement...</p>
        ) : resultatsTries.length === 0 ? (
          <p className="table-vide">Aucune tentative pour le moment.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Etudiant</th>
                <th onClick={inverserTri} style={{ cursor: 'pointer' }}>
                  Note {ordreCroissant ? '▲' : '▼'}
                </th>
                <th>Pourcentage</th>
                <th>Soumis le</th>
              </tr>
            </thead>
            <tbody>
              {resultatsTries.map((ligne) => {
                const pourcentage = ligne.maxScore > 0 ? (ligne.score / ligne.maxScore) * 100 : 0;
                return (
                  <tr key={ligne.attemptId}>
                    <td>
                      {ligne.fullName}{' '}
                      {!ligne.isActive && <span className="badge badge-alerte">Compte desactive</span>}
                      <div className="texte-discret">{ligne.email}</div>
                    </td>
                    <td>
                      {ligne.score} / {ligne.maxScore}
                    </td>
                    <td>{pourcentage.toFixed(0)}%</td>
                    <td>{formaterDate(ligne.submittedAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
