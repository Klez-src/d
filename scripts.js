const DEFAULT_PFP = 'https://i.pinimg.com/736x/83/bc/8b/83bc8b88cf6bc4b4e04d153a418cde62.jpg';
const ADMIN_CODE = 'admin123';
const API_BASE = '/api';

function generateInviteCode() {
    const part1 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    const part2 = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    const part3 = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
    const part4 = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
    return `${part1}-${part2}-${part3}-${part4}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('loader').style.display = 'flex';

    // Dynamically add invitation code input to register form
    const inviteCodeContainer = document.getElementById('invite-code-container');
    const inviteInput = document.createElement('input');
    inviteInput.type = 'text';
    inviteInput.id = 'invite-code';
    inviteInput.placeholder = 'Invitation Code';
    inviteCodeContainer.appendChild(inviteInput);

    // Check if user is logged in
    try {
        const response = await fetch(`${API_BASE}/user`, { credentials: 'include' });
        if (response.ok) {
            const user = await response.json();
            document.getElementById('login-container').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            document.getElementById('dashboard').classList.add('active');
            document.getElementById('subscriptions-section').style.display = 'block';
            document.getElementById('subscriptions-section').classList.add('active');
            document.querySelector(`.sidebar ul li a[onclick="showSection('subscriptions')"]`).classList.add('active');
            updateProfile(user);
            updateAdminUserSelect();
        } else {
            document.getElementById('login-container').style.display = 'flex';
            document.getElementById('login-container').classList.add('active');
        }
    } catch (error) {
        console.error('Error checking login status:', error);
        document.getElementById('login-container').style.display = 'flex';
        document.getElementById('login-container').classList.add('active');
    }
    document.getElementById('loader').classList.add('hidden');
});

function showModal(message) {
    const modal = document.getElementById('modal');
    const modalMessage = document.getElementById('modal-message');
    modalMessage.textContent = message;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

function switchAuth(mode) {
    document.getElementById('loader').style.display = 'flex';
    const loginContainer = document.getElementById('login-container');
    const registerContainer = document.getElementById('register-container');
    if (mode === 'register') {
        loginContainer.style.opacity = '0';
        setTimeout(() => {
            loginContainer.classList.remove('active');
            loginContainer.style.display = 'none';
            registerContainer.style.display = 'flex';
            registerContainer.classList.add('active');
            registerContainer.style.opacity = '1';
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    } else {
        registerContainer.style.opacity = '0';
        setTimeout(() => {
            registerContainer.classList.remove('active');
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'flex';
            loginContainer.classList.add('active');
            loginContainer.style.opacity = '1';
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    }
}

function updateProfile(user) {
    const usernameElement = document.getElementById('user-username');
    const idRegionElement = document.getElementById('user-id-region');
    const avatarElement = document.getElementById('user-avatar');
    const region = getUserRegion();
    usernameElement.textContent = user.username;
    idRegionElement.textContent = `ID: ${user.uid} | ${region}`;
    avatarElement.src = user.pfp || DEFAULT_PFP;
    avatarElement.style.display = 'block';
}

async function updateAdminUserSelect() {
    const select = document.getElementById('admin-user-select');
    select.innerHTML = '<option value="">Select a user</option>';
    try {
        const response = await fetch(`${API_BASE}/users`, { credentials: 'include' });
        const users = await response.json();
        users.filter(user => !user.banned).forEach(user => {
            const option = document.createElement('option');
            option.value = user.uid;
            option.textContent = `${user.username} (ID: ${user.uid})`;
            select.appendChild(option);
        });
        await updateInviteCodesList();
    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

async function updateInviteCodesList() {
    const inviteList = document.getElementById('invite-codes-list');
    inviteList.innerHTML = '';
    try {
        const response = await fetch(`${API_BASE}/invites`, { credentials: 'include' });
        const invites = await response.json();
        invites.filter(invite => !invite.used).forEach(invite => {
            const p = document.createElement('p');
            p.textContent = invite.code;
            inviteList.appendChild(p);
        });
    } catch (error) {
        console.error('Error fetching invites:', error);
    }
}

function getUserRegion() {
    return navigator.language.startsWith('en-GB') ? 'GB' : 'GB'; // Default to GB for UK
}

async function login() {
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value.trim();
    
    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        if (response.ok) {
            document.getElementById('loader').style.display = 'flex';
            document.getElementById('login-container').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('login-container').style.display = 'none';
                document.getElementById('dashboard').style.display = 'flex';
                document.getElementById('dashboard').style.opacity = '1';
                document.getElementById('dashboard').classList.add('active');
                document.getElementById('main-content').style.display = 'block';
                document.getElementById('subscriptions-section').style.display = 'block';
                document.getElementById('subscriptions-section').classList.add('active');
                document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
                document.querySelector(`.sidebar ul li a[onclick="showSection('subscriptions')"]`).classList.add('active');
                updateProfile(data.user);
                updateAdminUserSelect();
                document.getElementById('loader').classList.add('hidden');
            }, 500);
        } else {
            showModal(data.message || 'Wrong credentials. Try again.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE}/logout`, { method: 'POST', credentials: 'include' });
        document.getElementById('loader').style.display = 'flex';
        document.getElementById('dashboard').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('dashboard').classList.remove('active');
            document.getElementById('login-container').style.display = 'flex';
            document.getElementById('login-container').classList.add('active');
            document.getElementById('login-container').style.opacity = '1';
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    } catch (error) {
        console.error('Error logging out:', error);
    }
}

async function register() {
    const username = document.getElementById('register-username').value.trim();
    const password = document.getElementById('register-password').value.trim();
    const inviteCode = document.getElementById('invite-code').value.trim();

    if (!username || !password || !inviteCode) {
        showModal('Fill all fields.');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password, inviteCode })
        });
        const data = await response.json();
        if (response.ok) {
            showModal('Registration successful! Logging in...');
            document.getElementById('loader').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('register-container').style.opacity = '0';
                document.getElementById('register-container').style.display = 'none';
                document.getElementById('dashboard').style.display = 'flex';
                document.getElementById('dashboard').style.opacity = '1';
                document.getElementById('dashboard').classList.add('active');
                document.getElementById('main-content').style.display = 'block';
                document.getElementById('subscriptions-section').style.display = 'block';
                document.getElementById('subscriptions-section').classList.add('active');
                document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
                document.querySelector(`.sidebar ul li a[onclick="showSection('subscriptions')"]`).classList.add('active');
                updateProfile(data.user);
                updateAdminUserSelect();
                document.getElementById('loader').classList.add('hidden');
            }, 1500);
        } else {
            showModal(data.message || 'Registration failed.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function changeUsername() {
    const newUsername = document.getElementById('new-username').value.trim();
    if (!newUsername) {
        showModal('Please enter a username.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/user/username`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newUsername })
        });
        const data = await response.json();
        if (response.ok) {
            updateProfile(data.user);
            updateAdminUserSelect();
            showModal('Username updated successfully.');
        } else {
            showModal(data.message || 'Failed to update username.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function changePassword() {
    const currentPassword = document.getElementById('current-password').value.trim();
    const newPassword = document.getElementById('new-password').value.trim();
    const confirmNewPassword = document.getElementById('confirm-new-password').value.trim();
    
    if (newPassword !== confirmNewPassword) {
        showModal('New passwords don’t match.');
        return;
    }
    if (!newPassword) {
        showModal('Please enter a new password.');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/user/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });
        const data = await response.json();
        if (response.ok) {
            updateAdminUserSelect();
            showModal('Password updated successfully.');
        } else {
            showModal(data.message || 'Current password is incorrect or update failed.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function changePfp() {
    const pfpFile = document.getElementById('pfp-file').files[0];
    if (!pfpFile) {
        showModal('Please select an image.');
        return;
    }
    try {
        const reader = new FileReader();
        reader.onload = async function(e) {
            const response = await fetch(`${API_BASE}/user/pfp`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ pfp: e.target.result })
            });
            const data = await response.json();
            if (response.ok) {
                updateProfile(data.user);
                updateAdminUserSelect();
                showModal('Profile picture updated successfully.');
            } else {
                showModal(data.message || 'Failed to update profile picture.');
            }
        };
        reader.readAsDataURL(pfpFile);
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

function showSection(sectionId) {
    document.getElementById('loader').style.display = 'flex';
    setTimeout(() => {
        const sections = ['subscriptions', 'settings', 'workshop', 'security', 'admin'];
        sections.forEach(id => {
            const section = document.getElementById(`${id}-section`);
            const link = document.querySelector(`.sidebar ul li a[onclick="showSection('${id}')"]`);
            if (id === sectionId) {
                section.style.display = 'block';
                section.classList.add('active');
                if (link) link.classList.add('active');
            } else {
                section.style.display = 'none';
                section.classList.remove('active');
                if (link) link.classList.remove('active');
            }
        });
        document.getElementById('loader').classList.add('hidden');
    }, 500);
}

async function activatePromo() {
    const code = document.getElementById('promo-code').value.trim();
    if (code === ADMIN_CODE) {
        document.getElementById('loader').style.display = 'flex';
        setTimeout(async () => {
            document.getElementById('subscriptions-section').style.display = 'none';
            document.getElementById('subscriptions-section').classList.remove('active');
            document.getElementById('admin-section').style.display = 'block';
            document.getElementById('admin-section').classList.add('active');
            document.querySelectorAll('.sidebar ul li a').forEach(link => link.classList.remove('active'));
            await updateAdminUserSelect();
            document.getElementById('loader').classList.add('hidden');
        }, 500);
    } else if (code) {
        showModal(`Promo ${code} activated. Check your discount.`);
    } else {
        showModal('Enter a promo code.');
    }
}

async function banUser() {
    const uid = document.getElementById('admin-user-select').value;
    if (!uid) {
        showModal('Please select a user.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/user/${uid}/ban`, {
            method: 'PUT',
            credentials: 'include'
        });
        const data = await response.json();
        if (response.ok) {
            updateAdminUserSelect();
            showModal('User has been banned.');
            const currentUserResponse = await fetch(`${API_BASE}/user`, { credentials: 'include' });
            if (currentUserResponse.ok) {
                const currentUser = await currentUserResponse.json();
                if (currentUser.uid === uid) {
                    await logout();
                }
            }
        } else {
            showModal(data.message || 'Failed to ban user.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function changeUserId() {
    const uid = document.getElementById('admin-user-select').value;
    const newUid = document.getElementById('admin-new-uid').value.trim();
    if (!uid || !newUid) {
        showModal('Please select a user and enter a new ID.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/user/${uid}/uid`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newUid })
        });
        const data = await response.json();
        if (response.ok) {
            const currentUserResponse = await fetch(`${API_BASE}/user`, { credentials: 'include' });
            if (currentUserResponse.ok) {
                const currentUser = await currentUserResponse.json();
                updateProfile(currentUser);
            }
            updateAdminUserSelect();
            showModal(`User ID updated to ${newUid}.`);
        } else {
            showModal(data.message || 'Failed to update user ID.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

async function changeUserPassword() {
    const uid = document.getElementById('admin-user-select').value;
    const newPassword = document.getElementById('admin-new-password').value.trim();
    if (!uid || !newPassword) {
        showModal('Please select a user and enter a new password.');
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/user/${uid}/password`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ newPassword })
        });
        const data = await response.json();
        if (response.ok) {
            updateAdminUserSelect();
            showModal(`Password updated for user.`);
        } else {
            showModal(data.message || 'Failed to update password.');
        }
    } catch (error) {
        showModal('Error connecting to server.');
    }
}

function buyExtend(cheat, price) {
    showModal(`Extending ${cheat} for $${price}. Redirecting to payment...`);
    setTimeout(() => {
        window.location.href = 'https://your-payment-gateway.com';
    }, 1500);
}

function gift(cheat) {
    showModal(`Gifting ${cheat}. Enter recipient details in the next step.`);
}

function downloadClient() {
    showModal('Downloading client... Check your downloads folder.');
}