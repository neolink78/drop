/**
 * Map a French postal code to its administrative region name.
 *
 * AliExpress' delivery address validation requires a non-empty
 * State/Province/County that matches its address book. For France it expects
 * the administrative region name (e.g. "Ile-de-France"). Stripe Checkout does
 * not collect a region for French addresses, so we derive it from the first
 * two digits of the postal code (the department number).
 *
 * Region names are kept ASCII (no accents) because AliExpress' matcher is more
 * tolerant with unaccented values.
 */

// Department number (2 digits, or 3 for DOM) -> region name.
const DEPARTMENT_TO_REGION: Record<string, string> = {
  // Auvergne-Rhone-Alpes
  '01': 'Auvergne-Rhone-Alpes', '03': 'Auvergne-Rhone-Alpes', '07': 'Auvergne-Rhone-Alpes',
  '15': 'Auvergne-Rhone-Alpes', '26': 'Auvergne-Rhone-Alpes', '38': 'Auvergne-Rhone-Alpes',
  '42': 'Auvergne-Rhone-Alpes', '43': 'Auvergne-Rhone-Alpes', '63': 'Auvergne-Rhone-Alpes',
  '69': 'Auvergne-Rhone-Alpes', '73': 'Auvergne-Rhone-Alpes', '74': 'Auvergne-Rhone-Alpes',
  // Bourgogne-Franche-Comte
  '21': 'Bourgogne-Franche-Comte', '25': 'Bourgogne-Franche-Comte', '39': 'Bourgogne-Franche-Comte',
  '58': 'Bourgogne-Franche-Comte', '70': 'Bourgogne-Franche-Comte', '71': 'Bourgogne-Franche-Comte',
  '89': 'Bourgogne-Franche-Comte', '90': 'Bourgogne-Franche-Comte',
  // Bretagne
  '22': 'Bretagne', '29': 'Bretagne', '35': 'Bretagne', '56': 'Bretagne',
  // Centre-Val de Loire
  '18': 'Centre-Val de Loire', '28': 'Centre-Val de Loire', '36': 'Centre-Val de Loire',
  '37': 'Centre-Val de Loire', '41': 'Centre-Val de Loire', '45': 'Centre-Val de Loire',
  // Corse
  '20': 'Corse',
  // Grand Est
  '08': 'Grand Est', '10': 'Grand Est', '51': 'Grand Est', '52': 'Grand Est',
  '54': 'Grand Est', '55': 'Grand Est', '57': 'Grand Est', '67': 'Grand Est',
  '68': 'Grand Est', '88': 'Grand Est',
  // Hauts-de-France
  '02': 'Hauts-de-France', '59': 'Hauts-de-France', '60': 'Hauts-de-France',
  '62': 'Hauts-de-France', '80': 'Hauts-de-France',
  // Ile-de-France
  '75': 'Ile-de-France', '77': 'Ile-de-France', '78': 'Ile-de-France', '91': 'Ile-de-France',
  '92': 'Ile-de-France', '93': 'Ile-de-France', '94': 'Ile-de-France', '95': 'Ile-de-France',
  // Normandie
  '14': 'Normandie', '27': 'Normandie', '50': 'Normandie', '61': 'Normandie', '76': 'Normandie',
  // Nouvelle-Aquitaine
  '16': 'Nouvelle-Aquitaine', '17': 'Nouvelle-Aquitaine', '19': 'Nouvelle-Aquitaine',
  '23': 'Nouvelle-Aquitaine', '24': 'Nouvelle-Aquitaine', '33': 'Nouvelle-Aquitaine',
  '40': 'Nouvelle-Aquitaine', '47': 'Nouvelle-Aquitaine', '64': 'Nouvelle-Aquitaine',
  '79': 'Nouvelle-Aquitaine', '86': 'Nouvelle-Aquitaine', '87': 'Nouvelle-Aquitaine',
  // Occitanie
  '09': 'Occitanie', '11': 'Occitanie', '12': 'Occitanie', '30': 'Occitanie',
  '31': 'Occitanie', '32': 'Occitanie', '34': 'Occitanie', '46': 'Occitanie',
  '48': 'Occitanie', '65': 'Occitanie', '66': 'Occitanie', '81': 'Occitanie', '82': 'Occitanie',
  // Pays de la Loire
  '44': 'Pays de la Loire', '49': 'Pays de la Loire', '53': 'Pays de la Loire',
  '72': 'Pays de la Loire', '85': 'Pays de la Loire',
  // Provence-Alpes-Cote d'Azur
  '04': "Provence-Alpes-Cote d'Azur", '05': "Provence-Alpes-Cote d'Azur",
  '06': "Provence-Alpes-Cote d'Azur", '13': "Provence-Alpes-Cote d'Azur",
  '83': "Provence-Alpes-Cote d'Azur", '84': "Provence-Alpes-Cote d'Azur",
  // DOM
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Reunion', '976': 'Mayotte',
};

/**
 * Resolve the French region name from a postal code. Returns an empty string
 * if it cannot be determined (caller can then fall back to another value).
 */
export const regionFromFrenchPostalCode = (postalCode: string): string => {
  const digits = (postalCode || '').replace(/\D/g, '');
  if (digits.length < 2) return '';

  // Overseas departments use a 3-digit prefix (97x).
  if (digits.startsWith('97') && digits.length >= 3) {
    const dom = DEPARTMENT_TO_REGION[digits.slice(0, 3)];
    if (dom) return dom;
  }

  return DEPARTMENT_TO_REGION[digits.slice(0, 2)] || '';
};
