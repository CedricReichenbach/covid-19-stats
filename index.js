const baseUrl = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_daily_reports/';

const table = document.querySelector('#main-table');
const thead = document.querySelector('#main-table > thead');
const tbody = document.querySelector('#main-table > tbody');
const dateInput = document.querySelector('#date-input');
const applyButton = document.querySelector('#apply-button');

(function defaultToYesteday() {
    const date = yesterdayish();
    const month = date.getMonth() + 1 + '';
    const day = date.getDate() + '';
    dateInput.value = `${date.getFullYear()}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
})();

displayForDay(yesterdayish());

applyButton.addEventListener('click', () => {
    const date = new Date(dateInput.value);
    displayForDay(date);
});

/** 1.5 days ago */
function yesterdayish() {
    const date = new Date();
    date.setHours(date.getHours() - 36);
    return date;
}

async function dataForDay(date) {
    // MM-DD-YYYY.csv
    const month = date.getMonth() + 1 + '';
    const day = date.getDate() + '';
    const fileName = `${month.padStart(2, '0')}-${day.padStart(2, '0')}-${date.getFullYear()}.csv`;

    const response = await fetch(baseUrl + fileName);
    if (response.status >= 400) throw `Failed to load data (${(await response.text()).replace('\n', '')})`;

    return await response.text();
}

async function displayForDay(date) {
    const csv = await dataForDay(date).catch(err => alert(err));
    const lines = csv.split('\n');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    const headers = lines.shift();
    addRow(splitLine(headers), true);

    lines.forEach(line => addRow(splitLine(line)));

    // trick sort-table into forgetting it already ran
    table.attributes.removeNamedItem('data-js-sort-table');
    sortTable.init();
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
    if (entries.length !== 8) {
        console.warn('Unexpected number of entries: ' + entries.length);
        return;
    }

    const extended = deriveStats(entries, isHeader);

    // remove combined_key
    extended.splice(11, 1);
    // remove last-update date, latitude, longitude
    extended.splice(4, 3);
    // remove FIPS, admin2
    extended.splice(0, 2);

    const tr = document.createElement('tr');
    extended.forEach((entry, i) => {
        const cell = document.createElement(isHeader ? 'th' : 'td');
        cell.textContent = entry;
        // confirmed, deaths, recovered, active, ratio
        if ([2, 3, 4, 5].includes(i)) cell.classList.add('js-sort-number');
        tr.append(cell);
    });

    (isHeader ? thead : tbody).append(tr);
}

function deriveStats(entries, isHeader) {
    if (isHeader) return [...entries, 'Deaths / Confirmed*'];

    const confirmed = entries[3];
    const deaths = entries[4];
    const recovered = entries[5];

    const extended = entries;
    const deathPercentage = deaths / confirmed * 100;
    extended.push(isNaN(deathPercentage) ? '-' : `${deathPercentage.toFixed(2)} %`);
    return extended;
}
