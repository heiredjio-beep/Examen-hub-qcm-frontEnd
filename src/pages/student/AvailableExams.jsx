import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

/**
 * Examens disponibles — perimetre P5.
 *
 * La liste vient de GET /api/my/exams, qui ne renvoie que les examens
 * ouverts maintenant (RG-03) et pas encore passes (RG-02). Le filtrage
 * est fait en SQL cote serveur : cette page n'en refait aucun.
 */

/** Formate le temps restant avant fermeture, en clair. */
function tempsRestant(endsAt) {
  const restant = new Date(endsAt).getTime() - Date.now();
  if (restant <= 0) return 'Ferme';

  const heures = Math.floor(restant / 3_600_000);
  const jours = Math.floor(heures / 24);

  if (jours >= 1) return `${jours} jour${jours > 1 ? 's' : ''} restant${jours > 1 ? 's' : ''}`;
  if (heures >= 1) return `${heures} heure${heures > 1 ? 's' : ''} restante${heures > 1 ? 's' : ''}`;
  return `${Math.max(1, Math.floor(restant / 60_000))} minutes restantes`;
}

function dateLocale(iso) {
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export default function AvailableExams() {
  const [examens, setExamens] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function charger() {
      try {
        const donnees = await apiFetch('/my/exams');
        if (!annule) setExamens(donnees);
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

  if (chargement) {
    return (
      <section className="carte">
        <p className="texte-discret">Chargement des examens...</p>
      </section>
    );
  }

  return (
    <>
      <div className="carte-entete">
        <h1>Examens disponibles</h1>
        <Link to="/student/results" className="bouton bouton-secondaire">
          Mes resultats
        </Link>
      </div>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      {examens.length === 0 && !erreur && (
        <section className="carte">
          <p className="texte-discret">Aucun examen n'est ouvert pour le moment.</p>
        </section>
      )}

      {examens.map((examen) => (
        <section className="carte" key={examen.id}>
          <div className="carte-entete">
            <div>
              <h2>{examen.title}</h2>
              <p className="texte-discret">
                {examen.courseCode} — {examen.courseName}
              </p>
            </div>
            <span className="badge badge-alerte">{tempsRestant(examen.endsAt)}</span>
          </div>

          {examen.description && <p>{examen.description}</p>}

          <p className="texte-discret">
            {examen.questionCount} question{examen.questionCount > 1 ? 's' : ''} · ferme le{' '}
            {dateLocale(examen.endsAt)}
          </p>

          <Link to={`/student/exams/${examen.id}`} className="bouton">
            Passer l'examen
          </Link>
        </section>
      ))}
    </>
  );
}
