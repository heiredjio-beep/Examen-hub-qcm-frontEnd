import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError, apiFetch } from '../../api/client';

/**
 * Editeur de questions
 *
 * Proprietaire : P4
 *
 * - Liste des questions numerotees, points de chacune + total en haut
 * - Formulaire d'ajout : enonce, points, 2 a 6 choix, un seul radio pour
 *   la bonne reponse (le radio empeche mecaniquement d'en cocher deux,
 *   donc RG-04 est deja garanti cote UI - le serveur revalide quand meme)
 * - RG-08 : bandeau de verrouillage visible des qu'une tentative existe.
 *   On le deduit du resume des resultats (attemptsCount > 0), plutot que
 *   d'attendre l'echec d'une ecriture : l'utilisateur voit l'etat avant
 *   meme d'essayer.
 * - Les erreurs renvoyees par le serveur sont toujours affichees telles
 *   quelles (RG-13), meme quand le formulaire empeche deja l'erreur.
 */

const NOMBRE_MIN_CHOIX = 2;
const NOMBRE_MAX_CHOIX = 6;

function choixVide() {
  return { label: '', isCorrect: false };
}

function formulaireVide() {
  return {
    statement: '',
    points: '',
    choices: [choixVide(), choixVide()],
  };
}

export default function QuestionEditor() {
  const { id } = useParams();

  const [questions, setQuestions] = useState([]);
  const [attemptsCount, setAttemptsCount] = useState(0);
  const [chargement, setChargement] = useState(true);
  const [erreurChargement, setErreurChargement] = useState('');

  const [formulaire, setFormulaire] = useState(formulaireVide);
  const [erreurFormulaire, setErreurFormulaire] = useState('');
  const [envoiEnCours, setEnvoiEnCours] = useState(false);

  const estVerrouille = attemptsCount > 0;
  const totalPoints = questions.reduce((somme, q) => somme + q.points, 0);

  const chargerDonnees = useCallback(async () => {
    setChargement(true);
    setErreurChargement('');
    try {
      const [listeQuestions, resultats] = await Promise.all([
        apiFetch(`/exams/${id}/questions`),
        apiFetch(`/exams/${id}/results`),
      ]);
      setQuestions(listeQuestions);
      setAttemptsCount(resultats.summary.attemptsCount);
    } catch (erreur) {
      setErreurChargement(
        erreur instanceof ApiError ? erreur.message : "Impossible de charger l'examen."
      );
    } finally {
      setChargement(false);
    }
  }, [id]);

  useEffect(() => {
    chargerDonnees();
  }, [chargerDonnees]);

  function modifierChamp(champ, valeur) {
    setFormulaire((precedent) => ({ ...precedent, [champ]: valeur }));
  }

  function modifierLabelChoix(index, valeur) {
    setFormulaire((precedent) => ({
      ...precedent,
      choices: precedent.choices.map((choix, i) =>
        i === index ? { ...choix, label: valeur } : choix
      ),
    }));
  }

  function choisirBonneReponse(index) {
    setFormulaire((precedent) => ({
      ...precedent,
      choices: precedent.choices.map((choix, i) => ({ ...choix, isCorrect: i === index })),
    }));
  }

  function ajouterChoix() {
    setFormulaire((precedent) => {
      if (precedent.choices.length >= NOMBRE_MAX_CHOIX) return precedent;
      return { ...precedent, choices: [...precedent.choices, choixVide()] };
    });
  }

  function retirerChoix(index) {
    setFormulaire((precedent) => {
      if (precedent.choices.length <= NOMBRE_MIN_CHOIX) return precedent;
      return { ...precedent, choices: precedent.choices.filter((_, i) => i !== index) };
    });
  }

  async function soumettre(evenement) {
    evenement.preventDefault();
    setErreurFormulaire('');
    setEnvoiEnCours(true);

    try {
      await apiFetch(`/exams/${id}/questions`, {
        method: 'POST',
        body: {
          statement: formulaire.statement,
          points: Number(formulaire.points),
          choices: formulaire.choices.map((choix) => ({
            label: choix.label,
            isCorrect: choix.isCorrect,
          })),
        },
      });
      setFormulaire(formulaireVide());
      await chargerDonnees();
    } catch (erreur) {
      // RG-13 : le message du serveur est affiche tel quel, meme si le
      // formulaire empechait deja la plupart des cas (RG-04) - le 409 de
      // verrouillage par exemple ne peut venir que du serveur.
      setErreurFormulaire(
        erreur instanceof ApiError ? erreur.message : 'Une erreur est survenue.'
      );
    } finally {
      setEnvoiEnCours(false);
    }
  }

  async function supprimerQuestion(questionId) {
    if (!window.confirm('Supprimer cette question ?')) return;
    try {
      await apiFetch(`/questions/${questionId}`, { method: 'DELETE' });
      await chargerDonnees();
    } catch (erreur) {
      setErreurFormulaire(
        erreur instanceof ApiError ? erreur.message : 'Une erreur est survenue.'
      );
    }
  }

  return (
    <section>
      <div className="carte">
        <div className="carte-entete">
          <div>
            <h2>Questions de l'examen</h2>
            <p className="texte-discret">
              {questions.length} question{questions.length > 1 ? 's' : ''} — {totalPoints} point
              {totalPoints > 1 ? 's' : ''} au total
            </p>
          </div>
          <Link to="/admin/exams" className="bouton bouton-secondaire">
            Retour aux examens
          </Link>
        </div>

        {estVerrouille && (
          <div className="message message-alerte">
            Cet examen a deja ete passe par {attemptsCount} etudiant
            {attemptsCount > 1 ? 's' : ''}. Les questions ne sont plus modifiables.
          </div>
        )}

        {erreurChargement && <div className="message message-erreur">{erreurChargement}</div>}

        {chargement ? (
          <p className="texte-discret">Chargement...</p>
        ) : questions.length === 0 ? (
          <p className="table-vide">Aucune question pour le moment.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>#</th>
                <th>Enonce</th>
                <th>Points</th>
                <th>Choix</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question, index) => (
                <tr key={question.id}>
                  <td>{index + 1}</td>
                  <td>{question.statement}</td>
                  <td>{question.points}</td>
                  <td>
                    {question.choices.map((choix) => (
                      <div key={choix.id}>
                        {choix.isCorrect ? '✓' : '—'} {choix.label}
                      </div>
                    ))}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bouton bouton-danger"
                      disabled={estVerrouille}
                      onClick={() => supprimerQuestion(question.id)}
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="carte">
        <h3>Ajouter une question</h3>

        {erreurFormulaire && <div className="message message-erreur">{erreurFormulaire}</div>}

        <form onSubmit={soumettre}>
          <fieldset disabled={estVerrouille || envoiEnCours} style={{ border: 'none', padding: 0 }}>
            <div className="champ">
              <label htmlFor="statement">Enonce</label>
              <textarea
                id="statement"
                required
                value={formulaire.statement}
                onChange={(e) => modifierChamp('statement', e.target.value)}
              />
            </div>

            <div className="champ">
              <label htmlFor="points">Points</label>
              <input
                id="points"
                type="number"
                min="1"
                step="1"
                required
                value={formulaire.points}
                onChange={(e) => modifierChamp('points', e.target.value)}
              />
            </div>

            <div className="champ">
              <label>Choix (2 a 6) — cochez la bonne reponse</label>
              {formulaire.choices.map((choix, index) => (
                <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input
                    type="radio"
                    name="bonne-reponse"
                    checked={choix.isCorrect}
                    onChange={() => choisirBonneReponse(index)}
                    aria-label={`Choix ${index + 1} correct`}
                  />
                  <input
                    type="text"
                    required
                    placeholder={`Choix ${index + 1}`}
                    value={choix.label}
                    onChange={(e) => modifierLabelChoix(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="bouton bouton-secondaire"
                    disabled={formulaire.choices.length <= NOMBRE_MIN_CHOIX}
                    onClick={() => retirerChoix(index)}
                  >
                    Retirer
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="bouton bouton-secondaire"
                disabled={formulaire.choices.length >= NOMBRE_MAX_CHOIX}
                onClick={ajouterChoix}
              >
                Ajouter un choix
              </button>
            </div>

            <button type="submit" className="bouton">
              {envoiEnCours ? 'Enregistrement...' : 'Ajouter la question'}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}
