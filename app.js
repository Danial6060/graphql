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
        renderCharts(userData.user[0], xpData.transaction, levelData.transaction, skillsData.transaction);
      
        
    }
}


// Render user profile information
function renderUserProfile(user) {
    const welcomeMessage = document.getElementById('welcomeMessage');
    welcomeMessage.innerHTML = `
        <h2>User Info</h2>
        <p>Welcome ${user.firstName} ${user.lastName} !</p>
         <p>Campus: ${user.campus}</p>
        <p>Email: ${user.email}</p>
       
        <p>CPR: ${user.attrs['CPRnumber']}</p>
        <p>Gender: ${user.attrs['gender']}</p>
        <p>Phone Number: ${user.attrs['PhoneNumber']}</p>
        
        
        <h2>Audit Info</h2>
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

// Setup button listeners for different tables


// Display Tables

// Function to display different tables based on selection




// SVG Rendering Functions

// Function to create SVG for Level by Month
function levelSVG(data) {
    const list = levelByMonth(data);
    const maxLevel = list[list.length - 1][1];
    let w = document.getElementById('container').clientWidth - 40;
    if (w > 600) {
        w = 600;
    }

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "liner-chart");
    svg.setAttribute("width", w);
    svg.setAttribute("height", 400);

    // Create background rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 20);
    rect.setAttribute("y", 30);
    rect.setAttribute("width", w - 40);
    rect.setAttribute("height", 250);
    rect.setAttribute("fill", "white");
    svg.appendChild(rect);

    // Create chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 20);
    titleText.setAttribute("fill", "black");
    titleText.textContent = "User Levels by Month";
    svg.appendChild(titleText);

    // Create y-axis label
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("x", 15);
    yAxisLabel.setAttribute("y", 180);
    yAxisLabel.setAttribute("fill", "black");
    yAxisLabel.setAttribute("transform", `rotate(-90 15 180)`);
    yAxisLabel.textContent = "Levels";
    svg.appendChild(yAxisLabel);

    list.forEach((element, index) => {
        const x = (index / (list.length - 1)) * (w - 50) + 20; // Adjust x position
        const y = 280 - ((element[1] === undefined ? 0 : element[1]) / maxLevel) * 200; // Adjust y position based on maxLevel

        // Create circle for data point
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("fill", "green");
        svg.appendChild(circle);

        // Create line between points
        if (index > 0) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", (index - 1) / (list.length - 1) * (w - 50) + 20);
            line.setAttribute("y1", 280 - ((list[index - 1][1] === undefined ? 0 : list[index - 1][1])) / maxLevel * 200);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "blue");
            line.setAttribute("stroke-width", 2);
            svg.appendChild(line);
        }

        // Create text for data value
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x - 5);
        valueText.setAttribute("y", y - 10);
        valueText.setAttribute("fill", "black");
        valueText.textContent = element[1];
        svg.appendChild(valueText);

        // Create label for month (odd indices)
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

// Function to process data into month-based levels
function levelByMonth(data) {
    const monthLevels = {};
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    let lastMonth = new Date(data[data.length - 1].createdAt).getMonth();
    let lastYear = new Date(data[data.length - 1].createdAt).getYear() + 1900;
    let firstMonth = new Date(data[0].createdAt).getMonth() - 1;
    let firstYear = new Date(data[0].createdAt).getYear() + 1900;
    for (let i = firstYear; i <= lastYear; i++) {
        for (let j = 0; j < 12; j++) {
            if (i === firstYear && j < firstMonth) {
                continue;
            }
            if (i === lastYear && j > lastMonth) {
                break;
            }
            monthLevels[`${allMonths[j]} ${i}`] = 0;
        }
    }
    while (data.length > 0 && new Date(data[0].createdAt).getMonth() !== new Date(data[data.length - 1].createdAt).getMonth()) {
        const date = new Date(data[0].createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        monthLevels[monthYear] = data[0].amount;
        data.shift();
    }
    data.forEach((d, i) => {
        const date = new Date(d.createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        const level = d.amount;
        if (!monthLevels[monthYear] || monthLevels[monthYear] < level) {
            monthLevels[monthYear] = level;
        }
    });
    for (let i = 0; i < Object.keys(monthLevels).length; i++) {
        if (monthLevels[Object.keys(monthLevels)[i]] === 0) {
            monthLevels[Object.keys(monthLevels)[i]] = monthLevels[Object.keys(monthLevels)[i - 1]];
        }
    }
    const monthLevelsArray = Object.entries(monthLevels);
    return monthLevelsArray;
}

// Function to create SVG for Circle Chart (Project Attempts)
function circleSVG(modelData) {
    const totalAttempts = modelData.length;
    const failedAttempts = modelData.filter((item) => item.grade < 1).length;
    const successAttempts = totalAttempts - failedAttempts;
    const failedPrcnt = (failedAttempts / totalAttempts) * 100;
    const successPrcnt = (successAttempts / totalAttempts) * 100;
    const Data = [
        { type: 'Failed', amount: failedAttempts, prcnt: failedPrcnt },
        { type: 'Success', amount: successAttempts, prcnt: successPrcnt },
    ];
    const barWidth = 40;
    const barPadding = 20;
    let w = document.getElementById('container').clientWidth - 40;
    if (w > 300) {
        w = 300;
    }

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "bar-chart");
    svg.setAttribute("width", w);
    svg.setAttribute("height", 400);

    // Create chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", (w - 100) / 2);
    titleText.setAttribute("y", 30);
    titleText.textContent = "Project Attempts";
    svg.appendChild(titleText);

    Data.forEach((data, index) => {
        const x = (w - 100) / 2 + index * (barWidth + barPadding);
        const y = 400 - data.prcnt * ((300 - 20) / 100) - 50;

        // Create rectangle for bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", barWidth);
        rect.setAttribute("height", data.prcnt * ((300 - 20) / 100));
        rect.setAttribute("fill", data.type === 'Failed' ? 'red' : 'green');
        svg.appendChild(rect);

        // Create text for amount
        const amountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        amountText.setAttribute("x", x + barWidth / 2 - 5);
        amountText.setAttribute("y", y - 10);
        amountText.textContent = data.amount;
        svg.appendChild(amountText);

        // Create text for type
        const typeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        typeText.setAttribute("x", x);
        typeText.setAttribute("y", 380);
        typeText.textContent = data.type;
        svg.appendChild(typeText);
    });

    return svg;
}

// Function to filter maximum skill levels
function filterMax(data) {
    const max = data.reduce((acc, curr) => {
        if (!acc[curr.type] || acc[curr.type].amount < curr.amount) {
            acc[curr.type] = curr;
        }
        return acc;
    }, {});
    const maxValues = Object.values(max);
    // Sort by alphabetical order type
    maxValues.sort((a, b) => a.type.localeCompare(b.type));
    return maxValues;
}

// Function to create SVG for Skills Bar Chart
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

    // Create chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 30);
    titleText.textContent = "Skills Levels";
    svg.appendChild(titleText);

    skills.forEach((skill, index) => {
        const x = 100;
        const y = index * (barWidth + barPadding) + 50;

        // Create rectangle for bar
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", x);
        rect.setAttribute("y", y);
        rect.setAttribute("width", skill.amount * ((w - 110) / 100));
        rect.setAttribute("height", barWidth);
        rect.setAttribute("fill", "blue");
        svg.appendChild(rect);

        // Create text for amount
        const amountText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        amountText.setAttribute("x", x + skill.amount * ((w - 110) / 100) + 10);
        amountText.setAttribute("y", y + barWidth - 5);
        amountText.textContent = skill.amount;
        svg.appendChild(amountText);

        // Create text for skill type
        const typeText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        typeText.setAttribute("x", x - 80);
        typeText.setAttribute("y", y + barWidth / 2 + 5);
        typeText.textContent = skill.type.split('_').pop();
        svg.appendChild(typeText);
    });

    return svg;
}

// Function to create SVG for XP by Month
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

    // Create background rectangle
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", 20);
    rect.setAttribute("y", 30);
    rect.setAttribute("width", w - 40);
    rect.setAttribute("height", 250);
    rect.setAttribute("fill", "white");
    svg.appendChild(rect);

    // Create chart title
    const titleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    titleText.setAttribute("x", 20);
    titleText.setAttribute("y", 20);
    titleText.setAttribute("fill", "black");
    titleText.textContent = "User XP by Month";
    svg.appendChild(titleText);

    // Create y-axis label
    const yAxisLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
    yAxisLabel.setAttribute("x", 15);
    yAxisLabel.setAttribute("y", 180);
    yAxisLabel.setAttribute("fill", "black");
    yAxisLabel.setAttribute("transform", `rotate(-90 15 180)`);
    yAxisLabel.textContent = "XP";
    svg.appendChild(yAxisLabel);

    monthXp.forEach((element, index) => {
        const x = (index / (monthXp.length - 1)) * (w - 50) + 20; // Adjust x position
        const y = 280 - ((element[1] === undefined ? 0 : element[1]) / maxXP) * 200; // Adjust y position based on maxXP

        // Create circle for data point
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", 3);
        circle.setAttribute("fill", "green");
        svg.appendChild(circle);

        // Create line between points
        if (index > 0) {
            const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
            line.setAttribute("x1", (index - 1) / (monthXp.length - 1) * (w - 50) + 20);
            line.setAttribute("y1", 280 - ((monthXp[index - 1][1] === undefined ? 0 : monthXp[index - 1][1]) / maxXP) * 200);
            line.setAttribute("x2", x);
            line.setAttribute("y2", y);
            line.setAttribute("stroke", "black");
            svg.appendChild(line);
        }

        // Create text for data value
        const valueText = document.createElementNS("http://www.w3.org/2000/svg", "text");
        valueText.setAttribute("x", x - 40);
        valueText.setAttribute("y", y - 10);
        valueText.setAttribute("fill", "black");
        valueText.setAttribute("font-size", 10);
        valueText.textContent = element[1];
        svg.appendChild(valueText);

        // Create label for month (odd indices)
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

// Function to process data into month-based XP
function xpByMonth(data) {
    const monthLevels = {};
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
    let lastMonth = new Date(data[data.length - 1].createdAt).getMonth();
    let lastYear = new Date(data[data.length - 1].createdAt).getYear() + 1900;
    let firstMonth = new Date(data[0].createdAt).getMonth() - 1;
    let firstYear = new Date(data[0].createdAt).getYear() + 1900;
    for (let i = firstYear; i <= lastYear; i++) {
        for (let j = 0; j < 12; j++) {
            if (i === firstYear && j < firstMonth) {
                continue;
            }
            if (i === lastYear && j > lastMonth) {
                break;
            }
            monthLevels[`${allMonths[j]} ${i}`] = 0;
        }
    }
    while (data.length > 0 && new Date(data[0].createdAt).getMonth() !== new Date(data[data.length - 1].createdAt).getMonth()) {
        const date = new Date(data[0].createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        monthLevels[monthYear] = data[0].amount;
        data.shift();
    }
    let xp = 0;
    data.forEach((d, i) => {
        const date = new Date(d.createdAt);
        const monthYear = date.toLocaleString('en-GB', { month: 'short', year: 'numeric' });
        const level = d.amount;
        xp += level;
        monthLevels[monthYear] = xp;
    });
    for (let i = 0; i < Object.keys(monthLevels).length; i++) {
        if (monthLevels[Object.keys(monthLevels)[i]] === 0) {
            monthLevels[Object.keys(monthLevels)[i]] = monthLevels[Object.keys(monthLevels)[i - 1]];
        }
    }
    const monthLevelsArray = Object.entries(monthLevels);
    return monthLevelsArray;
}
