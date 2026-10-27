# ---------------------------------------------------------------------------
# download_photos.R — copie locale des photos (Wikimedia Commons) dans
# assets/img/photos/ pour que le site ne dépende pas de Wikimedia.
# Usage (depuis le dossier enquete-mangroves/) : source("tools/download_photos.R")
# ---------------------------------------------------------------------------
cfg <- readLines("assets/js/survey-config.js", encoding = "UTF-8")
src    <- sub('.*"src": "([^"]+)".*', "\\1", grep('"src": "assets/img/photos/', cfg, value = TRUE))
remote <- sub('.*"remote": "([^"]+)".*', "\\1", grep('"remote": "', cfg, value = TRUE))
stopifnot(length(src) == length(remote))
dir.create("assets/img/photos", showWarnings = FALSE, recursive = TRUE)
for (i in seq_along(src)) {
  if (file.exists(src[i])) { message("déjà présent : ", src[i]); next }
  # Wikimedia exige un User-Agent identifiant l'utilisateur
  download.file(remote[i], src[i], mode = "wb", quiet = TRUE,
                headers = c("User-Agent" = "enquete-mangroves-madagascar/1.0 (usage scientifique)"))
  message("téléchargé : ", src[i])
}
