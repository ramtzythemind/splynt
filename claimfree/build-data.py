#!/usr/bin/env python3
"""Genera claimfree/data.js dai dataset OpenFlights.

Uso:
    curl -sLO https://raw.githubusercontent.com/jpatokal/openflights/master/data/airports.dat
    curl -sLO https://raw.githubusercontent.com/jpatokal/openflights/master/data/routes.dat
    curl -sLO https://raw.githubusercontent.com/jpatokal/openflights/master/data/airlines.dat
    curl -sLO https://raw.githubusercontent.com/jpatokal/openflights/master/data/countries.dat
    python3 build-data.py     # scrive data.js nella cartella corrente

Tiene solo gli scali serviti da rotte di linea, assegna a ognuno la
giurisdizione (Reg. 261/2004, UK261 o nessuna) e il numero di rotte, che serve
a ordinare i risultati della ricerca. Dati OpenFlights, licenza ODbL.
"""

import csv, json, re, io

EU = set("AT BE BG CY CZ DE DK EE ES FI FR GR HR HU IE IT LT LU LV MT NL PL PT RO SE SI SK".split())
# Regioni ultraperiferiche dove i Trattati (e quindi il 261) si applicano
EU |= set("GP MQ GF RE YT MF".split())
# EEA + Svizzera: il 261 si applica lo stesso
EU |= set("IS NO LI CH".split())
# Territori legati a uno Stato membro ma FUORI dal campo di applicazione
NOT_EU = set("GL FO AW CW SX BQ NC PF WF PM TF BL".split())
UK = set("GB GI JE GG IM".split())

EXTRA_ISO = {
    'Faroe Islands': 'FO', 'Congo (Brazzaville)': 'CG', 'Swaziland': 'SZ',
    'Congo (Kinshasa)': 'CD', 'Cape Verde': 'CV', 'Saint Pierre and Miquelon': 'PM',
    'Wallis and Futuna': 'WF', 'Micronesia': 'FM', 'Virgin Islands': 'VI',
    'Saint Kitts and Nevis': 'KN', 'Saint Lucia': 'LC',
    'Saint Vincent and the Grenadines': 'VC', 'Kyrgyzstan': 'KG', 'Macau': 'MO',
    'Burma': 'MM', 'Brunei': 'BN', 'East Timor': 'TL',
}

iso = {}
for r in csv.reader(open('countries.dat')):
    if len(r) >= 2 and r[1]:
        iso[r[0]] = r[1]
iso.update(EXTRA_ISO)

served = set()
weight = {}
for r in csv.reader(open('routes.dat')):
    if len(r) > 4:
        served.add(r[2]); served.add(r[4])
        weight[r[2]] = weight.get(r[2], 0) + 1
        weight[r[4]] = weight.get(r[4], 0) + 1

NOISE = re.compile(r'\b(International|Intl|Airport|Airfield|Aerodrome|Regional|Municipal|Airpark|Field)\b', re.I)

def short(name, city):
    n = NOISE.sub('', name)
    n = re.sub(r'\s{2,}', ' ', n).strip(' -,')
    if not n:
        n = city
    return n

rows, skipped = [], 0
for r in csv.reader(open('airports.dat')):
    if len(r) < 8: continue
    _, name, city, country, iata, icao, lat, lon = r[:8]
    if iata == '\\N' or len(iata) != 3: continue
    if iata not in served: continue
    cc = iso.get(country, '')
    if not cc:
        skipped += 1
        continue
    j = 'E' if (cc in EU and cc not in NOT_EU) else ('U' if cc in UK else '')
    disp = short(name, city)
    # se il nome breve contiene già la città, non ripetere la città
    c = '' if (city and city.lower() in disp.lower()) else city
    rows.append('|'.join([iata, disp, c, cc, j, f'{float(lat):.2f}', f'{float(lon):.2f}',
                          str(weight.get(iata, 0))]))

rows.sort()
print('aeroporti:', len(rows), 'scartati (paese ignoto):', skipped)

# --- compagnie ---
# OpenFlights riusa lo stesso codice IATA per compagnie diverse (VY = Vueling ma
# anche una defunta taiwanese): a parità di codice vince quella con più rotte.
freq = {}
for r in csv.reader(open('routes.dat')):
    if r: freq[r[0]] = freq.get(r[0], 0) + 1

cand = {}
for r in csv.reader(open('airlines.dat')):
    if len(r) < 8: continue
    _, name, alias, iata, icao, callsign, country, active = r[:8]
    if active != 'Y': continue
    if not iata or iata == '\\N' or len(iata) != 2: continue
    if iata not in freq: continue
    cc = iso.get(country, '')
    prev = cand.get(iata)
    # euristica: tengo la prima, ma una compagnia europea batte una omonima extra-UE
    # quando il codice è conteso (le rotte del dataset sono in gran parte europee)
    if prev is None:
        cand[iata] = (name.strip(), cc)

# Correzioni e aggiornamenti a mano: il dataset OpenFlights è fermo a ~2014.
OVERRIDE = {
    'AZ': ('ITA Airways', 'IT'), 'VY': ('Vueling', 'ES'), 'U2': ('easyJet', 'GB'),
    'EJU': ('easyJet Europe', 'AT'), 'XZ': ('Aeroitalia', 'IT'), 'NO': ('Neos', 'IT'),
    'IG': ('Air Dolomiti', 'IT'), 'BV': ('Aeroitalia', 'IT'), 'W6': ('Wizz Air', 'HU'),
    'W4': ('Wizz Air Malta', 'MT'), 'W9': ('Wizz Air UK', 'GB'), 'FR': ('Ryanair', 'IE'),
    'RK': ('Ryanair UK', 'GB'), 'LH': ('Lufthansa', 'DE'), 'EW': ('Eurowings', 'DE'),
    'OS': ('Austrian Airlines', 'AT'), 'LX': ('SWISS', 'CH'), 'SN': ('Brussels Airlines', 'BE'),
    'AF': ('Air France', 'FR'), 'KL': ('KLM', 'NL'), 'TO': ('Transavia France', 'FR'),
    'HV': ('Transavia', 'NL'), 'IB': ('Iberia', 'ES'), 'I2': ('Iberia Express', 'ES'),
    'UX': ('Air Europa', 'ES'), 'TP': ('TAP Air Portugal', 'PT'), 'A3': ('Aegean Airlines', 'GR'),
    'OA': ('Olympic Air', 'GR'), 'SK': ('SAS', 'DK'), 'DY': ('Norwegian', 'NO'),
    'D8': ('Norwegian Air Sweden', 'SE'), 'FI': ('Icelandair', 'IS'), 'AY': ('Finnair', 'FI'),
    'LO': ('LOT Polish Airlines', 'PL'), 'OK': ('Czech Airlines', 'CZ'), 'RO': ('TAROM', 'RO'),
    'JU': ('Air Serbia', 'RS'), 'TK': ('Turkish Airlines', 'TR'), 'PC': ('Pegasus Airlines', 'TR'),
    'BA': ('British Airways', 'GB'), 'VS': ('Virgin Atlantic', 'GB'), 'BY': ('TUI Airways', 'GB'),
    'EI': ('Aer Lingus', 'IE'), 'KM': ('KM Malta Airlines', 'MT'), 'LG': ('Luxair', 'LU'),
    'EK': ('Emirates', 'AE'), 'QR': ('Qatar Airways', 'QA'), 'EY': ('Etihad Airways', 'AE'),
    'MS': ('EgyptAir', 'EG'), 'AT': ('Royal Air Maroc', 'MA'), 'TU': ('Tunisair', 'TN'),
    'DL': ('Delta Air Lines', 'US'), 'AA': ('American Airlines', 'US'), 'UA': ('United Airlines', 'US'),
    'AC': ('Air Canada', 'CA'), 'LA': ('LATAM Airlines', 'CL'), 'SU': ('Aeroflot', 'RU'),
    'SQ': ('Singapore Airlines', 'SG'), 'CX': ('Cathay Pacific', 'HK'), 'JL': ('Japan Airlines', 'JP'),
    'NH': ('ANA', 'JP'), 'AI': ('Air India', 'IN'), 'ET': ('Ethiopian Airlines', 'ET'),
    'QF': ('Qantas', 'AU'), 'NZ': ('Air New Zealand', 'NZ'), 'SA': ('South African Airways', 'ZA'),
}
cand.update(OVERRIDE)

alines = []
for code, (name, cc) in cand.items():
    j = 'E' if (cc in EU and cc not in NOT_EU) else ('U' if cc in UK else '')
    alines.append('|'.join([code, name, cc, j]))

alines.sort(key=lambda s: s.split('|')[1].lower())
print('compagnie:', len(alines))

out = io.StringIO()
out.write('/* Generato da OpenFlights (openflights.org/data, ODbL) — vedi README.\n')
out.write('   Formato aeroporti:  IATA|nome|citta|paese|giurisdizione|lat|lon|rotte\n')
out.write('   giurisdizione: E = UE/SEE/CH (Reg. 261/2004) · U = Regno Unito (UK261) · vuoto = altro\n')
out.write('   Formato compagnie:  IATA|nome|paese|giurisdizione                                   */\n')
out.write('window.CLAIMFREE_DATA = {\n  airports: ' + json.dumps('\n'.join(rows), ensure_ascii=False) + ',\n')
out.write('  airlines: ' + json.dumps('\n'.join(alines), ensure_ascii=False) + '\n};\n')
open('data.js', 'w').write(out.getvalue())
