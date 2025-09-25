/**
 * 指定されたミリ秒数だけ待機する
 * @param ms 待機時間（ミリ秒）
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
