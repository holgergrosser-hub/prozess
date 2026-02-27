function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`Missing env var: ${name}`);
    }
    return value;
}

function jsonResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify(body)
    };
}

function toBase64Utf8(text) {
    return Buffer.from(text, 'utf8').toString('base64');
}

function fromBase64Utf8(base64Text) {
    return Buffer.from(base64Text, 'base64').toString('utf8');
}

function encodeGitHubPath(path) {
    return String(path)
        .split('/')
        .map(segment => encodeURIComponent(segment))
        .join('/');
}

function normalizeCategory(value) {
    if (value == null) return '';
    const raw = String(value).trim().toLowerCase();
    if (!raw) return '';
    if (raw === 'fuehrung' || raw === 'wertschoepfung' || raw === 'unterstuetzung') return raw;
    if (raw === '1') return 'fuehrung';
    if (raw === '2') return 'wertschoepfung';
    if (raw === '3') return 'unterstuetzung';

    const s = raw
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss');

    if (s.includes('fuehr')) return 'fuehrung';
    if (s.includes('wert') || s.includes('schoepf')) return 'wertschoepfung';
    if (s.includes('unter') || s.includes('stuetz')) return 'unterstuetzung';
    return '';
}

async function githubRequest(url, { method = 'GET', token, body } = {}) {
    const headers = {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'prozess-editor-netlify'
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await res.text();
    let json;
    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        json = null;
    }

    if (!res.ok) {
        const err = new Error(`GitHub API error ${res.status}`);
        err.status = res.status;
        err.responseText = text;
        err.responseJson = json;
        throw err;
    }

    return json;
}

exports.handler = async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' });
    }

    if (!context?.clientContext?.user) {
        return jsonResponse(401, { error: 'Unauthorized (Netlify Identity required)' });
    }

    let payload;
    try {
        payload = JSON.parse(event.body || '{}');
    } catch {
        return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const processKey = typeof payload.processKey === 'string' ? payload.processKey.trim() : '';
    const isDelete = payload?.delete === true || String(payload?.action || '').toLowerCase() === 'delete';
    const processData = payload.process;

    if (!processKey || !/^[a-z0-9\-]{3,64}$/.test(processKey)) {
        return jsonResponse(400, { error: 'Invalid processKey' });
    }

    if (!isDelete && (!processData || typeof processData !== 'object')) {
        return jsonResponse(400, { error: 'Missing process' });
    }

    try {
        const owner = getRequiredEnv('GITHUB_OWNER');
        const repo = getRequiredEnv('GITHUB_REPO');
        const token = getRequiredEnv('GITHUB_TOKEN');
        const branch = process.env.GITHUB_BRANCH || 'main';
        const dataPath = process.env.GITHUB_DATA_PATH || 'data/processes.json';

        const getUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(dataPath)}?ref=${encodeURIComponent(branch)}`;
        const existing = await githubRequest(getUrl, { token });

        const decoded = fromBase64Utf8(existing.content || '');
        let fileJson;
        try {
            fileJson = JSON.parse(decoded);
        } catch {
            fileJson = null;
        }

        if (!fileJson || !Array.isArray(fileJson.processes)) {
            return jsonResponse(500, { error: 'Invalid processes.json format (expected {processes: []})' });
        }

        const processes = fileJson.processes;
        const idx = processes.findIndex(p => p && p.key === processKey);
        if (isDelete) {
            if (idx >= 0) {
                processes.splice(idx, 1);
            }
        } else {
            const category = normalizeCategory(processData.category) || 'unterstuetzung';
            const description = typeof processData.description === 'string' ? processData.description : '';
            const nextProc = {
                key: processKey,
                category,
                title: processData.title || 'Neuer Prozess',
                description,
                swimlanes: Array.isArray(processData.swimlanes) ? processData.swimlanes : [],
                connections: Array.isArray(processData.connections) ? processData.connections : []
            };

            if (idx >= 0) {
                processes[idx] = nextProc;
            } else {
                processes.push(nextProc);
            }
        }

        const newContent = JSON.stringify({ processes }, null, 2) + '\n';

        const putUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeGitHubPath(dataPath)}`;
        const commitMessage = isDelete ? `chore(process): delete ${processKey}` : `chore(process): update ${processKey}`;

        const updated = await githubRequest(putUrl, {
            method: 'PUT',
            token,
            body: {
                message: commitMessage,
                content: toBase64Utf8(newContent),
                sha: existing.sha,
                branch
            }
        });

        return jsonResponse(200, {
            ok: true,
            processKey,
            deleted: isDelete,
            commit: updated?.commit?.sha || null,
            url: updated?.commit?.html_url || null
        });
    } catch (err) {
        console.error(err);
        return jsonResponse(500, {
            error: 'Publish failed',
            details: err?.responseJson || err?.responseText || err?.message || String(err)
        });
    }
};
