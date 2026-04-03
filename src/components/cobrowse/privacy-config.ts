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
