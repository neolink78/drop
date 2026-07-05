/**
 * Map a French postal code to the "province" value AliExpress expects.
 *
 * AliExpress' delivery-address validation for France uses the DEPARTMENT as the
 * `province` level (type "PROVINCE"), e.g. postal code 78200 -> "Yvelines".
 * (Confirmed via aliexpress.ds.address.get, which lists departments as
 * PROVINCE and communes as CITY.) Stripe Checkout does not collect this, so we
 * derive it from the first two digits of the postal code (the department code).
 *
 * Names are kept without accents to match AliExpress' address book entries.
 */

const DEPARTMENT_CODE_TO_NAME: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence',
  '05': 'Hautes-Alpes', '06': 'Alpes-Maritimes', '07': 'Ardeche', '08': 'Ardennes',
  '09': 'Ariege', '10': 'Aube', '11': 'Aude', '12': 'Aveyron',
  '13': 'Bouches-du-Rhone', '14': 'Calvados', '15': 'Cantal', '16': 'Charente',
  '17': 'Charente-Maritime', '18': 'Cher', '19': 'Correze', '21': "Cote-d'Or",
  '22': "Cotes-d'Armor", '23': 'Creuse', '24': 'Dordogne', '25': 'Doubs',
  '26': 'Drome', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistere',
  '2a': 'Corse-du-Sud', '2b': 'Haute-Corse', '30': 'Gard', '31': 'Haute-Garonne',
  '32': 'Gers', '33': 'Gironde', '34': 'Herault', '35': 'Ille-et-Vilaine',
  '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isere', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire',
  '44': 'Loire-Atlantique', '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne',
  '48': 'Lozere', '49': 'Maine-et-Loire', '50': 'Manche', '51': 'Marne',
  '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle', '55': 'Meuse',
  '56': 'Morbihan', '57': 'Moselle', '58': 'Nievre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dome',
  '64': 'Pyrenees-Atlantiques', '65': 'Hautes-Pyrenees', '66': 'Pyrenees-Orientales',
  '67': 'Bas-Rhin', '68': 'Haut-Rhin', '69': 'Rhone', '70': 'Haute-Saone',
  '71': 'Saone-et-Loire', '72': 'Sarthe', '73': 'Savoie', '74': 'Haute-Savoie',
  '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne', '78': 'Yvelines',
  '79': 'Deux-Sevres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendee', '86': 'Vienne',
  '87': 'Haute-Vienne', '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort',
  '91': 'Essonne', '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis',
  '94': 'Val-de-Marne', '95': "Val-d'Oise",
  // Overseas departments (3-digit prefix)
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane',
  '974': 'La Reunion', '976': 'Mayotte',
};

/**
 * Resolve the French department name (AliExpress "province") from a postal
 * code. Returns an empty string if it cannot be determined.
 */
export const departmentFromFrenchPostalCode = (postalCode: string): string => {
  const digits = (postalCode || '').replace(/\D/g, '');
  if (digits.length < 2) return '';

  // Overseas departments use a 3-digit prefix (97x / 98x).
  if (digits.startsWith('97') && digits.length >= 3) {
    const dom = DEPARTMENT_CODE_TO_NAME[digits.slice(0, 3)];
    if (dom) return dom;
  }

  // Corsica: 20xxx maps to 2A (Corse-du-Sud, 200/201) or 2B (Haute-Corse, 202+).
  if (digits.startsWith('20')) {
    const n = parseInt(digits.slice(0, 3), 10);
    return n <= 201 ? DEPARTMENT_CODE_TO_NAME['2a'] : DEPARTMENT_CODE_TO_NAME['2b'];
  }

  return DEPARTMENT_CODE_TO_NAME[digits.slice(0, 2)] || '';
};

/**
 * @deprecated Kept for backward compatibility. AliExpress expects the
 * department, not the region; use departmentFromFrenchPostalCode instead.
 */
export const regionFromFrenchPostalCode = departmentFromFrenchPostalCode;
