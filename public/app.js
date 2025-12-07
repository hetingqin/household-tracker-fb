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
    await updateDoc(doc(db, 'items', id), { quantity: newQty });
};

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
