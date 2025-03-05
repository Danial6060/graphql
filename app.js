const API_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

// GraphQL Queries
const userQuery = `
    query User {
        user {
            id
            login 
            attrs
            firstName
            lastName
            email
            campus
            totalUp
            totalDown
            auditRatio
            progresses {
                grade
                path
                updatedAt
            }
            transactions {
                amount
                type
                path
                createdAt
            }
        }
    }
`;

const xpModelQuery = `
    query Transaction {
        transaction(order_by: { createdAt: asc }, where: { type: { _eq: "xp" }, path: { _niregex: "piscine-js/|piscine-bh"  _iregex: "bh-module"} }) {
            amount
            attrs
            createdAt
            originEventId
            path
            type
        }
    }
`;

const levelQuery = `
    query Transaction {
        transaction(order_by: { amount: asc }, where: { type: { _eq: "level" }, path: { _niregex: "piscine" }}) {
            amount
            attrs
            createdAt
            path
        }
    }
`;

const skillsQuery = `
    query Transaction {
        transaction(order_by: { createdAt: asc }, where: { type: {_iregex: "skill" }}) {
            type
            amount
            attrs
            createdAt
            path
        }
    }
`;

let token = null;

// Authentication function
async function AuthUser(encodedCredentials) {
    try {
        const response = await fetch("https://learn.reboot01.com/api/auth/signin", {
            method: "POST",
            headers: {
                'Authorization': `Basic ${encodedCredentials}`,
                'Content-Type': 'application/json'
            }
        });

        const result = await response.json();

        if (!result.error) {
            token = result;
            return true; // Login successful
        } else {
            alert(result.error); // Display error message
            return false; // Login failed
        }
    } catch (error) {
        alert('Unable to fetch login data. Please try again later.');
        return false; // Handle other errors
    }
}

// Fetch data from GraphQL API
async function getData(query) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ query: query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.data;
    } catch (error) {
        console.error(error);
        alert('Error fetching data. Please try again.');
    }
}

// Event listener for login button
document.getElementById('loginButton').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const credentials = `${username}:${password}`;
    const encodedCredentials = btoa(credentials);

    const isLogged = await AuthUser(encodedCredentials);
    if (isLogged) {
        // Hide login, show container
        document.getElementById('login').style.display = 'none';
        document.getElementById('container').style.display = 'block';
        loadUserData();
    }
});

// Event listener for logout button
document.getElementById('logoutButton').addEventListener('click', () => {
    token = null;
    // Hide container, show login
    document.getElementById('container').style.display = 'none';
    document.getElementById('login').style.display = 'block';
});

// Load user data and render charts
async function loadUserData() {
    const userData = await getData(userQuery);
    const xpData = await getData(xpModelQuery);
    const levelData = await getData(levelQuery);
    const skillsData = await getData(skillsQuery);

    if (userData) {
        renderUserProfile(userData.user[0]);
        renderCharts(
            userData.user[0],
            xpData.transaction,
            levelData.transaction,
            skillsData.transaction
        );
    }
}

// Render user profile information
function renderUserProfile(user) {
    const userInfoDiv = document.getElementById('userInfo');
    const auditInfoDiv = document.getElementById('auditInfo');

    // User Info
    userInfoDiv.innerHTML = `
        <p>Welcome <strong>${user.firstName} ${user.lastName}</strong>!</p>
        <p>Campus: ${user.campus}</p>
        <p>Email: ${user.email}</p>
        <p>CPR: ${user.attrs['CPRnumber']}</p>
        <p>Gender: ${user.attrs['gender']}</p>
        <p>Phone Number: ${user.attrs['PhoneNumber']}</p>
    `;

    // Audit Info
    auditInfoDiv.innerHTML = `
        <p>Audit XP Received: ${formatXP(user.totalUp)}</p>
        <p>Audit XP Given: ${formatXP(user.totalDown)}</p>
        <p>Audit Ratio: ${user.auditRatio.toFixed(2)}</p>
    `;
}

// Format XP value
function formatXP(xp) {
    if (xp > 1000000) {
        return (xp / 1000000).toFixed(2) + ' MB';
    } else if (xp > 1000) {
        return (xp / 1000).toFixed(2) + ' KB';
    } else {
        return xp + ' B';
    }
}

// Render charts
function renderCharts(user, xpData, levelData, skillsData) {
    document.getElementById('levelChart').appendChild(levelSVG(levelData));
    document.getElementById('skillsChart').appendChild(skillsBarChart(skillsData));
    document.getElementById('xpChart').appendChild(xpSVG(xpData));
}

// -------------------- SVG Rendering Functions --------------------

// LEVEL CHART
function levelSVG(data) {
    const list = levelByMonth(data);
    const maxLevel = list[list.length - 1][1];
    let w = document.getElementById('container').clientWidth - 40;
    if (w > 600) {
        w = 600;
    }

    // Create SVG
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "liner-chart");
    svg.setAttribute("width", w);
    svg.setAttribute("height", 400);

    // Background rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 20);
    rect.setAttribute("y", 30);
    rect.setAttribute("width", w - 40);
    rect.setAttribute("height", 250);
    rect.setAttribute("fill", "white");
    svg.appendChild(rect);

    // Chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 20);
    titleText.setAttribute("fill", "black");
    titleText.textContent = "User Levels by Month";
    svg.appendChild(titleText);

    // Y-axis label
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("x", 15);
    yAxisLabel.setAttribute("y", 180);
    yAxisLabel.setAttribute("fill", "black");
    yAxisLabel.setAttribute("transform", `rotate(-90 15 180)`);
    yAxisLabel.textContent = "Levels";
    svg.appendChild(yAxisLabel);

    list.forEach((element, index) => {
        const x = (index / (list.length - 1)) * (w - 50) + 20;
        const y = 280 - ((element[1] || 0) / maxLevel) * 200;

        // Circle
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("fill", "green");
        svg.appendChild(circle);

        // Connecting line
        if (index > 0) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", ((index - 1) / (list.length - 1)) * (w - 50) + 20);
            line.setAttribute("y1", 280 - ((list[index - 1][1] || 0) / maxLevel) * 200);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "blue");
            line.setAttribute("stroke-width", 2);
            svg.appendChild(line);
        }

        // Value text
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x - 5);
        valueText.setAttribute("y", y - 10);
        valueText.setAttribute("fill", "black");
        valueText.textContent = element[1];
        svg.appendChild(valueText);

        // Month label every other data point
        if (index % 2 !== 0) {
            const monthLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            monthLabel.setAttribute("x", x - 50);
            monthLabel.setAttribute("y", 310);
            monthLabel.setAttribute("fill", "black");
            monthLabel.setAttribute("transform", `rotate(-90 ${x} 300)`);
            monthLabel.textContent = element[0];
            svg.appendChild(monthLabel);
        }
    });

    return svg;
}

function levelByMonth(data) {
    const monthLevels = {};
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May',
      'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];

    let lastMonth = new Date(data[data.length - 1].createdAt).getMonth();
    let lastYear = new Date(data[data.length - 1].createdAt).getFullYear();
    let firstMonth = new Date(data[0].createdAt).getMonth() - 1;
    let firstYear = new Date(data[0].createdAt).getFullYear();

    for (let i = firstYear; i <= lastYear; i++) {
        for (let j = 0; j < 12; j++) {
            if (i === firstYear && j < firstMonth) continue;
            if (i === lastYear && j > lastMonth) break;
            monthLevels[`${allMonths[j]} ${i}`] = 0;
        }
    }

    // Shift data to align with the start
    while (
        data.length > 0 &&
        new Date(data[0].createdAt).getMonth() !==
            new Date(data[data.length - 1].createdAt).getMonth()
    ) {
        const date = new Date(data[0].createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        monthLevels[monthYear] = data[0].amount;
        data.shift();
    }

    // Fill in the maximum level per month
    data.forEach((d) => {
        const date = new Date(d.createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        const level = d.amount;
        if (!monthLevels[monthYear] || monthLevels[monthYear] < level) {
            monthLevels[monthYear] = level;
        }
    });

    // Fill zero months with last known level
    const keys = Object.keys(monthLevels);
    for (let i = 1; i < keys.length; i++) {
        if (monthLevels[keys[i]] === 0) {
            monthLevels[keys[i]] = monthLevels[keys[i - 1]];
        }
    }
    return Object.entries(monthLevels);
}

// SKILLS BAR CHART
function skillsBarChart(data) {
    const skills = filterMax(data);
    const barWidth = 20;
    const barPadding = 10;
    let w = document.getElementById('container').clientWidth - 40;
    if (w > 600) {
        w = 600;
    }

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "bar-chart");
    svg.setAttribute("width", w);
    svg.setAttribute("height", skills.length * (barWidth + barPadding + 3) + 50);

    // Chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 30);
    titleText.textContent = "Skills Levels";
    svg.appendChild(titleText);

    skills.forEach((skill, index) => {
        const x = 100;
        const y = index * (barWidth + barPadding) + 50;

        // Bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", skill.amount * ((w - 110) / 100));
        rect.setAttribute("height", barWidth);
        rect.setAttribute("fill", "blue");
        svg.appendChild(rect);

        // Amount label
        const amountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        amountText.setAttribute("x", x + skill.amount * ((w - 110) / 100) + 10);
        amountText.setAttribute("y", y + barWidth - 5);
        amountText.textContent = skill.amount;
        svg.appendChild(amountText);

        // Skill label
        const typeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        typeText.setAttribute("x", x - 80);
        typeText.setAttribute("y", y + barWidth / 2 + 5);
        typeText.textContent = skill.type.split('_').pop();
        svg.appendChild(typeText);
    });

    return svg;
}

function filterMax(data) {
    const max = data.reduce((acc, curr) => {
        if (!acc[curr.type] || acc[curr.type].amount < curr.amount) {
            acc[curr.type] = curr;
        }
        return acc;
    }, {});
    const maxValues = Object.values(max);
    // Sort by alphabetical order
    maxValues.sort((a, b) => a.type.localeCompare(b.type));
    return maxValues;
}

// XP CHART
function xpSVG(data) {
    const monthXp = xpByMonth(data);
    const maxXP = monthXp[monthXp.length - 1][1];
    let w = document.getElementById('container').clientWidth - 40;
    if (w > 600) {
        w = 600;
    }

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "liner-chart");
    svg.setAttribute("width", w);
    svg.setAttribute("height", 400);

    // Background rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 20);
    rect.setAttribute("y", 30);
    rect.setAttribute("width", w - 40);
    rect.setAttribute("height", 250);
    rect.setAttribute("fill", "white");
    svg.appendChild(rect);

    // Chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 20);
    titleText.setAttribute("fill", "black");
    titleText.textContent = "User XP by Month";
    svg.appendChild(titleText);

    // Y-axis label
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("x", 15);
    yAxisLabel.setAttribute("y", 180);
    yAxisLabel.setAttribute("fill", "black");
    yAxisLabel.setAttribute("transform", `rotate(-90 15 180)`);
    yAxisLabel.textContent = "XP";
    svg.appendChild(yAxisLabel);

    // Y-axis ticks + grid lines
    const numTicks = 5;  // Adjust for more/less lines
    for (let i = 0; i <= numTicks; i++) {
        const tickValue = (maxXP / numTicks) * i;
        const yPos = 280 - (tickValue / maxXP) * 200;

        // Horizontal tick line
        const tickLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        tickLine.setAttribute("x1", 20);
        tickLine.setAttribute("y1", yPos);
        tickLine.setAttribute("x2", w - 20);
        tickLine.setAttribute("y2", yPos);
        tickLine.setAttribute("stroke", "#ccc");
        tickLine.setAttribute("stroke-dasharray", "2,2");
        svg.appendChild(tickLine);

        // Tick label
        const tickLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
        tickLabel.setAttribute("x", 25);
        tickLabel.setAttribute("y", yPos - 5);
        tickLabel.setAttribute("fill", "black");
        tickLabel.setAttribute("font-size", "10");
        tickLabel.textContent = Math.round(tickValue);
        svg.appendChild(tickLabel);
    }

    // Plot data points + lines
    monthXp.forEach((element, index) => {
        const x = (index / (monthXp.length - 1)) * (w - 50) + 20;
        const y = 280 - ((element[1] || 0) / maxXP) * 200;

        // Circle for data point
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("fill", "green");
        svg.appendChild(circle);

        // Line between consecutive points
        if (index > 0) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", ((index - 1) / (monthXp.length - 1)) * (w - 50) + 20);
            line.setAttribute("y1", 280 - ((monthXp[index - 1][1] || 0) / maxXP) * 200);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "black");
            svg.appendChild(line);
        }

        // (Removed the text label on each point to reduce clutter)

        // Month label (every other point)
        if (index % 2 !== 0) {
            const monthLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
            monthLabel.setAttribute("x", x - 50);
            monthLabel.setAttribute("y", 310);
            monthLabel.setAttribute("fill", "black");
            monthLabel.setAttribute("transform", `rotate(-90 ${x} 300)`);
            monthLabel.textContent = element[0];
            svg.appendChild(monthLabel);
        }
    });

    return svg;
}

function xpByMonth(data) {
    const monthLevels = {};
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May',
      'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'
    ];
    let lastMonth = new Date(data[data.length - 1].createdAt).getMonth();
    let lastYear = new Date(data[data.length - 1].createdAt).getFullYear();
    let firstMonth = new Date(data[0].createdAt).getMonth() - 1;
    let firstYear = new Date(data[0].createdAt).getFullYear();

    // Initialize all months from firstYear..lastYear
    for (let i = firstYear; i <= lastYear; i++) {
        for (let j = 0; j < 12; j++) {
            if (i === firstYear && j < firstMonth) continue;
            if (i === lastYear && j > lastMonth) break;
            monthLevels[`${allMonths[j]} ${i}`] = 0;
        }
    }

    // In case there's a discrepancy in the earliest date
    while (
        data.length > 0 &&
        new Date(data[0].createdAt).getMonth() !==
            new Date(data[data.length - 1].createdAt).getMonth()
    ) {
        const date = new Date(data[0].createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        monthLevels[monthYear] = data[0].amount;
        data.shift();
    }

    // Accumulate XP month by month
    let xp = 0;
    data.forEach((d) => {
        const date = new Date(d.createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        xp += d.amount;
        monthLevels[monthYear] = xp;
    });

    // Fill empty months with the last known XP
    const keys = Object.keys(monthLevels);
    for (let i = 1; i < keys.length; i++) {
        if (monthLevels[keys[i]] === 0) {
            monthLevels[keys[i]] = monthLevels[keys[i - 1]];
        }
    }
    return Object.entries(monthLevels);
}
