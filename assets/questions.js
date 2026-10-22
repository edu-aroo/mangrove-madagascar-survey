/* =====================================================================
   QUESTIONS — derived from Questionnaire_mangrove_Fidele.xlsx
   Types: text, email, tel, number, year, date, textarea, radio, checkbox,
          likert, top3, file
   Fields: id (column name in Google Sheets), n (question number),
           req (required), opts (options), other (adds "Autre" + precision),
           specify (options that reveal a precision field), showIf, hint, unit
   Stored columns: multi-choice answers are joined with " | ",
           precisions in <id>_precision, top3 in <id>_1.._3
   ===================================================================== */
(function () {
  const L5 = (a) => a.map((t, i) => `${i + 1} = ${t}`);
  const MANG_TYPES = ["Dense", "Dégradée", "Restaurée", "Menacée", "Autre"];
  const YES_NO_SOME = ["Oui", "Non", "Certains seulement"];
  const ADOPT = ["Oui", "Non", "Peut-être", "Sous condition"];

  /* ---------- Questions asked ONCE per respondent ---------- */
  const general = [
    {
      key: "A", title: "Identification du répondant", short: "Identification",
      questions: [
        { id: "q1", n: 1, type: "text", req: true, label: "Nom et prénom(s) du répondant" },
        { id: "q2", n: 2, type: "text", req: true, label: "Fonction / poste du répondant" },
        { id: "q3", n: 3, type: "text", req: true, label: "Organisation / institution" },
        { id: "q4", n: 4, type: "email", label: "Adresse e-mail professionnelle" },
        { id: "q5", n: 5, type: "tel", label: "Numéro de téléphone professionnel" }
      ]
    },
    {
      key: "B", title: "Informations sur l’organisation", short: "Organisation",
      questions: [
        { id: "q6", n: 6, type: "radio", req: true, label: "Type d’organisation / institution",
          opts: ["Institution publique", "ONG", "Association", "Institution de recherche / université",
                 "Projet / programme", "Entreprise / secteur privé", "Gestionnaire d’AMP/LMMA", "Autre"],
          specify: ["Gestionnaire d’AMP/LMMA", "Autre"],
          specifyLabel: "Précisez (pour une AMP : catégorie 1, 2, 3…)" },
        { id: "q7", n: 7, type: "checkbox", req: true, other: true, label: "Domaine(s) d’intervention de votre organisation",
          opts: ["Recherche", "Conservation", "Gestion d’AMP/LMMA", "Suivi écologique", "Pêche", "Restauration", "Sensibilisation", "Autre"] },
        { id: "q8", n: 8, type: "textarea", req: true, label: "Zone(s) d’intervention géographique(s) concernant les mangroves" },
        { id: "q9", n: 9, type: "year", label: "Depuis quelle année votre organisation intervient-elle dans le suivi, la recherche ou la conservation des mangroves ?" },
        { id: "q10", n: 10, type: "number", unit: "ha", label: "Quelle est la superficie de mangrove que votre institution suit et/ou gère ?" }
      ]
    },
    {
      key: "CD", title: "Suivi et restauration des mangroves", short: "Suivi & restauration",
      questions: [
        { sub: "Pratiques de suivi des mangroves" },
        { id: "q11", n: 11, type: "radio", req: true, label: "Votre organisation réalise-t-elle actuellement un suivi écologique des mangroves à Madagascar ?",
          opts: ["Oui", "Non", "Auparavant, mais plus actuellement"] },
        { id: "q12", n: 12, type: "number", req: true, min: 1, max: 10,
          label: "Combien de méthodes ou protocoles de suivi des mangroves utilisez-vous ou avez-vous utilisés ?",
          hint: "Une série de questions s’ouvrira pour chaque méthode (étapes « Méthode 1 », « Méthode 2 »…).",
          showIf: { q: "q11", in: ["Oui", "Auparavant, mais plus actuellement"] } },
        { sub: "Suivi participatif et restauration" },
        { id: "q17", n: 17, type: "radio", label: "Faites-vous du suivi écologique participatif ?", opts: ["Oui", "Non", "Parfois"] },
        { id: "q18", n: 18, type: "textarea", label: "Si oui, quelle méthode ou quel protocole utilisez-vous pour ce suivi ? Quels sont les indices écologiques mesurés ?",
          showIf: { q: "q17", in: ["Oui", "Parfois"] } },
        { id: "q19", n: 19, type: "radio", req: true, label: "Votre organisation réalise-t-elle actuellement une restauration des mangroves à Madagascar ?",
          opts: ["Oui", "Non", "Autrefois", "Parfois"] },
        { id: "q20", n: 20, type: "textarea", req: true, label: "Quels sont les noms exacts des méthodes / protocoles utilisés pour la restauration des mangroves ?",
          showIf: { q: "q19", in: ["Oui", "Autrefois", "Parfois"] } },
        { id: "q21", n: 21, type: "checkbox", req: true, other: true, label: "Sur quels types de mangroves utilisez-vous ces méthodes de restauration ?",
          opts: MANG_TYPES, showIf: { q: "q19", in: ["Oui", "Autrefois", "Parfois"] } },
        { id: "q22", n: 22, type: "number", req: true, unit: "ha", label: "Quelle est la superficie de mangrove que votre institution restaure ?",
          showIf: { q: "q19", in: ["Oui", "Autrefois", "Parfois"] } }
      ]
    }
  ];

  /* ---------- Questions REPEATED for each monitoring method ---------- */
  const method = [
    { sub: "Description de la méthode" },
    { id: "q13", n: 13, type: "radio", req: true, label: "Quelle est cette méthode / ce protocole ?",
      opts: ["Inventaire écologique par placette", "Suivi de la restauration", "Suivi de la régénération naturelle",
             "Transect–quadrat", "Quadrat / points d’observation", "Cartographie SIG / télédétection", "Drone",
             "Méthode institutionnelle ou projet spécifique", "Autre"],
      specify: ["Méthode institutionnelle ou projet spécifique", "Autre"], specifyLabel: "Nom exact de la méthode / du protocole" },
    { id: "q14", n: 14, type: "checkbox", req: true, label: "Statut de cette méthode",
      opts: ["Actuellement utilisée", "Utilisée auparavant", "Protocole adapté", "Protocole interne"] },
    { id: "q15", n: 15, type: "radio", req: true, label: "La méthode est-elle basée sur un protocole standardisé publié ou reconnu ?",
      opts: ["Oui, sans modification", "Oui, mais adaptée", "Non, protocole interne", "Ne sait pas"] },
    { id: "q16", n: 16, type: "checkbox", req: true, other: true, label: "Sur quels types de mangroves utilisez-vous cette méthode ?", opts: MANG_TYPES },

    { sub: "Objectifs du suivi" },
    { id: "q23", n: 23, type: "checkbox", req: true, other: true, label: "Quels sont les principaux objectifs du suivi réalisé avec cette méthode ?",
      opts: ["Évaluer l’état / la santé des mangroves", "Suivre les changements dans le temps", "Cartographier la distribution / superficie",
             "Suivre les pressions et menaces", "Évaluer la biodiversité / faune associée", "Suivre la restauration",
             "Évaluer la biomasse / carbone", "Recherche scientifique", "Gestion d’AMP/LMMA", "Autre"] },
    { id: "q24", n: 24, type: "textarea", label: "Quelles questions écologiques permet-elle de traiter ?" },

    { sub: "Indicateurs écologiques" },
    { id: "q25", n: 25, type: "checkbox", req: true, other: true, label: "Quels indicateurs écologiques sont mesurés avec cette méthode ?",
      opts: ["Pourcentage de couverture", "Composition spécifique", "Densité des pousses", "Richesse spécifique", "Diversité",
             "Hauteur de la canopée", "Biomasse", "Mortalité / état des plants", "Étendue / superficie des mangroves",
             "Distribution spatiale", "Caractéristiques du substrat", "Matière organique", "Carbone organique", "Turbidité",
             "Température", "Salinité", "Profondeur", "Pressions anthropiques", "Faune associée", "Autre"] },
    { id: "q26", n: 26, type: "textarea", label: "Parmi les indicateurs sélectionnés, lesquels sont les plus importants pour votre objectif de suivi ?" },
    { id: "q27", n: 27, type: "textarea", label: "Certains indicateurs sont-ils difficiles ou coûteux à mesurer ? Si oui, lesquels et pourquoi ?" },

    { sub: "Protocole d’échantillonnage" },
    { id: "q28", n: 28, type: "checkbox", req: true, other: true, label: "Quel est le dispositif d’échantillonnage utilisé ?",
      opts: ["Transects", "Quadrats", "Points d’observation", "Placettes / stations permanentes", "Relevés GPS", "Photographies / vidéo",
             "Télédétection satellite", "Drone", "Prélèvements de laboratoire", "Autre"] },
    { id: "q29", n: 29, type: "text", label: "Quelle est la taille ou la surface de ces dispositifs ?", hint: "Indiquez l’unité (ex. 10 m × 10 m, 100 m²)." },
    { id: "q30", n: 30, type: "radio", req: true, label: "Les sites / stations de suivi sont-ils permanents ?", opts: YES_NO_SOME },
    { id: "q31", n: 31, type: "radio", req: true, label: "Les sites / stations de suivi sont-ils dans une AMP ?", opts: YES_NO_SOME },
    { id: "q32", n: 32, type: "textarea", label: "Si oui, pourquoi ?", showIf: { q: "q31", in: ["Oui", "Certains seulement"] } },
    { id: "q33", n: 33, type: "checkbox", req: true, label: "Dans quelle(s) catégorie(s) de zonage la méthode est-elle le plus souvent utilisée ?",
      opts: ["Zone exploitée", "Zone à accès réglementé", "Zone de restauration", "Zone de conservation", "Zone à restriction forte",
             "No-Take Zone / protection intégrale", "Zone difficilement accessible"] },
    { id: "q34", n: 34, type: "textarea", label: "Pourquoi dans ces zones ?", showIf: { q: "q33", any: true } },
    { id: "q35", n: 35, type: "number", req: true, unit: "ha", label: "Quelle est la surface de la zone de suivi ?" },
    { id: "q36", n: 36, type: "textarea", label: "Comment les sites sont-ils sélectionnés ?" },
    { id: "q37", n: 37, type: "number", label: "Combien de stations / sites sont généralement suivis par campagne ?" },
    { id: "q38", n: 38, type: "text", label: "Quelle est la durée moyenne d’une campagne de terrain pour cette méthode ?", hint: "Préciser en heures / jours si possible." },
    { id: "q39", n: 39, type: "text", label: "Quelle est la durée moyenne nécessaire pour réaliser un relevé sur une station / un site ?", hint: "Préciser en minutes / heures." },

    { sub: "Fréquence et temporalité" },
    { id: "q40", n: 40, type: "text", label: "À quelle période les données sont-elles collectées ?" },
    { id: "q41", n: 41, type: "radio", req: true, other: true, label: "À quelle fréquence les données sont-elles collectées ?",
      opts: ["Hebdomadaire", "Mensuelle", "Trimestrielle", "Semestrielle", "Annuelle", "Tous les 2 à 5 ans", "Ponctuelle / selon projet", "Autre"] },
    { id: "q42", n: 42, type: "radio", req: true, label: "La fréquence de suivi est-elle la même toute l’année ?", opts: ["Oui", "Non"] },
    { id: "q43", n: 43, type: "textarea", label: "Si non, quelles périodes / saisons sont privilégiées et pourquoi ?", showIf: { q: "q42", in: ["Non"] } },

    { sub: "Matériel, ressources et compétences" },
    { id: "q44", n: 44, type: "checkbox", req: true, other: true, label: "Quels équipements sont nécessaires ?",
      opts: ["GPS", "Appareil photo / caméra", "Drone", "Quadrat", "Transect", "Réfractomètre", "Thermomètre", "Ordinateur", "Logiciel SIG", "Autre"] },
    { id: "q45", n: 45, type: "radio", req: true, label: "Quel est le niveau de compétence / formation nécessaire pour appliquer correctement cette méthode ?",
      opts: ["Faible", "Moyen", "Élevé", "Très élevé"] },
    { id: "q46", n: 46, type: "number", label: "Combien de personnes participent généralement à une campagne de suivi avec cette méthode ?" },
    { id: "q47", n: 47, type: "radio", req: true, label: "Une formation spécifique est-elle nécessaire ?", opts: ["Oui", "Non"] },
    { id: "q48", n: 48, type: "textarea", label: "Si oui, quel type de formation est nécessaire ?", showIf: { q: "q47", in: ["Oui"] } },
    { id: "q49", n: 49, type: "text", label: "Quel est le budget alloué pour chaque campagne ?", hint: "Fourchette de prix (ex. 5–10 M Ar, 10–15 M Ar) ou autre." },

    { sub: "Données et gestion" },
    { id: "q50", n: 50, type: "checkbox", other: true, label: "Comment les données sont-elles enregistrées sur le terrain ?",
      opts: ["Fiches papier", "Excel", "KoboToolbox", "Application mobile", "GPS", "Photographies / vidéos", "Autre"] },
    { id: "q51", n: 51, type: "checkbox", other: true, label: "Où les données sont-elles stockées après la collecte ?",
      opts: ["Excel", "Drive", "KoboToolbox", "Base de données", "Serveur institutionnel", "Plateforme en ligne", "Documents papier", "Autre"] },
    { id: "q52", n: 52, type: "radio", req: true, label: "Les données issues de cette méthode sont-elles facilement comparables entre sites et entre années ?",
      opts: ["Oui", "Partiellement", "Non", "Ne sait pas"] },
    { id: "q53", n: 53, type: "radio", label: "Les données sont-elles partagées avec d’autres institutions / partenaires ?", opts: ["Oui", "Partiellement", "Non"] },

    { sub: "Performance de la méthode", note: "1 = valeur la plus basse, 5 = valeur la plus haute." },
    { id: "q54", n: 54, type: "likert", req: true, label: "Comment évaluez-vous la précision des données produites par cette méthode ?",
      opts: L5(["Très faible", "Faible", "Moyenne", "Élevée", "Très élevée"]) },
    { id: "q55", n: 55, type: "likert", req: true, label: "Dans quelle mesure cette méthode permet-elle de détecter les changements à court terme ?",
      opts: L5(["Très faible", "Faible", "Moyenne", "Élevée", "Très élevée"]) },
    { id: "q56", n: 56, type: "likert", req: true, label: "Dans quelle mesure cette méthode permet-elle de détecter les changements à long terme ?",
      opts: L5(["Très faible", "Faible", "Moyenne", "Élevée", "Très élevée"]) },
    { id: "q57", n: 57, type: "likert", req: true, label: "Comment évaluez-vous la facilité de mise en œuvre de cette méthode ?",
      opts: L5(["Très difficile", "Difficile", "Moyenne", "Facile", "Très facile"]) },
    { id: "q58", n: 58, type: "likert", req: true, label: "Comment évaluez-vous le coût global de mise en œuvre ?",
      opts: L5(["Très faible", "Faible", "Moyen", "Élevé", "Très élevé"]) },
    { id: "q59", n: 59, type: "likert", req: true, label: "Dans quelle mesure cette méthode est-elle adaptée aux réalités et capacités locales à Madagascar ?",
      opts: L5(["Pas du tout adaptée", "Peu adaptée", "Moyennement adaptée", "Bien adaptée", "Très bien adaptée"]) },
    { id: "q60", n: 60, type: "likert", label: "Dans quelle mesure les résultats sont-ils reproductibles entre différents observateurs / équipes ?",
      opts: L5(["Très faible", "Faible", "Moyenne", "Élevée", "Très élevée"]) },

    { sub: "Contraintes et limites" },
    { id: "q61", n: 61, type: "checkbox", req: true, other: true, label: "Quelles sont les principales contraintes rencontrées lors de la mise en œuvre de cette méthode ?",
      opts: ["Accès aux sites", "Équipement insuffisant", "Coût", "Manque de personnel", "Manque de compétences / formation", "Temps nécessaire",
             "Difficulté d’analyse des données", "Difficulté de stockage / gestion des données", "Autre"] },
    { id: "q62", n: 62, type: "top3", from: "q61", req: true, label: "Parmi ces contraintes, quelles sont les trois plus importantes ?",
      hint: "Classez-les à partir des contraintes cochées ci-dessus (1 = la plus importante)." },
    { id: "q63", n: 63, type: "textarea", req: true, label: "Quelles sont, selon vous, les principales limites scientifiques ou méthodologiques de cette méthode ?" },

    { sub: "Forces, faiblesses, opportunités et menaces (FFOM)" },
    { id: "q64", n: 64, type: "textarea", req: true, label: "Quelles sont les principales FORCES de cette méthode ?" },
    { id: "q65", n: 65, type: "checkbox", req: true, other: true, label: "Quelles sont les principales FAIBLESSES de cette méthode ?",
      opts: ["Coût élevé", "Besoin d’équipements spécifiques", "Équipements difficiles à obtenir à Madagascar", "Besoin de personnel spécialisé",
             "Besoin d’une formation spécifique", "Méthode longue à mettre en œuvre", "Méthode difficile à standardiser", "Méthode difficile à reproduire",
             "Forte dépendance aux conditions météorologiques / marines", "Difficultés d’accès aux sites", "Faible couverture spatiale",
             "Faible fréquence de suivi", "Difficultés d’identification des espèces", "Données difficiles à traiter / analyser",
             "Données difficiles à comparer entre sites", "Méthode peu adaptée à certains types de mangroves", "Autre"] },
    { id: "q66", n: 66, type: "checkbox", req: true, other: true, label: "Quelles sont les principales OPPORTUNITÉS pour améliorer ou développer cette méthode à Madagascar ?",
      opts: ["Possibilité d’intégrer la méthode dans un protocole national", "Possibilité d’harmoniser les méthodes existantes",
             "Possibilité de former davantage les acteurs nationaux", "Possibilité de renforcer les capacités des institutions",
             "Développement de partenariats entre institutions", "Collaboration avec les ONG et projets", "Collaboration avec les communautés locales",
             "Développement d’un réseau national de suivi des mangroves", "Mise en place de stations permanentes", "Développement d’une base de données nationale",
             "Utilisation des outils SIG et de télédétection", "Développement d’outils numériques de collecte des données", "Possibilité de suivi à long terme",
             "Possibilité de comparaison des données entre régions", "Possibilité d’intégration dans les programmes de conservation",
             "Possibilité de mobiliser des financements pour le suivi écologique", "Autre"] },
    { id: "q67", n: 67, type: "checkbox", req: true, other: true, label: "Quelles sont les principales MENACES pouvant limiter son utilisation ou sa pérennisation ?",
      opts: ["Manque de financement à long terme", "Arrêt des projets après leur période de financement", "Manque de personnel qualifié",
             "Rotation du personnel formé", "Manque de matériel / équipements", "Coût élevé des équipements", "Difficultés logistiques et d’accès aux sites",
             "Difficultés liées aux conditions météorologiques ou marines", "Absence de coordination entre les institutions",
             "Absence de protocole national harmonisé", "Utilisation de méthodes différentes entre les acteurs", "Manque de continuité des séries de données",
             "Perte ou mauvaise gestion des données", "Faible appropriation par les acteurs locaux", "Difficulté d’intégration des données dans une base nationale",
             "Pressions anthropiques importantes sur les mangroves", "Dégradation / disparition des sites de suivi", "Autre"] },

    { sub: "Intégration dans un protocole national" },
    { id: "q68", n: 68, type: "radio", req: true, label: "Selon vous, cette méthode pourrait-elle être intégrée dans un protocole national harmonisé de suivi des mangroves ?",
      opts: ["Oui", "Oui, avec adaptations", "Non", "Ne sait pas"] },
    { id: "q69", n: 69, type: "textarea", label: "Quels éléments de cette méthode devraient absolument être conservés dans un futur protocole national ?" },
    { id: "q70", n: 70, type: "textarea", label: "Quelles adaptations seraient nécessaires pour permettre son utilisation à l’échelle nationale ?" },

    { sub: "Photos et référence de la méthode" },
    { id: "q79", n: 79, type: "file", kind: "image", req: true, label: "Téléversez des photos illustrant la méthode / le protocole de suivi",
      hint: "JPG/PNG — photos du site, du dispositif de suivi, du matériel ou de la réalisation du protocole. Les photos sont réduites automatiquement avant l’envoi." },
    { id: "q80", n: 80, type: "text", req: true, label: "Nom et prénom(s) du photographe" },
    { id: "q81", n: 81, type: "text", req: true, label: "Localisation de la prise de ces photos", hint: "Région / district / commune / site ou station de suivi." },
    { id: "q82", n: 82, type: "date", req: true, label: "Date de la prise de vue" },
    { id: "q83", n: 83, type: "file", kind: "doc", req: true, label: "Référence bibliographique de la méthode / du protocole", hint: "PDF ou autre document." }
  ];

  /* ---------- Final section (once) ---------- */
  const final = {
    key: "N", title: "Harmonisation nationale", short: "Harmonisation",
    questions: [
      { id: "q71", n: 71, type: "radio", req: true, label: "Pensez-vous qu’une harmonisation nationale des protocoles est nécessaire ?", opts: ["Oui", "Non"] },
      { id: "q72", n: 72, type: "radio", req: true, label: "Seriez-vous prêt(e) à adopter un protocole national harmonisé ?", opts: ADOPT },
      { id: "q73", n: 73, type: "checkbox", other: true, label: "Quels critères sont importants pour un protocole national ?",
        opts: ["Simplicité", "Coût abordable", "Reproductibilité", "Adaptabilité locale", "Compatibilité internationale", "Autre"] },
      { id: "q74", n: 74, type: "textarea", label: "Quelles méthodes recommandez-vous pour un futur protocole national ?" },
      { id: "q75", n: 75, type: "checkbox", req: true, other: true, label: "Quels indicateurs devraient, selon vous, être suivis de manière commune par tous les acteurs à Madagascar ?",
        opts: ["Couverture", "Composition spécifique", "Densité", "Hauteur de canopée", "Biomasse", "Superficie / distribution", "Pressions",
               "Substrat", "Faune associée", "Paramètres environnementaux", "Autre"] },
      { id: "q76", n: 76, type: "checkbox", req: true, other: true, label: "Quels sont les principaux besoins pour améliorer le suivi des mangroves à Madagascar ?",
        opts: ["Formation", "Matériel", "Financement", "Protocoles harmonisés", "Base de données nationale", "Coordination entre acteurs",
               "Appui scientifique", "Cartographie / SIG", "Laboratoire", "Autre"] },
      { id: "q77", n: 77, type: "textarea", label: "Avez-vous d’autres recommandations concernant la mise en place d’un système national harmonisé de suivi écologique des mangroves ?" },
      { id: "q78", n: 78, type: "radio", label: "Souhaitez-vous participer à l’élaboration du protocole national ?", opts: ADOPT }
    ]
  };

  window.SURVEY = { general, method, final };
})();
