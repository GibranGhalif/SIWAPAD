// Data Inisialisasi Aplikasi

// Default Users
const defaultUsers = [
    { 
        id: 1, 
        username: 'admin', 
        fullName: 'Administrator', 
        email: 'admin@sidrap.go.id', 
        password: 'admin123', 
        role: 'admin', 
        status: 'aktif' 
    },
    { 
        id: 2, 
        username: 'operator', 
        fullName: 'Operator Pajak', 
        email: 'operator@sidrap.go.id', 
        password: 'operator123', 
        role: 'operator', 
        status: 'aktif' 
    },
    { 
        id: 3, 
        username: 'verifikator', 
        fullName: 'Verifikator Pajak', 
        email: 'verifikator@sidrap.go.id', 
        password: 'verifikator123', 
        role: 'verifikator', 
        status: 'aktif' 
    }
];

// Tax Types Mapping
const taxTypes = {
    reklame: 'Pajak Reklame',
    air_tanah: 'Pajak Air Tanah',
    sarang_burung: 'Pajak Sarang Burung Walet',
    mineral: 'Pajak Mineral Bukan Logam & Batuan',
    pbb: 'PBB-P2',
    bphtb: 'BPHTB',
    pbjt_mamin: 'PBJT - Makanan & Minuman',
    pbjt_listrik: 'PBJT - Tenaga Listrik',
    pbjt_hotel: 'PBJT - Perhotelan',
    pbjt_parkir: 'PBJT - Parkir',
    pbjt_hiburan: 'PBJT - Kesenian & Hiburan',
    opsen_pkb: 'Opsen PKB',
    opsen_bbnkb: 'Opsen BBNKB'
};

// Role Badges
const roleBadges = {
    admin: { class: 'bg-purple-100 text-purple-700', label: 'Administrator' },
    operator: { class: 'bg-blue-100 text-blue-700', label: 'Operator' },
    verifikator: { class: 'bg-green-100 text-green-700', label: 'Verifikator' },
    viewer: { class: 'bg-gray-100 text-gray-700', label: 'Viewer' }
};

// Page Titles
const pageTitles = {
    dashboard: 'Dashboard',
    inputWP: 'Input Wajib Pajak',
    dataWP: 'Data Wajib Pajak',
    petaBlok: 'Peta Blok',
    realisasi: 'Realisasi Pajak',
    users: 'Manajemen User'
};

// Sidrap Coordinates
const SIDRAP_COORDS = {
    lat: -3.7333,
    lng: 119.8833,
    zoom: 10
};

// Load data from localStorage
function loadFromLocalStorage(key, defaultValue = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error(`Error loading ${key}:`, error);
        return defaultValue;
    }
}

// Save data to localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Error saving ${key}:`, error);
        return false;
    }
}

// Initialize application data
function initializeData() {
    // Initialize users if not exists
    if (!localStorage.getItem('users')) {
        saveToLocalStorage('users', defaultUsers);
    }
    
    // Initialize empty arrays
    if (!localStorage.getItem('wajibPajak')) {
        saveToLocalStorage('wajibPajak', []);
    }
    
    if (!localStorage.getItem('realisasiPajak')) {
        saveToLocalStorage('realisasiPajak', []);
    }
    
    if (!localStorage.getItem('targetPajak')) {
        saveToLocalStorage('targetPajak', []);
    }
}
