/**
 * PayCloud configuration.
 * Sandbox values are PayCloud's published public test credentials —
 * safe defaults so the integration works out of the box in dev.
 * Real production values MUST come from environment variables and
 * should never be committed to the repo.
 */

const SANDBOX = {
  endpoint: 'https://addpay-open.wangtest.cn/api/entry',
  appId: 'wz715fc0d10ee9d156',
  merchantNo: '302100085224',
  storeNo: '4021000637',
  gatewayRsaPublicKey:
    'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA2m4nkQKyQAxJc8VVsz/L6qVbtDWRTBolUK8Dwhi9wH6aygA6363PVNEPM8eRI5W19ssCyfdtNFy6DRAureoYV053ETPUefEA5bHDOQnjbb9PuNEfT651v8cqwEaTptaxj2zujsWI8Ad3R50EyQHsskQWms/gv2aB36XUM4vyOIk4P1f3dxtqigH0YROEYiuwFFqsyJuNSjJzNbCmfgqlQv/+pE/pOV9MIQe0CAdD26JF10QpSssEwKgvKvnXPUynVu09cjSEipev5cLJSApKSDZxrRjSFBXrh6nzg8JK05ehkI8wdsryRUneh0PGN0PgYLP/wjKiqlgTJaItxnb/JQIDAQAB',
  appRsaPrivateKey:
    'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCqYYFrbdXFhOv3zEo4fmORUmYKsadE/QMJhD5kGzthsfwvMoqJHzN41rrGWOp4ljL64elsd2amgnEkWi8ImtV9hS4IKLft/Lq0oP5OBUvbqldaG6KX5wjq7Q11W7Ec5/tSX0IdAtV++UaO/IJyydn2JNZjspeSxbUuE+cymGs9sXtO5s5wRQmeJWv3VhDzQMj8N0ptD2dVvoFkKZ7lbnpNo9ULwAn2oVQgLrmEv/R+TEZPiAcCIhcez4eimY9i6ucTcj4I9liUeTgydAnNAesQZDCt3qQyfl8EZvfWtCUVVbin4uiYsxbzcFSW3q0q27fLsruPRGf+XHnjbR4438MpAgMBAAECggEAMo4YDr5abe9Q7QgLBdRKyvX+HTI1hbzlR8+bi6yg5A4h3AdNH/7IERT1+qCrgfhfTB34WxzaspGF7Nltl0oKCuKXlAgw+0bAR5R1oMTli1px7OTCS/xbowmPssDwPrl+0yQ8w8rxemmQzCCUvGa0a9rmWlLFsuFDL1bshRDA0V73/RB+GG2GtYQFwcu9RgbWcb8YUXBkck7UccGfSoLhtiiDISYTcQy7FQUZHXrr/v6BapG/oVp0PXwIyglw44rHFbpAQVFZw7SzEJcJmLj3PPZkzTGOEPB1b+4Mv0jQszKx+O2whbziXoZGaBWW7jsozi07f0+xom8vWUOd0GhgWQKBgQD97kSx4U2PlnCOvVjHAXWAqBmw2L4gngoCQndWZTTx95nAX4OUUKljWWJhC1/9x/21l52SZhO3q/TAgHON42zIf/1PSDaUuhTATAqrHCgudpRTVd9X1bvJItXNvmbLKkb2hXUPnrd2DxasZI8YAgp6CJFmH+g5plrKF90y1JahowKBgQCrxPEO1CpG/Xso7PuW9fqdz+wS2F6S9UXFm4V0+CcL49ieCY7ImOFtXsTJjQrZEQE7DhONjic07Xd1xlyFjY6RJ5FlFSPGoU3rmbaDKPvcK65nNaH/Nf8V1iWZqTl5Cg4jKboNRilVtAcF+hJNC7jmOdk/kxLDLobxN7XYiiUMwwKBgQCNSrDqkUTI6pqCshTd1o/9IIv6/P79wzIqg7VHW1UUdgMVKZBbTG6UGz5EZUHqQgeHrW898JJ0Frg/DLo/bxYukhjurm3AX7IANc+R2j75a32oyRVXGFQ+3KU+r/0ees21ihjSsiu/AzJIhkOgxjHyKSZOPt7GhSvrW0/3YpbWJQKBgGBJ3F/Vq4V0HxBIGJj9dun0XoAJ7qou+FfX4K47VZgit5GQBgyJNwVadLIPcJ9SGwCB2ZAmue+/lpHdCoyLV/oi1ix190Intkh2OIu588XubqvIsvEf0cjp7NYAuQkTC+3GPFeolw9GBhHhp1StV48nqpMq3P+xG1ApTLUAa9iFAoGAQrbQRkq3TIbsTYIpxE5kM5fgHaaHlcg6qoiLzHuEidWXVa3PssJQnJs5jKGFcErWjn3o3ttfrllk3mm5MzJCChse9a54/KifNhCeDcCQHl/+WPswRBjYz5rw5XJacmz7S8rd7JEEXT2fY3uv47ey4N9CZaWw+Y0UzQ8MeAAJ5jY=',
}

export interface PayCloudConfig {
  endpoint: string
  appId: string
  merchantNo: string
  storeNo: string
  gatewayRsaPublicKey: string
  appRsaPrivateKey: string
  isSandbox: boolean
}

export function getPayCloudConfig(): PayCloudConfig {
  const isSandbox = process.env.PAYCLOUD_ENV !== 'production'

  if (isSandbox) {
    return { ...SANDBOX, isSandbox: true }
  }

  // Production — every value MUST come from env vars. Throw loudly if missing
  // rather than silently falling back to sandbox creds in prod.
  const required = (name: string, value: string | undefined): string => {
    if (!value) throw new Error(`Missing required env var for PayCloud production: ${name}`)
    return value
  }

  return {
    isSandbox: false,
    endpoint: process.env.PAYCLOUD_ENDPOINT ?? 'https://addpay-op.wangtest.cn/api/entry',
    appId: required('PAYCLOUD_APP_ID', process.env.PAYCLOUD_APP_ID),
    merchantNo: required('PAYCLOUD_MERCHANT_NO', process.env.PAYCLOUD_MERCHANT_NO),
    storeNo: required('PAYCLOUD_STORE_NO', process.env.PAYCLOUD_STORE_NO),
    gatewayRsaPublicKey: required('PAYCLOUD_GATEWAY_RSA_PUBLIC_KEY', process.env.PAYCLOUD_GATEWAY_RSA_PUBLIC_KEY),
    appRsaPrivateKey: required('PAYCLOUD_APP_RSA_PRIVATE_KEY', process.env.PAYCLOUD_APP_RSA_PRIVATE_KEY),
  }
}