/* =====================================================================
   CONFIGURATION DE L'ENQUÊTE « SUIVI ET RESTAURATION DES MANGROVES » — fichier unique à modifier
   ---------------------------------------------------------------------
   • META     : titre, textes d'accueil, contact, logos, photos, URL Apps Script
   • PHOTOS   : photos du bandeau, de l'accueil et des sections (avec crédits)
   • SECTIONS : titres des sections (A–P)
   • LOOP     : boucle « par méthode » (Q14–Q16 et Q23–Q70 répétées pour chaque méthode cochée en Q13)
   • STEPS    : étapes du formulaire et questions. Les étapes marquées
                perMethod: true sont répétées pour chaque méthode.
   Les identifiants (id) deviennent les noms de colonnes dans Google
   Sheets et les noms de variables dans R : ne pas les modifier une fois
   la collecte lancée.

   Types : text, email, tel, textarea, number, year, date, radio, checkbox, scale, rank, file
   Options :
     other: true   → champ texte quand « Autre » ou « (préciser) » est coché (id_autre)
     groups: [...] → options présentées par groupes (choix multiple)
     unit: 'ha'    → unité affichée à côté d'un nombre ; units: [...] → menu d'unités (id_unite)
     detail: {...} → champ texte facultatif sous la question (id_detail)
     rank          → classement des réponses d'une question à choix multiple (rankFrom, ranks)
     file          → accept: extensions autorisées, maxFiles, maxMB
     showIf        → { q:'q011', eq:'Oui' } | { q:'q031', in:[...] } | { q:'q079', filled:true } |
                     { q:'q017', starts:'Oui' } | { q:'q015', ne:'...' } | { all:[cond1, cond2] }
   ===================================================================== */

const SURVEY = {
  META: {
  "version": "1.0",
  "title": "Enquête nationale sur le suivi et la restauration des mangroves à Madagascar",
  "subtitle": "Inventaire des méthodes de suivi écologique et de restauration des mangroves, de leurs moyens et de leurs limites, en vue d'un protocole national harmonisé",
  "organizer": "Fondation pour les Aires Protégées et la Biodiversité de Madagascar (FAPBM), en collaboration avec l’Institut Halieutique et des Sciences Marines (IH.SM) – Université de Toliara",
  "contactName": "Fidèle Rakotonjanahary",
  "contactEmail": "fidele.rakotonjanahary886@gmail.com",
  "deadline": "15 Novembre 2026",
  "estimatedTime": "30 à 50 min",
  "appsScriptUrl": "https://script.google.com/macros/s/AKfycbwAb2fbzkMVWaubWFLjCwFvN8rmtlHN28crnc14KmmBa6QRoPcFhuo6aYmDK27p9RlRfg/exec",
  "logos": [
    {
      "src": "assets/img/logos/ihsm.png",
      "alt": "IH.SM — Université de Toliara",
      "url": "https://ihsm.mg/"
    },
    {
      "src": "assets/img/logos/fapbm.png",
      "alt": "FAPBM",
      "url": "https://www.fapbm.org/en/home/"
    }
  ],
  "intro": [
    "Cette enquête vise à dresser un état des lieux des méthodes de suivi écologique et de restauration des mangroves utilisées à Madagascar : protocoles, indicateurs, dispositifs d'échantillonnage, moyens, gestion des données, performances et contraintes.",
    "Elle s'adresse aux institutions publiques, gestionnaires d'AMP/LMMA, ONG, associations, instituts de recherche, projets et partenaires impliqués dans le suivi ou la restauration des mangroves.",
    "Si votre organisation utilise plusieurs méthodes de suivi, les questions détaillées (sections C à N) vous seront posées pour chacune d'elles."
  ],
  "draftNote": "Vos réponses sont enregistrées automatiquement sur cet appareil : vous pouvez interrompre la saisie et la reprendre plus tard depuis le même navigateur.",
  "privacy": "Les informations recueillies servent uniquement à cette étude. Vos coordonnées ne serviront qu'à vous recontacter si une réponse doit être précisée ; elles ne seront ni publiées ni transmises. Les résultats seront présentés de manière agrégée. Les photos transmises ne seront utilisées qu'avec mention du photographe.",
  "consentLabel": "J'accepte que les informations fournies soient utilisées dans le cadre de cette étude, selon les conditions décrites ci-dessus.",
  "heroPhoto": "mangrove-ifaty-1",
  "introPhotos": [
    "mangrove-morondava",
    "mangrove-sainte-marie",
    "mangrove-nosy-lonjo"
  ],
  "thanksPhoto": "mangrove-kinkony",
  "photoCreditNote": "Photographies : Wikimedia Commons (licences CC BY, CC BY-SA, CC0) — auteurs indiqués sur chaque photo.",
  "storeKey": "mangrove-enquete-draft-v",
  "downloadPrefix": "reponses-mangroves-"
},

  PHOTOS: [
  {
    "key": "mangrove-ifaty-1",
    "src": "assets/img/photos/mangrove-ifaty-1.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Mangrove_on_Westcoast_Madagascar_I.jpg/1280px-Mangrove_on_Westcoast_Madagascar_I.jpg",
    "caption": "",
    "credit": "Smiley.toerist",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Mangrove_on_Westcoast_Madagascar_I.jpg"
  },
  {
    "key": "mangrove-nosy-lonjo",
    "src": "assets/img/photos/mangrove-nosy-lonjo.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Mangrove_Madagascar_03.jpg/1280px-Mangrove_Madagascar_03.jpg",
    "caption": "",
    "credit": "007RA",
    "license": "CC0",
    "page": "https://commons.wikimedia.org/wiki/File:Mangrove_Madagascar_03.jpg"
  },
  {
    "key": "mangrove-morondava",
    "src": "assets/img/photos/mangrove-morondava.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Pirogue_ride_along_the_Mangrove_forests_channel_in_Morondava_in_Madagascar.jpg/1280px-Pirogue_ride_along_the_Mangrove_forests_channel_in_Morondava_in_Madagascar.jpg",
    "caption": "",
    "credit": "Rudolphfurtado",
    "license": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Pirogue_ride_along_the_Mangrove_forests_channel_in_Morondava_in_Madagascar.jpg"
  },
  {
    "key": "mangrove-sainte-marie",
    "src": "assets/img/photos/mangrove-sainte-marie.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Mangrove_d%E2%80%99Agnafiafy%2C_dans_la_for%C3%AAt_de_Sainte-Marie%2C_Madagascar.jpg/1280px-Mangrove_d%E2%80%99Agnafiafy%2C_dans_la_for%C3%AAt_de_Sainte-Marie%2C_Madagascar.jpg",
    "caption": "",
    "credit": "Anai171",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Mangrove_d%E2%80%99Agnafiafy,_dans_la_for%C3%AAt_de_Sainte-Marie,_Madagascar.jpg"
  },
  {
    "key": "mangrove-kinkony",
    "src": "assets/img/photos/mangrove-kinkony.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Zone_arri%C3%A8re_mangrove_dans_le_Complexe_Mahavavy-Kinkony%2C_Boeny%2C_Madagascar.jpg/1280px-Zone_arri%C3%A8re_mangrove_dans_le_Complexe_Mahavavy-Kinkony%2C_Boeny%2C_Madagascar.jpg",
    "caption": "",
    "credit": "Anai171",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Zone_arri%C3%A8re_mangrove_dans_le_Complexe_Mahavavy-Kinkony,_Boeny,_Madagascar.jpg"
  },
  {
    "key": "mangrove-ifaty-3",
    "src": "assets/img/photos/mangrove-ifaty-3.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Mangrove_on_Westcoast_Madagascar_III.jpg/1280px-Mangrove_on_Westcoast_Madagascar_III.jpg",
    "caption": "",
    "credit": "Smiley.toerist",
    "license": "CC BY-SA 3.0",
    "page": "https://commons.wikimedia.org/wiki/File:Mangrove_on_Westcoast_Madagascar_III.jpg"
  },
  {
    "key": "mangrove-canal-sainte-marie",
    "src": "assets/img/photos/mangrove-canal-sainte-marie.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Canal_de_Mangrove_d%E2%80%99Agnafiafy%2C_dans_la_for%C3%AAt_de_Sainte-Marie%2C_Madagascar.jpg/1280px-Canal_de_Mangrove_d%E2%80%99Agnafiafy%2C_dans_la_for%C3%AAt_de_Sainte-Marie%2C_Madagascar.jpg",
    "caption": "",
    "credit": "Anai171",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Canal_de_Mangrove_d%E2%80%99Agnafiafy,_dans_la_for%C3%AAt_de_Sainte-Marie,_Madagascar.jpg"
  },
  {
    "key": "mangrove-andranovondronina",
    "src": "assets/img/photos/mangrove-andranovondronina.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/For%C3%AAt_de_Mangrove_%C3%A0_Andranovondronina_Antsiranana_II_02.jpg/1280px-For%C3%AAt_de_Mangrove_%C3%A0_Andranovondronina_Antsiranana_II_02.jpg",
    "caption": "",
    "credit": "Chirocca77",
    "license": "CC BY 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:For%C3%AAt_de_Mangrove_%C3%A0_Andranovondronina_Antsiranana_II_02.jpg"
  },
  {
    "key": "mangrove-toliara",
    "src": "assets/img/photos/mangrove-toliara.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/La_Mangrove_%289584523984%29.jpg/1280px-La_Mangrove_%289584523984%29.jpg",
    "caption": "",
    "credit": "Bernard Dupont",
    "license": "CC BY-SA 2.0",
    "page": "https://commons.wikimedia.org/wiki/File:La_Mangrove_(9584523984).jpg"
  },
  {
    "key": "mangrove-amboanio",
    "src": "assets/img/photos/mangrove-amboanio.jpg",
    "remote": "https://upload.wikimedia.org/wikipedia/commons/9/9e/Bord_de_mangrove_%C3%A0_Amboanio.jpg",
    "caption": "",
    "credit": "Anai171",
    "license": "CC BY-SA 4.0",
    "page": "https://commons.wikimedia.org/wiki/File:Bord_de_mangrove_%C3%A0_Amboanio.jpg"
  }
],

  SECTIONS: {
  "A": "A. Identification de l'enquêté",
  "B": "B. Informations sur l'organisation",
  "C": "C. Pratiques de suivi des mangroves",
  "D": "D. Suivi participatif et restauration",
  "E": "E. Objectifs du suivi",
  "F": "F. Indicateurs écologiques",
  "G": "G. Protocole d'échantillonnage",
  "H": "H. Fréquence et temporalité",
  "I": "I. Matériel, ressources et compétences",
  "J": "J. Données et gestion",
  "K": "K. Performance de la méthode",
  "L": "L. Contraintes et limites",
  "M": "M. Analyse FFOM",
  "N": "N. Harmonisation nationale",
  "O": "O. Photos",
  "P": "P. Référence bibliographique"
},

  LOOP: {
  "source": "q013",
  "label": "Méthode",
  "labelPlural": "méthodes",
  "key": "methode",
  "otherName": "Autre méthode",
  "scopeText": "la méthode",
  "active": {
    "q": "q011",
    "in": [
      "Oui",
      "Auparavant, mais plus actuellement"
    ]
  }
},

  STEPS: [
  {
    "key": "A",
    "title": "Identification de l'enquêté",
    "short": "Répondant",
    "questions": [
      {
        "id": "q001",
        "n": 1,
        "label": "Nom et prénom(s) du répondant",
        "type": "text",
        "required": true,
        "autocomplete": "name"
      },
      {
        "id": "q002",
        "n": 2,
        "label": "Fonction / poste du répondant",
        "type": "text",
        "required": true
      },
      {
        "id": "q003",
        "n": 3,
        "label": "Organisation / institution",
        "type": "text",
        "required": true,
        "autocomplete": "organization"
      },
      {
        "id": "q004",
        "n": 4,
        "label": "Adresse e-mail professionnelle",
        "type": "email",
        "required": false,
        "autocomplete": "email"
      },
      {
        "id": "q005",
        "n": 5,
        "label": "Numéro de téléphone professionnel",
        "type": "tel",
        "required": false,
        "autocomplete": "tel"
      }
    ]
  },
  {
    "key": "B",
    "title": "Informations sur l'organisation",
    "short": "Organisation",
    "questions": [
      {
        "id": "q006",
        "n": 6,
        "label": "Type d’organisation / institution",
        "type": "radio",
        "required": true,
        "other": true,
        "options": [
          "Institution publique",
          "ONG",
          "Association",
          "Institution de recherche / université",
          "Projet / programme",
          "Entreprise / secteur privé",
          "Gestionnaire d’AMP/LMMA (préciser la catégorie d'AMP : I, II, III…)",
          "Autre"
        ]
      },
      {
        "id": "q007",
        "n": 7,
        "label": "Domaine(s) d’intervention de votre organisation",
        "type": "checkbox",
        "required": true,
        "other": true,
        "help": "Plusieurs choix possibles.",
        "options": [
          "Recherche",
          "Conservation",
          "Gestion d’AMP/LMMA",
          "Suivi écologique",
          "Pêche",
          "Restauration",
          "Sensibilisation",
          "Autre"
        ]
      },
      {
        "id": "q008",
        "n": 8,
        "label": "Zone(s) d’intervention géographique(s) concernant les mangroves",
        "type": "textarea",
        "required": true,
        "help": "Région(s), district(s), commune(s), sites…"
      },
      {
        "id": "q009",
        "n": 9,
        "label": "Depuis quelle année votre organisation intervient-elle dans le suivi, la recherche ou la conservation des mangroves ?",
        "type": "year",
        "required": false
      },
      {
        "id": "q010",
        "n": 10,
        "label": "Quelle est la superficie de mangrove que votre institution suit et/ou gère ?",
        "type": "number",
        "required": false,
        "min": 0,
        "unit": "ha"
      }
    ]
  },
  {
    "key": "C",
    "title": "Pratiques de suivi des mangroves",
    "short": "Suivi des mangroves",
    "questions": [
      {
        "id": "q011",
        "n": 11,
        "label": "Votre organisation réalise-t-elle actuellement un suivi écologique des mangroves à Madagascar ?",
        "type": "radio",
        "required": true,
        "options": [
          "Oui",
          "Non",
          "Auparavant, mais plus actuellement"
        ],
        "help": "Si vous répondez « Non », le questionnaire passe directement aux sections sur la restauration et l'harmonisation."
      },
      {
        "id": "q013",
        "n": 13,
        "label": "Quelles méthodes / protocoles de suivi des mangroves utilisez-vous ou avez-vous utilisés ?",
        "type": "checkbox",
        "required": true,
        "other": true,
        "showIf": {
          "q": "q011",
          "in": [
            "Oui",
            "Auparavant, mais plus actuellement"
          ]
        },
        "options": [
          "Inventaire écologique par placette",
          "Suivi de la restauration",
          "Suivi de la régénération naturelle",
          "Transect–quadrat",
          "Quadrat / points d'observation",
          "Cartographie SIG / télédétection",
          "Drone",
          "Méthode institutionnelle ou propre à un projet",
          "Autre"
        ],
        "help": "Cochez toutes les méthodes utilisées. Les questions détaillées (sections C à N) seront répétées pour chaque méthode cochée ; vous préciserez le nom exact du protocole à l'étape suivante."
      }
    ]
  },
  {
    "key": "C2",
    "perMethod": true,
    "sections": [
      "C"
    ],
    "title": "Statut et protocole de la méthode",
    "short": "Statut et protocole",
    "questions": [
      {
        "id": "q014",
        "n": 14,
        "label": "Cette méthode est-elle encore utilisée ?",
        "type": "radio",
        "required": true,
        "section": "C",
        "options": [
          "Actuellement utilisée",
          "Utilisée auparavant"
        ]
      },
      {
        "id": "q015",
        "n": 15,
        "label": "La méthode utilisée est-elle basée sur un protocole standardisé publié ou reconnu ?",
        "type": "radio",
        "required": true,
        "section": "C",
        "options": [
          "Oui, sans modification",
          "Oui, mais adaptée",
          "Non, protocole interne",
          "Ne sait pas"
        ],
        "detail": {
          "label": "Nom exact ou référence du protocole"
        }
      },
      {
        "id": "q016",
        "n": 16,
        "label": "Sur quels types de mangroves utilisez-vous cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "C",
        "other": true,
        "options": [
          "Dense",
          "Dégradée",
          "Restaurée",
          "Menacée",
          "Autre"
        ]
      }
    ]
  },
  {
    "key": "EF",
    "perMethod": true,
    "sections": [
      "E",
      "F"
    ],
    "title": "Objectifs et indicateurs écologiques",
    "short": "Objectifs et indicateurs",
    "questions": [
      {
        "id": "q023",
        "n": 23,
        "label": "Quels sont les principaux objectifs du suivi réalisé avec cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "E",
        "other": true,
        "options": [
          "Évaluer l’état / la santé des mangroves",
          "Suivre les changements dans le temps",
          "Cartographier la distribution / superficie",
          "Suivre les pressions et menaces",
          "Évaluer la biodiversité / faune associée",
          "Suivre la restauration",
          "Évaluer la biomasse / carbone",
          "Recherche scientifique",
          "Gestion d’AMP/LMMA",
          "Autre"
        ]
      },
      {
        "id": "q024",
        "n": 24,
        "label": "Quelles questions écologiques cette méthode permet-elle de traiter ?",
        "type": "textarea",
        "required": false,
        "section": "E"
      },
      {
        "id": "q025",
        "n": 25,
        "label": "Quels indicateurs écologiques sont mesurés avec cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "F",
        "other": true,
        "help": "Cochez tous les indicateurs mesurés.",
        "groups": [
          {
            "label": "Végétation",
            "options": [
              "Pourcentage de couverture",
              "Composition spécifique",
              "Densité des pousses",
              "Richesse spécifique",
              "Diversité",
              "Hauteur de la canopée",
              "Biomasse",
              "Mortalité / état des plants"
            ]
          },
          {
            "label": "Étendue et distribution",
            "options": [
              "Étendue / superficie des mangroves",
              "Distribution spatiale"
            ]
          },
          {
            "label": "Sol et carbone",
            "options": [
              "Caractéristiques du substrat",
              "Matière organique",
              "Carbone organique"
            ]
          },
          {
            "label": "Paramètres physico-chimiques",
            "options": [
              "Turbidité",
              "Température",
              "Salinité",
              "Profondeur"
            ]
          },
          {
            "label": "Pressions et faune",
            "options": [
              "Pressions anthropiques",
              "Faune associée"
            ]
          },
          {
            "label": "",
            "options": [
              "Autre"
            ]
          }
        ],
        "options": [
          "Pourcentage de couverture",
          "Composition spécifique",
          "Densité des pousses",
          "Richesse spécifique",
          "Diversité",
          "Hauteur de la canopée",
          "Biomasse",
          "Mortalité / état des plants",
          "Étendue / superficie des mangroves",
          "Distribution spatiale",
          "Caractéristiques du substrat",
          "Matière organique",
          "Carbone organique",
          "Turbidité",
          "Température",
          "Salinité",
          "Profondeur",
          "Pressions anthropiques",
          "Faune associée",
          "Autre"
        ]
      },
      {
        "id": "q026",
        "n": 26,
        "label": "Parmi les indicateurs sélectionnés, lesquels sont considérés comme les plus importants pour votre objectif de suivi ?",
        "type": "textarea",
        "required": false,
        "section": "F"
      },
      {
        "id": "q027",
        "n": 27,
        "label": "Certains indicateurs sont-ils difficiles ou coûteux à mesurer ? Si oui, lesquels et pourquoi ?",
        "type": "textarea",
        "required": false,
        "section": "F"
      }
    ]
  },
  {
    "key": "G",
    "perMethod": true,
    "sections": [
      "G"
    ],
    "title": "Protocole d’échantillonnage",
    "short": "Échantillonnage",
    "questions": [
      {
        "id": "q028",
        "n": 28,
        "label": "Quel est le dispositif d’échantillonnage utilisé ?",
        "type": "checkbox",
        "required": true,
        "section": "G",
        "other": true,
        "options": [
          "Transects",
          "Quadrats",
          "Points d’observation",
          "Placettes / stations permanentes",
          "Relevés GPS",
          "Photographies / vidéo",
          "Télédétection satellite",
          "Drone",
          "Prélèvements de laboratoire",
          "Autre"
        ]
      },
      {
        "id": "q029",
        "n": 29,
        "label": "Quelle est la taille ou la surface de ces dispositifs ?",
        "type": "number",
        "required": false,
        "section": "G",
        "min": 0,
        "units": [
          "m²",
          "ha",
          "m (longueur)"
        ],
        "help": "Ex. : placette de 100 m², transect de 50 m."
      },
      {
        "id": "q030",
        "n": 30,
        "label": "Les sites / stations de suivi sont-ils permanents ?",
        "type": "radio",
        "required": true,
        "section": "G",
        "options": [
          "Oui",
          "Non",
          "Certains seulement"
        ]
      },
      {
        "id": "q031",
        "n": 31,
        "label": "Les sites / stations de suivi sont-ils dans une AMP ?",
        "type": "radio",
        "required": true,
        "section": "G",
        "options": [
          "Oui",
          "Non",
          "Certains seulement"
        ]
      },
      {
        "id": "q032",
        "n": 32,
        "label": "Si oui, pourquoi ?",
        "type": "textarea",
        "required": false,
        "section": "G",
        "showIf": {
          "q": "q031",
          "in": [
            "Oui",
            "Certains seulement"
          ]
        }
      },
      {
        "id": "q033",
        "n": 33,
        "label": "Dans quelle(s) catégorie(s) de zonage la méthode est-elle le plus souvent utilisée ?",
        "type": "checkbox",
        "required": true,
        "section": "G",
        "showIf": {
          "q": "q031",
          "in": [
            "Oui",
            "Certains seulement"
          ]
        },
        "options": [
          "Zone exploitée",
          "Zone à accès réglementé",
          "Zone de restauration",
          "Zone de conservation",
          "Zone à restriction forte",
          "No-Take Zone / protection intégrale",
          "Zone difficilement accessible"
        ]
      },
      {
        "id": "q034",
        "n": 34,
        "label": "Pourquoi la méthode est-elle surtout utilisée dans ces catégories de zonage ?",
        "type": "textarea",
        "required": false,
        "section": "G",
        "showIf": {
          "q": "q031",
          "in": [
            "Oui",
            "Certains seulement"
          ]
        }
      },
      {
        "id": "q035",
        "n": 35,
        "label": "Quelle est la surface de la zone de suivi ?",
        "type": "number",
        "required": true,
        "section": "G",
        "min": 0,
        "unit": "ha"
      },
      {
        "id": "q036",
        "n": 36,
        "label": "Comment les sites sont-ils sélectionnés ?",
        "type": "textarea",
        "required": false,
        "section": "G"
      },
      {
        "id": "q037",
        "n": 37,
        "label": "Combien de stations / sites sont généralement suivis par campagne ?",
        "type": "number",
        "required": false,
        "section": "G",
        "min": 0
      },
      {
        "id": "q038",
        "n": 38,
        "label": "Quelle est la durée moyenne d’une campagne de terrain pour cette méthode ?",
        "type": "number",
        "required": false,
        "section": "G",
        "min": 0,
        "units": [
          "jours",
          "heures"
        ]
      },
      {
        "id": "q039",
        "n": 39,
        "label": "Quelle est la durée moyenne nécessaire pour réaliser un relevé sur une station / un site ?",
        "type": "number",
        "required": false,
        "section": "G",
        "min": 0,
        "units": [
          "minutes",
          "heures"
        ]
      }
    ]
  },
  {
    "key": "HI",
    "perMethod": true,
    "sections": [
      "H",
      "I"
    ],
    "title": "Fréquence, matériel et compétences",
    "short": "Fréquence et moyens",
    "questions": [
      {
        "id": "q040",
        "n": 40,
        "label": "À quelle période les données sont-elles collectées ?",
        "type": "checkbox",
        "required": false,
        "section": "H",
        "help": "Cochez les mois concernés.",
        "options": [
          "Janvier",
          "Février",
          "Mars",
          "Avril",
          "Mai",
          "Juin",
          "Juillet",
          "Août",
          "Septembre",
          "Octobre",
          "Novembre",
          "Décembre"
        ]
      },
      {
        "id": "q041",
        "n": 41,
        "label": "À quelle fréquence les données sont-elles collectées ?",
        "type": "radio",
        "required": true,
        "section": "H",
        "other": true,
        "options": [
          "Hebdomadaire",
          "Mensuelle",
          "Trimestrielle",
          "Semestrielle",
          "Annuelle",
          "Tous les 2 à 5 ans",
          "Ponctuelle / selon projet",
          "Autre"
        ]
      },
      {
        "id": "q042",
        "n": 42,
        "label": "La fréquence de suivi est-elle la même toute l’année ?",
        "type": "radio",
        "required": true,
        "section": "H",
        "options": [
          "Oui",
          "Non"
        ]
      },
      {
        "id": "q043",
        "n": 43,
        "label": "Si non, quelles périodes / saisons sont privilégiées et pourquoi ?",
        "type": "textarea",
        "required": false,
        "section": "H",
        "showIf": {
          "q": "q042",
          "eq": "Non"
        }
      },
      {
        "id": "q044",
        "n": 44,
        "label": "Quels équipements sont nécessaires ?",
        "type": "checkbox",
        "required": true,
        "section": "I",
        "other": true,
        "options": [
          "GPS",
          "Appareil photo / caméra",
          "Drone",
          "Quadrat",
          "Transect",
          "Réfractomètre",
          "Thermomètre",
          "Ordinateur",
          "Logiciel SIG",
          "Autre"
        ]
      },
      {
        "id": "q045",
        "n": 45,
        "label": "Quel est le niveau de compétence / formation nécessaire pour appliquer correctement cette méthode ?",
        "type": "radio",
        "required": true,
        "section": "I",
        "options": [
          "Faible",
          "Moyen",
          "Élevé",
          "Très élevé"
        ]
      },
      {
        "id": "q046",
        "n": 46,
        "label": "Combien de personnes participent généralement à une campagne de suivi avec cette méthode ?",
        "type": "number",
        "required": false,
        "section": "I",
        "min": 0
      },
      {
        "id": "q047",
        "n": 47,
        "label": "Une formation spécifique est-elle nécessaire ?",
        "type": "radio",
        "required": true,
        "section": "I",
        "options": [
          "Oui",
          "Non"
        ]
      },
      {
        "id": "q048",
        "n": 48,
        "label": "Si oui, quel type de formation est nécessaire ?",
        "type": "textarea",
        "required": false,
        "section": "I",
        "showIf": {
          "q": "q047",
          "eq": "Oui"
        }
      },
      {
        "id": "q049",
        "n": 49,
        "label": "Quel est le budget alloué pour chaque campagne ?",
        "type": "number",
        "required": false,
        "section": "I",
        "min": 0,
        "unit": "MGA",
        "help": "Montant approximatif par campagne, en Ariary (ex. 7 500 000)."
      }
    ]
  },
  {
    "key": "JK",
    "perMethod": true,
    "sections": [
      "J",
      "K"
    ],
    "title": "Données et performance de la méthode",
    "short": "Données et performance",
    "questions": [
      {
        "id": "q050",
        "n": 50,
        "label": "Comment les données sont-elles enregistrées sur le terrain ?",
        "type": "checkbox",
        "required": false,
        "section": "J",
        "other": true,
        "options": [
          "Fiches papier",
          "Excel",
          "KoboToolbox",
          "Application mobile",
          "GPS",
          "Photographies / vidéos",
          "Autre"
        ]
      },
      {
        "id": "q051",
        "n": 51,
        "label": "Où les données sont-elles stockées après la collecte ?",
        "type": "checkbox",
        "required": false,
        "section": "J",
        "other": true,
        "options": [
          "Excel",
          "Drive",
          "KoboToolbox",
          "Base de données",
          "Serveur institutionnel",
          "Plateforme en ligne",
          "Documents papier",
          "Autre"
        ]
      },
      {
        "id": "q052",
        "n": 52,
        "label": "Les données issues de cette méthode sont-elles facilement comparables entre sites et entre années ?",
        "type": "radio",
        "required": true,
        "section": "J",
        "options": [
          "Oui",
          "Partiellement",
          "Non",
          "Ne sait pas"
        ]
      },
      {
        "id": "q053",
        "n": 53,
        "label": "Les données sont-elles partagées avec d’autres institutions / partenaires ?",
        "type": "radio",
        "required": false,
        "section": "J",
        "options": [
          "Oui",
          "Partiellement",
          "Non"
        ]
      },
      {
        "id": "q054",
        "n": 54,
        "label": "Comment évaluez-vous la précision des données produites par cette méthode ?",
        "type": "scale",
        "required": true,
        "options": [
          "Très faible",
          "Faible",
          "Moyenne",
          "Élevée",
          "Très élevée"
        ],
        "section": "K"
      },
      {
        "id": "q055",
        "n": 55,
        "label": "Dans quelle mesure cette méthode permet-elle de détecter les changements à court terme ?",
        "type": "scale",
        "required": true,
        "options": [
          "Très faible",
          "Faible",
          "Moyenne",
          "Élevée",
          "Très élevée"
        ],
        "section": "K"
      },
      {
        "id": "q056",
        "n": 56,
        "label": "Dans quelle mesure cette méthode permet-elle de détecter les changements à long terme ?",
        "type": "scale",
        "required": true,
        "options": [
          "Très faible",
          "Faible",
          "Moyenne",
          "Élevée",
          "Très élevée"
        ],
        "section": "K"
      },
      {
        "id": "q057",
        "n": 57,
        "label": "Comment évaluez-vous la facilité de mise en œuvre de cette méthode ?",
        "type": "scale",
        "required": true,
        "options": [
          "Très difficile",
          "Difficile",
          "Moyenne",
          "Facile",
          "Très facile"
        ],
        "section": "K"
      },
      {
        "id": "q058",
        "n": 58,
        "label": "Comment évaluez-vous le coût global de mise en œuvre ?",
        "type": "scale",
        "required": true,
        "options": [
          "Très faible",
          "Faible",
          "Moyen",
          "Élevé",
          "Très élevé"
        ],
        "section": "K"
      },
      {
        "id": "q059",
        "n": 59,
        "label": "Dans quelle mesure cette méthode est-elle adaptée aux réalités et capacités locales à Madagascar ?",
        "type": "scale",
        "required": true,
        "options": [
          "Pas du tout adaptée",
          "Peu adaptée",
          "Moyennement adaptée",
          "Bien adaptée",
          "Très bien adaptée"
        ],
        "section": "K"
      },
      {
        "id": "q060",
        "n": 60,
        "label": "Dans quelle mesure les résultats sont-ils reproductibles entre différents observateurs / équipes ?",
        "type": "scale",
        "required": false,
        "options": [
          "Très faible",
          "Faible",
          "Moyenne",
          "Élevée",
          "Très élevée"
        ],
        "section": "K"
      }
    ]
  },
  {
    "key": "LM",
    "perMethod": true,
    "sections": [
      "L",
      "M"
    ],
    "title": "Contraintes, limites et analyse FFOM",
    "short": "Contraintes et FFOM",
    "questions": [
      {
        "id": "q061",
        "n": 61,
        "label": "Quelles sont les principales contraintes rencontrées lors de la mise en œuvre de cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "L",
        "other": true,
        "options": [
          "Accès aux sites",
          "Équipement insuffisant",
          "Coût",
          "Manque de personnel",
          "Manque de compétences / formation",
          "Temps nécessaire",
          "Difficulté d’analyse des données",
          "Difficulté de stockage / gestion des données",
          "Autre"
        ]
      },
      {
        "id": "q062",
        "n": 62,
        "label": "Parmi ces contraintes, quelles sont les trois plus importantes ?",
        "type": "rank",
        "required": true,
        "section": "L",
        "ranks": 3,
        "rankFrom": "q061",
        "help": "Classez-les de la plus importante (1) à la moins importante (3)."
      },
      {
        "id": "q063",
        "n": 63,
        "label": "Quelles sont, selon vous, les principales limites scientifiques ou méthodologiques de cette méthode ?",
        "type": "textarea",
        "required": true,
        "section": "L"
      },
      {
        "id": "q064",
        "n": 64,
        "label": "Quelles sont les principales FORCES de cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "M",
        "other": true,
        "options": [
          "Précision",
          "Simplicité",
          "Faible coût",
          "Rapidité",
          "Reproductibilité",
          "Comparaison possible dans le temps",
          "Applicabilité à grande échelle",
          "Accessibilité pour les gestionnaires malgaches",
          "Autre"
        ]
      },
      {
        "id": "q065",
        "n": 65,
        "label": "Quelles sont les principales FAIBLESSES de cette méthode ?",
        "type": "checkbox",
        "required": true,
        "section": "M",
        "other": true,
        "options": [
          "Coût élevé",
          "Besoin d’équipements spécifiques",
          "Équipements difficiles à obtenir à Madagascar",
          "Besoin de personnel spécialisé",
          "Besoin d’une formation spécifique",
          "Méthode longue à mettre en œuvre",
          "Méthode difficile à standardiser",
          "Méthode difficile à reproduire",
          "Forte dépendance aux conditions météorologiques / marines",
          "Difficultés d’accès aux sites",
          "Faible couverture spatiale",
          "Faible fréquence de suivi",
          "Difficultés d’identification des espèces",
          "Données difficiles à traiter / analyser",
          "Données difficiles à comparer entre sites",
          "Méthode peu adaptée à certains types de mangroves",
          "Autre"
        ]
      },
      {
        "id": "q066",
        "n": 66,
        "label": "Quelles sont les principales OPPORTUNITÉS pour améliorer ou développer cette méthode à Madagascar ?",
        "type": "checkbox",
        "required": true,
        "section": "M",
        "other": true,
        "options": [
          "Possibilité d’intégrer la méthode dans un protocole national",
          "Possibilité d’harmoniser les méthodes existantes",
          "Possibilité de former davantage les acteurs nationaux",
          "Possibilité de renforcer les capacités des institutions",
          "Développement de partenariats entre institutions",
          "Collaboration avec les ONG et projets",
          "Collaboration avec les communautés locales",
          "Développement d’un réseau national de suivi des mangroves",
          "Mise en place de stations permanentes",
          "Développement d’une base de données nationale",
          "Utilisation des outils SIG et de télédétection",
          "Développement d’outils numériques de collecte des données",
          "Possibilité de suivi à long terme",
          "Possibilité de comparaison des données entre régions",
          "Possibilité d’intégration dans les programmes de conservation",
          "Possibilité de mobiliser des financements pour le suivi écologique",
          "Autre"
        ]
      },
      {
        "id": "q067",
        "n": 67,
        "label": "Quelles sont les principales MENACES pouvant limiter son utilisation ou sa pérennisation ?",
        "type": "checkbox",
        "required": true,
        "section": "M",
        "other": true,
        "options": [
          "Manque de financement à long terme",
          "Arrêt des projets après leur période de financement",
          "Manque de personnel qualifié",
          "Rotation du personnel formé",
          "Manque de matériel / équipements",
          "Coût élevé des équipements",
          "Difficultés logistiques et d’accès aux sites",
          "Difficultés liées aux conditions météorologiques ou marines",
          "Absence de coordination entre les institutions",
          "Absence de protocole national harmonisé",
          "Utilisation de méthodes différentes entre les acteurs",
          "Manque de continuité des séries de données",
          "Perte ou mauvaise gestion des données",
          "Faible appropriation par les acteurs locaux",
          "Difficulté d’intégration des données dans une base nationale",
          "Pressions anthropiques importantes sur les mangroves",
          "Dégradation / disparition des sites de suivi",
          "Autre"
        ]
      }
    ]
  },
  {
    "key": "N1",
    "perMethod": true,
    "sections": [
      "N"
    ],
    "title": "Intégration de la méthode dans un protocole national",
    "short": "Protocole national",
    "questions": [
      {
        "id": "q068",
        "n": 68,
        "label": "Selon vous, cette méthode pourrait-elle être intégrée dans un protocole national harmonisé de suivi des mangroves ?",
        "type": "radio",
        "required": true,
        "section": "N",
        "options": [
          "Oui",
          "Oui, avec adaptations",
          "Non",
          "Ne sait pas"
        ]
      },
      {
        "id": "q069",
        "n": 69,
        "label": "Quels éléments de cette méthode devraient absolument être conservés dans un futur protocole national ?",
        "type": "textarea",
        "required": false,
        "section": "N"
      },
      {
        "id": "q070",
        "n": 70,
        "label": "Quelles adaptations seraient nécessaires pour permettre son utilisation à l’échelle nationale ?",
        "type": "textarea",
        "required": false,
        "section": "N"
      }
    ]
  },
  {
    "key": "D",
    "title": "Suivi participatif et restauration des mangroves",
    "short": "Restauration",
    "questions": [
      {
        "id": "q017",
        "n": 17,
        "label": "Faites-vous du suivi écologique participatif ?",
        "type": "radio",
        "required": false,
        "options": [
          "Oui",
          "Non",
          "Parfois"
        ]
      },
      {
        "id": "q018",
        "n": 18,
        "label": "Si oui, quelle méthode ou quel protocole utilisez-vous pour ce suivi ? Quels indices écologiques sont mesurés ?",
        "type": "textarea",
        "required": false,
        "showIf": {
          "q": "q017",
          "in": [
            "Oui",
            "Parfois"
          ]
        }
      },
      {
        "id": "q019",
        "n": 19,
        "label": "Votre organisation réalise-t-elle actuellement une restauration des mangroves à Madagascar ?",
        "type": "radio",
        "required": true,
        "options": [
          "Oui",
          "Non",
          "Autrefois",
          "Parfois"
        ]
      },
      {
        "id": "q020",
        "n": 20,
        "label": "Quels sont les noms exacts des méthodes / protocoles utilisés pour la restauration des mangroves ?",
        "type": "checkbox",
        "required": true,
        "other": true,
        "showIf": {
          "q": "q019",
          "in": [
            "Oui",
            "Autrefois",
            "Parfois"
          ]
        },
        "options": [
          "Plantation directe de propagules",
          "Plantation de plants issus de pépinière",
          "Régénération naturelle assistée",
          "Restauration hydrologique (rétablissement des écoulements d'eau)",
          "Autre"
        ],
        "help": "Liste provisoire — si votre méthode n'y figure pas, cochez « Autre » et indiquez son nom."
      },
      {
        "id": "q021",
        "n": 21,
        "label": "Sur quels types de mangroves utilisez-vous ces méthodes de restauration ?",
        "type": "checkbox",
        "required": true,
        "other": true,
        "showIf": {
          "q": "q019",
          "in": [
            "Oui",
            "Autrefois",
            "Parfois"
          ]
        },
        "options": [
          "Dense",
          "Dégradée",
          "Restaurée",
          "Menacée",
          "Autre"
        ]
      },
      {
        "id": "q022",
        "n": 22,
        "label": "Quelle est la superficie de mangrove que votre institution restaure ?",
        "type": "number",
        "required": true,
        "min": 0,
        "unit": "ha",
        "showIf": {
          "q": "q019",
          "in": [
            "Oui",
            "Autrefois",
            "Parfois"
          ]
        }
      }
    ]
  },
  {
    "key": "N",
    "title": "Harmonisation nationale",
    "short": "Harmonisation",
    "questions": [
      {
        "id": "q071",
        "n": 71,
        "label": "Pensez-vous qu'une harmonisation nationale des protocoles est nécessaire ?",
        "type": "radio",
        "required": true,
        "options": [
          "Oui",
          "Non"
        ]
      },
      {
        "id": "q072",
        "n": 72,
        "label": "Seriez-vous prêt(e) à adopter un protocole national harmonisé ?",
        "type": "radio",
        "required": true,
        "options": [
          "Oui",
          "Non",
          "Peut-être",
          "Sous condition"
        ]
      },
      {
        "id": "q073",
        "n": 73,
        "label": "Quels critères sont importants pour un protocole national ?",
        "type": "checkbox",
        "required": false,
        "other": true,
        "options": [
          "Simplicité",
          "Coût abordable",
          "Reproductibilité",
          "Adaptabilité locale",
          "Compatibilité internationale",
          "Autre"
        ]
      },
      {
        "id": "q074",
        "n": 74,
        "label": "Quelles méthodes recommandez-vous pour un futur protocole national ?",
        "type": "checkbox",
        "required": false,
        "other": true,
        "options": [
          "Inventaire écologique par placette",
          "Suivi de la restauration",
          "Suivi de la régénération naturelle",
          "Transect–quadrat",
          "Quadrat / points d'observation",
          "Cartographie SIG / télédétection",
          "Drone",
          "Méthode institutionnelle ou propre à un projet",
          "Autre"
        ]
      },
      {
        "id": "q075",
        "n": 75,
        "label": "Quels indicateurs devraient, selon vous, être suivis de manière commune par tous les acteurs à Madagascar ?",
        "type": "checkbox",
        "required": true,
        "other": true,
        "options": [
          "Couverture",
          "Composition spécifique",
          "Densité",
          "Hauteur de canopée",
          "Biomasse",
          "Superficie / distribution",
          "Pressions",
          "Substrat",
          "Faune associée",
          "Paramètres environnementaux",
          "Autre"
        ]
      },
      {
        "id": "q076",
        "n": 76,
        "label": "Quels sont les principaux besoins pour améliorer le suivi des mangroves à Madagascar ?",
        "type": "checkbox",
        "required": true,
        "other": true,
        "options": [
          "Formation",
          "Matériel",
          "Financement",
          "Protocoles harmonisés",
          "Base de données nationale",
          "Coordination entre acteurs",
          "Appui scientifique",
          "Cartographie / SIG",
          "Laboratoire",
          "Autre"
        ]
      },
      {
        "id": "q077",
        "n": 77,
        "label": "Avez-vous d’autres recommandations concernant la mise en place d’un système national harmonisé de suivi écologique des mangroves ?",
        "type": "textarea",
        "required": false
      },
      {
        "id": "q078",
        "n": 78,
        "label": "Souhaitez-vous participer à l'élaboration du protocole national ?",
        "type": "radio",
        "required": false,
        "options": [
          "Oui",
          "Non",
          "Peut-être",
          "Sous condition"
        ]
      }
    ]
  },
  {
    "key": "O",
    "title": "Photos de la méthode de suivi",
    "short": "Photos",
    "questions": [
      {
        "id": "q079",
        "n": 79,
        "label": "Téléchargez des photos illustrant la méthode / le protocole de suivi utilisé",
        "type": "file",
        "required": false,
        "maxFiles": 5,
        "maxMB": 10,
        "accept": [
          "jpg",
          "jpeg",
          "png"
        ],
        "help": "JPG ou PNG — photos du site, du dispositif de suivi, du matériel ou de la réalisation du protocole. 5 photos maximum ; elles sont compressées automatiquement."
      },
      {
        "id": "q080",
        "n": 80,
        "label": "Nom et prénom(s) du photographe",
        "type": "text",
        "required": false,
        "showIf": {
          "q": "q079",
          "filled": true
        }
      },
      {
        "id": "q081",
        "n": 81,
        "label": "Localisation de la prise de ces photos",
        "type": "text",
        "required": false,
        "showIf": {
          "q": "q079",
          "filled": true
        },
        "help": "Région / district / commune / site ou station de suivi"
      },
      {
        "id": "q082",
        "n": 82,
        "label": "Date de la prise de vue",
        "type": "date",
        "required": false,
        "showIf": {
          "q": "q079",
          "filled": true
        }
      }
    ]
  },
  {
    "key": "P",
    "title": "Référence bibliographique",
    "short": "Référence",
    "questions": [
      {
        "id": "q083",
        "n": 83,
        "label": "Référence bibliographique de la méthode / du protocole",
        "type": "file",
        "required": false,
        "maxFiles": 3,
        "maxMB": 10,
        "accept": [
          "pdf",
          "doc",
          "docx"
        ],
        "help": "PDF ou Word (protocole, manuel, article, rapport). 3 fichiers et 10 Mo maximum ; au-delà, envoyez-les par e-mail."
      }
    ]
  }
]
};

if (typeof module !== "undefined") module.exports = SURVEY;
