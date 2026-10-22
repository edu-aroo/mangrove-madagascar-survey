# Link to survey
https://edu-aroo.github.io/mangrove-madagascar-survey/
# Link to report
https://edu-aroo.github.io/mangrove-madagascar-survey/rapport

# Mangrove survey – web form → Google Sheets

Static web form (GitHub/GitLab Pages) that sends answers to a Google Sheet through a Google Apps Script, with uploaded photos/PDFs saved in Google Drive.

```
index.html               page skeleton
assets/config.js         ← EDIT: Script URL, texts, contact, deadline, logos
assets/questions.js      ← EDIT if you change questions (labels, options, required)
assets/app.js            form engine (no need to edit)
assets/style.css         design
logos/                   partner logos (ihsm.png, fapbm.png)
apps-script/Code.gs      backend to paste into Google Apps Script
codebook/codebook.csv    column dictionary (for R)
```

## Data structure in Google Sheets

| Sheet | One row per | Key columns |
|---|---|---|
| `Reponses` | respondent | `response_id`, `submitted_at`, `n_methods`, `q1`…`q22`, `q71`…`q78` |
| `Methodes` | method described by a respondent | `response_id`, `organisation`, `method_index`, `q13`…`q70`, `q79` (photo links), `q80`…`q82`, `q83` (document link) |

- Multiple-choice answers are stored as `Option A | Option B`.
- "Autre"/precision text is in `<question>_precision` (e.g. `q7_precision`).
- Q62 (top 3 constraints) → `q62_1`, `q62_2`, `q62_3`.
- Likert scales (Q54–Q60) are stored as numbers 1–5.
- The two sheets are linked by `response_id`.

---

## Step 1 — Create the Google Sheet and Drive folder

1. In Google Drive, create a folder, e.g. `Enquete_mangroves_fichiers`. Open it and copy its ID from the URL: `https://drive.google.com/drive/folders/`**`THIS_PART`**.
2. Create a new Google Sheet, e.g. `Enquete_mangroves_reponses`. Leave it empty — the script creates the `Reponses` and `Methodes` sheets and their headers automatically.

## Step 2 — Install the Apps Script

1. In the Google Sheet: **Extensions → Apps Script**.
2. Delete the default code, paste the content of `apps-script/Code.gs`.
3. Replace `PASTE_YOUR_DRIVE_FOLDER_ID_HERE` with the folder ID from step 1. Save (💾).
4. In the function menu select `testSetup` → **Run**. Accept the authorisation requests (Google will warn "unverified app": click *Advanced → Go to project*). The log should show "Folder OK" and "Sheet OK".
5. **Deploy → New deployment** → type **Web app**:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Click **Deploy** and copy the **Web app URL** (ends with `/exec`).
6. Check it: open the URL in a browser → you should see `{"ok":true,...}`.

> If you later modify `Code.gs`, use **Deploy → Manage deployments → ✏️ → Version: New version** so the URL stays the same.

## Step 3 — Configure the form

Edit `assets/config.js`:
- `SCRIPT_URL`: paste the Web app URL.
- `deadline`, `contact`: fill or leave empty to hide.
- `duration`: adjust after a pilot test.

While `SCRIPT_URL` is empty the form runs in **test mode** (yellow banner, nothing sent).

## Step 4 — Publish on GitHub Pages

1. Create a GitHub account if needed, then **New repository** (e.g. `enquete-mangroves`), Public.
2. **Add file → Upload files** → drag the *content* of this folder (index.html, assets/, logos/ …) → Commit.
3. **Settings → Pages** → *Source*: Deploy from a branch → Branch `main` / `(root)` → Save.
4. After ~1 minute the form is online at `https://<your-username>.github.io/enquete-mangroves/`.

GitLab alternative: create a project, upload the files, add a `.gitlab-ci.yml` with a `pages` job copying the files to `public/` (ask me if you choose this route).

> The repository is public, so the form code is visible — but the answers are not: they go only to your private Google Sheet. Don't put the Sheet URL in the repository.

## Step 5 — Pilot test before sending

1. Fill the form yourself with 2 methods and photos, on a computer **and** on a phone.
2. Check the rows in `Reponses` and `Methodes`, and the files in Drive.
3. Delete the test rows (keep the header row!) and the test Drive folder.
4. Ask 1–2 colleagues to test and time it.

## Notes

- **Drafts**: answers are saved in the respondent's browser and restored if they come back on the same device/browser. Attached files are not kept in the draft.
- **Photos** are resized to 1600 px in the browser before upload (lighter for slow connections).
- **Duplicates**: the same `response_id` is never written twice (protects against double clicks / retries).
- **Quotas**: a personal Google account allows ~20,000 script executions/day — far above what this survey needs.
- Uploaded files are private to your Drive account; the links in the sheet work only for people you share the folder with.

## Next step

R project: read the two sheets with `googlesheets4`, clean and join them, descriptive analysis and an R Markdown report published as HTML.
