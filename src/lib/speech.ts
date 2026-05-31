// Remove emojis and pictographic symbols, keep readable text only
export function stripEmojis(text: string): string {
  return text
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Presentation}\p{Emoji_Modifier}\p{Emoji_Component}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function speakText(text: string, onEnd?: () => void): boolean {
  const clean = stripEmojis(text);
  if (!clean) {
    onEnd?.();
    return false;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = "pt-BR";
  utterance.rate = 0.85;
  utterance.pitch = 1.1;
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking() {
  window.speechSynthesis.cancel();
}
