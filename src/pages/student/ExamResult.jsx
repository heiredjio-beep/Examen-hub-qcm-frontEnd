import { Link, useLocation, useParams } from 'react-router-dom';

/**
 * Correction d'un examen — perimetre P5.
 *
 * RG-12 : la note et la correction complete sont affichees immediatement
 * apres la soumission. Le resultat est celui renvoye par POST /submit,
 * transmis par la page de passage via l'etat de navigation — inutile de
 * refaire un appel pour une donnee qu'on vient de recevoir.
 *
 * Si la page est ouverte directement par URL (ou apres un rafraichissement),
 * cet etat n'existe pas : on renvoie l'etudiant vers son historique.
 */
export default function ExamResult() {
  const { id } = useParams();
  const emplacement = useLocation();
  const resultat = emplacement.state?.resultat ?? null;

  if (!resultat) {
    return (
      <section className="carte">
        <h1>Resultat</h1>
        <p className="message message-alerte">
          Le detail de cette correction n'est plus en memoire. Retrouvez votre note dans
          l'historique de vos resultats.
        </p>
        <Link to="/student/results" className="bouton">
          Voir mes resultats
        </Link>
      </section>
    );
  }

  const reussi = resultat.pourcentage >= 50;

  return (
    <>
      <section className="carte">
        <div className="carte-entete">
          <div>
            <h1>{resultat.examTitle}</h1>
            <p className="texte-discret">Examen termine — correction ci-dessous</p>
          </div>
          <span className={`badge ${reussi ? 'badge-succes' : 'badge-erreur'}`}>
            {resultat.pourcentage} %
          </span>
        </div>

        <p className="note-globale">
          {resultat.score} / {resultat.maxScore}
        </p>
        <p className="texte-discret">
          {resultat.corrections.filter((c) => c.correct).length} bonne
          {resultat.corrections.filter((c) => c.correct).length > 1 ? 's' : ''} reponse
          {resultat.corrections.filter((c) => c.correct).length > 1 ? 's' : ''} sur{' '}
          {resultat.corrections.length} questions
        </p>
      </section>

      {resultat.corrections.map((correction, index) => (
        <section className="carte" key={correction.questionId}>
          <div className="carte-entete">
            <h3>
              Question {index + 1} — {correction.pointsObtenus} / {correction.points} point
              {correction.points > 1 ? 's' : ''}
            </h3>
            {correction.correct ? (
              <span className="badge badge-succes">Correct</span>
            ) : correction.choixEtudiantId === null ? (
              <span className="badge">Non repondu</span>
            ) : (
              <span className="badge badge-erreur">Faux</span>
            )}
          </div>

          <p>{correction.statement}</p>

          <div className="choix-ligne choix-correct">
            <span>
              <strong>Bonne reponse :</strong> {correction.bonChoixLabel}
            </span>
          </div>

          {correction.choixEtudiantId !== null && !correction.correct && (
            <div className="choix-ligne choix-errone">
              <span>
                <strong>Votre reponse :</strong> {correction.choixEtudiantLabel}
              </span>
            </div>
          )}

          {correction.choixEtudiantId === null && (
            <p className="texte-discret">Vous n'avez pas repondu a cette question.</p>
          )}
        </section>
      ))}

      <section className="carte">
        <Link to="/student" className="bouton bouton-secondaire">
          Retour aux examens
        </Link>{' '}
        <Link to="/student/results" className="bouton">
          Mes resultats
        </Link>
      </section>
    </>
  );
}
