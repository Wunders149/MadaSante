/**
 * Demo fixtures for local development.
 *
 * NOT part of the application. This is loaded only by `npm run seed:demo`,
 * never on `npm start`, and the runner refuses to execute in production. It
 * exists so the catalog, the booking flow and both dashboards can actually be
 * exercised — an empty catalog makes every other code path unverifiable.
 *
 * Column names are the real snake_case database columns so there is no
 * mapping layer between this file and the schema.
 */

const iso = (daysFromToday: number) => {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return d.toISOString().slice(0, 10)
}

export const DEMO_PASSWORD = 'Demo1234!'

export const cities = ['Antananarivo', 'Mahajanga', 'Toamasina']

export const adminUser = {
  id: 'u_admin_demo',
  firstName: 'Super',
  lastName: 'Admin',
  phone: '+261 34 00 000 01',
  email: 'admin@demo.mg',
  location: 'Antananarivo',
}

export const patientUsers = [
  { id: 'u_pat_1', firstName: 'Voahangy', lastName: 'Andrianiaina', phone: '+261 34 12 345 67', email: 'voahangy@demo.mg', location: 'Antananarivo' },
  { id: 'u_pat_2', firstName: 'Tiana', lastName: 'Rasolofomanana', phone: '+261 32 55 210 88', email: 'tiana@demo.mg', location: 'Antananarivo' },
  { id: 'u_pat_3', firstName: 'Miora', lastName: 'Randriamampionona', phone: '+261 33 98 765 43', email: 'miora@demo.mg', location: 'Mahajanga' },
  { id: 'u_pat_4', firstName: 'Fetra', lastName: 'Rakotomalala', phone: '+261 34 77 123 45', email: 'fetra@demo.mg', location: 'Toamasina' },
]

/** Provider logins, each linked to a catalog record via provider_id. */
export const providerUsers = [
  { id: 'u_prov_doctor', firstName: 'Jean', lastName: 'Rakoto', phone: '+261 33 11 111 11', email: 'dr.rakoto@demo.mg', role: 'doctor', location: 'Antananarivo', providerId: 'd1' },
  { id: 'u_prov_kine', firstName: 'Hanitra', lastName: 'Rasoanaivo', phone: '+261 34 22 333 44', email: 'kine.rasoanaivo@demo.mg', role: 'kinesitherapist', location: 'Antananarivo', providerId: 'pr_kine' },
  { id: 'u_prov_psy', firstName: 'Lova', lastName: 'Andrianina', phone: '+261 32 44 555 66', email: 'psy.andrianina@demo.mg', role: 'psychologist', location: 'Antananarivo', providerId: 'pr_psy' },
  { id: 'u_prov_nurse', firstName: 'Edith', lastName: 'Raveloson', phone: '+261 34 22 222 22', email: 'edith.raveloson@demo.mg', role: 'nurse', location: 'Antananarivo', providerId: 'n1' },
  { id: 'u_prov_pharmacy', firstName: 'Pharmacie', lastName: 'Amitié', phone: '+261 20 22 333 33', email: 'contact@pharmamitie.mg', role: 'pharmacy', location: 'Antananarivo', providerId: 'p1' },
  { id: 'u_prov_ngo', firstName: 'Hanta', lastName: 'Rakotondrabe', phone: '+261 34 88 900 11', email: 'contact@santemada.mg', role: 'medical_ngo', location: 'Antananarivo', providerId: 'ngo1' },
]

const SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00']
const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

export const doctors = [
  {
    id: 'd1', name: 'Dr. Jean Rakoto', specialty: 'Médecine générale', type: 'generalist',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    consultation_types: ['cabinet', 'home', 'hospital'], price: 35000, price_home: 60000,
    availability: WEEKDAYS, availability_slots: SLOTS,
    rating: 4.8, reviews: 124,
    description: "Médecin généraliste avec 12 ans d'expérience. Prise en charge des adultes et des enfants, suivi des maladies chroniques (diabète, hypertension) et prévention. Consultation en cabinet, à domicile ou à l'hôpital.",
    languages: ['Français', 'Malagasy', 'Anglais'],
  },
  {
    id: 'd2', name: 'Dr. Hery Randrianarisoa', specialty: 'Médecine générale', type: 'generalist',
    location: 'Bd. de la Libération, Mahajanga 401', city: 'Mahajanga',
    consultation_types: ['cabinet', 'home'], price: 25000, price_home: 45000,
    availability: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], availability_slots: SLOTS.slice(0, 6),
    rating: 4.5, reviews: 67,
    description: 'Généraliste à Mahajanga, consultation au cabinet et visites à domicile. Prise en charge du paludisme, des infections respiratoires et du suivi de grossesse.',
    languages: ['Français', 'Malagasy'],
  },
  {
    id: 'd3', name: 'Dr. Miora Rasoanaivo', specialty: 'Pédiatrie', type: 'specialist',
    location: 'Ivandry, Antananarivo 101', city: 'Antananarivo',
    consultation_types: ['cabinet', 'hospital'], price: 45000, price_home: null,
    availability: WEEKDAYS, availability_slots: SLOTS,
    rating: 4.9, reviews: 203,
    description: 'Pédiatre. Suivi de croissance, vaccinations, asthme et allergies chez l’enfant, néonatologie. Disponible en cabinet et à l’hôpital.',
    languages: ['Français', 'Malagasy', 'Anglais'],
  },
  {
    id: 'd4', name: 'Dr. Fanja Rakotomalala', specialty: 'Cardiologie', type: 'specialist',
    location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo',
    consultation_types: ['cabinet', 'hospital'], price: 70000, price_home: null,
    availability: ['Mar', 'Mer', 'Ven'], availability_slots: ['09:00', '10:00', '11:00', '14:00'],
    rating: 4.7, reviews: 88,
    description: 'Cardiologue. Hypertension, insuffisance cardiaque, troubles du rythme. Électrocardiogramme et échographie cardiaque sur place.',
    languages: ['Français', 'Anglais'],
  },
  {
    id: 'd5', name: 'Dr. Toky Rabemananjara', specialty: 'Gynécologie-Obstétrique', type: 'specialist',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    consultation_types: ['cabinet', 'hospital'], price: 55000, price_home: null,
    availability: ['Lun', 'Mer', 'Ven'], availability_slots: SLOTS,
    rating: 4.6, reviews: 141,
    description: 'Gynécologue-obstétricienne. Suivi de grossesse, dépistage, contraception et prise en charge des pathologies gynécologiques.',
    languages: ['Français', 'Malagasy'],
  },
  {
    id: 'd6', name: 'Dr. Ony Rasoanaivo', specialty: 'Médecine générale', type: 'generalist',
    location: 'Bazary Be, Toamasina 501', city: 'Toamasina',
    consultation_types: ['cabinet'], price: 22000, price_home: null,
    availability: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], availability_slots: SLOTS.slice(0, 5),
    rating: 4.3, reviews: 52,
    description: 'Généraliste à Toamasina. Consultations courantes et soins de première intention.',
    languages: ['Français', 'Malagasy'],
  },
]

export const hospitals = [
  {
    id: 'h1', name: 'CHU Ambohidempona', type: 'hospital', sector: 'public',
    location: 'Ambohidempona, Antananarivo 101', city: 'Antananarivo',
    services: ['Urgences', 'Chirurgie', 'Médecine interne', 'Maternité', 'Pédiatrie', 'Radiologie'],
    opening_hours: '24h/24, 7j/7', emergency_available: 1, phone: '+261 20 22 240 40', rating: 4.3,
    description: "Centre hospitalier universitaire de référence à Antananarivo, avec service d'urgences et plateau technique complet.",
  },
  {
    id: 'h2', name: 'CH Mahajanga', type: 'hospital', sector: 'public',
    location: 'Avenue de la Libération, Mahajanga 401', city: 'Mahajanga',
    services: ['Urgences', 'Médecine', 'Maternité', 'Pédiatrie', 'Chirurgie'],
    opening_hours: '24h/24, 7j/7', emergency_available: 1, phone: '+261 20 62 223 44', rating: 4.1,
    description: 'Centre hospitalier régional de Mahajanga, urgences et chirurgie.',
  },
  {
    id: 'h3', name: 'Clinique Horizon', type: 'clinic', sector: 'private',
    location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo',
    services: ['Médecine générale', 'Pédiatrie', 'Vaccination', 'Laboratoire'],
    opening_hours: 'Lun–Sam : 07:30 – 19:00', emergency_available: 0, phone: '+261 34 05 678 90', rating: 4.6,
    description: 'Clinique privée avec rendez-vous, vaccinations et laboratoire sur place.',
  },
]

export const pharmacies = [
  { id: 'p1', name: 'Pharmacie de l’Amitié', location: 'Analakely, Antananarivo 101', city: 'Antananarivo', phone: '+261 20 22 333 33', opening_hours: 'Lun–Sam : 08:00 – 19:00', delivery_available: 1, rating: 4.6 },
  { id: 'p2', name: 'Pharmacie Tsiky', location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo', phone: '+261 34 11 222 33', opening_hours: 'Lun–Dim : 07:00 – 21:00', delivery_available: 1, rating: 4.4 },
  { id: 'p3', name: 'Pharmacie du Centre', location: 'Bd. de la Libération, Mahajanga 401', city: 'Mahajanga', phone: '+261 20 62 445 56', opening_hours: 'Lun–Sam : 08:00 – 18:00', delivery_available: 0, rating: 4.2 },
]

export const medicines = [
  { id: 'm1', name: 'Paracétamol 500 mg', generic_name: 'Paracétamol', form: 'Comprimé', dose: '500 mg', price: 3500, pharmacy_id: 'p1', pharmacy_name: 'Pharmacie de l’Amitié', location: 'Analakely, Antananarivo 101', city: 'Antananarivo', stock: 240, available: 1, prescription_required: 0 },
  { id: 'm2', name: 'Amoxicilline 500 mg', generic_name: 'Amoxicilline', form: 'Gélule', dose: '500 mg', price: 8000, pharmacy_id: 'p1', pharmacy_name: 'Pharmacie de l’Amitié', location: 'Analakely, Antananarivo 101', city: 'Antananarivo', stock: 96, available: 1, prescription_required: 1 },
  { id: 'm3', name: 'Artéméther/Luméfantrine', generic_name: 'Artéméther/Luméfantrine', form: 'Comprimé', dose: '20/120 mg', price: 4500, pharmacy_id: 'p2', pharmacy_name: 'Pharmacie Tsiky', location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo', stock: 8, available: 1, prescription_required: 0 },
  { id: 'm4', name: 'Ibuprofène 400 mg', generic_name: 'Ibuprofène', form: 'Comprimé', dose: '400 mg', price: 4000, pharmacy_id: 'p2', pharmacy_name: 'Pharmacie Tsiky', location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo', stock: 180, available: 1, prescription_required: 0 },
  { id: 'm5', name: 'Metformine 850 mg', generic_name: 'Metformine', form: 'Comprimé', dose: '850 mg', price: 6500, pharmacy_id: 'p2', pharmacy_name: 'Pharmacie Tsiky', location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo', stock: 120, available: 1, prescription_required: 1 },
  { id: 'm6', name: 'Amlodipine 5 mg', generic_name: 'Amlodipine', form: 'Comprimé', dose: '5 mg', price: 5500, pharmacy_id: 'p1', pharmacy_name: 'Pharmacie de l’Amitié', location: 'Analakely, Antananarivo 101', city: 'Antananarivo', stock: 90, available: 1, prescription_required: 1 },
  { id: 'm7', name: 'Sérum physiologique', generic_name: 'NaCl 0,9%', form: 'Poche 500 ml', dose: '500 ml', price: 7000, pharmacy_id: 'p3', pharmacy_name: 'Pharmacie du Centre', location: 'Bd. de la Libération, Mahajanga 401', city: 'Mahajanga', stock: 40, available: 1, prescription_required: 0 },
  { id: 'm8', name: 'Métronidazole 250 mg', generic_name: 'Métronidazole', form: 'Comprimé', dose: '250 mg', price: 5000, pharmacy_id: 'p3', pharmacy_name: 'Pharmacie du Centre', location: 'Bd. de la Libération, Mahajanga 401', city: 'Mahajanga', stock: 0, available: 0, prescription_required: 1 },
  { id: 'm9', name: 'Vitamine C 500 mg', generic_name: 'Acide ascorbique', form: 'Comprimé effervescent', dose: '500 mg', price: 3000, pharmacy_id: 'p2', pharmacy_name: 'Pharmacie Tsiky', location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo', stock: 300, available: 1, prescription_required: 0 },
  { id: 'm10', name: 'Amoxicilline 250 mg', generic_name: 'Amoxicilline', form: 'Sirop', dose: '250 mg/5 ml', price: 12000, pharmacy_id: 'p1', pharmacy_name: 'Pharmacie de l’Amitié', location: 'Analakely, Antananarivo 101', city: 'Antananarivo', stock: 25, available: 1, prescription_required: 1 },
]

export const laboratories = [
  {
    id: 'l1', name: 'Laboratoire LEM', location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    tests: ['NFS', 'Glycémie', 'Analyse d’urine', 'TSH', 'Test paludisme', 'Sérologies', 'Bilan lipidique'],
    opening_hours: 'Lun–Sam : 07:30 – 16:00', phone: '+261 20 22 444 44', rating: 4.5,
  },
  {
    id: 'l2', name: 'BioSanté Mahajanga', location: 'Bd. de la Libération, Mahajanga 401', city: 'Mahajanga',
    tests: ['NFS', 'Glycémie', 'Test paludisme', 'Coproculture', 'Bilan hépatique'],
    opening_hours: 'Lun–Ven : 07:00 – 15:00', phone: '+261 20 62 777 88', rating: 4.2,
  },
  {
    id: 'l3', name: 'Labo Toamasina', location: 'Bazary Be, Toamasina 501', city: 'Toamasina',
    tests: ['NFS', 'Glycémie', 'Analyse d’urine', 'SIDA'],
    opening_hours: 'Lun–Sam : 08:00 – 17:00', phone: '+261 20 53 222 33', rating: 4.0,
  },
]

export const imagingCenters = [
  {
    id: 'c1', name: 'CIMA Imagerie', location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    exams: [
      { type: 'Radiographie', price: 25000 },
      { type: 'Échographie', price: 45000 },
      { type: 'Scanner', price: 120000 },
      { type: 'IRM', price: 350000 },
    ],
    opening_hours: 'Lun–Sam : 08:00 – 18:00', phone: '+261 20 22 555 55', rating: 4.4,
  },
  {
    id: 'c2', name: 'Centre d’imagerie Mahajanga', location: 'Quai de la Gare, Mahajanga 401', city: 'Mahajanga',
    exams: [
      { type: 'Radiographie', price: 22000 },
      { type: 'Échographie', price: 40000 },
    ],
    opening_hours: 'Lun–Ven : 08:00 – 17:00', phone: '+261 20 62 111 22', rating: 4.1,
  },
]

export const nurses = [
  {
    id: 'n1', name: 'Edith Raveloson', qualification: 'Infirmière diplômée d’État',
    location: 'Ankadifotsy, Antananarivo 101', city: 'Antananarivo',
    services: ['Pansements', 'Injections', 'Suivi post-opératoire', 'Perfusion'],
    availability: WEEKDAYS, price: 25000, rating: 4.7,
  },
  {
    id: 'n2', name: 'Bako Maharitra', qualification: 'Infirmière puéricultrice',
    location: 'Ampitatafika, Mahajanga 401', city: 'Mahajanga',
    services: ['Soins pédiatriques', 'Pansements', 'Suivi de grossesse'],
    availability: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'], price: 20000, rating: 4.4,
  },
  {
    id: 'n3', name: 'Naina Ratsimbazafy', qualification: 'Infirmier diplômé d’État',
    location: 'Androva, Toamasina 501', city: 'Toamasina',
    services: ['Pansements', 'Injections', 'Soins à domicile'],
    availability: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'], price: 22000, rating: 4.3,
  },
]

export const ambulances = [
  { id: 'a1', provider: 'SAMU Antananarivo', location: 'Ambohidempona, Antananarivo', city: 'Antananarivo', phone: '+261 34 77 777 77', vehicles: ['Ambulance médicalisée', 'VSAV'], available: 1, response_time: '15 min' },
  { id: 'a2', provider: 'Croix-Rouge Madagascar', location: 'Analakely, Antananarivo', city: 'Antananarivo', phone: '+261 20 22 555 12', vehicles: ['Ambulance de réanimation'], available: 1, response_time: '10 min' },
  { id: 'a3', provider: 'Secours Catholique Toamasina', location: 'Bazary Be, Toamasina', city: 'Toamasina', phone: '+261 20 53 444 55', vehicles: ['Ambulance médicalisée'], available: 1, response_time: '20 min' },
]

/**
 * Allied-health professionals. One per profession so every filter chip in the
 * Professionals directory has something behind it.
 */
export const practitioners = [
  {
    id: 'pr_psy', profession: 'psychologist', name: 'Lova Andrianina',
    qualification: 'Psychologue clinicienne, maîtrise en psychologie', specialty: 'Psychologie clinique',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    services: ['Thérapie de groupe', 'Anxiété', 'Dépression', 'Suivi post-traumatique'],
    languages: ['Français', 'Malagasy'], consultation_types: ['cabinet', 'home'],
    price: 40000, price_home: 60000, rating: 4.8, reviews: 96,
    description: "Psychologue clinicienne. Prise en charge de l'anxiété, de la dépression et des troubles du sommeil, en cabinet ou à domicile. Confidentialité garantie.",
  },
  {
    id: 'pr_psychiatrist', profession: 'psychiatrist', name: 'Dr. Naina Andriamalala',
    qualification: 'Psychiatre, Docteur en médecine', specialty: 'Psychiatrie',
    location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo',
    services: ['Consultation psychiatrique', 'Suivi de traitement', 'Addictologie'],
    languages: ['Français', 'Anglais'], consultation_types: ['cabinet', 'hospital'],
    price: 65000, price_home: null, rating: 4.7, reviews: 74,
    description: "Psychiatre. Consultation et suivi de traitement, notamment pour troubles de l'humeur, psychoses et dépendances.",
  },
  {
    id: 'pr_kine', profession: 'kinesitherapist', name: 'Hanitra Rasoanaivo',
    qualification: 'Masseur-kinésithérapeute diplômé', specialty: 'Kinésithérapie',
    location: 'Itaosy, Antananarivo 105', city: 'Antananarivo',
    services: ['Rééducation post-traumatique', 'Mal de dos', 'Entorse', 'Rééducation neurologique'],
    languages: ['Français', 'Malagasy'], consultation_types: ['cabinet', 'home', 'hospital'],
    price: 30000, price_home: 50000, rating: 4.9, reviews: 158,
    description: "Kinésithérapeute. Rééducation après blessure ou chirurgie, douleurs lombaires, entorses et rééducation neurologique. Domicile et hôpital.",
  },
  {
    id: 'pr_ergo', profession: 'ergotherapist', name: 'Fanja Randriamampandry',
    qualification: 'Ergothérapeute, certifiée en rééducation de la main', specialty: 'Ergothérapie',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    services: ['Rééducation de la main', 'Aides techniques', 'Ergonomie', 'Rééducation neurologique'],
    languages: ['Français', 'Malagasy'], consultation_types: ['cabinet', 'hospital'],
    price: 35000, price_home: null, rating: 4.6, reviews: 52,
    description: "Ergothérapeute. Rééducation de la main, adaptation d'aides techniques et aménagement ergonomique.",
  },
  {
    id: 'pr_speech', profession: 'speech_therapist', name: 'Onja Rakotomalala',
    qualification: 'Orthophoniste, maîtrise en sciences du langage', specialty: 'Orthophonie',
    location: 'Androva, Toamasina 501', city: 'Toamasina',
    services: ['Troubles de la parole', 'Bilan de langage', 'Récupération post-AVC', 'Troubles de la voix'],
    languages: ['Français', 'Malagasy'], consultation_types: ['cabinet', 'home'],
    price: 28000, price_home: 45000, rating: 4.5, reviews: 41,
    description: "Orthophoniste. Bilan de langage, troubles de la parole et récupération du langage après AVC.",
  },
  {
    id: 'pr_diet', profession: 'dietitian', name: 'Miora Ravelojaona',
    qualification: 'Diététicienne-nutritionniste', specialty: 'Nutrition & diététique',
    location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo',
    services: ['Diabète', 'Obésité', 'Malnutrition', 'Allergies alimentaires'],
    languages: ['Français', 'Anglais'], consultation_types: ['cabinet', 'home'],
    price: 25000, price_home: 40000, rating: 4.6, reviews: 63,
    description: "Diététicienne. Accompagnement du diabète, de l'obésité et de la malnutrition, avec plan alimentaire adapté.",
  },
  {
    id: 'pr_midwife', profession: 'midwife', name: 'Voahangy Rasoanaivo',
    qualification: 'Sage-femme d’État', specialty: 'Suivi de grossesse',
    location: 'Ankadifotsy, Antananarivo 101', city: 'Antananarivo',
    services: ['Suivi de grossesse', 'Consultation post-partum', 'Préparation à l’accouchement'],
    languages: ['Malagasy', 'Français'], consultation_types: ['cabinet', 'home'],
    price: 20000, price_home: 30000, rating: 4.9, reviews: 187,
    description: "Sage-femme. Suivi de grossesse, consultations post-partum et préparation à l'accouchement, à domicile ou en cabinet.",
  },
]

/**
 * Medical NGOs and associations. These are not bookable, so the fixture
 * emphasises free care and contact details.
 */
export const medicalNgos = [
  {
    id: 'ngo1', name: 'Santé pour Tous Madagascar', focus: 'Santé communautaire',
    location: 'Ankorondrano, Antananarivo 101', city: 'Antananarivo',
    services: ['Consultations gratuites', 'Vaccination', 'Santé maternelle', 'Sensibilisation'],
    coverage: ['Antananarivo', 'Analamanga', 'Vakinankaratra'], opening_hours: 'Lun–Ven : 08:00 – 17:00',
    phone: '+261 34 88 900 11', email: 'contact@santepourtous.mg', website: 'https://santepourtous.mg',
    free_care: 1, rating: 4.7,
    description: "Association qui offre des consultations médicales gratuites et des campagnes de vaccination dans les quartiers défavorisés d'Antananarivo.",
  },
  {
    id: 'ngo2', name: 'Fihoviana – Santé Mentale', focus: 'Santé mentale',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    services: ['Écoute', 'Soutien psychologique', 'Groupes de parole', 'Formation'],
    coverage: ['Antananarivo', 'Toamasina'], opening_hours: 'Mar–Sam : 09:00 – 16:00',
    phone: '+261 34 22 400 55', email: 'contact@fihoviana.mg', website: 'https://fihoviana.mg',
    free_care: 1, rating: 4.8,
    description: "Réseau d'entraide et de pairs : accueil gratuit, groupes de parole et accompagnement des personnes vivant avec un trouble psychique.",
  },
  {
    id: 'ngo3', name: 'Krosse Famba', focus: 'Réadaptation fonctionnelle',
    location: 'Antsirabe 110', city: 'Antsirabe',
    services: ['Kinésithérapie gratuite', 'Orthèses', 'Aide aux enfants handicapés'],
    coverage: ['Antsirabe', 'Vakinankaratra'], opening_hours: 'Lun–Ven : 08:00 – 16:00',
    phone: '+261 32 44 300 66', email: 'contact@krossfamba.mg', website: '',
    free_care: 1, rating: 4.6,
    description: "Association qui fournit des séances de kinésithérapie et des orthèses gratuites aux enfants en situation de handicap.",
  },
  {
    id: 'ngo4', name: 'Miaraka Isoa', focus: 'Soins infirmiers à domicile',
    location: 'Analakely, Antananarivo 101', city: 'Antananarivo',
    services: ['Soins à domicile', 'Pansements', 'Accompagnement des personnes âgées'],
    coverage: ['Antananarivo', 'Analamanga'], opening_hours: 'Lun–Sam : 07:00 – 18:00',
    phone: '+261 34 66 700 88', email: 'contact@miarakaisoa.mg', website: '',
    free_care: 0, rating: 4.4,
    description: "Mouvement associatif assurant des soins infirmiers à domicile à tarif solidaire pour les personnes âgées isolées.",
  },
]

/**
 * Appointments and their matching payments, so the provider dashboard, the
 * patient history and the revenue figure all have something to render. Prices
 * mirror the server's derivation: base + round(base * 0.05) platform fee.
 */
export const appointments = [
  {
    id: 'ap_demo_1', reference: 'MS-2026-0001', patient_id: 'u_pat_1', provider_id: 'd1',
    provider_type: 'doctor', provider_name: 'Dr. Jean Rakoto',
    type: 'Consultation', consultation_type: 'cabinet',
    date: iso(0), time: '09:00', location: 'Analakely, Antananarivo 101',
    status: 'confirmed', base_price: 35000, price: 36750, payment_status: 'paid',
  },
  {
    id: 'ap_demo_2', reference: 'MS-2026-0002', patient_id: 'u_pat_2', provider_id: 'd1',
    provider_type: 'doctor', provider_name: 'Dr. Jean Rakoto',
    type: 'À domicile', consultation_type: 'home',
    date: iso(1), time: '10:00', location: 'Antananarivo — À domicile',
    status: 'confirmed', base_price: 60000, price: 63000, payment_status: 'paid',
  },
  {
    id: 'ap_demo_3', reference: 'MS-2026-0003', patient_id: 'u_pat_3', provider_id: 'd2',
    provider_type: 'doctor', provider_name: 'Dr. Hery Randrianarisoa',
    type: 'Consultation', consultation_type: 'cabinet',
    date: iso(2), time: '14:00', location: 'Bd. de la Libération, Mahajanga 401',
    status: 'pending', base_price: 25000, price: 26250, payment_status: 'unpaid',
  },
  {
    id: 'ap_demo_4', reference: 'MS-2026-0004', patient_id: 'u_pat_1', provider_id: 'pr_kine',
    provider_type: 'kinesitherapist', provider_name: 'Hanitra Rasoanaivo',
    type: 'À domicile', consultation_type: 'home',
    date: iso(-3), time: '11:00', location: 'Antananarivo — À domicile',
    status: 'completed', base_price: 50000, price: 52500, payment_status: 'paid',
  },
  {
    id: 'ap_demo_5', reference: 'MS-2026-0005', patient_id: 'u_pat_4', provider_id: 'd6',
    provider_type: 'doctor', provider_name: 'Dr. Ony Rasoanaivo',
    type: 'Consultation', consultation_type: 'cabinet',
    date: iso(-1), time: '15:00', location: 'Bazary Be, Toamasina 501',
    status: 'completed', base_price: 22000, price: 23100, payment_status: 'paid',
  },
]

export const payments = appointments
  .filter((a) => a.payment_status === 'paid')
  .map((a) => ({
    id: `pay_demo_${a.id.slice(-1)}`,
    reference: `PAY-2026-000${a.id.slice(-1)}`,
    patient_id: a.patient_id,
    provider_id: a.provider_id,
    appointment_id: a.id,
    service: a.type,
    provider_name: a.provider_name,
    date: iso(0),
    amount: a.price,
    method: 'orange_money',
    status: 'success',
    breakdown: [
      { label: a.type, amount: a.base_price },
      { label: 'Frais de plateforme', amount: a.price - a.base_price },
    ],
  }))

export const deliveries = [
  {
    id: 'del_demo_1', reference: 'DEL-2026-0001', patient_id: 'u_pat_1', medicine_id: 'm1',
    medicine_name: 'Paracétamol 500 mg', dose: '500 mg', quantity: 2,
    pharmacy_id: 'p1', pharmacy_name: 'Pharmacie de l’Amitié',
    delivery_address: 'Analakely, Antananarivo 101', delivery_time_slot: 'Dès que possible',
    delivery_fee: 3500, total: 10500, status: 'delivered', date: iso(-2),
  },
]

export const notifications = [
  {
    id: 'notif_demo_1', user_id: 'u_pat_1', title: 'Votre rendez-vous est confirmé.',
    message: 'Rendez-vous avec Dr. Jean Rakoto.', category: 'appointment', read: 0,
    created_at: new Date().toISOString(), link: '/patient/appointments',
  },
]

/** Two applications so the admin moderation queue has something to review. */
export const pendingApplications = [
  {
    id: 'pa_demo_1', reference: 'PA-2026-0001', role: 'kinesitherapist', org_name: 'Cabinet Kiné Soa',
    first_name: 'Hery', last_name: 'Rakotondrabe', phone: '+261 34 12 999 88',
    email: 'hery.kine@demo.mg', location: 'Antsirabe 110', city: 'Antsirabe',
    license_number: 'KIN-2026-0042',
  },
  {
    id: 'pa_demo_2', reference: 'PA-2026-0002', role: 'medical_ngo', org_name: 'Mpitsabo ho an’ny Fokonolona',
    first_name: 'Soa', last_name: 'Ramanantena', phone: '+261 32 45 678 00',
    email: 'contact@mpitsabofokonolona.mg', location: 'Fianarantsoa 301', city: 'Fianarantsoa',
    license_number: 'ONG-2026-0007',
  },
]
