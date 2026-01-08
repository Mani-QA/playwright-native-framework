# GitHub Pages Setup for Playwright Reports

This guide explains how to publish Playwright test reports to GitHub Pages.

## Prerequisites

- GitHub repository with Actions enabled
- Playwright tests configured with HTML reporter

## Repository Settings

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in the left sidebar under "Code and automation")
3. Under **Source**, select **GitHub Actions**
4. Click **Save**

![GitHub Pages Settings](https://docs.github.com/assets/cb-22286/mw-1440/images/help/pages/pages-source-actions.webp)

### Step 2: Verify Workflow Permissions

1. Go to **Settings** → **Actions** → **General**
2. Scroll to **Workflow permissions**
3. Select **Read and write permissions**
4. Check **Allow GitHub Actions to create and approve pull requests** (optional)
5. Click **Save**

## How It Works

The workflow automatically:

1. **Runs tests** - Executes all Playwright tests
2. **Generates HTML report** - Creates a detailed interactive report
3. **Deploys to GitHub Pages** - Publishes the report (only on main/master branch pushes)

### Workflow Configuration

The workflows are configured with the necessary permissions:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

And use the official GitHub Pages actions:

```yaml
- name: Setup Pages
  uses: actions/configure-pages@v4

- name: Upload to GitHub Pages
  uses: actions/upload-pages-artifact@v3
  with:
    path: playwright-report/

- name: Deploy to GitHub Pages
  uses: actions/deploy-pages@v4
```

## Accessing the Report

After a successful deployment, your report will be available at:

```
https://<username>.github.io/<repository-name>/
```

For example:
- Repository: `github.com/manivannan-g/playwright-native-framework`
- Report URL: `https://manivannan-g.github.io/playwright-native-framework/`

## Deployment Rules

| Event | Branch | Deploys to GitHub Pages? |
|-------|--------|--------------------------|
| Push | main/master | ✅ Yes |
| Push | develop | ❌ No |
| Pull Request | any | ❌ No |
| Manual trigger | main/master | ✅ Yes |
| Scheduled run | main/master | ✅ Yes |

## Report History

Each deployment **overwrites** the previous report. For historical reports:

1. **Artifacts**: Download from the Actions run (retained for 30 days)
2. **Custom solution**: Implement timestamped folders (advanced)

### Viewing Artifacts

1. Go to **Actions** tab in your repository
2. Click on a workflow run
3. Scroll to **Artifacts** section
4. Download `playwright-report` artifact

## Troubleshooting

### "Pages not enabled" Error

**Solution**: Enable GitHub Pages in repository Settings → Pages → Source: GitHub Actions

### "Permission denied" Error

**Solution**: Check workflow permissions in Settings → Actions → General → Workflow permissions

### Report Not Updating

**Possible causes**:
1. Workflow only deploys on `main`/`master` branches
2. Check if the deploy job ran successfully in Actions
3. Browser cache - try hard refresh (Ctrl+Shift+R)

### "Environment not found" Error

**Solution**: The first deployment will automatically create the `github-pages` environment. If you see this error:
1. Go to **Settings** → **Environments**
2. Check if `github-pages` exists
3. If not, re-run the workflow

## Advanced: Custom Domain

To use a custom domain:

1. Go to **Settings** → **Pages**
2. Enter your custom domain under **Custom domain**
3. Configure your DNS provider:
   - For apex domain: Add A records pointing to GitHub's IPs
   - For subdomain: Add CNAME record pointing to `<username>.github.io`

## Example Report URL

Once deployed, the Playwright HTML report provides:

- ✅ Test summary with pass/fail counts
- ✅ Detailed test results with screenshots
- ✅ Trace viewer for debugging
- ✅ Filtering and search capabilities
- ✅ Video recordings (if enabled)

---

## Related Documentation

- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [Playwright HTML Reporter](https://playwright.dev/docs/test-reporters#html-reporter)
- [GitHub Actions for Pages](https://github.com/actions/deploy-pages)
