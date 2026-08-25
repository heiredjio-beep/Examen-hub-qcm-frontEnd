const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

const CLE_TOKEN = 'examhub.token';

/**
 * Evenement emis des qu'une reponse 401 arrive : le token est absent,
 * expire ou invalide. AuthContext l'ecoute et vide la session, ce qui
 * declenche la redirection vers /login via ProtectedRoute.
 *
 * On passe par un evenement plutot que par un import direct du routeur :
 * client.js reste un module sans dependance a React.
 */
export const EVENEMENT_NON_AUTHENTIFIE = 'examhub:non-authentifie';

export function lireToken() {
  return localStorage.getItem(CLE_TOKEN);
}

export function ecrireToken(token) {
  localStorage.setItem(CLE_TOKEN, token);
}

export function effacerToken() {
  localStorage.removeItem(CLE_TOKEN);
}

/**
 * Erreur portant le message renvoye par le serveur.
 *
 * RG-13 : l'API repond toujours { "message": "..." }. On releve ce message
 * tel quel pour l'afficher a l'ecran. Aucune page ne doit inventer son
 * propre texte d'erreur : le message du serveur est la source de verite.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Appel unique de l'API pour tout le frontend.
 *
 * - prefixe l'URL avec VITE_API_URL
 * - ajoute Authorization: Bearer <token> si un token est present
 * - serialise le corps en JSON
 * - leve une ApiError portant le message du serveur en cas d'echec
 *
 *   const cours = await apiFetch('/courses');
 *   await apiFetch('/courses', { method: 'POST', body: { code, name } });
 */
export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const token = lireToken();
  const enTetes = { ...headers };

  if (body !== undefined) {
    enTetes['Content-Type'] = 'application/json';
  }
  if (token) {
    enTetes.Authorization = `Bearer ${token}`;
  }

  let reponse;
  try {
    reponse = await fetch(`${API_URL}${path}`, {
      method,
      headers: enTetes,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Le serveur n'a pas repondu du tout : backend eteint, mauvais port,
    // ou CORS refuse. Message explicite plutot qu'un "Failed to fetch".
    throw new ApiError(0, "Le serveur est injoignable. Verifiez que l'API est demarree.");
  }

  // 204 No Content : pas de corps a lire.
  if (reponse.status === 204) {
    return null;
  }

  const texte = await reponse.text();
  let donnees = null;
  if (texte) {
    try {
      donnees = JSON.parse(texte);
    } catch {
      donnees = null;
    }
  }

  if (!reponse.ok) {
    const message = donnees?.message ?? `Erreur ${reponse.status}.`;

    if (reponse.status === 401) {
      window.dispatchEvent(new CustomEvent(EVENEMENT_NON_AUTHENTIFIE));
    }

    throw new ApiError(reponse.status, message);
  }

  return donnees;
}
