const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';

const table = document.querySelector('#main-table');

async function dataForDay(date) {
    // MM-DD-YYYY.csv
    const month = date.getMonth() + 1 + '';
    const day = date.getDate() + '';
    const fileName = `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${date.getFullYear()}.csv`;

    const response = await fetch(baseUrl + fileName);
    return await response.text();
}

async function displayForDay(date) {
    const csv = await dataForDay(date);
    const lines = csv.split('\n');

    const headers = lines.shift();
    addRow(splitLine(headers), true);

    lines.forEach(line => addRow(splitLine(line)));
}

function splitLine(line) {
    const splitIndices = [];
    let inString = false;
    [...line].forEach((char, i) => {
        if (char === '"') inString = !inString;
        if (char === ',' && !inString) splitIndices.push(i);
    });

    let leftover = line;
    const parts = [];
    // back to front, so indices stay stable
    splitIndices.reverse().forEach(i => {
        parts.unshift(leftover.slice(i + 1).replace(/^"|"$/g, ''));
        leftover = leftover.slice(0, i);
    });
    parts.unshift(leftover);

    return parts;
}

function addRow(entries, isHeader) {
    const extended = deriveStats(entries, isHeader);

    // remove latitude, longitude
    extended.splice(6, 2);

    const tr = document.createElement('tr');
    extended.forEach(entry => {
        const cell = document.createElement(isHeader ? 'th' : 'td');
        cell.textContent = entry;
        tr.append(cell);
    });
    table.append(tr);
}

function deriveStats(entries, isHeader) {
    if (isHeader) return [...entries, 'Deaths per confirmed case'];

    const confirmed = entries[3];
    const deaths = entries[4];
    const recovered = entries[5];

    const extended = entries;
    const deathPercentage = deaths / confirmed * 100;
    extended.push(isNaN(deathPercentage) ? '-' : `${deathPercentage.toFixed(2)} %`);
    return extended;
}

// test
displayForDay(new Date('2020-03-15'));
