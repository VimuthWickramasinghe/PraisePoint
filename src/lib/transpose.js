const chords = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function transposeChord(chord, step) {
    let index = chords.indexOf(chord);
    if (index === -1) return chord;
    return chords[(index + step + chords.length) % chords.length];
}

export function transposeSong(song, step) {
    return song.replace(/\b[A-G]#?\b/g, match => transposeChord(match, step));
}