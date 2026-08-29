import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiFetch, ApiError } from '../../api/client';

/**
 * Passage d'un examen — perimetre P5.
 *
 * Toutes les questions sur une seule page, comme le sujet l'impose.
 * Un groupe de boutons radio par question : un seul choix est donc
 * possible mecaniquement, l'interface ne peut pas produire deux reponses.
 *
 * Le client n'envoie que des identifiants (RG-06). Aucune notion de
 * bonne reponse n'existe dans cette page : le serveur ne l'envoie jamais
 * avant la soumission (RG-07).
 */
export default function TakeExam() {
  const { id } = useParams();
  const naviguer = useNavigate();

  const [examen, setExamen] = useState(null);
  const [reponses, setReponses] = useState({});
  const [chargement, setChargement] = useState(true);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let annule = false;

    async function charger() {
      try {
        const donnees = await apiFetch(`/my/exams/${id}`);
        if (!annule) setExamen(donnees);
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
  }, [id]);

  const nombreRepondues = useMemo(
    () => Object.values(reponses).filter((choix) => choix !== null && choix !== undefined).length,
    [reponses]
  );

  function choisir(questionId, choiceId) {
    setReponses((precedent) => ({ ...precedent, [questionId]: choiceId }));
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    if (envoiEnCours || !examen) return;

    const sansReponse = examen.questions.length - nombreRepondues;
    const avertissement =
      sansReponse > 0
        ? `Il vous reste ${sansReponse} question${sansReponse > 1 ? 's' : ''} sans reponse, qui vaudra${sansReponse > 1 ? 'ont' : ''} 0 point.\n\n`
        : '';

    // Exigence explicite du sujet : confirmation avant soumission.
    const confirme = window.confirm(
      `${avertissement}La soumission est definitive : vous ne pourrez pas repasser cet examen.\n\nConfirmer l'envoi ?`
    );
    if (!confirme) return;

    setEnvoiEnCours(true);
    setErreur('');

    try {
      const resultat = await apiFetch(`/my/exams/${id}/submit`, {
        method: 'POST',
        body: {
          answers: examen.questions.map((question) => ({
            questionId: question.id,
            choiceId: reponses[question.id] ?? null,
          })),
        },
      });

      // Le resultat complet (RG-12) est renvoye par la soumission elle-meme.
      // On le passe a la page de resultat plutot que de refaire un appel.
      naviguer(`/student/exams/${id}/result`, { replace: true, state: { resultat } });
    } catch (error) {
      setErreur(error instanceof ApiError ? error.message : 'Soumission impossible.');
      setEnvoiEnCours(false);
    }
  }

  if (chargement) {
    return (
      <section className="carte">
        <p className="texte-discret">Chargement de l'examen...</p>
      </section>
    );
  }

  if (!examen) {
    return (
      <section className="carte">
        <p className="message message-erreur">{erreur || 'Examen indisponible.'}</p>
        <button type="button" className="bouton bouton-secondaire" onClick={() => naviguer('/student')}>
          Retour aux examens
        </button>
      </section>
    );
  }

  return (
    <form onSubmit={soumettre}>
      <section className="carte">
        <div className="carte-entete">
          <div>
            <h1>{examen.title}</h1>
            <p className="texte-discret">
              {examen.courseCode} — {examen.courseName} · {examen.totalPoints} points
            </p>
          </div>
          <span className="badge badge-alerte">
            Ferme le{' '}
            {new Date(examen.endsAt).toLocaleString('fr-FR', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </span>
        </div>

        <p>
          <strong>
            {nombreRepondues} sur {examen.questions.length} questions repondues
          </strong>
        </p>
      </section>

      {erreur && <p className="message message-erreur">{erreur}</p>}

      {examen.questions.map((question, index) => (
        <section className="carte" key={question.id}>
          <h3>
            Question {index + 1} — {question.points} point{question.points > 1 ? 's' : ''}
          </h3>
          <p>{question.statement}</p>

          {question.choices.map((choix) => (
            <label key={choix.id} className="choix-ligne">
              <input
                type="radio"
                name={`question-${question.id}`}
                value={choix.id}
                checked={reponses[question.id] === choix.id}
                onChange={() => choisir(question.id, choix.id)}
                disabled={envoiEnCours}
              />
              <span>{choix.label}</span>
            </label>
          ))}
        </section>
      ))}

      <section className="carte">
        <button type="submit" className="bouton" disabled={envoiEnCours}>
          {envoiEnCours ? 'Envoi en cours...' : "Soumettre l'examen"}
        </button>
        <p className="texte-discret">
          La soumission est definitive. Les questions sans reponse valent 0 point.
        </p>
      </section>
    </form>
  );
}
