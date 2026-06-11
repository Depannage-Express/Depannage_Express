export const MOTS_INTERDITS = [
  // Insultes générales
  'idiot', 'imbécile', 'con', 'connard',
  'connasse', 'crétin', 'abruti', 'nul',
  'incompétent', 'arnaqueur', 'voleur',
  'escroc', 'menteur', 'salaud', 'fumier',
  'ordure', 'déchet', 'minable', 'raté',
  // Insultes en fon/yoruba fréquentes au Bénin
  'wologoudou', 'gbèto', 'zémidjan',
  // Mots à connotation violente
  'tuer', 'frapper', 'cogner', 'battre',
  'menacer', 'attaquer',
  // Grossièretés
  'merde', 'putain', 'bordel', 'salopard',
  'enculé', 'bâtard',
];

export const detecterMotsInterdits = (texte) => {
  if (!texte) return [];
  const texteLower = texte.toLowerCase();
  return MOTS_INTERDITS.filter((mot) =>
    texteLower.includes(mot.toLowerCase())
  );
};
