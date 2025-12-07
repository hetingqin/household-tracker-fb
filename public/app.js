import { auth, db } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// State
let currentUser = null;
let items = [];
let unsubscribe = null;

// DOM Elements
const views = {
    auth: document.getElementById('auth-view'),
    dashboard: document.getElementById('dashboard-view')
};
const panels = {
    inventory: document.getElementById('inventory-panel'),
    shopping: document.getElementById('shopping-panel')
};
const tabBtns = document.querySelectorAll('.tab-btn');
const itemList = document.getElementById('item-list');
const shoppingList = document.getElementById('shopping-list');
const stats = {
    total: document.getElementById('stat-total-items'),
    low: document.getElementById('stat-low-stock'),
    expired: document.getElementById('stat-expired')
};

// Auth Logic
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        showView('dashboard');
        initData();
    } else {
        showView('auth');
        if (unsubscribe) unsubscribe();
        items = [];
        renderItems();
    }
});

document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError) {
                alert('注册失败: ' + createError.message);
            }
        } else {
            alert('登录失败: ' + error.message);
        }
    }
});

document.getElementById('logout-btn').addEventListener('click', () => signOut(auth));

// Navigation
function showView(viewName) {
    Object.values(views).forEach(el => el.classList.add('hidden'));
    views[viewName].classList.remove('hidden');
}

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        Object.values(panels).forEach(p => p.classList.add('hidden'));
        panels[btn.dataset.tab].classList.remove('hidden');
        if (btn.dataset.tab === 'shopping') renderShoppingList();
    });
});

// Data Logic
function initData() {
    const q = query(collection(db, 'items'), where('uid', '==', currentUser.uid));
    unsubscribe = onSnapshot(q, (snapshot) => {
        items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderItems();
        updateStats();
    });
}

// Render
function renderItems() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const filtered = items.filter(item => item.name.toLowerCase().includes(searchTerm));

    itemList.innerHTML = filtered.map(item => {
        const isLow = item.quantity <= item.threshold;
        const isExpired = item.expiry && new Date(item.expiry) < new Date();
        const statusClass = isExpired ? 'expired' : (isLow ? 'low-stock' : '');

        return `
            <li class="item-card ${statusClass}">
                <div class="item-info" onclick="editItem('${item.id}')">
                    <h4>${item.name}</h4>
                    <div class="item-meta">
                        ${item.category} | ${item.quantity} ${item.unit}
                        ${item.expiry ? `| 📅 ${item.expiry}` : ''}
                    </div>
                </div>
                <div class="item-controls">
                    <button class="icon-btn" onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span class="quantity-display">${item.quantity}</span>
                    <button class="icon-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                </div>
            </li>
        `;
    }).join('');
}

function renderShoppingList() {
    const toBuy = items.filter(item => item.quantity <= item.threshold);
    shoppingList.innerHTML = toBuy.length ? toBuy.map(item => `
        <li class="item-card">
            <div class="item-info">
                <h4>${item.name}</h4>
                <div class="item-meta">需补货: ${item.threshold * 2 - item.quantity} ${item.unit}</div>
            </div>
        </li>
    `).join('') : '<p style="text-align:center;color:#999;padding:2rem">暂无需要补货的物品</p>';
}

function updateStats() {
    stats.total.textContent = items.length;
    stats.low.textContent = items.filter(i => i.quantity <= i.threshold).length;
    stats.expired.textContent = items.filter(i => i.expiry && new Date(i.expiry) < new Date()).length;
}

// Item Actions
window.updateQuantity = async (id, change) => {
    const item = items.find(i => i.id === id);
    const newQty = Math.max(0, item.quantity + change);

    // Optimistic update
    // (Optional: could update local state immediately for better UX, but Firestore listener handles it fast enough)

    const batch = db.batch(); // Use batch if we were doing multiple writes, but here we do separate asyncs or just one.
    // Actually, let's just do them.

    await updateDoc(doc(db, 'items', id), { quantity: newQty });

    // Log the change
    if (change !== 0) {
        await addDoc(collection(db, 'logs'), {
            uid: currentUser.uid,
            itemId: id,
            itemName: item.name,
            change: change,
            timestamp: serverTimestamp()
        });
    }
};

// Stats Logic
function updateStats() {
    // Basic counters
    stats.total.textContent = items.length;
    stats.low.textContent = items.filter(i => i.quantity <= i.threshold).length;
    stats.expired.textContent = items.filter(i => i.expiry && new Date(i.expiry) < new Date()).length;

    // Fetch logs for advanced stats (simple implementation: just listen to recent logs or fetch once)
    // For MVP, let's just show a simple "Top Consumed" based on local calculation if we had history.
    // Since we just started logging, we might not have much data. 
    // Let's add a real-time listener for logs to show "Recent Activity" or similar.

    // For now, let's keep it simple as requested: "Simple chart display"
    // We can add a "Monthly Consumption" section to the dashboard if we fetch logs.
    // Let's add a function to fetch stats when Dashboard loads.
    fetchMonthlyStats();
}

async function fetchMonthlyStats() {
    // Fetch recent logs (client-side sort to avoid index creation)
    const q = query(
        collection(db, 'logs'),
        where('uid', '==', currentUser.uid)
    );

    const unsubscribeLogs = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => doc.data())
            .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
            .slice(0, 10); // Show last 10 activities

        const activityList = document.getElementById('activity-list');
        if (activityList) {
            activityList.innerHTML = logs.map(log => {
                const date = log.timestamp ? new Date(log.timestamp.seconds * 1000) : new Date();
                const timeStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
                const isConsumption = log.change < 0;
                const changeClass = isConsumption ? 'negative' : 'positive';
                const changeText = isConsumption ? `消耗 ${Math.abs(log.change)}` : `补充 ${log.change}`;

                return `
                    <li>
                        <span>${log.itemName}</span>
                        <span class="change ${changeClass}">${changeText}</span>
                        <span class="time">${timeStr}</span>
                    </li>
                `;
            }).join('');

            if (logs.length === 0) {
                activityList.innerHTML = '<li style="color:#999; justify-content:center;">暂无动态</li>';
            }
        }
    });
}


// Modal & Form
const modal = document.getElementById('item-modal');
const form = document.getElementById('item-form');

document.getElementById('add-item-btn').addEventListener('click', () => {
    form.reset();
    document.getElementById('item-id').value = '';
    modal.classList.remove('hidden');
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    modal.classList.add('hidden');
});

window.editItem = (id) => {
    const item = items.find(i => i.id === id);
    document.getElementById('item-id').value = item.id;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category;
    document.getElementById('item-quantity').value = item.quantity;
    document.getElementById('item-unit').value = item.unit;
    document.getElementById('item-threshold').value = item.threshold;
    document.getElementById('item-expiry').value = item.expiry || '';
    modal.classList.remove('hidden');
};

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('item-id').value;
    const data = {
        uid: currentUser.uid,
        name: document.getElementById('item-name').value,
        category: document.getElementById('item-category').value,
        quantity: Number(document.getElementById('item-quantity').value),
        unit: document.getElementById('item-unit').value,
        threshold: Number(document.getElementById('item-threshold').value),
        expiry: document.getElementById('item-expiry').value || null,
        updatedAt: serverTimestamp()
    };

    if (id) {
        await updateDoc(doc(db, 'items', id), data);
    } else {
        await addDoc(collection(db, 'items'), { ...data, createdAt: serverTimestamp() });
    }
    modal.classList.add('hidden');
});

document.getElementById('search-input').addEventListener('input', renderItems);
