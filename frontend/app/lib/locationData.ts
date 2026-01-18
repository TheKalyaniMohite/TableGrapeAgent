// Location data for farm setup dropdowns
// Focused on major grape-growing regions worldwide

export interface City {
  name: string;
}

export interface State {
  name: string;
  cities: City[];
}

export interface Country {
  name: string;
  code: string;
  states: State[];
}

export const countries: Country[] = [
  {
    name: 'India',
    code: 'IN',
    states: [
      {
        name: 'Maharashtra',
        cities: [
          { name: 'Nashik' },
          { name: 'Pune' },
          { name: 'Sangli' },
          { name: 'Solapur' },
          { name: 'Ahmednagar' },
          { name: 'Satara' },
          { name: 'Kolhapur' },
          { name: 'Osmanabad' },
          { name: 'Latur' },
          { name: 'Baramati' },
          { name: 'Niphad' },
          { name: 'Dindori' },
          { name: 'Mumbai' },
          { name: 'Nagpur' },
          { name: 'Aurangabad' },
        ],
      },
      {
        name: 'Karnataka',
        cities: [
          { name: 'Bengaluru' },
          { name: 'Vijayapura' },
          { name: 'Bagalkot' },
          { name: 'Belagavi' },
          { name: 'Chikkaballapur' },
          { name: 'Kolar' },
          { name: 'Bidar' },
          { name: 'Mysuru' },
          { name: 'Hubli' },
          { name: 'Dharwad' },
        ],
      },
      {
        name: 'Tamil Nadu',
        cities: [
          { name: 'Chennai' },
          { name: 'Coimbatore' },
          { name: 'Madurai' },
          { name: 'Theni' },
          { name: 'Dindigul' },
          { name: 'Salem' },
          { name: 'Tiruchirappalli' },
          { name: 'Erode' },
        ],
      },
      {
        name: 'Andhra Pradesh',
        cities: [
          { name: 'Hyderabad' },
          { name: 'Anantapur' },
          { name: 'Kadapa' },
          { name: 'Chittoor' },
          { name: 'Kurnool' },
          { name: 'Visakhapatnam' },
          { name: 'Vijayawada' },
          { name: 'Guntur' },
        ],
      },
      {
        name: 'Telangana',
        cities: [
          { name: 'Hyderabad' },
          { name: 'Rangareddy' },
          { name: 'Medak' },
          { name: 'Mahbubnagar' },
          { name: 'Nalgonda' },
          { name: 'Warangal' },
          { name: 'Karimnagar' },
        ],
      },
      {
        name: 'Madhya Pradesh',
        cities: [
          { name: 'Indore' },
          { name: 'Bhopal' },
          { name: 'Ratlam' },
          { name: 'Mandsaur' },
          { name: 'Ujjain' },
          { name: 'Gwalior' },
          { name: 'Jabalpur' },
        ],
      },
      {
        name: 'Punjab',
        cities: [
          { name: 'Ludhiana' },
          { name: 'Amritsar' },
          { name: 'Jalandhar' },
          { name: 'Patiala' },
          { name: 'Bathinda' },
          { name: 'Mohali' },
          { name: 'Chandigarh' },
        ],
      },
      {
        name: 'Haryana',
        cities: [
          { name: 'Gurugram' },
          { name: 'Faridabad' },
          { name: 'Hisar' },
          { name: 'Karnal' },
          { name: 'Panipat' },
          { name: 'Ambala' },
          { name: 'Rohtak' },
        ],
      },
      {
        name: 'Rajasthan',
        cities: [
          { name: 'Jaipur' },
          { name: 'Jodhpur' },
          { name: 'Udaipur' },
          { name: 'Kota' },
          { name: 'Ajmer' },
          { name: 'Bikaner' },
          { name: 'Alwar' },
        ],
      },
      {
        name: 'Gujarat',
        cities: [
          { name: 'Ahmedabad' },
          { name: 'Surat' },
          { name: 'Vadodara' },
          { name: 'Rajkot' },
          { name: 'Bhavnagar' },
          { name: 'Junagadh' },
          { name: 'Gandhinagar' },
        ],
      },
      {
        name: 'Uttar Pradesh',
        cities: [
          { name: 'Lucknow' },
          { name: 'Kanpur' },
          { name: 'Agra' },
          { name: 'Varanasi' },
          { name: 'Meerut' },
          { name: 'Allahabad' },
          { name: 'Noida' },
          { name: 'Ghaziabad' },
        ],
      },
      {
        name: 'West Bengal',
        cities: [
          { name: 'Kolkata' },
          { name: 'Howrah' },
          { name: 'Durgapur' },
          { name: 'Asansol' },
          { name: 'Siliguri' },
          { name: 'Kharagpur' },
        ],
      },
      {
        name: 'Kerala',
        cities: [
          { name: 'Thiruvananthapuram' },
          { name: 'Kochi' },
          { name: 'Kozhikode' },
          { name: 'Thrissur' },
          { name: 'Kollam' },
          { name: 'Palakkad' },
        ],
      },
    ],
  },
  {
    name: 'United States',
    code: 'US',
    states: [
      {
        name: 'California',
        cities: [
          { name: 'Napa' },
          { name: 'Sonoma' },
          { name: 'Fresno' },
          { name: 'Lodi' },
          { name: 'Paso Robles' },
          { name: 'Santa Barbara' },
          { name: 'Temecula' },
          { name: 'Modesto' },
          { name: 'Bakersfield' },
          { name: 'Sacramento' },
          { name: 'San Francisco' },
          { name: 'Los Angeles' },
          { name: 'San Diego' },
          { name: 'San Jose' },
        ],
      },
      {
        name: 'Washington',
        cities: [
          { name: 'Yakima' },
          { name: 'Walla Walla' },
          { name: 'Prosser' },
          { name: 'Richland' },
          { name: 'Kennewick' },
          { name: 'Seattle' },
          { name: 'Spokane' },
          { name: 'Tacoma' },
        ],
      },
      {
        name: 'Oregon',
        cities: [
          { name: 'Willamette Valley' },
          { name: 'Portland' },
          { name: 'Salem' },
          { name: 'Eugene' },
          { name: 'Medford' },
          { name: 'Bend' },
        ],
      },
      {
        name: 'New York',
        cities: [
          { name: 'Finger Lakes' },
          { name: 'Long Island' },
          { name: 'Hudson Valley' },
          { name: 'New York City' },
          { name: 'Buffalo' },
          { name: 'Rochester' },
          { name: 'Albany' },
        ],
      },
      {
        name: 'Texas',
        cities: [
          { name: 'Fredericksburg' },
          { name: 'Lubbock' },
          { name: 'Austin' },
          { name: 'Houston' },
          { name: 'Dallas' },
          { name: 'San Antonio' },
          { name: 'El Paso' },
        ],
      },
      {
        name: 'Virginia',
        cities: [
          { name: 'Charlottesville' },
          { name: 'Loudoun' },
          { name: 'Fairfax' },
          { name: 'Richmond' },
          { name: 'Norfolk' },
          { name: 'Virginia Beach' },
        ],
      },
      {
        name: 'Arizona',
        cities: [
          { name: 'Phoenix' },
          { name: 'Tucson' },
          { name: 'Scottsdale' },
          { name: 'Mesa' },
          { name: 'Sedona' },
          { name: 'Flagstaff' },
        ],
      },
      {
        name: 'Florida',
        cities: [
          { name: 'Miami' },
          { name: 'Orlando' },
          { name: 'Tampa' },
          { name: 'Jacksonville' },
          { name: 'Fort Lauderdale' },
          { name: 'Tallahassee' },
        ],
      },
      {
        name: 'Colorado',
        cities: [
          { name: 'Denver' },
          { name: 'Colorado Springs' },
          { name: 'Boulder' },
          { name: 'Fort Collins' },
          { name: 'Grand Junction' },
          { name: 'Palisade' },
        ],
      },
      {
        name: 'Michigan',
        cities: [
          { name: 'Traverse City' },
          { name: 'Detroit' },
          { name: 'Grand Rapids' },
          { name: 'Ann Arbor' },
          { name: 'Lansing' },
        ],
      },
    ],
  },
  {
    name: 'Spain',
    code: 'ES',
    states: [
      {
        name: 'La Rioja',
        cities: [
          { name: 'Logroño' },
          { name: 'Haro' },
          { name: 'Calahorra' },
          { name: 'Arnedo' },
        ],
      },
      {
        name: 'Catalonia',
        cities: [
          { name: 'Barcelona' },
          { name: 'Penedès' },
          { name: 'Priorat' },
          { name: 'Tarragona' },
          { name: 'Girona' },
        ],
      },
      {
        name: 'Castilla y León',
        cities: [
          { name: 'Ribera del Duero' },
          { name: 'Valladolid' },
          { name: 'Burgos' },
          { name: 'Salamanca' },
          { name: 'León' },
        ],
      },
      {
        name: 'Andalusia',
        cities: [
          { name: 'Jerez de la Frontera' },
          { name: 'Sevilla' },
          { name: 'Málaga' },
          { name: 'Córdoba' },
          { name: 'Granada' },
        ],
      },
      {
        name: 'Galicia',
        cities: [
          { name: 'Rías Baixas' },
          { name: 'Santiago de Compostela' },
          { name: 'Vigo' },
          { name: 'A Coruña' },
        ],
      },
      {
        name: 'Castilla-La Mancha',
        cities: [
          { name: 'Toledo' },
          { name: 'Valdepeñas' },
          { name: 'Albacete' },
          { name: 'Ciudad Real' },
        ],
      },
    ],
  },
  {
    name: 'France',
    code: 'FR',
    states: [
      {
        name: 'Bordeaux',
        cities: [
          { name: 'Bordeaux' },
          { name: 'Médoc' },
          { name: 'Saint-Émilion' },
          { name: 'Pomerol' },
          { name: 'Graves' },
        ],
      },
      {
        name: 'Burgundy',
        cities: [
          { name: 'Beaune' },
          { name: 'Dijon' },
          { name: 'Chablis' },
          { name: 'Nuits-Saint-Georges' },
          { name: 'Mâcon' },
        ],
      },
      {
        name: 'Champagne',
        cities: [
          { name: 'Reims' },
          { name: 'Épernay' },
          { name: 'Troyes' },
          { name: 'Châlons-en-Champagne' },
        ],
      },
      {
        name: 'Loire Valley',
        cities: [
          { name: 'Tours' },
          { name: 'Angers' },
          { name: 'Sancerre' },
          { name: 'Nantes' },
          { name: 'Orléans' },
        ],
      },
      {
        name: 'Rhône Valley',
        cities: [
          { name: 'Lyon' },
          { name: 'Avignon' },
          { name: 'Châteauneuf-du-Pape' },
          { name: 'Hermitage' },
          { name: 'Côte-Rôtie' },
        ],
      },
      {
        name: 'Provence',
        cities: [
          { name: 'Marseille' },
          { name: 'Aix-en-Provence' },
          { name: 'Nice' },
          { name: 'Bandol' },
          { name: 'Cassis' },
        ],
      },
      {
        name: 'Alsace',
        cities: [
          { name: 'Strasbourg' },
          { name: 'Colmar' },
          { name: 'Mulhouse' },
          { name: 'Riquewihr' },
        ],
      },
    ],
  },
  {
    name: 'Italy',
    code: 'IT',
    states: [
      {
        name: 'Tuscany',
        cities: [
          { name: 'Florence' },
          { name: 'Siena' },
          { name: 'Montalcino' },
          { name: 'Montepulciano' },
          { name: 'Chianti' },
          { name: 'Pisa' },
        ],
      },
      {
        name: 'Piedmont',
        cities: [
          { name: 'Turin' },
          { name: 'Alba' },
          { name: 'Barolo' },
          { name: 'Barbaresco' },
          { name: 'Asti' },
        ],
      },
      {
        name: 'Veneto',
        cities: [
          { name: 'Verona' },
          { name: 'Venice' },
          { name: 'Valpolicella' },
          { name: 'Soave' },
          { name: 'Prosecco' },
        ],
      },
      {
        name: 'Sicily',
        cities: [
          { name: 'Palermo' },
          { name: 'Catania' },
          { name: 'Marsala' },
          { name: 'Etna' },
          { name: 'Siracusa' },
        ],
      },
      {
        name: 'Lombardy',
        cities: [
          { name: 'Milan' },
          { name: 'Franciacorta' },
          { name: 'Bergamo' },
          { name: 'Brescia' },
        ],
      },
      {
        name: 'Emilia-Romagna',
        cities: [
          { name: 'Bologna' },
          { name: 'Modena' },
          { name: 'Parma' },
          { name: 'Ravenna' },
        ],
      },
    ],
  },
  {
    name: 'Australia',
    code: 'AU',
    states: [
      {
        name: 'South Australia',
        cities: [
          { name: 'Adelaide' },
          { name: 'Barossa Valley' },
          { name: 'McLaren Vale' },
          { name: 'Clare Valley' },
          { name: 'Coonawarra' },
        ],
      },
      {
        name: 'Victoria',
        cities: [
          { name: 'Melbourne' },
          { name: 'Yarra Valley' },
          { name: 'Mornington Peninsula' },
          { name: 'Geelong' },
          { name: 'Bendigo' },
        ],
      },
      {
        name: 'New South Wales',
        cities: [
          { name: 'Sydney' },
          { name: 'Hunter Valley' },
          { name: 'Mudgee' },
          { name: 'Orange' },
          { name: 'Canberra District' },
        ],
      },
      {
        name: 'Western Australia',
        cities: [
          { name: 'Perth' },
          { name: 'Margaret River' },
          { name: 'Swan Valley' },
          { name: 'Great Southern' },
        ],
      },
      {
        name: 'Tasmania',
        cities: [
          { name: 'Hobart' },
          { name: 'Launceston' },
          { name: 'Tamar Valley' },
          { name: 'Coal River Valley' },
        ],
      },
    ],
  },
  {
    name: 'South Africa',
    code: 'ZA',
    states: [
      {
        name: 'Western Cape',
        cities: [
          { name: 'Cape Town' },
          { name: 'Stellenbosch' },
          { name: 'Franschhoek' },
          { name: 'Paarl' },
          { name: 'Constantia' },
          { name: 'Swartland' },
        ],
      },
      {
        name: 'Northern Cape',
        cities: [
          { name: 'Kimberley' },
          { name: 'Upington' },
          { name: 'Orange River' },
        ],
      },
      {
        name: 'Gauteng',
        cities: [
          { name: 'Johannesburg' },
          { name: 'Pretoria' },
        ],
      },
    ],
  },
  {
    name: 'Chile',
    code: 'CL',
    states: [
      {
        name: 'Central Valley',
        cities: [
          { name: 'Santiago' },
          { name: 'Maipo Valley' },
          { name: 'Colchagua Valley' },
          { name: 'Rapel Valley' },
          { name: 'Curicó Valley' },
        ],
      },
      {
        name: 'Aconcagua',
        cities: [
          { name: 'Casablanca Valley' },
          { name: 'San Antonio Valley' },
          { name: 'Aconcagua Valley' },
        ],
      },
      {
        name: 'Coquimbo',
        cities: [
          { name: 'Elqui Valley' },
          { name: 'Limarí Valley' },
          { name: 'La Serena' },
        ],
      },
      {
        name: 'Southern Region',
        cities: [
          { name: 'Maule Valley' },
          { name: 'Bío Bío Valley' },
          { name: 'Itata Valley' },
        ],
      },
    ],
  },
  {
    name: 'Argentina',
    code: 'AR',
    states: [
      {
        name: 'Mendoza',
        cities: [
          { name: 'Mendoza City' },
          { name: 'Luján de Cuyo' },
          { name: 'Maipú' },
          { name: 'Uco Valley' },
          { name: 'San Rafael' },
        ],
      },
      {
        name: 'Salta',
        cities: [
          { name: 'Cafayate' },
          { name: 'Salta City' },
          { name: 'Cachi' },
        ],
      },
      {
        name: 'San Juan',
        cities: [
          { name: 'San Juan City' },
          { name: 'Tulum Valley' },
          { name: 'Pedernal Valley' },
        ],
      },
      {
        name: 'Patagonia',
        cities: [
          { name: 'Neuquén' },
          { name: 'Río Negro' },
          { name: 'San Patricio del Chañar' },
        ],
      },
      {
        name: 'La Rioja',
        cities: [
          { name: 'La Rioja City' },
          { name: 'Famatina Valley' },
        ],
      },
    ],
  },
  {
    name: 'Germany',
    code: 'DE',
    states: [
      {
        name: 'Rhineland-Palatinate',
        cities: [
          { name: 'Mosel' },
          { name: 'Rheinhessen' },
          { name: 'Pfalz' },
          { name: 'Mainz' },
          { name: 'Koblenz' },
        ],
      },
      {
        name: 'Baden-Württemberg',
        cities: [
          { name: 'Baden' },
          { name: 'Stuttgart' },
          { name: 'Heidelberg' },
          { name: 'Freiburg' },
        ],
      },
      {
        name: 'Bavaria',
        cities: [
          { name: 'Franconia' },
          { name: 'Munich' },
          { name: 'Würzburg' },
          { name: 'Nuremberg' },
        ],
      },
      {
        name: 'Hesse',
        cities: [
          { name: 'Rheingau' },
          { name: 'Frankfurt' },
          { name: 'Wiesbaden' },
        ],
      },
    ],
  },
  {
    name: 'Portugal',
    code: 'PT',
    states: [
      {
        name: 'Douro Valley',
        cities: [
          { name: 'Porto' },
          { name: 'Vila Nova de Gaia' },
          { name: 'Pinhão' },
          { name: 'Peso da Régua' },
        ],
      },
      {
        name: 'Alentejo',
        cities: [
          { name: 'Évora' },
          { name: 'Beja' },
          { name: 'Portalegre' },
        ],
      },
      {
        name: 'Vinho Verde',
        cities: [
          { name: 'Braga' },
          { name: 'Guimarães' },
          { name: 'Viana do Castelo' },
        ],
      },
      {
        name: 'Lisboa',
        cities: [
          { name: 'Lisbon' },
          { name: 'Sintra' },
          { name: 'Cascais' },
        ],
      },
      {
        name: 'Dão',
        cities: [
          { name: 'Viseu' },
          { name: 'Nelas' },
          { name: 'Mangualde' },
        ],
      },
    ],
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    states: [
      {
        name: 'Marlborough',
        cities: [
          { name: 'Blenheim' },
          { name: 'Renwick' },
          { name: 'Seddon' },
        ],
      },
      {
        name: 'Hawke\'s Bay',
        cities: [
          { name: 'Napier' },
          { name: 'Hastings' },
          { name: 'Havelock North' },
        ],
      },
      {
        name: 'Central Otago',
        cities: [
          { name: 'Queenstown' },
          { name: 'Cromwell' },
          { name: 'Alexandra' },
        ],
      },
      {
        name: 'Auckland',
        cities: [
          { name: 'Auckland' },
          { name: 'Waiheke Island' },
          { name: 'Matakana' },
        ],
      },
      {
        name: 'Canterbury',
        cities: [
          { name: 'Christchurch' },
          { name: 'Waipara' },
        ],
      },
    ],
  },
  {
    name: 'Greece',
    code: 'GR',
    states: [
      {
        name: 'Macedonia',
        cities: [
          { name: 'Thessaloniki' },
          { name: 'Naoussa' },
          { name: 'Drama' },
        ],
      },
      {
        name: 'Peloponnese',
        cities: [
          { name: 'Nemea' },
          { name: 'Patras' },
          { name: 'Mantinia' },
        ],
      },
      {
        name: 'Crete',
        cities: [
          { name: 'Heraklion' },
          { name: 'Chania' },
          { name: 'Rethymno' },
        ],
      },
      {
        name: 'Santorini',
        cities: [
          { name: 'Fira' },
          { name: 'Oia' },
          { name: 'Pyrgos' },
        ],
      },
      {
        name: 'Attica',
        cities: [
          { name: 'Athens' },
          { name: 'Markopoulo' },
        ],
      },
    ],
  },
  {
    name: 'China',
    code: 'CN',
    states: [
      {
        name: 'Ningxia',
        cities: [
          { name: 'Yinchuan' },
          { name: 'Helan Mountain' },
          { name: 'Zhongwei' },
        ],
      },
      {
        name: 'Shandong',
        cities: [
          { name: 'Yantai' },
          { name: 'Qingdao' },
          { name: 'Penglai' },
        ],
      },
      {
        name: 'Xinjiang',
        cities: [
          { name: 'Turpan' },
          { name: 'Ürümqi' },
          { name: 'Hami' },
        ],
      },
      {
        name: 'Hebei',
        cities: [
          { name: 'Changli' },
          { name: 'Huailai' },
          { name: 'Shijiazhuang' },
        ],
      },
      {
        name: 'Yunnan',
        cities: [
          { name: 'Shangri-La' },
          { name: 'Kunming' },
          { name: 'Mile' },
        ],
      },
    ],
  },
];

// Helper functions
export function getCountries(): Country[] {
  return countries;
}

export function getStates(countryName: string): State[] {
  const country = countries.find(c => c.name === countryName);
  return country?.states || [];
}

export function getCities(countryName: string, stateName: string): City[] {
  const country = countries.find(c => c.name === countryName);
  const state = country?.states.find(s => s.name === stateName);
  return state?.cities || [];
}

export function getCountryCode(countryName: string): string | undefined {
  const country = countries.find(c => c.name === countryName);
  return country?.code;
}

