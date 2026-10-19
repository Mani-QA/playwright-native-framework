# AI Harness

The AI Harness turns a Qase case for [QADemo](https://qademo.com) into a Playwright test and opens a GitHub pull request. It runs on the Antigravity CLI (`agy`). Product behavior comes from `docs/FRD-QADemo.md`. When a case skips a step or an assertion, `docs/kb/product-knowledge.md` tells the agent what the requirement still expects.

The agent reuses a page object and a method when `docs/kb/pom-index.md` already has one. It creates a class or a method only for a gap, after looking at the live page with Playwright MCP. The new test is added to the spec that already owns that area. A passing run appends its result to [Qase run 1](https://app.qase.io/run/QADEMO/dashboard/1). The harness does not create another Qase run.

## What you need

- Node.js 22.13 or newer. GitHub Actions uses Node.js 24.
- [Antigravity CLI](https://antigravity.google/docs/getting-started/), available as `agy` on your PATH. Sign in once with an interactive `agy` session. Headless mode reuses that login. Confirm model names with `agy models`.
- GitHub CLI `gh`, signed in with permission to push branches and open pull requests.
- A Qase API token, an Antigravity login file, and a GitHub login. Create each one with the steps in [Credentials](#credentials). The harness never prints them.

## Run one case locally

From `playwright-native-framework`:

```bash
npm install
npx playwright install chromium
npm run index:pom
npm run harness -- --case 91 --dry-run
npm run harness -- --case 91
```

`--dry-run` downloads the case and writes `playwright/.cache/harness/case-91.json`. It does not start `agy`.

A full run refuses to start when the git worktree is dirty. The agent then branches as `automate/qase-<id>`, pushes, and opens a pull request. The last log line contains the pull request URL.

A suite or plan is limited to one case unless you raise the limit:

```bash
npm run harness -- --suite 2 --limit 1
npm run harness -- --plan 1 --limit 1
```

## Run it in GitHub Actions

Open **Actions**, choose **AI Harness**, and run the workflow. Enter one of:

| Input | Meaning |
| :--- | :--- |
| case | One Qase case id |
| suite | Every case in that suite, capped by limit |
| plan | Every case on that plan, capped by limit |
| limit | How many suite or plan cases to automate. Default 1 |

The workflow does not run on push, so a Markdown edit does not start it. The job summary lists the pull request URL.

## Credentials

Store each value as a GitHub Actions secret. Open the repository, then **Settings → Secrets and variables → Actions → New repository secret**. Do not commit these values and do not paste them into chat.

| Secret | Local name | Used for |
| :--- | :--- | :--- |
| `QASE_API_TOKEN` | `QASEToken` in `.env` | Read the Qase case and append results to run 1 |
| `AGY_CREDENTIALS` | file `antigravity-oauth-token` | Sign `agy` in on the runner |
| none | `gh auth login`, or a personal access token | Push the branch and open the pull request |

The workflow passes `QASE_API_TOKEN` and `AGY_CREDENTIALS` into the job. GitHub creates `GITHUB_TOKEN` for that job and the harness uses it as `GH_TOKEN`. You do not paste a personal token into the workflow.

### Qase token

1. Sign in at [app.qase.io](https://app.qase.io).
2. Open [API tokens](https://app.qase.io/user/api/token).
3. Choose **Create a new API token**, give it a name such as `qademo-harness`, and create it.
4. Copy the token when Qase shows it. Qase does not show the full value again.

Locally, add one line to `.env` in this directory or the parent directory. `.env` is gitignored.

```text
QASEToken=paste-the-token-here
```

In GitHub, create the secret `QASE_API_TOKEN` with that same value. The header sent to `https://api.qase.io/v1` is `Token`.

### AGY credentials

Install the CLI from the [Antigravity getting started guide](https://antigravity.google/docs/getting-started/) and sign in once with `agy`. On Windows that login is saved in Credential Manager as `gemini:antigravity`. `GEMINI_FORCE_FILE_STORAGE` does not create a file on Windows, so export the saved login yourself.

Run this in PowerShell after `agy` has signed in. It writes the token file and prints only the path and expiry, not the token.

```powershell
$sig = @'
using System;
using System.Runtime.InteropServices;
public class AgyCredExport {
  [DllImport("advapi32.dll", SetLastError=true, CharSet=CharSet.Unicode)]
  public static extern bool CredRead(string target, int type, int flags, out IntPtr cred);
  [DllImport("advapi32.dll")] public static extern void CredFree(IntPtr cred);
  [StructLayout(LayoutKind.Sequential)]
  public struct CREDENTIAL {
    public int Flags; public int Type; public IntPtr TargetName; public IntPtr Comment;
    public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
    public int CredentialBlobSize; public IntPtr CredentialBlob; public int Persist;
    public int AttributeCount; public IntPtr Attributes; public IntPtr TargetAlias; public IntPtr UserName;
  }
  public static byte[] Read(string target){
    IntPtr p; if(!CredRead(target,1,0,out p)) return null;
    try {
      var c=(CREDENTIAL)Marshal.PtrToStructure(p,typeof(CREDENTIAL));
      var b=new byte[c.CredentialBlobSize];
      if(c.CredentialBlobSize>0) Marshal.Copy(c.CredentialBlob,b,0,c.CredentialBlobSize);
      return b;
    } finally { CredFree(p); }
  }
}
'@
Add-Type -TypeDefinition $sig
$bytes = [AgyCredExport]::Read('gemini:antigravity')
if ($null -eq $bytes) { throw 'Sign in with agy first. Credential gemini:antigravity was not found.' }
$text = [Text.Encoding]::UTF8.GetString($bytes).Trim([char]0)
if (-not $text.TrimStart().StartsWith('{')) { throw 'Credential blob is not the agy token.' }
$parsed = $text | ConvertFrom-Json
if (-not $parsed.token.refresh_token) { throw 'Credential has no refresh token. Sign in with agy again.' }
$dest = Join-Path $env:USERPROFILE '.gemini\antigravity-cli\antigravity-oauth-token'
New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
[IO.File]::WriteAllText($dest, $text.Trim(), (New-Object System.Text.UTF8Encoding $false))
Write-Output "Wrote $dest"
Write-Output "expiry=$($parsed.token.expiry)"
```

The file is:

`%USERPROFILE%\.gemini\antigravity-cli\antigravity-oauth-token`

Create the secret `AGY_CREDENTIALS` and paste that whole file. Do not commit it. The workflow writes it to `~/.gemini/antigravity-cli/antigravity-oauth-token` and sets `GEMINI_FORCE_FILE_STORAGE` so the Linux runner reads the file. The access token expires within about an hour. The refresh token in the same file is what the runner uses to sign in again.

Confirm the local CLI with `agy --version` and list models with `agy models`.

### GitHub token

For a local run, sign the GitHub CLI in to this repository. That login is stored by `gh` and is the token the harness uses to push and open a pull request.

```powershell
gh auth login
```

Choose GitHub.com, HTTPS, and authenticate in the browser. When asked for scopes, include `repo`. Check with `gh auth status`.

For GitHub Actions, turn on write access for the automatic token:

1. Open **Settings → Actions → General**.
2. Under **Workflow permissions**, select **Read and write permissions**.
3. Save.

That automatic token is `GITHUB_TOKEN`. The harness job already has `contents: write` and `pull-requests: write`, so it can push `automate/qase-<id>` and open the pull request.

Create a personal access token only when you want `git` or another tool to authenticate without `gh auth login`:

1. Open [Fine-grained tokens](https://github.com/settings/personal-access-tokens).
2. Generate a token for this repository.
3. Grant **Contents: Read and write** and **Pull requests: Read and write**.
4. Copy the token once.

Use it as the password for `gh auth login` or `gh auth login --with-token`. Do not add it to the AI Harness workflow. The workflow already receives `GITHUB_TOKEN`.

## Models

Default models are `gemini-3.8-flash-medium` and, on failure, `gemini-3.1-pro-high`. Override them with `HARNESS_MODEL` and `HARNESS_FALLBACK_MODEL` after checking `agy models`.

## Files the agent reads

| File | Role |
| :--- | :--- |
| `GEMINI.md` | Instructions `agy` loads for this repo |
| `docs/FRD-QADemo.md` | Full product requirements |
| `docs/kb/product-knowledge.md` | Gap-fill steps and validations |
| `docs/kb/app-map.md` | Route, page object, fixture, and spec |
| `docs/kb/pom-index.md` | Existing methods. Refresh with `npm run index:pom` |
| `.agents/skills/automate/SKILL.md` | Stage-by-stage procedure |
