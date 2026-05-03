/**
 * Kawaii — Publish to Site
 *
 * Adds a "Kawaii" menu to Google Docs with a "Publish to site" button that
 * triggers a GitHub Actions workflow via repository_dispatch.
 *
 * Setup:
 *   1. In Drive, open the root content folder. Tools → Apps Script (or
 *      script.google.com → New project) and paste this file.
 *   2. Project Settings → Script properties, add:
 *        GITHUB_OWNER         e.g. easingthemes
 *        GITHUB_REPO          e.g. kawaii
 *        GITHUB_TOKEN         a fine-grained PAT with "Actions: read+write"
 *                             scoped to that single repo
 *   3. Deploy → Test deployments → Editor add-on (or just bind it to a
 *      single doc by opening Extensions → Apps Script from any doc).
 *   4. Reload a Google Doc → "Kawaii" menu appears next to Help.
 */

const EVENT_TYPE = 'docs-publish';

function onOpen() {
  DocumentApp.getUi()
    .createMenu('Kawaii')
    .addItem('Publish this doc to site', 'publishCurrent')
    .addItem('Republish entire site', 'publishAll')
    .addSeparator()
    .addItem('Open site repo', 'openRepo')
    .addToUi();
}

function publishCurrent() {
  const doc = DocumentApp.getActiveDocument();
  dispatch_({
    reason: 'single-doc',
    docId: doc.getId(),
    docName: doc.getName(),
    triggeredBy: Session.getActiveUser().getEmail(),
  });
  toast_(`Publishing "${doc.getName()}" — site rebuild started.`);
}

function publishAll() {
  const ui = DocumentApp.getUi();
  const resp = ui.alert(
    'Republish entire site',
    'This will pull every published doc from Drive and rebuild the site. Continue?',
    ui.ButtonSet.OK_CANCEL,
  );
  if (resp !== ui.Button.OK) return;
  dispatch_({
    reason: 'full-resync',
    triggeredBy: Session.getActiveUser().getEmail(),
  });
  toast_('Full site rebuild started.');
}

function openRepo() {
  const { owner, repo } = props_();
  const url = `https://github.com/${owner}/${repo}/actions`;
  DocumentApp.getUi().showModalDialog(
    HtmlService.createHtmlOutput(`<a href="${url}" target="_blank">Open ${owner}/${repo} actions →</a>`).setWidth(360).setHeight(80),
    'Site repository',
  );
}

function dispatch_(payload) {
  const { owner, repo, token } = props_();
  const url = `https://api.github.com/repos/${owner}/${repo}/dispatches`;
  const res = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    muteHttpExceptions: true,
    payload: JSON.stringify({ event_type: EVENT_TYPE, client_payload: payload }),
  });
  const code = res.getResponseCode();
  if (code >= 300) {
    throw new Error(`GitHub dispatch failed: ${code} ${res.getContentText()}`);
  }
}

function props_() {
  const sp = PropertiesService.getScriptProperties();
  const owner = sp.getProperty('GITHUB_OWNER');
  const repo = sp.getProperty('GITHUB_REPO');
  const token = sp.getProperty('GITHUB_TOKEN');
  if (!owner || !repo || !token) {
    throw new Error('Missing script property: GITHUB_OWNER / GITHUB_REPO / GITHUB_TOKEN');
  }
  return { owner, repo, token };
}

function toast_(msg) {
  // Toasts only work in Sheets/Forms; in Docs we fall back to a brief modal.
  try {
    SpreadsheetApp.getActive().toast(msg);
  } catch (_) {
    DocumentApp.getUi().showModalDialog(
      HtmlService.createHtmlOutput(`<p>${msg}</p>`).setWidth(320).setHeight(60),
      'Kawaii',
    );
    Utilities.sleep(1500);
  }
}
