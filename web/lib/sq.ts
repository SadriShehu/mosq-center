/**
 * Every user-facing Albanian string (docs/redesign/UX.md glossary). Import from here;
 * never hardcode copy in components. Brand stays "Xhamia Qender" until the spelling is confirmed.
 */
export const sq = {
  brand: 'Xhamia Qender',

  nav: {
    home: 'Fillimi',
    collection: 'Mbledhja',
    families: 'Familjet',
    neighbourhoods: 'Lagjet',
    payments: 'Pagesat',
    profile: 'Profili',
    logout: 'Dil',
    login: 'Kyçu',
    menu: 'Menyja',
    skipToContent: 'Kalo te përmbajtja',
  },

  actions: {
    search: 'Kërko',
    addNeighbourhood: 'Shto lagje',
    addFamily: 'Shto familje',
    pay: 'Paguaj',
    markPaid: 'Shëno të paguara',
    undo: 'Zhbëj',
    edit: 'Ndrysho',
    delete: 'Fshi',
    deleteFamily: 'Fshi familjen',
    cancel: 'Anulo',
    save: 'Ruaj',
    close: 'Mbyll',
    confirmDelete: 'Konfirmo fshirjen',
    generateInvoices: 'Gjenero faturat',
    payRemainingYears: 'Paguaj vitet e mbetura',
    exportCsv: 'Eksporto CSV',
    payForSeveralYears: 'Paguaj për disa vite',
  },

  status: { paid: 'Paguar', unpaid: 'Pa paguar' },
  tabs: { all: 'Të gjitha', unpaid: 'Pa paguar', paid: 'Paguar' },

  fields: {
    name: 'Emri',
    parentName: 'Emri i prindit',
    surname: 'Mbiemri',
    members: 'Anëtarët',
    memberCount: 'Numri i anëtarëve',
    neighbourhood: 'Lagjja',
    selectNeighbourhood: 'Zgjidh lagjen',
    selectFamily: 'Zgjidh familjen',
    amount: 'Shuma',
    year: 'Viti',
    untilYear: 'Deri në vitin',
    createdAt: 'Krijuar më',
    updatedAt: 'Ndryshuar më',
    city: 'Qyteti',
    village: 'Fshati',
    country: 'Shteti',
    postalCode: 'Kodi postar',
    region: 'Rajoni',
    status: 'Statusi',
  },

  collection: { collected: 'Mbledhur', expected: 'Pritet' },
  dashboard: {
    unpaidFamilies: 'Familjet e papaguara',
    progressByNeighbourhood: 'Përparimi sipas lagjeve',
    recentPayments: 'Pagesat e fundit',
    nextPrayer: 'Namazi i ardhshëm',
    welcome: 'Mirësevini',
  },
  history: { title: 'Historiku i pagesave' },

  prayers: {
    title: 'Kohët e namazit',
    Fajr: 'Sabahu',
    Sunrise: 'Lindja e Diellit',
    Dhuhr: 'Dreka',
    Asr: 'Ikindia',
    Maghrib: 'Akshami',
    Isha: 'Jacia',
    Midnight: 'Pjesa e tretë e natës',
  },

  command: {
    open: 'Kërko familje ose faqe',
    placeholder: 'Kërko familje ose faqe…',
    families: 'Familjet',
    pages: 'Faqet',
    empty: 'Nuk u gjet asgjë.',
  },

  year: { label: 'Viti', select: 'Zgjidh vitin' },

  empty: {
    list: 'Nuk ka të dhëna.',
    noResults: 'Asnjë rezultat për kërkimin.',
  },
  loading: 'Duke ngarkuar…',
  selectRow: (label: string) => `Zgjidh ${label}`,
  selectAll: 'Zgjidh të gjitha',

  messages: {
    paid: 'Pagesa u regjistrua.',
    created: 'U krijua me sukses.',
    updated: 'U ruajt me sukses.',
    deleted: 'U fshi me sukses.',
    undone: 'Pagesa u zhbë.',
    confirmDelete: (what: 'pagesë' | 'familje' | 'lagje') =>
      `A jeni të sigurt që dëshironi ta fshini këtë ${what}?`,
    noInvoices: (year: number | string) => `Nuk ka fatura për t'u gjeneruar për vitin ${year}.`,
    deleteFamilyConsequence: (n: number) => `Kjo fshin edhe ${n} pagesa.`,
  },

  errors: {
    network: 'Nuk ka lidhje me serverin. Provoni përsëri.',
    badRequest: 'Të dhënat nuk janë të sakta.',
    notFound: 'Nuk u gjet.',
    server: 'Ndodhi një gabim në server. Provoni përsëri.',
    unknown: 'Ndodhi një gabim. Provoni përsëri.',
    required: 'Kjo fushë është e detyrueshme.',
    positive: 'Numri duhet të jetë pozitiv.',
  },
} as const;
