document.getElementById("solveBtn").addEventListener("click", solveSimplex);

function parseInput(str) {
  return str.trim().split(/\s+/).map(Number).filter(n => !isNaN(n));
}

function parseMatrix(text) {
  return text
    .trim()
    .split("\n")
    .map(line => parseInput(line));
}

function solveSimplex() {
  const z = parseInput(document.getElementById("zInput").value);
  const A = parseMatrix(document.getElementById("constraintsInput").value);
  const b = parseInput(document.getElementById("bInput").value);
  const objectif = document.getElementById("problemType").value;

  const output = document.getElementById("output");
  const tableauDiv = document.getElementById("tableauContainer");
  tableauDiv.innerHTML = "";

  if (!z.length || !A.length || !b.length || A.length !== b.length) {
    output.innerHTML = `<p class="error">⚠️ Champs vides ou invalides. Vérifiez vos entrées.</p>`;
    return;
  }

  const result = simplex(z, A, b, objectif, (tableau, entering, leaving) => {
    displayTableau(tableau, entering, leaving);
  });

  if (result.message) output.innerHTML = `<p>${result.message}</p>`;
  if (result.x)
    output.innerHTML += `<p><strong>Solution :</strong> ${result.x.map((v, i) => `x${i + 1}=${v.toFixed(2)}`).join(", ")}</p>
                         <p><strong>Z =</strong> ${result.z.toFixed(2)}</p>`;
}

// === ALGORITHME DU SIMPLEXE ===
function simplex(c, A, b, objectif = "max", onIterate) {
  if (objectif === "min") {
    return { message: "⚠️ Optimum atteint pour la minimisation. L’algorithme n’est pas exécuté." };
  }

  const m = A.length;
  const n = A[0].length;

  let tableau = [];
  for (let i = 0; i < m; i++) {
    tableau.push([...A[i], ...Array(m).fill(0), b[i]]);
    tableau[i][n + i] = 1;
  }

  tableau.push([...c, ...Array(m).fill(0), 0]);
  let base = [];
  for (let i = 0; i < m; i++) base.push(n + i);

  let iteration = 1;
  while (true) {
    const lastRow = tableau[m];
    let entering = -1, maxVal = 0;

    for (let j = 0; j < n + m; j++) {
      if (lastRow[j] > maxVal) {
        maxVal = lastRow[j];
        entering = j;
      }
    }

    if (entering === -1 || maxVal <= 0) break;

    let leaving = -1, minRatio = Infinity;
    for (let i = 0; i < m; i++) {
      const val = tableau[i][entering];
      if (val > 0) {
        const ratio = tableau[i][n + m] / val;
        if (ratio < minRatio) {
          minRatio = ratio;
          leaving = i;
        }
      }
    }

    if (leaving === -1) return { message: "⚠️ Problème non borné !" };

    const pivot = tableau[leaving][entering];
    for (let j = 0; j <= n + m; j++) tableau[leaving][j] /= pivot;

    for (let i = 0; i <= m; i++) {
      if (i !== leaving) {
        const factor = tableau[i][entering];
        for (let j = 0; j <= n + m; j++) {
          tableau[i][j] -= factor * tableau[leaving][j];
        }
      }
    }

    base[leaving] = entering;
    onIterate(tableau, entering, leaving, iteration++);
  }

  const x = Array(n).fill(0);
  for (let i = 0; i < m; i++) {
    if (base[i] < n) x[base[i]] = tableau[i][n + m];
  }

  const z = -tableau[m][n + m];
  return { x, z, message: "✅ Optimum atteint !" };
}

// === AFFICHAGE DES TABLEAUX ===
function displayTableau(tableau, entering, leaving, iteration) {
  const div = document.createElement("div");
  div.className = "tableau-container";
  div.innerHTML = `<h4>Itération ${iteration} — Entrante: x${entering + 1}, Sortante: Ligne ${leaving + 1}</h4>`;
  const table = document.createElement("table");

  tableau.forEach((row, i) => {
    const tr = document.createElement("tr");
    row.forEach((val, j) => {
      const td = document.createElement("td");
      td.textContent = val.toFixed(2);
      if (i === leaving && j === entering) td.classList.add("pivot-cell");
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  div.appendChild(table);
  document.getElementById("tableauContainer").appendChild(div);
}
