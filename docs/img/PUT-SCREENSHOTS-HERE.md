# Screenshots for the README

Save the feature screenshots in this folder with **exactly** these filenames — the package
`README.md` references them:

| Filename | What it shows |
| --- | --- |
| `locked-readonly.png` | Second editor: read-only node with red border + Request access / Force access buttons |
| `editor-normal.png` | The lock holder: normal Save / Save and publish buttons |
| `access-requested-toast.png` | "Access requested" confirmation shown to the requester |
| `request-prompt.png` | The holder's "User X is requesting access… Accept / Decline" prompt |
| `force-access-confirm.png` | The "Are you sure you want to take control from X?" Force access confirmation |

The README links these via absolute `raw.githubusercontent.com` URLs (NuGet.org only renders absolute
image URLs). After you push the repo, replace `CHANGE-ME` in both `README.md` and the `.csproj`
(`PackageProjectUrl` / `RepositoryUrl`) with your GitHub `owner/repo`, and set the correct branch.

You can delete this file once the images are in place.
