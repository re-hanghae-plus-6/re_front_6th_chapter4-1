export function safeSerialize<T>(data: T): string {
  const json = JSON.stringify(data);
  return json
    .replace(/</g, "\u003C")
    .replace(/>/g, "\u003E")
    .replace(/\u2028/g, "\u2028")
    .replace(/\u2029/g, "\u2029");
}
