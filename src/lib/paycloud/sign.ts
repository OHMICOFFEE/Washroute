import crypto from 'crypto'

/**
 * PayCloud RSA2 (SHA256withRSA) signing utilities.
 * Docs: https://developers.paycloud.africa/docs/public/Sign
 */

function toPemPrivateKey(rawKey: string): string {
  const clean = rawKey.replace(/-----BEGIN.*?-----/g, '').replace(/-----END.*?-----/g, '').replace(/\s+/g, '')
  const lines = clean.match(/.{1,64}/g) ?? []
  return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`
}

function toPemPublicKey(rawKey: string): string {
  const clean = rawKey.replace(/-----BEGIN.*?-----/g, '').replace(/-----END.*?-----/g, '').replace(/\s+/g, '')
  const lines = clean.match(/.{1,64}/g) ?? []
  return `-----BEGIN PUBLIC KEY-----\n${lines.join('\n')}\n-----END PUBLIC KEY-----`
}

/**
 * Build the "Content_To_Be_Signed" string per PayCloud rules:
 * - Exclude the `sign` field itself
 * - Exclude null/empty string values
 * - Sort remaining keys ascending by ASCII
 * - Join as key=value pairs with "&"
 */
export function buildSignString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([key, value]) => key !== 'sign' && value !== null && value !== undefined && value !== '')
    .map(([key, value]) => {
      const strValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      return [key, strValue] as [string, string]
    })
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  return entries.map(([key, value]) => `${key}=${value}`).join('&')
}

/** Sign a params object with our PKCS8 RSA private key (SHA256withRSA). */
export function signParams(params: Record<string, unknown>, privateKeyBase64: string): string {
  const contentToSign = buildSignString(params)
  const pem = toPemPrivateKey(privateKeyBase64)
  const signer = crypto.createSign('RSA-SHA256')
  signer.update(contentToSign, 'utf8')
  signer.end()
  return signer.sign(pem, 'base64')
}

/** Verify a signature from PayCloud (response or webhook) using their gateway public key. */
export function verifySignature(params: Record<string, unknown>, signatureBase64: string, gatewayPublicKeyBase64: string): boolean {
  const contentToVerify = buildSignString(params)
  const pem = toPemPublicKey(gatewayPublicKeyBase64)
  const verifier = crypto.createVerify('RSA-SHA256')
  verifier.update(contentToVerify, 'utf8')
  verifier.end()
  try {
    return verifier.verify(pem, signatureBase64, 'base64')
  } catch {
    return false
  }
}