// === Déclencheur principal : quand on clique sur "Résoudre" ===
document.getElementById("solveBtn").addEventListener("click", resoudreSimplexe);

// === Fonction pour lire une ligne d’entrée (vecteur de nombres) ===
function lireEntree(str) {
  return str.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
}

// === Fonction pour lire plusieurs lignes (matrice des contraintes) ===
function lireMatrice(texte) {
  return texte.trim().split("\n").map(ligne => lireEntree(ligne));
}

// === Vérification que tous les champs sont remplis ===
function verifierChampsVides() {
  const champs = document.querySelectorAll('input, select, textarea');
  let tousRemplis = true;

  document.querySelectorAll('.message-erreur').forEach(e => e.remove());

  champs.forEach(champ => {
    if (champ.value.trim() === '') {
      tousRemplis = false;
      const erreur = document.createElement('div');
      erreur.textContent = '⚠️ Champ vide';
      erreur.className = 'message-erreur';
      erreur.style.color = 'red';
      erreur.style.fontSize = '14px';
      erreur.style.marginTop = '4px';
      champ.insertAdjacentElement('afterend', erreur);
      champ.style.border = '2px solid red';
    } else {
      champ.style.border = '';
    }
  });

  if (!tousRemplis) {
    alert(' Certains champs sont vides. Veuillez les remplir avant de continuer.');
    return false;
  }
  return true;
}

// === Fonction principale ===
function resoudreSimplexe() {
  if (!verifierChampsVides()) return;

  const fonctionObjectif = lireEntree(document.getElementById("zInput").value);
  const contraintes = lireMatrice(document.getElementById("constraintsInput").value);
  const secondsMembres = lireEntree(document.getElementById("bInput").value);
  const typeProbleme = document.getElementById("problemType").value;

  const zoneResultat = document.getElementById("output");
  const zoneTableaux = document.getElementById("tableauContainer");
  zoneTableaux.innerHTML = "";
  zoneResultat.innerHTML = "";

  //affiche les résultats de chaque tableau à chaque iteration
  const resultat = simplexe(
    fonctionObjectif,
    contraintes,
    secondsMembres,
    typeProbleme,
    (tableau, variableEntrante, variableSortante, iteration) => {
      afficherTableau(tableau, variableEntrante, variableSortante, iteration);
    }
  );

  // Afficher le résultat final après les itérations
  setTimeout(() => {
    if (resultat.message) zoneResultat.innerHTML += `<p>${resultat.message}</p>`;
    if (resultat.x)
      zoneResultat.innerHTML += `<p><strong>Solution :</strong> ${resultat.x.map((v, i) => `x${i + 1}=${v.toFixed(2)}`).join(", ")}</p>
                                 <p><strong>Z =</strong> ${resultat.z.toFixed(2)}</p>`;
  }, 200 * resultat.iterations);
}

// === ALGORITHME DU SIMPLEXE ===
function simplexe(c, A, b, objectif = "max", afficherIteration) {
  if (objectif === "min") {
    return { message: "⚠️ Optimum atteint pour la minimisation. L’algorithme n’est pas exécuté." };
  }

  const m = A.length;      // Nombre de contraintes 
  const n = A[0].length;   // Nombre de variables 
  let tableau = [];

  // Construction du tableau initial
  for (let i = 0; i < m; i++) {
    tableau.push([...A[i], ...Array(m).fill(0), b[i]]);
    tableau[i][n + i] = 1; // ajout variable d’écart
  }

  // remplissage de la Ligne de la fonction objectif
  tableau.push([...c, ...Array(m).fill(0), 0]);

  //base est un tableau qui stocke quelle variable est actuellement en base pour chaque ligne.
  let base = [];
  for (let i = 0; i < m; i++) base.push(n + i);

  let iteration = 1;
  let totalIterations = 0;

  while (true) {
    const derniereLigne = tableau[m];
    let variableEntrante = -1 , valeurMax = 0 ;

    // Trouver la variable entrante
    for (let j = 0; j < n + m; j++) {
      if ( derniereLigne[j] > valeurMax ) {
        valeurMax = derniereLigne[j];
        variableEntrante = j;
      }
    }

    if (variableEntrante === -1 || valeurMax <= 0) break;

    // Trouver la variable sortante (test du rapport minimum)
    let variableSortante = -1, rapportMin = Infinity;
    for (let i = 0; i < m; i++) {
      const val = tableau[i][variableEntrante];
      // on s'interesse au plus petit ration positif
      if (val > 0) {
        const rapport = tableau[i][n + m] / val;
        if (rapport < rapportMin) {
          rapportMin = rapport;
          variableSortante = i;
        }
      }
    }

    if (variableSortante === -1) return { message: "⚠️ Problème non borné !" };

    // Calcul du pivot
    const pivot = tableau[variableSortante][variableEntrante];

    // Normalisation de la ligne du pivot
    for (let j = 0; j <= n + m; j++) tableau[variableSortante][j] /= pivot;

    // Met à jour les autres lignes du tableau pour annuler la colonne du pivot(transformations  linéaires)
    for (let i = 0; i <= m; i++) {
      if (i !== variableSortante) {
        const facteur = tableau[i][variableEntrante];
        for (let j = 0; j <= n + m; j++) {
          tableau[i][j] -= facteur * tableau[variableSortante][j];
        }
      }
    }

 
    base[variableSortante] = variableEntrante;

    //fonction qui va afficher le tableau du simplexe dans l’interface.
    //copie profonde du tableau pour éviter que les modifications ultérieures du tableau ne changent l’affichage déjà fait.
    //variableEntrante, variableSortante → informations pour marquer la colonne et la ligne du pivot.
    afficherIteration(JSON.parse(JSON.stringify(tableau)), variableEntrante, variableSortante, iteration++);
    totalIterations++;
  }

  const x = Array(n).fill(0); 
  for (let i = 0; i < m; i++) {
    if (base[i] < n ) x[base[i]] = tableau[i][n + m];
  }

  const z = -tableau[m][n + m];
  return { x, z, message: "✅ Optimum atteint !", iterations: totalIterations };
}

// === AFFICHAGE DES TABLEAUX ===
function afficherTableau(tableau, variableEntrante, variableSortante, iteration) {
  const div = document.createElement("div");
  div.className = "tableau-container";
  div.innerHTML = `<h4 class="iteration-title">🧮 Itération ${iteration} — Variable entrante : x${variableEntrante + 1}, Variable sortante : e${variableSortante + 1}</h4>`;
  const table = document.createElement("table");
  table.classList.add("dynamic-table");

  tableau.forEach((ligne, i) => {
    const tr = document.createElement("tr");
    ligne.forEach((val, j) => {
      const td = document.createElement("td");
      td.textContent = val.toFixed(2);
      if (i === variableSortante && j === variableEntrante) td.classList.add("pivot-cell");
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  div.appendChild(table);
  document.getElementById("tableauContainer").appendChild(div);
}
