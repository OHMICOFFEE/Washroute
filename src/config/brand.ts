export interface BrandConfig {
  clientId:      string
  name:          string
  shortName:     string
  tagline:       string
  logoUrl:       string | null
  faviconUrl:    string | null
  primaryColor:  string
  accentColor:   string
  phone:         string | null
  email:         string | null
  website:       string | null
  address:       string | null
  instagram:     string | null
  facebook:      string | null
  cssVars:       Record<string, string>
}

const CLIENTS: Record<string, BrandConfig> = {
  default: {
    clientId: 'default', name: 'Ohmi Pay', shortName: 'Ohmi Pay',
    tagline: 'Premium Vehicle Concierge',
    logoUrl: null, faviconUrl: null,
    primaryColor: '#000000', accentColor: '#1a1a1a',
    phone: null, email: null, website: null, address: null, instagram: null, facebook: null,
    cssVars: {
      '--brand-primary':    '#000000',
      '--brand-accent':     '#1a1a1a',
      '--brand-glow':       'rgba(0,0,0,0.2)',
      '--brand-subtle':     'rgba(0,0,0,0.06)',
      '--brand-border':     'rgba(0,0,0,0.15)',
      '--btn-primary-from': '#000000',
      '--btn-primary-to':   '#1a1a1a',
    },
  },
  'exclusive-speedwash': {
    clientId: 'exclusive-speedwash',
    name: 'Exclusive Speedwash', shortName: 'Speedwash',
    tagline: 'Premium Car Wash & Detailing',
    logoUrl: '/logos/exclusive-speedwash.webp', faviconUrl: '/logos/exclusive-speedwash.webp',
    primaryColor: '#f97316', accentColor: '#ea580c',
    phone: null, email: 'book@exclusivespeedwash.co.za',
    website: 'https://exclusivespeedwash.co.za',
    address: null, instagram: '@exclusivespeedwash', facebook: 'exclusivespeedwash',
    cssVars: {
      '--brand-primary':    '#f97316',
      '--brand-accent':     '#ea580c',
      '--brand-glow':       'rgba(249,115,22,0.45)',
      '--brand-subtle':     'rgba(249,115,22,0.14)',
      '--brand-border':     'rgba(249,115,22,0.4)',
      '--btn-primary-from': '#f97316',
      '--btn-primary-to':   '#ea580c',
      // Dark theme — matches the black/orange Exclusive Speedwash logo
      '--surface-bg':       '#070707',
      '--surface-card':     '#141414',
      '--surface-elevated': '#181818',
      '--surface-inset':    '#0f0f0f',
      '--surface-border':   'rgba(255,255,255,0.08)',
      '--text-primary':     '#ffffff',
      '--text-secondary':   '#a3a3a3',
      '--text-tertiary':    '#6b6b6b',
      // Neon glow accents
      '--neon-glow-sm':     '0 0 12px rgba(249,115,22,0.35)',
      '--neon-glow-md':     '0 0 24px rgba(249,115,22,0.4), 0 0 4px rgba(249,115,22,0.6)',
      '--neon-glow-lg':     '0 0 48px rgba(249,115,22,0.35), 0 0 12px rgba(249,115,22,0.5)',
      '--neon-edge':        '1.5px solid rgba(249,115,22,0.5)',
    },
  },
}

export function getBrandConfig(): BrandConfig {
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'default'
  return CLIENTS[clientId] ?? CLIENTS['default']
}

export function getAllClients(): BrandConfig[] {
  return Object.values(CLIENTS)
}