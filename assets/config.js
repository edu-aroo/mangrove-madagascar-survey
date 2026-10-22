/* =====================================================================
   CONFIGURATION — the only file you normally need to edit
   ===================================================================== */
window.SURVEY_CONFIG = {
  // 1) Paste here the Web App URL obtained after deploying apps-script/Code.gs
  //    Leave empty ("") to run in TEST mode (nothing is sent; answers can be downloaded as JSON).
  SCRIPT_URL: "https://script.google.com/macros/s/AKfycbypFib_ds68xOpv1wyrpD3mqnk_n6DvHtpyUKmkCml-b00oMvPPqEElb_mMz32vjZBk/exec",

  // 2) Texts shown on the landing page
  title: "Questionnaire sur les méthodes de suivi écologique et de restauration des mangroves à Madagascar",
  organiser: "Fondation pour les Aires Protégées et la Biodiversité de Madagascar (FAPBM), en collaboration avec l’Institut Halieutique et des Sciences Marines (IH.SM) – Université de Toliara",
  copyright: "© 2026 Aroo Falinirina",
  subtitle: "Vers un protocole national harmonisé de suivi des mangroves",
  intro: [
    "Ce questionnaire s’adresse aux organisations et aux personnes impliquées dans le suivi, la recherche, la restauration ou la conservation des mangroves à Madagascar.",
    "Il vise à recenser les méthodes et protocoles utilisés, leurs forces et leurs limites, afin de contribuer à l’élaboration d’un protocole national harmonisé.",
    "Une partie du questionnaire se répète pour chaque méthode que vous utilisez. Vos réponses sont enregistrées automatiquement sur cet appareil : vous pouvez fermer la page et reprendre plus tard."
  ],
  duration: "30 à 45 minutes",              // [À VÉRIFIER]
  deadline: "15 Novembre 2026",                             // e.g. "15 décembre 2026" — leave "" to hide
  contact: { name: "Fidèle Rakotonjanahary", email: "fidele.rakotonjanahary886@gmail.com" },         // e.g. { name: "Fidèle …", email: "…@…" } — leave "" to hide

  // 3) Partner logos (files in the logos/ folder)
  logos: [
    { src: "logos/ihsm.png",  alt: "Institut Halieutique et des Sciences Marines (IH.SM) – Université de Toliara" },
    { src: "logos/fapbm.png", alt: "Fondation pour les Aires Protégées et la Biodiversité de Madagascar (FAPBM)" }
  ],

  // 4) Upload limits
  maxPhotosPerMethod: 5,
  maxPhotoSidePx: 1600,       // photos are resized in the browser before upload
  maxDocMB: 8,

  // 5) Consent text displayed before submission
  consent: "J’accepte que les informations fournies soient utilisées dans le cadre de cette étude et de l’élaboration d’un protocole national de suivi des mangroves. Les coordonnées personnelles ne seront pas publiées."
};
