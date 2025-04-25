// AWS Configuration - Replace with your actual values after deployment
const awsConfig = {
    region: 'us-east-1', // Replace with your region
    userPoolId: 'YOUR_USER_POOL_ID', // Replace after deployment
    userPoolWebClientId: 'YOUR_USER_POOL_CLIENT_ID', // Replace after deployment
    apiEndpoint: 'YOUR_API_GATEWAY_URL' // Replace after deployment
};

// Global variables
let currentUser = null;
let idToken = null;

// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Show auth section by default
    document.getElementById('auth-section').style.display = 'block';
    
    // Event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('signup-form').addEventListener('submit', handleSignup);
    document.getElementById('data-form').addEventListener('submit', handleDataSubmit);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
    document.getElementById('reminder-check').addEventListener('change', function() {
        document.getElementById('reminder-date-container').style.display = 
            this.checked ? 'block' : 'none';
    });
    
    // Check if user is already logged in
    checkAuthState();
});

// Authentication Functions
function checkAuthState() {
    const poolData = {
        UserPoolId: awsConfig.userPoolId,
        ClientId: awsConfig.userPoolWebClientId
    };
    
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    currentUser = userPool.getCurrentUser();
    
    if (currentUser !== null) {
        currentUser.getSession(function(err, session) {
            if (err) {
                showMessage('Error getting session: ' + err.message, 'danger');
                return;
            }
            
            if (session.isValid()) {
                idToken = session.getIdToken().getJwtToken();
                showUserInterface();
                fetchUserData();
            }
        });
    }
}

function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    
    const poolData = {
        UserPoolId: awsConfig.userPoolId,
        ClientId: awsConfig.userPoolWebClientId
    };
    
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    const attributeList = [
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'name',
            Value: name
        }),
        new AmazonCognitoIdentity.CognitoUserAttribute({
            Name: 'email',
            Value: email
        })
    ];
    
    userPool.signUp(email, password, attributeList, null, function(err, result) {
        if (err) {
            showMessage('Error signing up: ' + err.message, 'danger');
            return;
        }
        
        showMessage('Registration successful! Please check your email for verification code.', 'success');
        // Switch to login tab
        document.getElementById('login-tab').click();
    });
}

function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const poolData = {
        UserPoolId: awsConfig.userPoolId,
        ClientId: awsConfig.userPoolWebClientId
    };
    
    const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    
    const authenticationData = {
        Username: email,
        Password: password
    };
    
    const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    
    const userData = {
        Username: email,
        Pool: userPool
    };
    
    currentUser = new AmazonCognitoIdentity.CognitoUser(userData);
    
    currentUser.authenticateUser(authenticationDetails, {
        onSuccess: function(session) {
            idToken = session.getIdToken().getJwtToken();
            showMessage('Login successful!', 'success');
            showUserInterface();
            fetchUserData();
        },
        onFailure: function(err) {
            showMessage('Error logging in: ' + err.message, 'danger');
        }
    });
}

function handleLogout() {
    if (currentUser) {
        currentUser.signOut();
        currentUser = null;
        idToken = null;
        showMessage('Logged out successfully', 'info');
        document.getElementById('auth-section').style.display = 'block';
        document.getElementById('data-section').style.display = 'none';
    }
}

// Data Functions
function handleDataSubmit(event) {
    event.preventDefault();
    
    const title = document.getElementById('data-title').value;
    const content = document.getElementById('data-content').value;
    const setReminder = document.getElementById('reminder-check').checked;
    const reminderDate = setReminder ? document.getElementById('reminder-date').value : null;
    
    const userData = {
        title,
        content,
        requiresNotification: setReminder,
        reminderDate: reminderDate
    };
    
    submitData(userData);
}

async function submitData(userData) {
    try {
        if (!idToken) {
            showMessage('You must be logged in to submit data', 'warning');
            return;
        }
        
        const response = await fetch(`${awsConfig.apiEndpoint}/data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': idToken
            },
            body: JSON.stringify({
                userId: currentUser.username,
                userData: userData
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Data submitted successfully!', 'success');
            document.getElementById('data-form').reset();
            fetchUserData(); // Refresh the data list
        } else {
            showMessage(`Error: ${data.message}`, 'danger');
        }
    } catch (error) {
        showMessage(`Error submitting data: ${error.message}`, 'danger');
    }
}

async function fetchUserData() {
    try {
        if (!idToken || !currentUser) {
            return;
        }
        
        const response = await fetch(`${awsConfig.apiEndpoint}/data?userId=${currentUser.username}`, {
            method: 'GET',
            headers: {
                'Authorization': idToken
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            displayUserData(data.items || []);
        } else {
            const errorData = await response.json();
            console.error('Error fetching data:', errorData);
        }
    } catch (error) {
        console.error('Error fetching user data:', error);
    }
}

function displayUserData(items) {
    const dataList = document.getElementById('data-list');
    dataList.innerHTML = '';
    
    if (items.length === 0) {
        dataList.innerHTML = '<div class="list-group-item">No data found</div>';
        return;
    }
    
    items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item';
        
        const title = document.createElement('h5');
        title.textContent = item.title;
        
        const content = document.createElement('p');
        content.textContent = item.content;
        
        const timestamp = document.createElement('small');
        timestamp.className = 'text-muted';
        timestamp.textContent = new Date(item.createdAt).toLocaleString();
        
        itemElement.appendChild(title);
        itemElement.appendChild(content);
        itemElement.appendChild(timestamp);
        
        if (item.reminderDate) {
            const reminder = document.createElement('div');
            reminder.className = 'mt-2 badge bg-info';
            reminder.textContent = `Reminder: ${item.reminderDate}`;
            itemElement.appendChild(reminder);
        }
        
        dataList.appendChild(itemElement);
    });
}

// UI Helper Functions
function showUserInterface() {
    document.getElementById('auth-section').style.display = 'none';
    document.getElementById('data-section').style.display = 'block';
}

function showMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    statusMessage.textContent = message;
    statusMessage.className = `alert alert-${type}`;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}