// Comprehensive location data with countries and their states/cities
export const LOCATION_DATA = {
  'United States': {
    timezone: { name: 'Mountain Standard Time', utc: '(UTC-07:00)', description: 'Mountain Time (US & Canada)' },
    states: {
      'Alabama': ['Birmingham', 'Montgomery', 'Mobile', 'Huntsville', 'Tuscaloosa'],
      'Alaska': ['Anchorage', 'Juneau', 'Fairbanks', 'Ketchikan', 'Sitka'],
      'Arizona': ['Phoenix', 'Mesa', 'Chandler', 'Scottsdale', 'Glendale'],
      'Arkansas': ['Little Rock', 'Fort Smith', 'Fayetteville', 'Springdale', 'Jonesboro'],
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'Oakland'],
      'Colorado': ['Denver', 'Colorado Springs', 'Aurora', 'Fort Collins', 'Lakewood'],
      'Connecticut': ['Bridgeport', 'New Haven', 'Hartford', 'Stamford', 'Norwalk'],
      'Delaware': ['Wilmington', 'Dover', 'Newark', 'Middletown'],
      'Florida': ['Jacksonville', 'Miami', 'Tampa', 'Orlando', 'St. Petersburg'],
      'Georgia': ['Atlanta', 'Augusta', 'Savannah', 'Columbus', 'Athens']
    }
  },
  'Canada': {
    timezone: { name: 'Eastern Standard Time', utc: '(UTC-05:00)', description: 'Eastern Time (US & Canada)' },
    states: {
      'Alberta': ['Calgary', 'Edmonton', 'Lethbridge', 'Red Deer'],
      'British Columbia': ['Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Kelowna'],
      'Manitoba': ['Winnipeg', 'Brandon', 'Missinippi'],
      'Ontario': ['Toronto', 'Ottawa', 'Mississauga', 'Hamilton', 'London'],
      'Quebec': ['Montreal', 'Quebec City', 'Laval', 'Gatineau']
    }
  },
  'United Kingdom': {
    timezone: { name: 'GMT Standard Time', utc: '(UTC)', description: 'Dublin, Edinburgh, Lisbon, London' },
    states: {
      'England': ['London', 'Manchester', 'Birmingham', 'Leeds', 'Liverpool'],
      'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Perth'],
      'Wales': ['Cardiff', 'Swansea', 'Newport', 'Wrexham'],
      'Northern Ireland': ['Belfast', 'Derry', 'Armagh']
    }
  },
  'Australia': {
    timezone: { name: 'AUS Eastern Standard Time', utc: '(UTC+10:00)', description: 'Canberra, Melbourne, Sydney' },
    states: {
      'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast'],
      'Victoria': ['Melbourne', 'Geelong', 'Bendigo', 'Ballarat'],
      'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns'],
      'Western Australia': ['Perth', 'Fremantle', 'Mandurah'],
      'South Australia': ['Adelaide', 'Mount Barker', 'Salisbury'],
      'Tasmania': ['Hobart', 'Launceston']
    }
  },
  'Germany': {
    timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' },
    states: {
      'Bavaria': ['Munich', 'Nuremberg', 'Augsburg', 'Regensburg'],
      'Berlin': ['Berlin'],
      'Hamburg': ['Hamburg'],
      'Cologne': ['Cologne', 'Düsseldorf', 'Dortmund', 'Essen'],
      'Frankfurt': ['Frankfurt', 'Wiesbaden', 'Darmstadt']
    }
  },
  'France': {
    timezone: { name: 'Romance Standard Time', utc: '(UTC+01:00)', description: 'Brussels, Copenhagen, Madrid, Paris' },
    states: {
      'Île-de-France': ['Paris', 'Versailles', 'Boulogne-Billancourt'],
      'Provence-Alpes': ['Marseille', 'Nice', 'Toulon', 'Cannes'],
      'Auvergne-Rhône-Alpes': ['Lyon', 'Grenoble', 'Saint-Étienne'],
      'Nouvelle-Aquitaine': ['Bordeaux', 'Limoges', 'Poitiers'],
      'Occitanie': ['Toulouse', 'Montpellier']
    }
  },
  'Japan': {
    timezone: { name: 'Tokyo Standard Time', utc: '(UTC+09:00)', description: 'Osaka, Sapporo, Tokyo' },
    states: {
      'Hokkaido': ['Sapporo', 'Asahikawa', 'Hakodate'],
      'Tokyo': ['Tokyo'],
      'Osaka': ['Osaka', 'Kobe'],
      'Kyoto': ['Kyoto'],
      'Hiroshima': ['Hiroshima'],
      'Fukuoka': ['Fukuoka', 'Kitakyushu']
    }
  },
  'India': {
    timezone: { name: 'India Standard Time', utc: '(UTC+05:30)', description: 'Chennai, Kolkata, Mumbai, New Delhi' },
    states: {
      'Andhra Pradesh': ['Hyderabad', 'Visakhapatnam', 'Vijayawada', 'Guntur'],
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Aurangabad'],
      'Karnataka': ['Bangalore', 'Mysore', 'Mangalore', 'Hubballi'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
      'Delhi': ['Delhi'],
      'West Bengal': ['Kolkata', 'Darjeeling', 'Siliguri']
    }
  },
  'Brazil': {
    timezone: { name: 'E. South America Standard Time', utc: '(UTC-03:00)', description: 'Brasilia' },
    states: {
      'São Paulo': ['São Paulo', 'Santos', 'Campinas', 'São Bernardo do Campo'],
      'Rio de Janeiro': ['Rio de Janeiro', 'Niterói', 'Duque de Caxias'],
      'Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Juiz de Fora'],
      'Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
      'Pará': ['Belém', 'Ananindeua'],
      'Paraná': ['Curitiba', 'Londrina', 'Maringá']
    }
  },
  'Mexico': {
    timezone: { name: 'Central Standard Time (Mexico)', utc: '(UTC-06:00)', description: 'Guadalajara, Mexico City, Monterrey' },
    states: {
      'Mexico City': ['Mexico City'],
      'Jalisco': ['Guadalajara', 'Zapopan', 'Puerto Vallarta'],
      'Nuevo León': ['Monterrey', 'Guadalupe'],
      'Guanajuato': ['León', 'Guanajuato City'],
      'Baja California': ['Tijuana', 'Mexicali', 'Ensenada'],
      'Quintana Roo': ['Cancún', 'Playa del Carmen']
    }
  },
  'South Africa': {
    timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' },
    states: {
      'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto'],
      'Western Cape': ['Cape Town', 'Stellenbosch', 'George'],
      'Kwazulu-Natal': ['Durban', 'Pietermaritzburg'],
      'Limpopo': ['Polokwane', 'Thohoyandou'],
      'Mpumalanga': ['Mbombela', 'Secunda'],
      'Free State': ['Bloemfontein', 'Welkom']
    }
  },
  'China': { timezone: { name: 'China Standard Time', utc: '(UTC+08:00)', description: 'Beijing, Chongqing, Hong Kong SAR, Urumqi' } },
  'Russia': { timezone: { name: 'Russian Standard Time', utc: '(UTC+03:00)', description: 'Moscow, St. Petersburg, Volgograd' } },
  'Spain': { timezone: { name: 'Romance Standard Time', utc: '(UTC+01:00)', description: 'Brussels, Copenhagen, Madrid, Paris' } },
  'Italy': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Netherlands': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Belgium': { timezone: { name: 'Romance Standard Time', utc: '(UTC+01:00)', description: 'Brussels, Copenhagen, Madrid, Paris' } },
  'Poland': { timezone: { name: 'Central European Standard Time', utc: '(UTC+01:00)', description: 'Sarajevo, Skopje, Warsaw, Zagreb' } },
  'Turkey': { timezone: { name: 'Türkiye Standard Time', utc: '(UTC+02:00)', description: 'Istanbul' } },
  'Sweden': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Norway': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Denmark': { timezone: { name: 'Romance Standard Time', utc: '(UTC+01:00)', description: 'Brussels, Copenhagen, Madrid, Paris' } },
  'Finland': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } },
  'Portugal': { timezone: { name: 'GMT Standard Time', utc: '(UTC)', description: 'Dublin, Edinburgh, Lisbon, London' } },
  'Greece': { timezone: { name: 'GTB Standard Time', utc: '(UTC+02:00)', description: 'Athens, Bucharest' } },
  'Switzerland': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Austria': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Czech Republic': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Hungary': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Romania': { timezone: { name: 'GTB Standard Time', utc: '(UTC+02:00)', description: 'Athens, Bucharest' } },
  'Bulgaria': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } },
  'Croatia': { timezone: { name: 'Central European Standard Time', utc: '(UTC+01:00)', description: 'Sarajevo, Skopje, Warsaw, Zagreb' } },
  'Serbia': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Slovenia': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Slovakia': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Ireland': { timezone: { name: 'GMT Standard Time', utc: '(UTC)', description: 'Dublin, Edinburgh, Lisbon, London' } },
  'Iceland': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'New Zealand': { timezone: { name: 'New Zealand Standard Time', utc: '(UTC+12:00)', description: 'Auckland, Wellington' } },
  'Singapore': { timezone: { name: 'Singapore Standard Time', utc: '(UTC+08:00)', description: 'Kuala Lumpur, Singapore' } },
  'Hong Kong': { timezone: { name: 'China Standard Time', utc: '(UTC+08:00)', description: 'Beijing, Chongqing, Hong Kong SAR, Urumqi' } },
  'Thailand': { timezone: { name: 'SE Asia Standard Time', utc: '(UTC+07:00)', description: 'Bangkok, Hanoi, Jakarta' } },
  'Malaysia': { timezone: { name: 'Singapore Standard Time', utc: '(UTC+08:00)', description: 'Kuala Lumpur, Singapore' } },
  'Indonesia': { timezone: { name: 'SE Asia Standard Time', utc: '(UTC+07:00)', description: 'Bangkok, Hanoi, Jakarta' } },
  'Philippines': { timezone: { name: 'Singapore Standard Time', utc: '(UTC+08:00)', description: 'Kuala Lumpur, Singapore' } },
  'Vietnam': { timezone: { name: 'SE Asia Standard Time', utc: '(UTC+07:00)', description: 'Bangkok, Hanoi, Jakarta' } },
  'South Korea': { timezone: { name: 'Korea Standard Time', utc: '(UTC+09:00)', description: 'Seoul' } },
  'North Korea': { timezone: { name: 'Korea Standard Time', utc: '(UTC+09:00)', description: 'Seoul' } },
  'Taiwan': { timezone: { name: 'Taipei Standard Time', utc: '(UTC+08:00)', description: 'Taipei' } },
  'Pakistan': { timezone: { name: 'Pakistan Standard Time', utc: '(UTC+05:00)', description: 'Islamabad, Karachi' } },
  'Bangladesh': { timezone: { name: 'Bangladesh Standard Time', utc: '(UTC+06:00)', description: 'Dhaka' } },
  'Sri Lanka': { timezone: { name: 'Sri Lanka Standard Time', utc: '(UTC+05:30)', description: 'Sri Jayawardenepura' } },
  'Nepal': { timezone: { name: 'Nepal Standard Time', utc: '(UTC+05:45)', description: 'Kathmandu' } },
  'Afghanistan': { timezone: { name: 'Afghanistan Standard Time', utc: '(UTC+04:30)', description: 'Kabul' } },
  'Iran': { timezone: { name: 'Iran Standard Time', utc: '(UTC+03:30)', description: 'Tehran' } },
  'Iraq': { timezone: { name: 'Arabic Standard Time', utc: '(UTC+03:00)', description: 'Baghdad' } },
  'Saudi Arabia': { timezone: { name: 'Arab Standard Time', utc: '(UTC+03:00)', description: 'Kuwait, Riyadh' } },
  'United Arab Emirates': { timezone: { name: 'Arabian Standard Time', utc: '(UTC+04:00)', description: 'Abu Dhabi, Muscat' } },
  'Israel': { timezone: { name: 'Israel Standard Time', utc: '(UTC+02:00)', description: 'Middle East' } },
  'Egypt': { timezone: { name: 'Egypt Standard Time', utc: '(UTC+02:00)', description: 'Cairo' } },
  'Nigeria': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Kenya': {  
    timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' },
    states: {
      'Nairobi': ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra', 'Kariobangi North', 'Kariobangi South', 'Kasarani', 'Ruaraka', 'Mathare North', 'Mathare South', 'Embakasi North', 'Embakasi South', 'Embakasi East', 'Embakasi West', 'Embakasi Central', 'Makadara'],
      'Mombasa': ['Changamwe', 'Jomvu', 'Kisauni', 'Likoni', 'Mombasa', 'Nyali'],
      'Kilifi': ['Ganze', 'Kaloleni', 'Kilifi North', 'Kilifi South', 'Lamu East', 'Lamu West', 'Malindi'],
      'Lamu': ['Lamu East', 'Lamu West'],
      'Tana River': ['Galole', 'Garsen', 'Hola'],
      'Kwale': ['Lunga Lunga', 'Msambweni'],
      'Taita-Taveta': ['Mwatate', 'Taveta', 'Voi', 'Wundanyi'],
      'Nakuru': ['Bahati', 'Elburgon', 'Gilgil', 'Kuresoi North', 'Kuresoi South', 'Molo', 'Naivasha', 'Nakuru Town', 'Njoro', 'Subukia'],
      'Narok': ['Bomet', 'Narok East', 'Narok North', 'Narok South', 'Narok West', 'Transmara East', 'Transmara West'],
      'Kajiado': ['Isinya', 'Kajiado Central', 'Kajiado East', 'Kajiado North', 'Kajiado West', 'Loitokitok'],
      'Isiolo': ['Isiolo North', 'Isiolo South', 'Merti'],
      'Meru': ['Buuri', 'Central', 'Igembe Central', 'Igembe North', 'Igembe South', 'Imenti Central', 'Imenti North', 'Imenti South', 'Tigania East', 'Tigania West'],
      'Marsabit': ['Lagdera', 'Laisamis', 'Marsabit Central', 'Marsabit North', 'Moyale', 'Saku'],
      'Samburu': ['Samburu East', 'Samburu North', 'Samburu West'],
      'Garissa': ['Balambala', 'Dadaab', 'Garissa Township', 'Ijara', 'Lagdera'],
      'Wajir': ['Eldas', 'Hamar', 'Tarbaj', 'Wajir East', 'Wajir North', 'Wajir South', 'Wajir West'],
      'Mandera': ['Banaadir', 'Kacheliba', 'Lafmajong', 'Lainya', 'Mandera Central', 'Mandera East', 'Mandera North', 'Mandera South'],
      'Laikipia': ['Ilambarden', 'Laikipia Central', 'Laikipia East', 'Laikipia North', 'Laikipia West'],
      'Kirinyaga': ['Central', 'Gichichi', 'Gichugu', 'Kirinyaga South', 'Mwea', 'Ndia'],
      'Muranga': ['Gatanga', 'Kandara', 'Kangema', 'Kiharu', 'Kigumo', 'Maragua', 'Muranga North', 'Muranga South'],
      'Nyandarua': ['Karua', 'Kinangop', 'Mirangine', 'Murang\'a North', 'Ole Pusimoru', 'Ol Kalou', 'Nyahururu'],
      'Embu': ['Embu Central', 'Embu East', 'Embu North', 'Gachoka', 'Igoji', 'Mbeere North', 'Mbeere South', 'Runyenjes'],
      'Tharaka-Nithi': ['Chogoria', 'Kathwana', 'Marimba', 'Muthambi', 'Tharaka North'],
      'Kisumu': ['Ahero', 'Central Kisumu', 'East Kisumu', 'Kisumo East', 'Kisumu West', 'Muhoroni', 'Nyakach', 'Nyando', 'Seme', 'West Kisumu'],
      'Siaya': ['Alego-Usonga', 'Bondo', 'Gem', 'Muhoroni', 'Rarieda', 'Siaya', 'Ugenya', 'Ugunja'],
      'Homa Bay': ['Homabay Town', 'Karachuonyo', 'Kasipul', 'Kaswanga', 'Kanyamkago', 'Kochieng', 'Kosele', 'Njoro', 'Ndhiwa', 'Oyugis', 'Randigal', 'Rangwe', 'Suba North', 'Suba South'],
      'Migori': ['Awendo', 'Nyatike', 'Rongo', 'Suna East', 'Suna West', 'Uriri'],
      'Nyamira': ['Bogonko', 'Kitutu Chache North', 'Kitutu Chache South', 'Nyamira North', 'Nyamira South'],
      'Kisii': ['Bobasi', 'Bonchari', 'Kitutu Central', 'Kitutu Chache South', 'Kisii Central', 'Kisii East', 'Kisii West', 'Kitutu East'],
      'Bomet': ['Bomet Central', 'Bomet East', 'Chepalungu', 'Chepkwony', 'Konoin', 'Sotik'],
      'Uasin Gishu': ['Ainabkoi', 'Eldoret East', 'Eldoret North', 'Eldoret West', 'Kapsaret', 'Kesses', 'Kimumu', 'Moiben', 'Soi', 'Turbo'],
      'West Pokot': ['Central Pokot', 'East Pokot', 'North Pokot', 'Pokot South', 'Sigor', 'Weiwei'],
      'Trans Nzoia': ['Cherangany', 'Endebess', 'Kwanza', 'Saboti', 'Waitaluk'],
      'Bungoma': ['Bumula', 'Bungoma East', 'Bungoma South', 'Bungoma West', 'Kimilili', 'Kandutura', 'Musikari', 'Webuye East', 'Webuye West'],
      'Busia': ['Bunyala', 'Busia', 'Funyula', 'Nambale', 'Teso North', 'Teso South'],
      'Vihiga': ['Emuhaya', 'Hamisi', 'Luanda', 'Sabatia', 'Vihiga'],
      'Kakamega': ['Butula', 'Khwisero', 'Likuyani', 'Lugari', 'Lurambi', 'Malava', 'Matungu', 'Mumias', 'Mumias East', 'Nzoia', 'Shinyalu'],
      'Makueni': ['Kaiti', 'Kibwezi East', 'Kibwezi West', 'Kilome', 'Makueni', 'Mbooni East', 'Mbooni West', 'Mtito Andei'],
      'Machakos': ['Athi River', 'Kangundo', 'Kathiani', 'Machakos Central', 'Machakos East', 'Machakos South', 'Machakos West', 'Matungulu', 'Mavoko'],
      'Kiambu': ['Kahawa West', 'Gatanga', 'Gardimali', 'Kalimoni', 'Karuri', 'Kasarani', 'Kigumo', 'Kiambu Central', 'Kiambu North', 'Kiambu South', 'Kiambaa', 'Kikuyu', 'Limuru', 'Lari', 'Murang\'a South', 'Ruiru', 'Thika'],
      'Kericho': ['Ainamoi', 'Belgaum', 'Bureti', 'Chepseon', 'Kericho', 'Kipchoge', 'Sigowet-Soin'],
      'Nyeri': ['Kieni East', 'Kieni West', 'Mathira East', 'Mathira West', 'Mukurwe-ini', 'Nyeri Central', 'Nyeri South', 'Tetu'],
      'Murang\'a': ['Gatanga', 'Kandara', 'Kangema', 'Kiharu', 'Kigumo', 'Maragua', 'Murang\'a North', 'Murang\'a South'],
      'Baringo': ['Baringo Central', 'Baringo North', 'Baringo South', 'Eldama Ravine', 'Mogotio', 'Ravine', 'Tiaty'],
      'Elgeyo-Marakwet': ['Iten', 'Keiyo North', 'Keiyo South', 'Marakwet East', 'Marakwet West'],
      'Turkana': ['Chepareria', 'Donyiro', 'Kalacira North', 'Kalacira South', 'Kalobeyei', 'Katilu', 'Kainuk', 'Lodwar', 'Lokitaung', 'Loima', 'Turkana Central', 'Turkana East', 'Turkana North', 'Turkana South', 'Turkana West']
    }
  },
  'Ethiopia': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Ghana': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Morocco': { timezone: { name: 'Morocco Standard Time', utc: '(UTC)', description: 'Casablanca' } },
  'Algeria': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Tunisia': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Angola': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Zambia': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Zimbabwe': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Botswana': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Namibia': { timezone: { name: 'Namibia Standard Time', utc: '(UTC+01:00)', description: 'Windhoek' } },
  'Mozambique': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Malawi': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Tanzania': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Uganda': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Rwanda': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Burundi': { timezone: { name: 'South Africa Standard Time', utc: '(UTC+02:00)', description: 'Harare, Pretoria' } },
  'Sudan': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Peru': { timezone: { name: 'SA Pacific Standard Time', utc: '(UTC-05:00)', description: 'Bogota, Lima, Quito, Rio Branco' } },
  'Colombia': { timezone: { name: 'SA Pacific Standard Time', utc: '(UTC-05:00)', description: 'Bogota, Lima, Quito, Rio Branco' } },
  'Venezuela': { timezone: { name: 'Venezuela Standard Time', utc: '(UTC-04:30)', description: 'Caracas' } },
  'Ecuador': { timezone: { name: 'SA Pacific Standard Time', utc: '(UTC-05:00)', description: 'Bogota, Lima, Quito, Rio Branco' } },
  'Bolivia': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Chile': { timezone: { name: 'Pacific SA Standard Time', utc: '(UTC-03:00)', description: 'Santiago' } },
  'Argentina': { timezone: { name: 'Argentina Standard Time', utc: '(UTC-03:00)', description: 'City of Buenos Aires' } },
  'Uruguay': { timezone: { name: 'Montevideo Standard Time', utc: '(UTC-03:00)', description: 'Montevideo' } },
  'Paraguay': { timezone: { name: 'Paraguay Standard Time', utc: '(UTC-04:00)', description: 'Asuncion' } },
  'Guyana': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Suriname': { timezone: { name: 'SA Eastern Standard Time', utc: '(UTC-03:00)', description: 'Cayenne, Fortaleza' } },
  'Costa Rica': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'Panama': { timezone: { name: 'SA Pacific Standard Time', utc: '(UTC-05:00)', description: 'Bogota, Lima, Quito, Rio Branco' } },
  'Guatemala': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'Honduras': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'El Salvador': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'Nicaragua': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'Belize': { timezone: { name: 'Central America Standard Time', utc: '(UTC-06:00)', description: 'Central America' } },
  'Jamaica': { timezone: { name: 'SA Pacific Standard Time', utc: '(UTC-05:00)', description: 'Bogota, Lima, Quito, Rio Branco' } },
  'Haiti': { timezone: { name: 'Eastern Standard Time', utc: '(UTC-05:00)', description: 'Eastern Time (US & Canada)' } },
  'Dominican Republic': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Cuba': { timezone: { name: 'Eastern Standard Time', utc: '(UTC-05:00)', description: 'Eastern Time (US & Canada)' } },
  'Bahamas': { timezone: { name: 'Eastern Standard Time', utc: '(UTC-05:00)', description: 'Eastern Time (US & Canada)' } },
  'Trinidad and Tobago': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Barbados': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Grenada': { timezone: { name: 'SA Western Standard Time', utc: '(UTC-04:00)', description: 'Georgetown, La Paz, Manaus, San Juan' } },
  'Azerbaijan': { timezone: { name: 'Azerbaijan Standard Time', utc: '(UTC+04:00)', description: 'Baku' } },
  'Georgia': { timezone: { name: 'Georgian Standard Time', utc: '(UTC+04:00)', description: 'Tbilisi' } },
  'Armenia': { timezone: { name: 'Caucasus Standard Time', utc: '(UTC+04:00)', description: 'Yerevan' } },
  'Kazakhstan': { timezone: { name: 'Central Asia Standard Time', utc: '(UTC+06:00)', description: 'Astana' } },
  'Uzbekistan': { timezone: { name: 'West Asia Standard Time', utc: '(UTC+05:00)', description: 'Ashgabat, Tashkent' } },
  'Turkmenistan': { timezone: { name: 'West Asia Standard Time', utc: '(UTC+05:00)', description: 'Ashgabat, Tashkent' } },
  'Tajikistan': { timezone: { name: 'West Asia Standard Time', utc: '(UTC+05:00)', description: 'Ashgabat, Tashkent' } },
  'Kyrgyzstan': { timezone: { name: 'Central Asia Standard Time', utc: '(UTC+06:00)', description: 'Astana' } },
  'Libya': { timezone: { name: 'E. Europe Standard Time', utc: '(UTC+02:00)', description: 'E. Europe' } },
  'Senegal': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Mali': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Niger': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'South Sudan': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Somalia': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Djibouti': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Eritrea': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Mauritania': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Cameroon': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Gabon': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Congo': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Central African Republic': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Chad': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Benin': { timezone: { name: 'W. Central Africa Standard Time', utc: '(UTC+01:00)', description: 'West Central Africa' } },
  'Togo': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Ivory Coast': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Liberia': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Sierra Leone': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Guinea': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Guinea-Bissau': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Gambia': { timezone: { name: 'Greenwich Standard Time', utc: '(UTC)', description: 'Monrovia, Reykjavik' } },
  'Mauritius': { timezone: { name: 'Mauritius Standard Time', utc: '(UTC+04:00)', description: 'Port Louis' } },
  'Seychelles': { timezone: { name: 'Mauritius Standard Time', utc: '(UTC+04:00)', description: 'Port Louis' } },
  'Comoros': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Madagascar': { timezone: { name: 'E. Africa Standard Time', utc: '(UTC+03:00)', description: 'Nairobi' } },
  'Maldives': { timezone: { name: 'West Asia Standard Time', utc: '(UTC+05:00)', description: 'Ashgabat, Tashkent' } },
  'Cyprus': { timezone: { name: 'E. Europe Standard Time', utc: '(UTC+02:00)', description: 'E. Europe' } },
  'Lebanon': { timezone: { name: 'Middle East Standard Time', utc: '(UTC+02:00)', description: 'Beirut' } },
  'Syria': { timezone: { name: 'Syria Standard Time', utc: '(UTC+02:00)', description: 'Damascus' } },
  'Jordan': { timezone: { name: 'Jordan Standard Time', utc: '(UTC+02:00)', description: 'Amman' } },
  'Palestine': { timezone: { name: 'Egypt Standard Time', utc: '(UTC+02:00)', description: 'Cairo' } },
  'Bahrain': { timezone: { name: 'Arab Standard Time', utc: '(UTC+03:00)', description: 'Kuwait, Riyadh' } },
  'Qatar': { timezone: { name: 'Arab Standard Time', utc: '(UTC+03:00)', description: 'Kuwait, Riyadh' } },
  'Kuwait': { timezone: { name: 'Arab Standard Time', utc: '(UTC+03:00)', description: 'Kuwait, Riyadh' } },
  'Oman': { timezone: { name: 'Arabian Standard Time', utc: '(UTC+04:00)', description: 'Abu Dhabi, Muscat' } },
  'Yemen': { timezone: { name: 'Arab Standard Time', utc: '(UTC+03:00)', description: 'Kuwait, Riyadh' } },
  'Malta': { timezone: { name: 'W. Europe Standard Time', utc: '(UTC+01:00)', description: 'Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna' } },
  'Albania': { timezone: { name: 'Central Europe Standard Time', utc: '(UTC+01:00)', description: 'Belgrade, Bratislava, Budapest, Ljubljana, Prague' } },
  'Macedonia': { timezone: { name: 'Central European Standard Time', utc: '(UTC+01:00)', description: 'Sarajevo, Skopje, Warsaw, Zagreb' } },
  'Bosnia and Herzegovina': { timezone: { name: 'Central European Standard Time', utc: '(UTC+01:00)', description: 'Sarajevo, Skopje, Warsaw, Zagreb' } },
  'Montenegro': { timezone: { name: 'Central European Standard Time', utc: '(UTC+01:00)', description: 'Sarajevo, Skopje, Warsaw, Zagreb' } },
  'Belarus': { timezone: { name: 'Belarus Standard Time', utc: '(UTC+03:00)', description: 'Minsk' } },
  'Ukraine': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } },
  'Moldova': { timezone: { name: 'GTB Standard Time', utc: '(UTC+02:00)', description: 'Athens, Bucharest' } },
  'Lithuania': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } },
  'Latvia': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } },
  'Estonia': { timezone: { name: 'FLE Standard Time', utc: '(UTC+02:00)', description: 'Helsinki, Kyiv, Riga, Sofia, Tallinn, Vilnius' } }
};

// Map countries to their primary timezones for quick reference
export const COUNTRY_TIMEZONES = {
  'United States': 'EST/CST/MST/PST',
  'Canada': 'EST/CST/MST/PST',
  'United Kingdom': 'GMT/BST',
  'Australia': 'AEST/AEDT',
  'Germany': 'CET/CEST',
  'France': 'CET/CEST',
  'Japan': 'JST',
  'India': 'IST',
  'Brazil': 'BRT/BRST',
  'Mexico': 'CST/CDT',
  'South Africa': 'SAST'
};

// Get all available countries
export const getCountries = () => {
  let allCountries = Object.keys(LOCATION_DATA).sort();
  // Move Kenya to the beginning if it exists
  const kenyaIndex = allCountries.indexOf('Kenya');
  if (kenyaIndex > -1) {
    allCountries.splice(kenyaIndex, 1);
    allCountries.unshift('Kenya');
  }
  return allCountries;
};

// Get states for a specific country
export const getStatesByCountry = (country) => {
  return LOCATION_DATA[country]?.states ? Object.keys(LOCATION_DATA[country].states).sort() : [];
};

// Get cities for a specific country and state
export const getCitiesByState = (country, state) => {
  return LOCATION_DATA[country]?.states?.[state] || [];
};

// Get timezone for a country
export const getTimezonByCountry = (country) => {
  const tzData = LOCATION_DATA[country]?.timezone;
  if (!tzData) return '';
  
  // If timezone is an object, return formatted string: (UTC+03:00) Nairobi
  if (typeof tzData === 'object') {
    return `${tzData.utc} ${tzData.description}`;
  }
  
  // Fallback for legacy string format
  return tzData;
};

// Format location string
export const formatLocation = (country, state, city) => {
  const parts = [];
  if (city) parts.push(city);
  if (state && state !== country) parts.push(state);
  if (country) parts.push(country);
  return parts.join(', ');
};

// Parse location string back to components
export const parseLocation = (locationString) => {
  if (!locationString) return { country: '', state: '', city: '' };
  
  const parts = locationString.split(', ').filter(p => p.trim());
  let country = '';
  let state = '';
  let city = '';
  
  // Try to identify country (should be last part usually)
  const countries = getCountries();
  for (let i = parts.length - 1; i >= 0; i--) {
    if (countries.includes(parts[i])) {
      country = parts[i];
      parts.splice(i, 1);
      break;
    }
  }
  
  // Remaining parts: if 2, first is state, second is city. If 1, it's city.
  if (parts.length === 2) {
    state = parts[0];
    city = parts[1];
  } else if (parts.length === 1) {
    city = parts[0];
  }
  
  return { country, state, city };
};
