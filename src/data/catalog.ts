import type {
  AddOnItem,
  BundleTier,
  CountryConfig,
  CurrencyCode,
  Edition,
  LanguageCode,
  ReviewItem,
} from '../types/store';

export const HERO_SLIDES = [
  { id: 0, label: '01 · Stadium & Mist Cascade', ratioLabel: '4:3 Hero View' },
  { id: 1, label: '02 · Hand-Painted Turf Detail', ratioLabel: 'Detail View' },
  { id: 2, label: '03 · Backflow Chamber Design', ratioLabel: 'Chamber View' },
  { id: 3, label: '04 · Collector Gift Packaging', ratioLabel: 'Unboxing View' },
  { id: 4, label: '05 · Desk & Matchday Setup', ratioLabel: 'Lifestyle View' },
];

export const EDITIONS: Edition[] = [
  { id: 'grand-stadium', number: 1, name: 'The Grand Stadium', subtitle: 'Tiered arena bowl & floodlit turf' },
  { id: '10-maestro', number: 2, name: 'The #10 Maestro (Messi)', subtitle: 'Iconic #10 tribute & sculpted pitch' },
  { id: '7-legend', number: 3, name: 'The #7 Legend (Ronaldo)', subtitle: 'Signature #7 celebration & mist base' },
  { id: 'world-crown', number: 4, name: 'The World Crown (World Cup)', subtitle: 'Golden cup crest & cascading mist' },
  { id: 'golden-boot', number: 5, name: 'The Golden Boot', subtitle: 'Sculpted metallic cleat on lush pitch' },
  { id: 'champions-crest', number: 6, name: 'The Champions Crest', subtitle: 'Classic silver trophy centerpiece' },
  { id: 'golden-glove', number: 7, name: 'The Golden Glove', subtitle: 'Keeper tribute & textured grass plinth' },
  { id: 'heritage-matchball', number: 8, name: 'The Heritage Matchball', subtitle: 'Vintage panel sphere & smoke channel' },
  { id: 'overhead-volley', number: 9, name: 'The Overhead Volley', subtitle: 'Acrobatic strike frozen in resin' },
  { id: 'floodlight-arena', number: 10, name: 'The Floodlight Arena', subtitle: 'Night-match gantry & corner arc' },
];

export const BUNDLE_TIERS: BundleTier[] = [
  {
    id: 'buy-1',
    quantity: 1,
    title: 'Buy 1, Get 1 Free Gift',
    subtitle: '1 Hand-Painted Burner + Starter Cones + Free Gift',
    priceUsd: 43.99,
    compareAtUsd: 61.99,
    savingsUsd: 18.0,
  },
  {
    id: 'buy-2',
    quantity: 2,
    title: 'Buy 2, Get 15% Off + Free Gift',
    subtitle: 'Mix & match 2 editions + Starter Cones + Free Gift',
    priceUsd: 74.99,
    compareAtUsd: 123.99,
    savingsUsd: 49.0,
    badgeText: 'MOST POPULAR',
    discountPill: 'Save 15%',
  },
  {
    id: 'buy-3',
    quantity: 3,
    title: 'Buy 3, Get 25% Off + Free Gift',
    subtitle: 'Mix & match 3 editions + Starter Cones + Free Gift',
    priceUsd: 98.99,
    compareAtUsd: 185.99,
    savingsUsd: 87.0,
    badgeText: 'BEST VALUE',
    discountPill: 'Save 25%',
  },
];

export const ADDONS: AddOnItem[] = [
  {
    id: 'mystery-pitch-box',
    name: 'Mystery Pitch Box',
    description: 'Includes a surprise mini resin trophy + ceramic coaster',
    priceUsd: 14.99,
  },
  {
    id: 'backflow-cone-pack',
    name: 'Backflow Mist Cone Pack',
    description: '80 extra slow-burn cedar, sandalwood & sage cones',
    priceUsd: 14.99,
  },
  {
    id: 'extended-warranty',
    name: '60-Day Extended Warranty',
    description: 'Instant zero-questions replacement for chips or transit damage',
    priceUsd: 4.99,
  },
];

export const EXPRESS_SHIPPING_USD = 12.99;

export const CURRENCIES: Record<
  CurrencyCode,
  { code: CurrencyCode; symbol: string; rate: number; label: string; decimals: number }
> = {
  USD: { code: 'USD', symbol: '$', rate: 1, label: '$ USD', decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', rate: 0.92, label: '€ EUR', decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', rate: 0.79, label: '£ GBP', decimals: 2 },
  CAD: { code: 'CAD', symbol: 'CA$', rate: 1.38, label: 'CA$ CAD', decimals: 2 },
  AUD: { code: 'AUD', symbol: 'A$', rate: 1.53, label: 'A$ AUD', decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', rate: 154, label: '¥ JPY', decimals: 0 },
};

export function convertUsd(amountUsd: number, currency: CurrencyCode): number {
  const cfg = CURRENCIES[currency];
  const raw = amountUsd * cfg.rate;
  if (cfg.decimals === 0) return Math.round(raw);
  return Math.round(raw * 100) / 100;
}

export function formatCurrency(amountUsd: number, currency: CurrencyCode): string {
  const cfg = CURRENCIES[currency];
  const converted = convertUsd(amountUsd, currency);
  return `${cfg.symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: cfg.decimals,
    maximumFractionDigits: cfg.decimals,
  })}`;
}

export const INLINE_SNIPPETS = [
  {
    id: 's1',
    name: 'Liam K.',
    location: 'Manchester, UK',
    edition: 'The Grand Stadium',
    quote: '"Watching the mist roll across the penalty box before kickoff is unreal. Solid resin weight too."',
  },
  {
    id: 's2',
    name: 'Mateo R.',
    location: 'Buenos Aires, AR',
    edition: 'The #10 Maestro (Messi)',
    quote: '"Got the #10 Maestro for my desk. The hand-painted kit stripes and boots look sharp up close."',
  },
  {
    id: 's3',
    name: 'Diogo S.',
    location: 'Lisbon, PT',
    edition: 'The #7 Legend (Ronaldo)',
    quote: '"Bought the 2-pack with a friend—came gift-boxed and arrived safely with starter cones."',
  },
  {
    id: 's4',
    name: 'Hannah W.',
    location: 'Austin, US',
    edition: 'The World Crown (World Cup)',
    quote: '"Best birthday gift I have ever picked for my partner. Now burns a cone every Sunday morning."',
  },
];

export const INITIAL_REVIEWS: ReviewItem[] = [
  {
    id: 'rev-1',
    author_name: 'Callum Henderson',
    location: 'Glasgow, UK',
    edition_name: 'The Grand Stadium',
    rating: 5,
    title: 'Looks like a real matchday fog rolling over the stands',
    body: 'Set this up on my bookshelf next to my scarves. After about 15 seconds the mist pours down the tiers right onto the pitch. Heavy resin feel, zero cheap plastic vibe.',
    verified_purchase: true,
    created_at: '2026-11-12T18:20:00Z',
  },
  {
    id: 'rev-2',
    author_name: 'Sofia Alvarez',
    location: 'Madrid, ES',
    edition_name: 'The #10 Maestro (Messi)',
    rating: 5,
    title: 'Crisp paintwork on the kit and ball',
    body: 'Ordered the Buy 2 bundle so I could pair The #10 Maestro with The World Crown. Both arrived well-cushioned in foam and gift boxes. The backflow smoke flow works best away from ceiling fans.',
    verified_purchase: true,
    created_at: '2026-11-10T14:05:00Z',
  },
  {
    id: 'rev-3',
    author_name: 'Rafael Mendes',
    location: 'Porto, PT',
    edition_name: 'The #7 Legend (Ronaldo)',
    rating: 5,
    title: 'Instant centerpiece for my gaming and match room',
    body: 'The #7 sculpture detail is clean and the matte turf texture catches the mist nicely. Added the extra 80-cone pack and still have plenty left.',
    verified_purchase: true,
    created_at: '2026-11-08T21:40:00Z',
  },
  {
    id: 'rev-4',
    author_name: 'Marcus Vance',
    location: 'Chicago, US',
    edition_name: 'The Golden Boot',
    rating: 5,
    title: 'Thoughtful tribute piece with real weight',
    body: 'Got The Golden Boot and The Floodlight Arena in the 2-bundle. Keeps my home office smelling like cedar while watching midweek European fixtures.',
    verified_purchase: true,
    created_at: '2026-11-05T11:15:00Z',
  },
  {
    id: 'rev-5',
    author_name: 'Noah Lindqvist',
    location: 'Stockholm, SE',
    edition_name: 'The Champions Crest',
    rating: 4,
    title: 'Great gift box, remember to close windows when lighting',
    body: 'First cone drifted sideways because my window was cracked open. Once I closed it, the mist pooled straight down around the trophy base like dry ice. Really cool effect.',
    verified_purchase: true,
    created_at: '2026-11-02T09:30:00Z',
  },
  {
    id: 'rev-6',
    author_name: 'Kenji Takahashi',
    location: 'Osaka, JP',
    edition_name: 'The Overhead Volley',
    rating: 5,
    title: 'Super clean resin casting and steady mist stream',
    body: 'Delivered to Osaka in 9 days with tracking every step. The Overhead Volley pose looks dynamic from every angle and wipes clean easily with a damp cloth.',
    verified_purchase: true,
    created_at: '2026-10-29T16:45:00Z',
  },
  {
    id: 'rev-7',
    author_name: 'Daniel Okafor',
    location: 'London, UK',
    edition_name: 'The Golden Glove',
    rating: 5,
    title: 'Finally a collectible made for goalkeepers',
    body: 'Rarely see keeper-focused decor that isn’t tacky. The Golden Glove edition looks refined on a walnut shelf and the free surprise gift was a nice bonus.',
    verified_purchase: true,
    created_at: '2026-10-24T19:10:00Z',
  },
  {
    id: 'rev-8',
    author_name: 'Lucas Moreau',
    location: 'Lyon, FR',
    edition_name: 'The Heritage Matchball',
    rating: 5,
    title: 'Classic stitched panel detail',
    body: 'Subtle enough for a living room coffee table. The mist curls right around the vintage panels and settles into the turf tray.',
    verified_purchase: true,
    created_at: '2026-10-19T12:00:00Z',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'How does it work?',
    a: 'Mist & Turf burners use hollow-core backflow incense cones. When lit inside the discreet chamber, cooler dense smoke naturally sinks downward through the sculpted channels, creating a slow-moving waterfall of mist across the pitch and figure.',
  },
  {
    q: 'Does it come with incense cones?',
    a: 'Yes. Every burner includes a starter pack of backflow incense cones and tweezers inside the gift box so it is ready to light right out of the packaging. You can also add our 80-cone Backflow Mist Cone Pack above.',
  },
  {
    q: 'What is it made of?',
    a: 'Each piece is cast in solid, heat-resistant natural resin and hand-finished by studio artisans with matte acrylics and protective sealants for crisp pitch lines, boots, kits, and trophy contours.',
  },
  {
    q: 'Any tips for using it?',
    a: 'Place your burner in a draft-free room away from open windows, fans, or AC vents so the mist flows smoothly downward. After burning, wipe the resin turf dish gently with a warm damp cloth to remove natural aromatic oil residue.',
  },
  {
    q: 'When will it arrive?',
    a: 'Orders are inspected, packed, and dispatched within 24–48 business hours. Standard tracked worldwide delivery typically arrives in 7–12 business days, while Express Priority Air delivers in 4–7 business days.',
  },
  {
    q: "What's in the box?",
    a: 'Inside each cushioned Mist & Turf collector box you will find your hand-painted resin burner, a heat-safe mat, brass incense tweezers, a starter pack of backflow cones, and a care card.',
  },
  {
    q: 'Production & shipping',
    a: 'We ship worldwide to over 120 countries with full door-to-door tracking. Every parcel is packed in custom high-density foam inserts to protect delicate edges during international transit.',
  },
  {
    q: 'Damage guarantee',
    a: 'If your burner arrives chipped, cracked, or damaged in transit, message us with your order number and a photo within 14 days (or 60 days with Extended Warranty) and we will dispatch a free replacement immediately.',
  },
  {
    q: 'Made to order: how it works',
    a: 'Because each edition is hand-painted in small production batches rather than mass-stamped, minor brushstroke character makes every piece one of a kind while maintaining strict quality checks before sealing.',
  },
  {
    q: 'Questions about your order?',
    a: 'Use the Contact Us form below or email support@mistandturf.com with your MT-XXXXXX order number. Our team replies within 24–72 hours on business days.',
  },
  {
    q: 'Is this official merchandise?',
    a: 'No. Mist & Turf designs and produces independent, artist-crafted tribute collectibles inspired by iconic football moments and heritage aesthetics. We are not affiliated with or endorsed by any club, league, governing body, or player.',
  },
];

export const COUNTRIES: CountryConfig[] = [
  { code: 'US', name: 'United States', dialCode: '+1', stateLabel: 'State', postalLabel: 'ZIP Code' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', stateLabel: 'County', postalLabel: 'Postcode' },
  { code: 'CA', name: 'Canada', dialCode: '+1', stateLabel: 'Province', postalLabel: 'Postal Code' },
  { code: 'AU', name: 'Australia', dialCode: '+61', stateLabel: 'State / Territory', postalLabel: 'Postcode' },
  { code: 'DE', name: 'Germany', dialCode: '+49', stateLabel: 'State (Bundesland)', postalLabel: 'Postal Code (PLZ)' },
  { code: 'FR', name: 'France', dialCode: '+33', stateLabel: 'Region', postalLabel: 'Code Postal' },
  { code: 'ES', name: 'Spain', dialCode: '+34', stateLabel: 'Province', postalLabel: 'Código Postal' },
  { code: 'PT', name: 'Portugal', dialCode: '+351', stateLabel: 'District', postalLabel: 'Código Postal' },
  { code: 'IT', name: 'Italy', dialCode: '+39', stateLabel: 'Province', postalLabel: 'CAP' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', stateLabel: 'Province', postalLabel: 'Postcode' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', stateLabel: 'State', postalLabel: 'CEP' },
  { code: 'AR', name: 'Argentina', dialCode: '+54', stateLabel: 'Province', postalLabel: 'Postal Code' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', stateLabel: 'State', postalLabel: 'Código Postal' },
  { code: 'JP', name: 'Japan', dialCode: '+81', stateLabel: 'Prefecture', postalLabel: 'Postal Code' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', stateLabel: 'District / Region', postalLabel: 'Postal Code' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', stateLabel: 'Emirate', postalLabel: 'P.O. Box / Area' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', stateLabel: 'County', postalLabel: 'Eircode' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', stateLabel: 'County', postalLabel: 'Postnummer' },
  { code: 'OTHER', name: 'Rest of World', dialCode: '+1', stateLabel: 'State / Region', postalLabel: 'Postal / ZIP Code' },
];

export const TRANSLATIONS: Record<
  LanguageCode,
  {
    saleHeadline: string;
    hurryEnds: string;
    saveUpTo: string;
    heroTag: string;
    heroTitle: string;
    bundleDivider: string;
    chooseEdition: string;
    addToCart: string;
    howItWorks: string;
    faqTitle: string;
    contactTitle: string;
    sendMessage: string;
    trackTitle: string;
    trackBtn: string;
    reviewsTitle: string;
    writeReview: string;
    checkoutBtn: string;
  }
> = {
  EN: {
    saleHeadline: 'MATCHDAY DROP SALE',
    hurryEnds: 'HURRY UP, SALE ENDS IN:',
    saveUpTo: 'LIMITED TIME: SAVE UP TO 46%',
    heroTag: 'HOT PRODUCT | LIMITED PRODUCTION',
    heroTitle: 'MIST & TURF — FOOTBALL INCENSE & MIST BURNERS',
    bundleDivider: 'BUNDLE & SAVE',
    chooseEdition: 'CHOOSE YOUR EDITION',
    addToCart: 'Add to cart',
    howItWorks: 'HOW IT WORKS',
    faqTitle: 'FREQUENTLY ASKED QUESTIONS',
    contactTitle: 'CONTACT US',
    sendMessage: 'Send message',
    trackTitle: 'TRACK YOUR ORDER',
    trackBtn: 'Track package',
    reviewsTitle: 'WHAT OUR CUSTOMERS SAY',
    writeReview: 'Write a Review',
    checkoutBtn: 'Proceed to Checkout',
  },
  ES: {
    saleHeadline: 'OFERTA DÍA DE PARTIDO',
    hurryEnds: 'DATE PRISA, LA OFERTA TERMINA EN:',
    saveUpTo: 'TIEMPO LIMITADO: AHORRA HASTA UN 46%',
    heroTag: 'PRODUCTO TOP | PRODUCCIÓN LIMITADA',
    heroTitle: 'MIST & TURF — QUEMADORES DE INCIENSO DE FÚTBOL',
    bundleDivider: 'PACK Y AHORRO',
    chooseEdition: 'ELIGE TU EDICIÓN',
    addToCart: 'Añadir al carrito',
    howItWorks: 'CÓMO FUNCIONA',
    faqTitle: 'PREGUNTAS FRECUENTES',
    contactTitle: 'CONTÁCTANOS',
    sendMessage: 'Enviar mensaje',
    trackTitle: 'RASTREA TU PEDIDO',
    trackBtn: 'Rastrear paquete',
    reviewsTitle: 'OPINIONES DE CLIENTES',
    writeReview: 'Escribir reseña',
    checkoutBtn: 'Ir al pago',
  },
  FR: {
    saleHeadline: 'VENTE JOUR DE MATCH',
    hurryEnds: "DÉPÊCHEZ-VOUS, FIN DE L'OFFRE DANS :",
    saveUpTo: "DURÉE LIMITÉE : ÉCONOMISEZ JUSQU'À 46%",
    heroTag: 'BEST-SELLER | PRODUCTION LIMITÉE',
    heroTitle: 'MIST & TURF — BRÛLEURS D’ENCENS FOOTBALL',
    bundleDivider: 'PACKS & ÉCONOMIES',
    chooseEdition: 'CHOISISSEZ VOTRE ÉDITION',
    addToCart: 'Ajouter au panier',
    howItWorks: 'COMMENT ÇA MARCHE',
    faqTitle: 'QUESTIONS FRÉQUENTES',
    contactTitle: 'CONTACTEZ-NOUS',
    sendMessage: 'Envoyer le message',
    trackTitle: 'SUIVRE VOTRE COMMANDE',
    trackBtn: 'Suivre le colis',
    reviewsTitle: 'AVIS DE NOS CLIENTS',
    writeReview: 'Laisser un avis',
    checkoutBtn: 'Passer à la caisse',
  },
  DE: {
    saleHeadline: 'SPIELTAG-ANGEBOT',
    hurryEnds: 'BEEILUNG, ANGEBOT ENDET IN:',
    saveUpTo: 'ZEITLICH BEGRENZT: BIS ZU 46% SPAREN',
    heroTag: 'TOP-PRODUKT | LIMITIERTE AUFLAGE',
    heroTitle: 'MIST & TURF — FUSSBALL RÄUCHERBRENNER',
    bundleDivider: 'BUNDLE & SPAREN',
    chooseEdition: 'EDITION WÄHLEN',
    addToCart: 'In den Warenkorb',
    howItWorks: 'SO FUNKTIONIERT ES',
    faqTitle: 'HÄUFIGE FRAGEN',
    contactTitle: 'KONTAKTIERE UNS',
    sendMessage: 'Nachricht senden',
    trackTitle: 'BESTELLUNG VERFOLGEN',
    trackBtn: 'Paket verfolgen',
    reviewsTitle: 'KUNDENBEWERTUNGEN',
    writeReview: 'Bewertung schreiben',
    checkoutBtn: 'Zur Kasse',
  },
  PT: {
    saleHeadline: 'PROMOÇÃO DIA DE JOGO',
    hurryEnds: 'CORRA, A OFERTA TERMINA EM:',
    saveUpTo: 'TEMPO LIMITADO: ECONOMIZE ATÉ 46%',
    heroTag: 'EM ALTA | PRODUÇÃO LIMITADA',
    heroTitle: 'MIST & TURF — INCENSÁRIOS DE FUTEBOL',
    bundleDivider: 'COMBO & ECONOMIA',
    chooseEdition: 'ESCOLHA SUA EDIÇÃO',
    addToCart: 'Adicionar ao carrinho',
    howItWorks: 'COMO FUNCIONA',
    faqTitle: 'PERGUNTAS FREQUENTES',
    contactTitle: 'FALE CONOSCO',
    sendMessage: 'Enviar mensagem',
    trackTitle: 'RASTREAR PEDIDO',
    trackBtn: 'Rastrear pacote',
    reviewsTitle: 'O QUE DIZEM NOSSOS CLIENTES',
    writeReview: 'Escrever avaliação',
    checkoutBtn: 'Finalizar compra',
  },
};
