import './style.css';
import 'bootswatch/dist/brite/bootstrap.min.css';
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
window.bootstrap = bootstrap; // Make it globally available just in case
import { $typst, TypstSnippet } from '@myriaddreamin/typst.ts/dist/esm/contrib/all-in-one-lite.bundle.js';

export async function setupTypst() {
  $typst.setCompilerInitOptions({
    getModule: () => 'https://cdn.jsdelivr.net/npm/@myriaddreamin/typst-ts-web-compiler@0.7.0/pkg/typst_ts_web_compiler_bg.wasm'
  });
}

async function init() {
  await setupTypst();
  
  const fontUrls = [
    'fonts/arial.ttf',
    'fonts/arialbd.ttf',
    'fonts/ariali.ttf',
    'fonts/arialbi.ttf',
    'fonts/NotoSansSymbols-Regular.ttf',
    'fonts/NotoSansSymbols2-Regular.ttf'
  ].map(p => import.meta.env.BASE_URL + p);
  
  const fontBuffers = (await Promise.all(
    fontUrls.map(path => fetch(path).then(r => {
      if (!r.ok) throw new Error('Font not found: ' + path);
      return r.arrayBuffer();
    }).catch(e => {
      console.warn('Could not load font', e);
      return null;
    }))
  )).filter(Boolean).map(buf => new Uint8Array(buf));

  if (fontBuffers.length) {
    $typst.use(TypstSnippet.preloadFonts(fontBuffers));
  }

  const templateRes = await fetch(import.meta.env.BASE_URL + 'template.typ');
  const templateText = await templateRes.text();
  $typst.addSource('/template.typ', templateText);

  const logoRes = await fetch(import.meta.env.BASE_URL + 'assets/logo.png');
  if (logoRes.ok) {
    const logoBuffer = await logoRes.arrayBuffer();
    $typst.mapShadow('/assets/logo.png', new Uint8Array(logoBuffer));
  } else {
    console.warn('Could not load logo.png');
  }
}

init().catch(console.error);

// Add dynamic author
document.getElementById('add-auteur-btn').addEventListener('click', () => {
  const container = document.getElementById('auteurs-container');
  const newRow = document.createElement('div');
  newRow.className = 'auteur-row row mb-3 align-items-end';
  newRow.innerHTML = `
    <div class="col-md-4">
      <label class="form-label fw-bold">Prénom<span class="required-asterisk">*</span></label>
      <input type="text" class="form-control prenom-input" required>
      <div class="invalid-feedback">Requis.</div>
    </div>
    <div class="col-md-4">
      <label class="form-label fw-bold">Nom<span class="required-asterisk">*</span></label>
      <input type="text" class="form-control nom-input" required>
      <div class="invalid-feedback">Requis.</div>
    </div>
    <div class="col-md-3">
      <label class="form-label fw-bold">Classe<span class="required-asterisk">*</span></label>
      <input type="text" class="form-control classe-input" required>
      <div class="invalid-feedback">Requis.</div>
    </div>
    <div class="col-md-1">
      <button type="button" class="btn btn-outline-danger btn-sm remove-auteur-btn">X</button>
    </div>
  `;
  container.appendChild(newRow);

  newRow.querySelector('.remove-auteur-btn').addEventListener('click', () => {
    container.removeChild(newRow);
  });
});

document.getElementById('tm-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const form = e.target;
  
  // Validation check
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    
    // Find all invalid inputs and open their parent accordion if collapsed
    const invalidInputs = form.querySelectorAll(':invalid');
    invalidInputs.forEach(input => {
      const collapseEl = input.closest('.accordion-collapse');
      if (collapseEl && !collapseEl.classList.contains('show')) {
        const bsCollapse = new bootstrap.Collapse(collapseEl, {
          toggle: false
        });
        bsCollapse.show();
      }
    });
    return; // Stop generation if invalid
  }
  
  const generateBtn = document.getElementById('generate-btn');
  generateBtn.disabled = true;
  generateBtn.textContent = 'Génération en cours...';

  try {
    const data = getFormData();
    const jsonStr = JSON.stringify(data);
    
    // Afficher le JSON généré dans la console de Chrome pour pouvoir le vérifier
    // console.log("JSON généré à la volée :", jsonStr);
    
    $typst.mapShadow('/data.json', new TextEncoder().encode(jsonStr));

    const pdfBytes = await $typst.pdf({ mainFilePath: '/template.typ' });

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    // Open in new tab
    window.open(url, '_blank');
    
  } catch (error) {
    console.error('Erreur lors de la génération', error);
    alert('Erreur lors de la génération: ' + error.message);
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = 'Générer le PDF';
  }
});

// Masquer les sections non-pertinentes pour l'évaluation finale
document.querySelectorAll('input[name="evaluationType"]').forEach(radio => {
  radio.addEventListener('change', (e) => {
    const isFinal = e.target.value === 'Finale';
    
    // Accordions
    const consignesItem = document.getElementById('accordion-item-consignes');
    const travailItem = document.getElementById('accordion-item-travail');
    if (consignesItem) consignesItem.style.display = isFinal ? 'none' : 'block';
    if (travailItem) travailItem.style.display = isFinal ? 'none' : 'block';
    
    // Champs de texte
    const themeContainer = document.getElementById('theme-container');
    const expertContainer = document.getElementById('expert-container');
    const noteContainer = document.getElementById('note-container');
    const titreContainer = document.getElementById('titre-container');
    
    if (themeContainer) themeContainer.style.display = isFinal ? 'none' : 'block';
    if (expertContainer) expertContainer.style.display = isFinal ? 'block' : 'none';
    if (noteContainer) noteContainer.style.display = isFinal ? 'block' : 'none';
    
    // Ajustement de la largeur du titre
    if (titreContainer) {
      if (isFinal) {
        titreContainer.className = 'col-md-9';
      } else {
        titreContainer.className = 'col-12';
      }
    }
  });
});

// --- Utilitaires de Sauvegarde ---

function getFormData() {
  const auteurs = [];
  document.querySelectorAll('.auteur-row').forEach(row => {
    auteurs.push({
      prenom: row.querySelector('.prenom-input').value,
      nom: row.querySelector('.nom-input').value,
      classe: row.querySelector('.classe-input').value,
    });
  });

  return {
    date: document.getElementById('date').value,
    evaluationType: document.querySelector('input[name="evaluationType"]:checked')?.value || "Première",
    auteurs: auteurs,
    theme: document.getElementById('theme').value,
    repondant: document.getElementById('repondant').value,
    expert: document.getElementById('expert').value || "",
    titre: document.getElementById('titre').value || "",
    note: document.getElementById('note').value || "",
    travail: document.getElementById('travail').value || "",
    recherches: document.getElementById('recherches').value || "",
    contenu: document.getElementById('contenu').value || "",
    structure: document.getElementById('structure').value || "",
    expression: document.getElementById('expression').value || "",
    presentation: document.getElementById('presentation').value || "",
    sensCritique: document.getElementById('sensCritique').value || "",
    consignes: document.getElementById('consignes').value || "",
    remarques: document.getElementById('remarques').value || "",
  };
}

function setFormData(data) {
  if (!data) return;
  
  if (data.date) document.getElementById('date').value = data.date;
  if (data.evaluationType) {
    const radio = document.querySelector(`input[name="evaluationType"][value="${data.evaluationType}"]`);
    if (radio) {
      radio.checked = true;
      radio.dispatchEvent(new Event('change')); // Trigger visibility logic
    }
  }
  
  if (data.theme !== undefined) document.getElementById('theme').value = data.theme;
  if (data.repondant !== undefined) document.getElementById('repondant').value = data.repondant;
  if (data.expert !== undefined) document.getElementById('expert').value = data.expert;
  if (data.titre !== undefined) document.getElementById('titre').value = data.titre;
  if (data.note !== undefined) document.getElementById('note').value = data.note;
  if (data.travail !== undefined) document.getElementById('travail').value = data.travail;
  if (data.recherches !== undefined) document.getElementById('recherches').value = data.recherches;
  if (data.contenu !== undefined) document.getElementById('contenu').value = data.contenu;
  if (data.structure !== undefined) document.getElementById('structure').value = data.structure;
  if (data.expression !== undefined) document.getElementById('expression').value = data.expression;
  if (data.presentation !== undefined) document.getElementById('presentation').value = data.presentation;
  if (data.sensCritique !== undefined) document.getElementById('sensCritique').value = data.sensCritique;
  if (data.consignes !== undefined) document.getElementById('consignes').value = data.consignes;
  if (data.remarques !== undefined) document.getElementById('remarques').value = data.remarques;

  // Restaurer les auteurs
  if (data.auteurs && data.auteurs.length > 0) {
    const container = document.getElementById('auteurs-container');
    container.innerHTML = ''; // Nettoyer
    
    data.auteurs.forEach((auteur, index) => {
      const isFirst = index === 0;
      const newRow = document.createElement('div');
      newRow.className = 'auteur-row row mb-3 align-items-end';
      newRow.innerHTML = `
        <div class="col-md-4">
          <label class="form-label fw-bold">Prénom<span class="required-asterisk">*</span></label>
          <input type="text" class="form-control prenom-input" required value="${auteur.prenom || ''}">
          <div class="invalid-feedback">Requis.</div>
        </div>
        <div class="col-md-4">
          <label class="form-label fw-bold">Nom<span class="required-asterisk">*</span></label>
          <input type="text" class="form-control nom-input" required value="${auteur.nom || ''}">
          <div class="invalid-feedback">Requis.</div>
        </div>
        <div class="col-md-3">
          <label class="form-label fw-bold">Classe<span class="required-asterisk">*</span></label>
          <input type="text" class="form-control classe-input" required value="${auteur.classe || ''}">
          <div class="invalid-feedback">Requis.</div>
        </div>
        <div class="col-md-1">
          ${!isFirst ? '<button type="button" class="btn btn-outline-danger btn-sm remove-auteur-btn">X</button>' : ''}
        </div>
      `;
      container.appendChild(newRow);

      if (!isFirst) {
        newRow.querySelector('.remove-auteur-btn').addEventListener('click', () => {
          container.removeChild(newRow);
          saveToLocal();
        });
      }
    });
  }
}

let saveTimeout;
function saveToLocal() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const data = getFormData();
    localStorage.setItem('tm-form-autosave', JSON.stringify(data));
    
    const toastEl = document.getElementById('saveToast');
    if (toastEl) {
      // bootstrap is available globally since we did window.bootstrap = bootstrap
      const toast = window.bootstrap.Toast.getOrCreateInstance(toastEl);
      toast.show();
    }
  }, 1000); // 1 seconde de délai (debounce)
}

// Auto-sauvegarde à la modification
document.getElementById('tm-form').addEventListener('input', () => {
  saveToLocal();
});
document.getElementById('tm-form').addEventListener('change', () => {
  saveToLocal();
});

// Chargement initial
window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('tm-form-autosave');
  if (saved) {
    try {
      setFormData(JSON.parse(saved));
    } catch (e) {
      console.error('Erreur lors du chargement de la sauvegarde automatique', e);
    }
  }
});

// Export JSON
document.getElementById('export-btn')?.addEventListener('click', () => {
  const data = getFormData();
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  
  const dateStr = data.date || new Date().toISOString().split('T')[0];
  const titreClean = (data.titre || 'rapport').replace(/[^a-z0-9]/gi, '_').toLowerCase();
  a.href = url;
  a.download = `tm_${dateStr}_${titreClean}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// Import JSON
document.getElementById('import-file')?.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const data = JSON.parse(event.target.result);
      setFormData(data);
      saveToLocal();
      alert('Sauvegarde chargée avec succès !');
    } catch (err) {
      alert('Erreur lors de la lecture du fichier JSON.');
    }
  };
  reader.readAsText(file);
  e.target.value = ''; // Permet de re-sélectionner le même fichier si besoin
});
