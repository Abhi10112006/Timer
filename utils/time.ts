export const formatTime = (secondsOrMs: number, showMs = false) => {
  if (showMs) {
    const ms = secondsOrMs;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const cs = Math.floor((ms % 1000) / 10); // Centiseconds

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    const csStr = cs.toString().padStart(2, '0');

    if (h > 0) {
        return `${h}:${mStr}:${sStr}.${csStr}`;
    }
    return `${mStr}:${sStr}.${csStr}`;
  } else {
    const totalSeconds = Math.ceil(secondsOrMs);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
};