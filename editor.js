// Editor Hauptlogik
let currentProcess = null;
let currentProcessKey = null;
let connectionMode = false;
let connectionStart = null;
let draggedElement = null;
let masterConfig = {};

// Init
function init() {
    const urlParams = new URLSearchParams(window.location.search);
    currentProcessKey = urlParams.get('process');
    
    loadMasterConfig();
    
    if (currentProcessKey === 'new') {
        currentProcess = JSON.parse(JSON.stringify(EMPTY_PROCESS));
    } else if (PROCESS_DATA[currentProcessKey]) {
        currentProcess = JSON.parse(JSON.stringify(PROCESS_DATA[currentProcessKey]));
    } else {
        window.location.href = 'index.html';
        return;
    }
    
    renderProcess();
    attachEventListeners();
}

function loadMasterConfig() {
    const saved = localStorage.getItem('masterConfig');
    if (saved) {
        masterConfig = JSON.parse(saved);
    } else {
        masterConfig = {
            logo: 'SIUT',
            ersteller: 'QMB',
            pruefung: 'Prozessverantwortlicher',
            freigabe: 'GF',
            docPrefix: 'Prozess_',
            version: 'v1.0'
        };
    }
}

function renderProcess() {
    const container = document.getElementById('processContainer');
    
    let html = `
        <div class="process-header">
            <div class="process-title" contenteditable="true">${currentProcess.title}</div>
            <div class="logo-area" contenteditable="true">${masterConfig.logo}</div>
        </div>
        <div class="canvas-wrapper">
            <div class="canvas">
    `;
    
    currentProcess.swimlanes.forEach((lane, idx) => {
        html += `
            <div class="swimlane">
                <div class="swimlane-label" contenteditable="true">
                    ${lane.name}
                    <button class="delete-lane" onclick="deleteSwimlane(${idx})">×</button>
                </div>
                <div class="swimlane-content" data-lane="${idx}">
        `;
        
        lane.boxes.forEach(box => {
            html += createBoxHTML(box);
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            </div>
        </div>
        <div class="process-footer">
            <div class="footer-field">
                <div class="footer-label">Ersteller:</div>
                <div class="footer-value" contenteditable="true">${masterConfig.ersteller}</div>
            </div>
            <div class="footer-field">
                <div class="footer-label">Prüfung:</div>
                <div class="footer-value" contenteditable="true">${masterConfig.pruefung}</div>
            </div>
            <div class="footer-field">
                <div class="footer-label">Freigabe:</div>
                <div class="footer-value" contenteditable="true">${masterConfig.freigabe}</div>
            </div>
            <div class="footer-field">
                <div class="footer-label">Dokument:</div>
                <div class="footer-value" contenteditable="true">${masterConfig.docPrefix}${currentProcessKey}_${masterConfig.version}</div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    setTimeout(() => {
        drawConnections();
    }, 100);
}

function createBoxHTML(box) {
    let sizeStyle = '';
    if (box.type === 'decision') {
        sizeStyle = 'width: 120px; height: 120px;';
    } else if (box.type === 'software') {
        sizeStyle = 'width: 100px; height: 100px;';
    }
    
    return `
        <div class="process-box box-${box.type}" 
             id="${box.id}" 
             draggable="true"
             style="left: ${box.x}px; top: ${box.y}px; ${sizeStyle}">
            <span contenteditable="true">${box.text.replace(/\n/g, '<br>')}</span>
            <button class="delete-box" onclick="deleteBox('${box.id}')">×</button>
        </div>
    `;
}

function drawConnections() {
    const canvas = document.querySelector('.canvas');
    let svg = canvas.querySelector('.arrow-layer');
    if (svg) svg.remove();
    
    if (!currentProcess.connections || currentProcess.connections.length === 0) return;
    
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'arrow-layer');
    svg.innerHTML = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto"><polygon points="0 0, 10 3, 0 6" fill="#000"/></marker></defs>';
    
    currentProcess.connections.forEach((conn, idx) => {
        const from = document.getElementById(conn.from);
        const to = document.getElementById(conn.to);
        if (!from || !to) return;
        
        const fromCenter = getBoxCenter(from);
        const toCenter = getBoxCenter(to);
        
        const midX = (fromCenter.x + toCenter.x) / 2;
        const path = `M ${fromCenter.x} ${fromCenter.y} Q ${midX} ${fromCenter.y}, ${midX} ${(fromCenter.y + toCenter.y) / 2} T ${toCenter.x} ${toCenter.y}`;
        
        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('d', path);
        pathEl.setAttribute('class', 'arrow-line');
        pathEl.setAttribute('marker-end', 'url(#arrowhead)');
        svg.appendChild(pathEl);
        
        if (conn.label) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', midX);
            text.setAttribute('y', (fromCenter.y + toCenter.y) / 2);
            text.setAttribute('class', 'arrow-label');
            text.setAttribute('text-anchor', 'middle');
            text.textContent = conn.label;
            svg.appendChild(text);
        }
    });
    
    canvas.appendChild(svg);
}

function getBoxCenter(box) {
    return {
        x: box.offsetLeft + box.offsetWidth / 2,
        y: box.offsetTop + box.offsetHeight / 2
    };
}

function attachEventListeners() {
    document.querySelectorAll('.process-box').forEach(box => {
        box.addEventListener('dragstart', handleDragStart);
        box.addEventListener('dragend', handleDragEnd);
        box.addEventListener('click', handleBoxClick);
    });
    
    document.querySelectorAll('.swimlane-content').forEach(lane => {
        lane.addEventListener('dragover', e => e.preventDefault());
        lane.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedElement = e.target.closest('.process-box');
    if (draggedElement) {
        draggedElement.classList.add('dragging');
    }
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
        updateBoxPosition(draggedElement);
        drawConnections();
    }
}

function handleDrop(e) {
    e.preventDefault();
    if (!draggedElement) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - 60;
    const y = e.clientY - rect.top - 30;
    
    draggedElement.style.left = Math.max(0, x) + 'px';
    draggedElement.style.top = Math.max(0, y) + 'px';
    
    if (draggedElement.parentElement !== e.currentTarget) {
        e.currentTarget.appendChild(draggedElement);
    }
}

function handleBoxClick(e) {
    if (!connectionMode) return;
    
    e.stopPropagation();
    const box = e.target.closest('.process-box');
    
    if (!connectionStart) {
        connectionStart = box;
        box.classList.add('selected');
    } else {
        const label = prompt('Label (optional, z.B. "Ja", "Nein"):') || '';
        
        currentProcess.connections.push({
            from: connectionStart.id,
            to: box.id,
            label: label
        });
        
        connectionStart.classList.remove('selected');
        connectionStart = null;
        drawConnections();
    }
}

function updateBoxPosition(box) {
    const laneIdx = parseInt(box.parentElement.dataset.lane);
    const boxData = currentProcess.swimlanes[laneIdx].boxes.find(b => b.id === box.id);
    if (boxData) {
        boxData.x = parseInt(box.style.left);
        boxData.y = parseInt(box.style.top);
    }
}

function addBox(type) {
    const id = `custom-${Date.now()}`;
    const newBox = {
        id: id,
        type: type,
        text: type === 'decision' ? 'Entscheidung?' : 'Neuer Schritt',
        x: 100,
        y: 50
    };
    
    currentProcess.swimlanes[0].boxes.push(newBox);
    
    const lane = document.querySelector('.swimlane-content');
    if (lane) {
        lane.insertAdjacentHTML('beforeend', createBoxHTML(newBox));
        attachEventListeners();
    }
}

function deleteBox(id) {
    if (!confirm('Box wirklich löschen?')) return;
    
    currentProcess.swimlanes.forEach(lane => {
        lane.boxes = lane.boxes.filter(b => b.id !== id);
    });
    
    currentProcess.connections = currentProcess.connections.filter(
        c => c.from !== id && c.to !== id
    );
    
    renderProcess();
    attachEventListeners();
}

function addSwimlane() {
    const name = prompt('Name der Swimlane:', 'Neuer Bereich');
    if (!name) return;
    
    currentProcess.swimlanes.push({
        name: name,
        boxes: []
    });
    
    renderProcess();
    attachEventListeners();
}

function deleteSwimlane(idx) {
    if (!confirm('Swimlane wirklich löschen?')) return;
    
    currentProcess.swimlanes.splice(idx, 1);
    renderProcess();
    attachEventListeners();
}

function toggleConnectionMode() {
    connectionMode = !connectionMode;
    const btn = document.getElementById('connectionBtn');
    const info = document.getElementById('connectionInfo');
    
    if (connectionMode) {
        btn.style.background = '#4CAF50';
        btn.style.color = 'white';
        info.style.display = 'flex';
    } else {
        btn.style.background = 'white';
        btn.style.color = '#333';
        info.style.display = 'none';
        if (connectionStart) {
            connectionStart.classList.remove('selected');
            connectionStart = null;
        }
    }
}

function saveProcess() {
    // Titel aktualisieren
    const titleEl = document.querySelector('.process-title');
    if (titleEl) {
        currentProcess.title = titleEl.textContent;
    }
    
    // Swimlane-Namen aktualisieren
    document.querySelectorAll('.swimlane-label').forEach((label, idx) => {
        if (currentProcess.swimlanes[idx]) {
            currentProcess.swimlanes[idx].name = label.textContent.replace('×', '').trim();
        }
    });
    
    // Box-Texte aktualisieren
    document.querySelectorAll('.process-box').forEach(box => {
        const span = box.querySelector('span');
        if (span) {
            const text = span.innerHTML.replace(/<br>/g, '\n');
            const laneIdx = parseInt(box.parentElement.dataset.lane);
            const boxData = currentProcess.swimlanes[laneIdx].boxes.find(b => b.id === box.id);
            if (boxData) {
                boxData.text = text;
            }
        }
    });
    
    // In localStorage speichern
    const key = `process_${currentProcessKey}`;
    localStorage.setItem(key, JSON.stringify(currentProcess));
    
    alert('Prozess gespeichert!');
}

function exportHTML() {
    const container = document.getElementById('processContainer');
    const content = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <title>${currentProcess.title} - ${masterConfig.logo}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body style="padding: 20px; background: white;">
    ${container.outerHTML}
</body>
</html>`;
    
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${masterConfig.docPrefix}${currentProcessKey}_${masterConfig.version}.html`;
    a.click();
    URL.revokeObjectURL(url);
}

// Init beim Laden
window.addEventListener('load', init);
