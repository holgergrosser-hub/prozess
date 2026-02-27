// Prozess-Template für neue Prozesse.
// Die Standard-Prozesse werden zur Laufzeit aus /data/processes.json geladen.
// (Diese Datei bleibt als kleines Fallback/Template bestehen.)

const EMPTY_PROCESS = {
    category: 'unterstuetzung',
    description: '',
    title: 'Neuer Prozess',
    swimlanes: [
        {
            name: 'Bereich 1',
            height: 300,
            boxes: []
        }
    ],
    connections: []
};
