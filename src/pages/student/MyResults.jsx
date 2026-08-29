import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

/**
 * Historique personnel — perimetre P5.
 * GET /api/my/results renvoie deja le tri du plus recent au plus ancien,
 * fait en SQL. Cette page n'en refait aucun.
 */
export default function MyResults() {
  const [resultats, setResultats] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function charger() {
      try {
        const donnees = await apiFetch('/my/results');
        if (!annule) setResultats(donnees);
      } catch (error) {
        if (!annule) setErreur(error instanceof ApiError ? error.message : 'Chargement impossible.');
      } finally {
        if (!annule) setChargement(false);
      }
    }

    charger();
    return () => {
      annule = true;
    };
  }, []);

  const moyenne =
    resultats.length > 0
      ? Math.round(resultats.reduce((total, r) => total + r.pourcentage, 0) / resultats.length)
      : 0;

  return (
    <>
      <div className="carte-entete">
        <h1>Mes resultats</h1>
        <Link to="/student" className="bouton bouton-secondaire">
          Examens disponibles
        </Link>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      {resultats.length > 0 && (
        <section className="carte">
          <div className="compteurs">
            <div>
              <span className="compteur-valeur">{resultats.length}</span>
              <span className="compteur-libelle">
                Examen{resultats.length > 1 ? 's' : ''} passe{resultats.length > 1 ? 's' : ''}
              </span>
            </div>
            <div>
              <span className="compteur-valeur">{moyenne} %</span>
              <span className="compteur-libelle">Moyenne generale</span>
            </div>
          </div>
        </section>
      )}

      <section className="carte">
        {chargement ? (
          <p className="texte-discret">Chargement...</p>
        ) : resultats.length === 0 ? (
          <p className="table-vide">Vous n'avez encore passe aucun examen.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Examen</th>
                <th>Cours</th>
                <th>Note</th>
                <th>Pourcentage</th>
                <th>Passe le</th>
              </tr>
            </thead>
            <tbody>
              {resultats.map((resultat) => (
                <tr key={resultat.attemptId}>
                  <td>{resultat.examTitle}</td>
                  <td className="texte-discret">
                    {resultat.courseCode} — {resultat.courseName}
                  </td>
                  <td>
                    {resultat.score} / {resultat.maxScore}
                  </td>
                  <td>
                    <span
                      className={`badge ${resultat.pourcentage >= 50 ? 'badge-succes' : 'badge-erreur'}`}
                    >
                      {resultat.pourcentage} %
                    </span>
                  </td>
                  <td className="texte-discret">
                    {new Date(resultat.submittedAt).toLocaleString('fr-FR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
