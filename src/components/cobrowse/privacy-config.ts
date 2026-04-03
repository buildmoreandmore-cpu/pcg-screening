export const privacyConfig = {
  maskAllInputs: true,
  maskInputOptions: {
    password: true,
  },
  maskInputFn: (text: string) => {
    return text.replace(/./g, '*')
  },
  blockClass: 'rr-block',
  maskTextClass: 'rr-mask',
  // Throttle high-frequency events to reduce bandwidth
  sampling: {
    mousemove: 150,      // capture mouse position every 150ms (not every pixel)
    mouseInteraction: true,
    scroll: 200,         // capture scroll every 200ms
    media: 800,
    input: 'last' as const,  // only send final input value, not every keystroke
  },
  // Take a full checkpoint every 30s instead of default 10s
  checkoutEveryNms: 30000,
  slimDOMOptions: {
    script: true,
    comment: true,
    headFavicon: true,
    headWhitespace: true,
    headMetaDescKeywords: true,
    headMetaSocial: true,
    headMetaRobots: true,
    headMetaHttpEquiv: true,
    headMetaVerification: true,
    headMetaAuthorship: true,
  },
}
