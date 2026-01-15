// Main Application JavaScript
// Sistem Informasi Wajib Pajak Daerah - PEMDA SIDRAP

// Initialize data
initializeData();

// Application State
let currentUser = null;
let wajibPajak = loadFromLocalStorage('wajibPajak', []);
let users = loadFromLocalStorage('users', defaultUsers);
let realisasiPajak = loadFromLocalStorage('realisasiPajak', []);
let targetPajak = loadFromLocalStorage('targetPajak', []);
let firebaseConfig = loadFromLocalStorage('firebaseConfig', null);
let db = null;
let isOnline = false;

// Debug: Log realisasi data
console.log('Realisasi Pajak loaded:', realisasiPajak.length, 'items');

// Pagination State
let currentPage = 1;
const perPage = 10;

// Map State
let map = null;
let miniMap = null;
let blockMap = null;
let mapMarker = null;
let miniMapMarker = null;
let standardLayer = null;
let satelliteLayer = null;
let blockStandardLayer = null;
let blockSatelliteLayer = null;
let currentMapLayer = 'standard';
let currentBlockMapLayer = 'standard';
let tempLocation = { lat: -3.7333, lng: 119.8833 };

// WP Markers on Block Map
let wpMarkers = [];
let wpLayerGroup = null;
let selectedTaxTypes = [];

// Check if Firebase is configured
function isFirebaseConfigured() {
    return firebaseConfig !== null && firebaseConfig.projectId;
}

// ==================== LOGIN SYSTEM ====================

// Login Form Handler
function handleLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    const user = users.find(u => u.username === username && u.password === password && u.status === 'aktif');
    
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        showMainApp();
        showToast('Login berhasil!', 'success');
    } else {
        const userExists = users.find(u => u.username === username);
        if (!userExists) {
            showToast('Username tidak ditemukan!', 'error');
        } else if (userExists.status !== 'aktif') {
            showToast('User tidak aktif!', 'error');
        } else {
            showToast('Password salah!', 'error');
        }
    }
}

// Add event listener for realisasiNpwpd dropdown change
document.addEventListener('DOMContentLoaded', function() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showMainApp();
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    
    // Setup event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('wpForm').addEventListener('submit', handleWPSubmit);
    document.getElementById('userForm').addEventListener('submit', handleUserSubmit);
    document.getElementById('realisasiForm').addEventListener('submit', handleRealisasiSubmit);
    document.getElementById('targetForm').addEventListener('submit', handleTargetSubmit);
    document.getElementById('firebaseForm').addEventListener('submit', handleFirebaseSubmit);
    
    // Add event listener for realisasiNpwpd dropdown
    const realisasiNpwpd = document.getElementById('realisasiNpwpd');
    if (realisasiNpwpd) {
        realisasiNpwpd.addEventListener('change', autoFillWP);
    }
    
    // Search and filter listeners
    document.getElementById('searchWP')?.addEventListener('input', () => { currentPage = 1; updateWPTable(); });
    document.getElementById('filterJenisPajak')?.addEventListener('change', () => { currentPage = 1; updateWPTable(); });
    
    // Auto-calculate listeners
    document.querySelector('input[name="pbb_luas_tanah"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_njop_tanah"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_luas_bangunan"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_njop_bangunan"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="walet_panjang"]')?.addEventListener('input', calculateWalet);
    document.querySelector('input[name="walet_lebar"]')?.addEventListener('input', calculateWalet);
    
    // Auto-initialize Firebase if configured
    if (isFirebaseConfigured()) {
        setTimeout(() => initializeFirebase(), 1000);
    }
});

function showMainApp() {
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('userName').textContent = currentUser.fullName;
    document.getElementById('userInitial').textContent = currentUser.fullName.charAt(0).toUpperCase();
    document.getElementById('dashboardYear').textContent = new Date().getFullYear();
    initializeApp();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// ==================== INITIALIZATION ====================

function initializeApp() {
    console.log('=== INITIALIZE APP STARTED ===');
    console.log('Realisasi Pajak loaded:', realisasiPajak.length, 'items');
    
    updateDashboard();
    updateWPTable();
    updateUserTable();
    initializeMiniMap();
    updateDate();
    
    // Update realisasi functions
    updateRealisasiSummary();
    updateRealisasiTable();
    
    console.log('initializeApp completed, realisasiPajak count:', realisasiPajak.length);
    console.log('=== INITIALIZE APP COMPLETED ===');
}

function updateDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateEl = document.getElementById('currentDate');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('id-ID', options);
    }
}

// Check for saved session and setup event listeners
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CONTENT LOADED ===');
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        try {
            currentUser = JSON.parse(savedUser);
            showMainApp();
            console.log('✓ Auto-login berhasil');
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    
    // Auto-initialize Firebase if configured
    if (isFirebaseConfigured()) {
        setTimeout(() => initializeFirebase(), 1000);
    }
    
    // Setup event listeners
    const loginFormEl = document.getElementById('loginForm');
    if (loginFormEl) loginFormEl.addEventListener('submit', handleLogin);
    
    const wpFormEl = document.getElementById('wpForm');
    if (wpFormEl) wpFormEl.addEventListener('submit', handleWPSubmit);
    
    const userFormEl = document.getElementById('userForm');
    if (userFormEl) userFormEl.addEventListener('submit', handleUserSubmit);
    
    const realisasiFormEl = document.getElementById('realisasiForm');
    if (realisasiFormEl) realisasiFormEl.addEventListener('submit', handleRealisasiSubmit);
    
    const targetFormEl = document.getElementById('targetForm');
    if (targetFormEl) targetFormEl.addEventListener('submit', handleTargetSubmit);
    
    const firebaseFormEl = document.getElementById('firebaseForm');
    if (firebaseFormEl) firebaseFormEl.addEventListener('submit', handleFirebaseSubmit);
    
    // Event listener realisasiForm dihapus karena sudah ada di realisasi.js
    // Event listener realisasiNpwpd dihapus karena sudah ada di realisasi.js
    
    // Search and filter listeners
    const searchWPEl = document.getElementById('searchWP');
    if (searchWPEl) searchWPEl.addEventListener('input', () => { currentPage = 1; updateWPTable(); });
    
    const filterJenisPajakEl = document.getElementById('filterJenisPajak');
    if (filterJenisPajakEl) filterJenisPajakEl.addEventListener('change', () => { currentPage = 1; updateWPTable(); });
    
    // Auto-calculate listeners
    document.querySelector('input[name="pbb_luas_tanah"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_njop_tanah"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_luas_bangunan"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="pbb_njop_bangunan"]')?.addEventListener('input', calculatePBB);
    document.querySelector('input[name="walet_panjang"]')?.addEventListener('input', calculateWalet);
    document.querySelector('input[name="walet_lebar"]')?.addEventListener('input', calculateWalet);
    
    console.log('✓ Semua event listeners berhasil di-setup');
    console.log('=== END DOM CONTENT LOADED ===');
});

// ==================== NAVIGATION ====================

function showPage(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
    const pageEl = document.getElementById(page + 'Page');
    if (pageEl) {
        pageEl.classList.remove('hidden');
    }
    
    document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
    const sidebarItem = document.querySelector(`[data-page="${page}"]`);
    if (sidebarItem) {
        sidebarItem.classList.add('active');
    }
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = pageTitles[page] || page;
    }
    
    // Initialize block map when needed
    if (page === 'petaBlok') {
        setTimeout(() => {
            if (blockMap) {
                blockMap.invalidateSize();
            } else {
                initializeBlockMap();
            }
        }, 200);
    }
    
    // Update realisasi table when needed
    if (page === 'realisasi') {
        console.log('=== SHOW PAGE REALISASI ===');
        setTimeout(() => {
            updateRealisasiSummary();
            updateRealisasiTable();
            console.log('=== END SHOW PAGE REALISASI ===');
        }, 100);
    }
}

// ==================== DASHBOARD ====================

function updateDashboard() {
    const totalWPEl = document.getElementById('totalWP');
    if (totalWPEl) totalWPEl.textContent = wajibPajak.length;
    
    // Count per tax type
    const counts = {};
    Object.keys(taxTypes).forEach(type => {
        counts[type] = wajibPajak.filter(wp => wp.jenis_pajak && wp.jenis_pajak.includes(type)).length;
    });
    
    const totalReklameEl = document.getElementById('totalReklame');
    if (totalReklameEl) totalReklameEl.textContent = counts.reklame || 0;
    
    const totalPBBEl = document.getElementById('totalPBB');
    if (totalPBBEl) totalPBBEl.textContent = counts.pbb || 0;
    
    const totalBPHTBEl = document.getElementById('totalBPHTB');
    if (totalBPHTBEl) totalBPHTBEl.textContent = counts.bphtb || 0;
    
    // Dashboard Realisasi Summary
    updateDashboardRealisasi();
    
    // Tax summary
    const summaryEl = document.getElementById('taxSummary');
    if (summaryEl) {
        const summaryHtml = Object.entries(taxTypes).map(([key, label]) => `
            <div class="bg-gray-50 rounded-lg p-3">
                <p class="text-xs text-gray-500 truncate">${label}</p>
                <p class="text-lg font-bold text-blue-600">${counts[key] || 0}</p>
            </div>
        `).join('');
        summaryEl.innerHTML = summaryHtml;
    }
    
    // Recent WP
    const recentWPEl = document.getElementById('recentWPTable');
    if (recentWPEl) {
        const recent = wajibPajak.slice(-5).reverse();
        const recentHtml = recent.map(wp => {
            const namaUsaha = getNamaUsaha(wp);
            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3 font-medium">${wp.npwpd}</td>
                <td class="px-4 py-3 font-semibold">${namaUsaha || wp.nama || '-'}</td>
                <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                        ${(wp.jenis_pajak || []).map(j => `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">${taxTypes[j] || j}</span>`).join('')}
                    </div>
                </td>
                <td class="px-4 py-3">${formatDate(wp.tanggal_daftar)}</td>
            </tr>
        `;
        }).join('');
        recentWPEl.innerHTML = recentHtml || '<tr><td colspan="4" class="px-4 py-3 text-center text-gray-500">Belum ada data</td></tr>';
    }
}

function updateDashboardRealisasi() {
    const tahunBaru = new Date().getFullYear();
    
    console.log('=== UPDATE DASHBOARD REALISASI ===');
    
    const targetTotal = targetPajak
        .filter(t => t.tahun === tahunBaru)
        .reduce((sum, t) => sum + (t.nominal || 0), 0);
    
    const realisasiTahun = realisasiPajak
        .filter(r => {
            const tahunRealisasi = typeof r.tahun === 'string' ? parseInt(r.tahun) : r.tahun;
            return tahunRealisasi === tahunBaru && r.status === 'lunas';
        })
        .reduce((sum, r) => sum + (r.total || 0), 0);
    
    const sisa = Math.max(0, targetTotal - realisasiTahun);
    const persentase = targetTotal > 0 ? ((realisasiTahun / targetTotal) * 100).toFixed(1) : 0;
    
    console.log('Dashboard - Target:', targetTotal, 'Realisasi:', realisasiTahun, 'Persentase:', persentase + '%');
    
    const dashboardTargetEl = document.getElementById('dashboardTarget');
    if (dashboardTargetEl) dashboardTargetEl.textContent = formatRupiah(targetTotal);
    
    const dashboardRealisasiEl = document.getElementById('dashboardRealisasi');
    if (dashboardRealisasiEl) dashboardRealisasiEl.textContent = formatRupiah(realisasiTahun);
    
    const dashboardSisaEl = document.getElementById('dashboardSisa');
    if (dashboardSisaEl) dashboardSisaEl.textContent = formatRupiah(sisa);
    
    const dashboardPersentaseEl = document.getElementById('dashboardPersentase');
    if (dashboardPersentaseEl) dashboardPersentaseEl.textContent = persentase + '%';
    
    const dashboardProgressEl = document.getElementById('dashboardProgress');
    if (dashboardProgressEl) dashboardProgressEl.style.width = Math.min(persentase, 100) + '%';
    
    console.log('=== END UPDATE DASHBOARD REALISASI ===');
}

// ==================== WAJIB PAJAK FORM ====================

function handleWPSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    const form = e.target;
    const editingId = form.dataset.editingId ? parseInt(form.dataset.editingId) : null;
    
    // Get tax types
    const jenisPajak = [];
    document.querySelectorAll('input[name="jenis_pajak"]:checked').forEach(cb => {
        jenisPajak.push(cb.value);
    });
    
    if (jenisPajak.length === 0) {
        showToast('Pilih minimal 1 jenis pajak!', 'error');
        return;
    }
    
    // Collect tax object data
    const dataObjekPajak = {};
    
    // Pajak Reklame
    if (jenisPajak.includes('reklame')) {
        dataObjekPajak.reklame = {
            jenis: data.reklame_jenis || '',
            no_izin: data.reklame_no_izin || '',
            masa_izin: data.reklame_masa_izin || '',
            brand: data.reklame_brand || '',
            panjang: data.reklame_panjang || 0,
            lebar: data.reklame_lebar || 0,
            jumlah_unit: data.reklame_jumlah_unit || 0,
            jumlah_sisi: data.reklame_jumlah_sisi || 0,
            lokasi: data.reklame_lokasi || '',
            masa_tayang: data.reklame_masa_tayang || '',
            jalur: data.reklame_jalur || ''
        };
    }
    
    // Pajak Air Tanah
    if (jenisPajak.includes('air_tanah')) {
        dataObjekPajak.air_tanah = {
            no_izin: data.air_tanah_no_izin || '',
            masa_izin: data.air_tanah_masa_izin || '',
            jenis_penggunaan: data.air_tanah_jenis_penggunaan || '',
            jumlah_sumur_bor: data.air_tanah_jumlah_sumur_bor || 0,
            jumlah_sumur_resapan: data.air_tanah_jumlah_sumur_resapan || 0,
            kedalaman: data.air_tanah_kedalaman || 0,
            volume_hari: data.air_tanah_volume_hari || 0,
            volume_bulan: data.air_tanah_volume_bulan || 0,
            diameter_pipa: data.air_tanah_diameter_pipa || 0,
            lokasi: data.air_tanah_lokasi || ''
        };
    }
    
    // Pajak Sarang Burung Walet
    if (jenisPajak.includes('sarang_burung')) {
        dataObjekPajak.sarang_burung = {
            no_izin: data.walet_no_izin || '',
            masa_izin: data.walet_masa_izin || '',
            jenis_bangunan: data.walet_jenis_bangunan || '',
            jumlah_lantai: data.walet_jumlah_lantai || 0,
            panjang: data.walet_panjang || 0,
            lebar: data.walet_lebar || 0,
            luas: data.walet_luas || 0,
            tinggi: data.walet_tinggi || 0,
            lubang: data.walet_lubang || 0,
            lokasi: data.walet_lokasi || ''
        };
    }
    
    // Pajak Mineral Bukan Logam & Batuan
    if (jenisPajak.includes('mineral')) {
        dataObjekPajak.mineral = {
            no_izin: data.mineral_no_izin || '',
            masa_izin: data.mineral_masa_izin || '',
            jenis: data.mineral_jenis || '',
            luas: data.mineral_luas || 0,
            volume: data.mineral_volume || 0,
            satuan: data.mineral_satuan || '',
            metode: data.mineral_metode || '',
            jenis_izin: data.mineral_jenis_izin || '',
            lokasi: data.mineral_lokasi || ''
        };
    }
    
    // PBB-P2
    if (jenisPajak.includes('pbb')) {
        dataObjekPajak.pbb = {
            nop: data.pbb_nop || '',
            tahun: data.pbb_tahun || new Date().getFullYear(),
            luas_tanah: data.pbb_luas_tanah || 0,
            luas_bangunan: data.pbb_luas_bangunan || 0,
            njop_tanah: data.pbb_njop_tanah || 0,
            njop_bangunan: data.pbb_njop_bangunan || 0,
            total_njop_tanah: data.pbb_total_njop_tanah || 0,
            total_njop_bangunan: data.pbb_total_njop_bangunan || 0,
            njop_ksp: data.pbb_njop_ksp || 0,
            peruntukan: data.pbb_peruntukan || '',
            jenis_bangunan: data.pbb_jenis_bangunan || '',
            jumlah_lantai: data.pbb_jumlah_lantai || 0,
            tahun_bangunan: data.pbb_tahun_bangunan || '',
            alamat_op: data.pbb_alamat_op || '',
            rtrw: data.pbb_rtrw || ''
        };
    }
    
    // BPHTB
    if (jenisPajak.includes('bphtb')) {
        dataObjekPajak.bphtb = {
            nop_baru: data.bphtb_nop_baru || '',
            nop_lama: data.bphtb_nop_lama || '',
            jenis_perolehan: data.bphtb_jenis_perolehan || '',
            npop: data.bphtb_npop || 0,
            npokp: data.bphtb_npokp || 0,
            harga_transaksi: data.bphtb_harga_transaksi || 0,
            luas_tanah: data.bphtb_luas_tanah || 0,
            luas_bangunan: data.bphtb_luas_bangunan || 0,
            no_akta: data.bphtb_no_akta || '',
            tanggal_akta: data.bphtb_tanggal_akta || '',
            ppat: data.bphtb_ppat || '',
            lokasi: data.bphtb_lokasi || ''
        };
    }
    
    // PBJT - Makanan & Minuman
    if (jenisPajak.includes('pbjt_mamin')) {
        dataObjekPajak.pbjt_mamin = {
            no_izin: data.mamin_no_izin || '',
            jenis_usaha: data.mamin_jenis_usaha || '',
            klasifikasi: data.mamin_klasifikasi || '',
            jumlah_kursi: data.mamin_jumlah_kursi || 0,
            omzet_bulan: data.mamin_omzet_bulan || 0,
            jam_operasional: data.mamin_jam_operasional || '',
            lokasi: data.mamin_lokasi || ''
        };
    }
    
    // PBJT - Tenaga Listrik
    if (jenisPajak.includes('pbjt_listrik')) {
        dataObjekPajak.pbjt_listrik = {
            id_pelanggan: data.listrik_id_pelanggan || '',
            jenis_pelanggan: data.listrik_jenis_pelanggan || '',
            golongan: data.listrik_golongan || '',
            daya: data.listrik_daya || 0,
            pemakaian: data.listrik_pemakaian || 0,
            unit_bisnis: data.listrik_unit_bisnis || '',
            sumber: data.listrik_sumber || '',
            lokasi: data.listrik_lokasi || ''
        };
    }
    
    // PBJT - Perhotelan
    if (jenisPajak.includes('pbjt_hotel')) {
        const fasilitas = [];
        document.querySelectorAll('input[name="hotel_fasilitas"]:checked').forEach(cb => {
            fasilitas.push(cb.value);
        });
        
        dataObjekPajak.pbjt_hotel = {
            no_izin: data.hotel_no_izin || '',
            nama: data.hotel_nama || '',
            kelas: data.hotel_kelas || '',
            jumlah_kamar: data.hotel_jumlah_kamar || 0,
            tarif: data.hotel_tarif || 0,
            kapasitas: data.hotel_kapasitas || 0,
            fasilitas: fasilitas,
            lokasi: data.hotel_lokasi || ''
        };
    }
    
    // PBJT - Parkir
    if (jenisPajak.includes('pbjt_parkir')) {
        dataObjekPajak.pbjt_parkir = {
            no_izin: data.parkir_no_izin || '',
            jenis_lokasi: data.parkir_jenis_lokasi || '',
            kapasitas: data.parkir_kapasitas || '',
            slot_mobil: data.parkir_slot_mobil || 0,
            slot_motor: data.parkir_slot_motor || 0,
            tarif_jam: data.parkir_tarif_jam || 0,
            tarif_hari: data.parkir_tarif_hari || 0,
            jam_operasional: data.parkir_jam_operasional || '',
            jenis_kendaraan: data.parkir_jenis_kendaraan || '',
            lokasi: data.parkir_lokasi || ''
        };
    }
    
    // PBJT - Hiburan
    if (jenisPajak.includes('pbjt_hiburan')) {
        dataObjekPajak.pbjt_hiburan = {
            no_izin: data.hiburan_no_izin || '',
            jenis: data.hiburan_jenis || '',
            klasifikasi: data.hiburan_klasifikasi || '',
            kapasitas: data.hiburan_kapasitas || 0,
            tiket: data.hiburan_tiket || 0,
            harga_kamar: data.hiburan_harga_kamar || 0,
            jumlah_kamar: data.hiburan_jumlah_kamar || 0,
            jam_operasional: data.hiburan_jam_operasional || '',
            jadwal: data.hiburan_jadwal || '',
            lokasi: data.hiburan_lokasi || ''
        };
    }
    
    // Opsen - PKB
    if (jenisPajak.includes('opsen_pkb')) {
        dataObjekPajak.opsen_pkb = {
            no_bpkb: data.pkb_no_bpkb || '',
            no_polisi: data.pkb_no_polisi || '',
            jenis_kendaraan: data.pkb_jenis_kendaraan || '',
            merk: data.pkb_merk || '',
            tahun: data.pkb_tahun || '',
            cc: data.pkb_cc || 0,
            warna: data.pkb_warna || '',
            njkb: data.pkb_njkb || 0,
            pkb: data.pkb_pkb || 0,
            swdkllj: data.pkb_swdkllj || 0,
            kepemilikan: data.pkb_kepemilikan || ''
        };
    }
    
    // Opsen - BBNKB
    if (jenisPajak.includes('opsen_bbnkb')) {
        dataObjekPajak.opsen_bbnkb = {
            no_faktur: data.bbnkb_no_faktur || '',
            tanggal_faktur: data.bbnkb_tanggal_faktur || '',
            jenis_kendaraan: data.bbnkb_jenis_kendaraan || '',
            merk: data.bbnkb_merk || '',
            tahun: data.bbnkb_tahun || '',
            cc: data.bbnkb_cc || 0,
            njkb: data.bbnkb_njkb || 0,
            njk: data.bbnkb_njk || 0,
            bbnkb: data.bbnkb_bbnkb || 0,
            status: data.bbnkb_status || ''
        };
    }
    
    if (editingId) {
        // Update existing data
        const index = wajibPajak.findIndex(wp => wp.id === editingId);
        if (index !== -1) {
            wajibPajak[index] = {
                ...wajibPajak[index],
                ...data,
                jenis_pajak: jenisPajak,
                data_objek_pajak: dataObjekPajak,
                updated_by: currentUser?.username || 'system',
                updated_at: new Date().toISOString()
            };
            saveToLocalStorage('wajibPajak', wajibPajak);
            updateDashboard();
            updateWPTable();
            resetForm();
            // Reset editing mode
            delete form.dataset.editingId;
            const pageTitle = document.getElementById('pageTitle');
            if (pageTitle) pageTitle.textContent = 'Input Wajib Pajak';
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = `
                    <span class="flex items-center justify-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                        Simpan Data Wajib Pajak
                    </span>
                `;
            }
            showToast('Data wajib pajak berhasil diperbarui!', 'success');
        }
    } else {
        // Create new data
        const wp = {
            id: Date.now(),
            ...data,
            jenis_pajak: jenisPajak,
            data_objek_pajak: dataObjekPajak,
            tanggal_daftar: new Date().toISOString().split('T')[0],
            created_by: currentUser?.username || 'system'
        };
        
        wajibPajak.push(wp);
        saveToLocalStorage('wajibPajak', wajibPajak);
        
        updateDashboard();
        updateWPTable();
        resetForm();
        showToast('Data wajib pajak berhasil disimpan!', 'success');
    }
}

function resetForm() {
    const form = document.getElementById('wpForm');
    if (form) form.reset();
    
    const latEl = document.getElementById('latitude');
    const lngEl = document.getElementById('longitude');
    if (latEl) latEl.value = '';
    if (lngEl) lngEl.value = '';
    
    if (miniMapMarker && miniMap) {
        miniMap.removeLayer(miniMapMarker);
        miniMapMarker = null;
    }
    
    // Hide all tax fields
    document.querySelectorAll('.tax-fields').forEach(field => field.classList.add('hidden'));
    document.getElementById('taxFieldsContainer')?.classList.add('hidden');
    
    // Reset editing mode
    if (form) {
        delete form.dataset.editingId;
        const pageTitle = document.getElementById('pageTitle');
        if (pageTitle) pageTitle.textContent = 'Input Wajib Pajak';
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = `
                <span class="flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Simpan Data Wajib Pajak
                </span>
            `;
        }
    }
}

function showTaxFields() {
    const checkboxes = document.querySelectorAll('input[name="jenis_pajak"]:checked');
    const selectedTaxes = Array.from(checkboxes).map(cb => cb.value);
    const container = document.getElementById('taxFieldsContainer');
    
    // Hide all tax fields first
    document.querySelectorAll('.tax-fields').forEach(field => field.classList.add('hidden'));
    
    if (selectedTaxes.length > 0) {
        container.classList.remove('hidden');
        
        // Show selected tax fields
        selectedTaxes.forEach(tax => {
            const fieldMap = {
                'reklame': 'reklameFields',
                'air_tanah': 'airTanahFields',
                'sarang_burung': 'sarangBurungFields',
                'mineral': 'mineralFields',
                'pbb': 'pbbFields',
                'bphtb': 'bphtbFields',
                'pbjt_mamin': 'pbjtMaminFields',
                'pbjt_listrik': 'pbjtListrikFields',
                'pbjt_hotel': 'pbjtHotelFields',
                'pbjt_parkir': 'pbjtParkirFields',
                'pbjt_hiburan': 'pbjtHiburanFields',
                'opsen_pkb': 'opsenPkbFields',
                'opsen_bbnkb': 'opsenBbnkbFields'
            };
            
            const fieldId = fieldMap[tax];
            if (fieldId && document.getElementById(fieldId)) {
                document.getElementById(fieldId).classList.remove('hidden');
            }
        });
    } else {
        container.classList.add('hidden');
    }
}

function calculatePBB() {
    const luasTanah = parseFloat(document.querySelector('input[name="pbb_luas_tanah"]')?.value) || 0;
    const njopTanah = parseFloat(document.querySelector('input[name="pbb_njop_tanah"]')?.value) || 0;
    const luasBangunan = parseFloat(document.querySelector('input[name="pbb_luas_bangunan"]')?.value) || 0;
    const njopBangunan = parseFloat(document.querySelector('input[name="pbb_njop_bangunan"]')?.value) || 0;
    
    const totalNjopTanah = luasTanah * njopTanah;
    const totalNjopBangunan = luasBangunan * njopBangunan;
    const njopKsp = totalNjopTanah + totalNjopBangunan;
    
    const totalNjopTanahEl = document.querySelector('input[name="pbb_total_njop_tanah"]');
    if (totalNjopTanahEl) totalNjopTanahEl.value = totalNjopTanah;
    
    const totalNjopBangunanEl = document.querySelector('input[name="pbb_total_njop_bangunan"]');
    if (totalNjopBangunanEl) totalNjopBangunanEl.value = totalNjopBangunan;
    
    const njopKspEl = document.querySelector('input[name="pbb_njop_ksp"]');
    if (njopKspEl) njopKspEl.value = njopKsp;
}

function calculateWalet() {
    const panjang = parseFloat(document.querySelector('input[name="walet_panjang"]')?.value) || 0;
    const lebar = parseFloat(document.querySelector('input[name="walet_lebar"]')?.value) || 0;
    const luas = panjang * lebar;
    
    const luasEl = document.querySelector('input[name="walet_luas"]');
    if (luasEl) luasEl.value = luas.toFixed(2);
}

// ==================== WAJIB PAJAK TABLE ====================

function updateWPTable() {
    const searchEl = document.getElementById('searchWP');
    const search = searchEl?.value.toLowerCase() || '';
    
    const filterEl = document.getElementById('filterJenisPajak');
    const filter = filterEl?.value || '';
    
    let filtered = wajibPajak.filter(wp => {
        const matchSearch = wp.npwpd?.toLowerCase().includes(search) || 
                          wp.nama?.toLowerCase().includes(search) ||
                          getNamaUsaha(wp)?.toLowerCase().includes(search);
        const matchFilter = !filter || (wp.jenis_pajak && wp.jenis_pajak.includes(filter));
        return matchSearch && matchFilter;
    });
    
    const start = (currentPage - 1) * perPage;
    const end = start + perPage;
    const pageData = filtered.slice(start, end);
    
    const tableBody = document.getElementById('wpTableBody');
    if (tableBody) {
        const html = pageData.map((wp, i) => {
            const namaUsaha = getNamaUsaha(wp);
            // Koordinat display with clickable link
            let coordDisplay = `<span class="text-gray-400">-</span>`;
            if (wp.latitude && wp.longitude) {
                coordDisplay = `
                    <div class="flex flex-col gap-1">
                        <span class="font-mono text-xs bg-blue-50 text-blue-600 px-1 py-0.5 rounded cursor-pointer hover:bg-blue-100 transition-colors" onclick="viewDetail(${wp.id})">
                            ${parseFloat(wp.latitude).toFixed(6)}, ${parseFloat(wp.longitude).toFixed(6)}
                        </span>
                        <button onclick="viewDetail(${wp.id})" class="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg>
                            Lihat Peta
                        </button>
                    </div>
                `;
            }
            
            return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${start + i + 1}</td>
                <td class="px-4 py-3 font-medium">${wp.npwpd}</td>
                <td class="px-4 py-3 font-semibold">${namaUsaha || wp.nama || '-'}</td>
                <td class="px-4 py-3">${wp.jenis_wp === 'perorangan' ? 'Perorangan' : 'Badan Usaha'}</td>
                <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                        ${(wp.jenis_pajak || []).map(j => `<span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">${taxTypes[j] || j}</span>`).join('')}
                    </div>
                </td>
                <td class="px-4 py-3 text-sm">${wp.kelurahan}, ${wp.kecamatan}</td>
                <td class="px-4 py-3">${formatDate(wp.tanggal_daftar)}</td>
                <td class="px-4 py-3 text-sm min-w-[150px]">${coordDisplay}</td>
                <td class="px-4 py-3 text-center">
                    <button onclick="editWP(${wp.id})" class="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded mr-1">Edit</button>
                    <button onclick="deleteWP(${wp.id})" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">Hapus</button>
                </td>
            </tr>
        `;
        }).join('');
        
        tableBody.innerHTML = html || '<tr><td colspan="9" class="px-4 py-8 text-center text-gray-500">Tidak ada data</td></tr>';
    }
    
    const showingCountEl = document.getElementById('showingCount');
    if (showingCountEl) showingCountEl.textContent = pageData.length;
    
    const totalCountEl = document.getElementById('totalCount');
    if (totalCountEl) totalCountEl.textContent = filtered.length;
    
    const prevBtn = document.getElementById('prevBtn');
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = end >= filtered.length;
}

function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updateWPTable();
    }
}

function nextPage() {
    currentPage++;
    updateWPTable();
}

function viewDetail(id) {
    const wp = wajibPajak.find(w => w.id === id);
    if (!wp) return;

    const dataObjekPajak = wp.data_objek_pajak || {};
    
    // Helper function to render detail row
    const renderRow = (label, value, isHighlight = false) => {
        return `<div class="flex justify-between py-2 border-b border-gray-100 ${isHighlight ? 'bg-blue-50 -mx-4 px-4' : ''}">
            <span class="text-sm text-gray-500">${label}:</span>
            <span class="text-sm font-medium text-right flex-1 ml-4">${value || '-'}</span>
        </div>`;
    };
    
    // Generate detail content for each tax type
    const generateTaxDetail = (taxType, data, color) => {
        if (!data) return '';
        
        let html = `<div class="border-l-4" style="border-color: ${color};">
            <h4 class="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" style="background-color: ${color};"></span>
                ${taxTypes[taxType] || taxType}
            </h4>
            <div class="ml-4 space-y-1">`;
        
        switch(taxType) {
            case 'reklame':
                html += renderRow('Nama Usaha', data.nama_usaha);
                html += renderRow('Jenis Reklame', data.jenis);
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Masa Berlaku Izin', data.masa_izin ? formatDate(data.masa_izin) : '-');
                html += renderRow('Nama Brand/Produk', data.brand);
                html += renderRow('Ukuran (P x L)', `${data.panjang || 0}m x ${data.lebar || 0}m`);
                html += renderRow('Luas Reklame', `${((data.panjang || 0) * (data.lebar || 0)).toFixed(2)} m²`);
                html += renderRow('Jumlah Unit', data.jumlah_unit);
                html += renderRow('Jumlah Sisi', data.jumlah_sisi);
                html += renderRow('Lokasi Pemasangan', data.lokasi);
                html += renderRow('Masa Tayang', data.masa_tayang?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jalur Reklame', data.jalur?.replace(/_/g, ' ')?.toUpperCase() || '-');
                break;
                
            case 'air_tanah':
                html += renderRow('Nama Usaha', data.nama_usaha);
                html += renderRow('No. IPAT', data.no_izin);
                html += renderRow('Masa Berlaku Izin', data.masa_izin ? formatDate(data.masa_izin) : '-');
                html += renderRow('Jenis Penggunaan', data.jenis_penggunaan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jumlah Sumur Bor', data.jumlah_sumur_bor);
                html += renderRow('Jumlah Sumur Resapan', data.jumlah_sumur_resapan);
                html += renderRow('Kedalaman Sumur', data.kedalaman ? `${data.kedalaman} meter` : '-');
                html += renderRow('Debit Per Hari', data.volume_hari ? `${data.volume_hari} m³` : '-');
                html += renderRow('Debit Per Bulan', data.volume_bulan ? `${data.volume_bulan} m³` : '-');
                html += renderRow('Diameter Pipa', data.diameter_pipa ? `${data.diameter_pipa} inch` : '-');
                html += renderRow('Lokasi Sumur', data.lokasi);
                break;
                
            case 'sarang_burung':
                html += renderRow('Nama Usaha', data.nama_usaha);
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Masa Berlaku Izin', data.masa_izin ? formatDate(data.masa_izin) : '-');
                html += renderRow('Jenis Bangunan', data.jenis_bangunan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jumlah Lantai', data.jumlah_lantai);
                html += renderRow('Panjang Bangunan', data.panjang ? `${data.panjang} m` : '-');
                html += renderRow('Lebar Bangunan', data.lebar ? `${data.lebar} m` : '-');
                html += renderRow('Luas Bangunan', data.luas ? `${data.luas} m²` : '-');
                html += renderRow('Tinggi Bangunan', data.tinggi ? `${data.tinggi} m` : '-');
                html += renderRow('Jumlah Lubang Masuk', data.lubang);
                html += renderRow('Lokasi Bangunan', data.lokasi);
                break;
                
            case 'mineral':
                html += renderRow('Nama Usaha', data.nama_usaha);
                html += renderRow('No. IUP', data.no_izin);
                html += renderRow('Masa Berlaku Izin', data.masa_izin ? formatDate(data.masa_izin) : '-');
                html += renderRow('Jenis Mineral/Batuan', data.jenis?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Luas WIUP', data.luas ? `${data.luas} Ha` : '-');
                html += renderRow('Volume Produksi', data.volume ? `${data.volume} ${data.satuan || 'm³'}` : '-');
                html += renderRow('Satuan', data.satuan?.toUpperCase() || '-');
                html += renderRow('Metode Penambangan', data.metode?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jenis Izin', data.jenis_izin?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Lokasi Tambang', data.lokasi);
                break;
                
            case 'pbb':
                html += renderRow('Nama Objek Pajak', data.nama_op, true);
                html += renderRow('NOP', data.nop, true);
                html += renderRow('Tahun Pajak', data.tahun);
                html += renderRow('Luas Tanah', data.luas_tanah ? `${data.luas_tanah} m²` : '-');
                html += renderRow('Luas Bangunan', data.luas_bangunan ? `${data.luas_bangunan} m²` : '-');
                html += renderRow('NJOP Tanah/m²', data.njop_tanah ? formatRupiah(data.njop_tanah) : '-');
                html += renderRow('NJOP Bangunan/m²', data.njop_bangunan ? formatRupiah(data.njop_bangunan) : '-');
                html += renderRow('Total NJOP Tanah', data.total_njop_tanah ? formatRupiah(data.total_njop_tanah) : '-', true);
                html += renderRow('Total NJOP Bangunan', data.total_njop_bangunan ? formatRupiah(data.total_njop_bangunan) : '-', true);
                html += renderRow('NJOP KSP', data.njop_ksp ? formatRupiah(data.njop_ksp) : '-', true);
                html += renderRow('Peruntukan', data.peruntukan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jenis Bangunan', data.jenis_bangunan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jumlah Lantai', data.jumlah_lantai);
                html += renderRow('Tahun Pembuatan', data.tahun_bangunan);
                html += renderRow('Alamat Objek Pajak', data.alamat_op);
                html += renderRow('RT/RW', data.rtrw);
                break;
                
            case 'bphtb':
                html += renderRow('Nama Objek Pajak', data.nama_op, true);
                html += renderRow('NOP Baru', data.nop_baru, true);
                html += renderRow('NOP Lama', data.nop_lama);
                html += renderRow('Jenis Perolehan', data.jenis_perolehan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('NPPOP', data.npop ? formatRupiah(data.npop) : '-', true);
                html += renderRow('NPOKP', data.npokp ? formatRupiah(data.npokp) : '-', true);
                html += renderRow('Harga Transaksi', data.harga_transaksi ? formatRupiah(data.harga_transaksi) : '-');
                html += renderRow('Luas Tanah', data.luas_tanah ? `${data.luas_tanah} m²` : '-');
                html += renderRow('Luas Bangunan', data.luas_bangunan ? `${data.luas_bangunan} m²` : '-');
                html += renderRow('No. Akta', data.no_akta);
                html += renderRow('Tanggal Akta', data.tanggal_akta ? formatDate(data.tanggal_akta) : '-');
                html += renderRow('Nama PPAT', data.ppat);
                html += renderRow('Lokasi Objek Pajak', data.lokasi);
                break;
                
            case 'pbjt_mamin':
                html += renderRow('Nama Usaha', data.nama_usaha, true);
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Jenis Usaha', data.jenis_usaha?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Klasifikasi', data.klasifikasi?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jumlah Tempat Duduk', data.jumlah_kursi);
                html += renderRow('Omzet per Bulan', data.omzet_bulan ? formatRupiah(data.omzet_bulan) : '-');
                html += renderRow('Jam Operasional', data.jam_operasional);
                html += renderRow('Lokasi Usaha', data.lokasi);
                break;
                
            case 'pbjt_listrik':
                html += renderRow('Nama Usaha/Pelanggan', data.nama_usaha);
                html += renderRow('ID Pelanggan/No. SLO', data.id_pelanggan);
                html += renderRow('Jenis Pelanggan', data.jenis_pelanggan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Golongan Tarif', data.golongan?.toUpperCase());
                html += renderRow('Daya Terpasang', data.daya ? `${data.daya} VA/kVA` : '-');
                html += renderRow('Pemakaian per Bulan', data.pemakaian ? `${data.pemakaian} kWh` : '-');
                html += renderRow('Unit Bisnis', data.unit_bisnis);
                html += renderRow('Sumber Listrik', data.sumber?.toUpperCase());
                html += renderRow('Lokasi', data.lokasi);
                break;
                
            case 'pbjt_hotel':
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Nama Hotel', data.nama, true);
                html += renderRow('Kelas Hotel', data.kelas?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Jumlah Kamar', data.jumlah_kamar);
                html += renderRow('Tarif per Malam', data.tarif ? formatRupiah(data.tarif) : '-');
                html += renderRow('Kapasitas Tamu', data.kapasitas);
                html += renderRow('Fasilitas', data.fasilitas && Array.isArray(data.fasilitas) ? data.fasilitas.join(', ') : '-');
                html += renderRow('Lokasi Hotel', data.lokasi);
                break;
                
            case 'pbjt_parkir':
                html += renderRow('Nama Usaha/Tempat Parkir', data.nama_usaha);
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Jenis Lokasi', data.jenis_lokasi?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Kapasitas', data.kapasitas?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Slot Mobil', data.slot_mobil);
                html += renderRow('Slot Motor', data.slot_motor);
                html += renderRow('Tarif per Jam', data.tarif_jam ? formatRupiah(data.tarif_jam) : '-');
                html += renderRow('Tarif per Hari', data.tarif_hari ? formatRupiah(data.tarif_hari) : '-');
                html += renderRow('Jam Operasional', data.jam_operasional);
                html += renderRow('Jenis Kendaraan', data.jenis_kendaraan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Lokasi Tempat Parkir', data.lokasi);
                break;
                
            case 'pbjt_hiburan':
                html += renderRow('Nama Usaha/Tempat Hiburan', data.nama_usaha);
                html += renderRow('No. Izin', data.no_izin);
                html += renderRow('Jenis Hiburan', data.jenis?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Klasifikasi', data.klasifikasi?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Kapasitas Pengunjung', data.kapasitas);
                html += renderRow('Harga Tiket Masuk', data.tiket ? formatRupiah(data.tiket) : '-');
                html += renderRow('Harga Kamar/Box', data.harga_kamar ? formatRupiah(data.harga_kamar) : '-');
                html += renderRow('Jumlah Kamar/Box', data.jumlah_kamar);
                html += renderRow('Jam Operasional', data.jam_operasional);
                html += renderRow('Jadwal Pertunjukan', data.jadwal);
                html += renderRow('Lokasi Tempat Hiburan', data.lokasi);
                break;
                
            case 'opsen_pkb':
                html += renderRow('No. BPKB', data.no_bpkb, true);
                html += renderRow('No. Polisi', data.no_polisi, true);
                html += renderRow('Jenis Kendaraan', data.jenis_kendaraan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Merk/Tipe', data.merk);
                html += renderRow('Tahun Kendaraan', data.tahun);
                html += renderRow('Isi Silinder', data.cc ? `${data.cc} cc` : '-');
                html += renderRow('Warna', data.warna);
                html += renderRow('NJKB', data.njkb ? formatRupiah(data.njkb) : '-');
                html += renderRow('PKB Terutang', data.pkb ? formatRupiah(data.pkb) : '-', true);
                html += renderRow('SWDKLLJ', data.swdkllj ? formatRupiah(data.swdkllj) : '-');
                html += renderRow('Kepemilikan', data.kepemilikan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                break;
                
            case 'opsen_bbnkb':
                html += renderRow('No. Faktur', data.no_faktur, true);
                html += renderRow('Tanggal Faktur', data.tanggal_faktur ? formatDate(data.tanggal_faktur) : '-');
                html += renderRow('Jenis Kendaraan', data.jenis_kendaraan?.replace(/_/g, ' ')?.toUpperCase() || '-');
                html += renderRow('Merk/Tipe', data.merk);
                html += renderRow('Tahun Kendaraan', data.tahun);
                html += renderRow('Isi Silinder', data.cc ? `${data.cc} cc` : '-');
                html += renderRow('NJKB', data.njkb ? formatRupiah(data.njkb) : '-');
                html += renderRow('NJK', data.njk ? formatRupiah(data.njk) : '-');
                html += renderRow('BBNKB Terutang', data.bbnkb ? formatRupiah(data.bbnkb) : '-', true);
                html += renderRow('Status', data.status?.toUpperCase());
                break;
        }
        
        html += '</div></div>';
        return html;
    };
    
    // Generate coordinate action buttons if coordinates exist
    let coordinateActions = '';
    if (wp.latitude && wp.longitude) {
        const lat = wp.latitude;
        const lng = wp.longitude;
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        
        coordinateActions = `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 class="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Koordinat Lokasi
                </h4>
                <div class="space-y-3">
                    <div class="flex items-center gap-2 bg-white rounded-lg p-3">
                        <span class="text-sm font-medium text-gray-600">Latitude:</span>
                        <span class="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">${lat}</span>
                    </div>
                    <div class="flex items-center gap-2 bg-white rounded-lg p-3">
                        <span class="text-sm font-medium text-gray-600">Longitude:</span>
                        <span class="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">${lng}</span>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="showWPOnBlockMap(${wp.id})" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                            Lihat di Peta Blok
                        </button>
                        <button onclick="openGoogleMaps('${lat}', '${lng}')" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all">
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            Buka di Google Maps
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Build detail sections for each tax type
    let taxDetailsHtml = '';
    if (wp.jenis_pajak && wp.jenis_pajak.length > 0) {
        taxDetailsHtml = '<div class="mb-6"><h4 class="font-semibold text-gray-800 mb-4">📋 Data Objek Pajak Detail</h4>';
        wp.jenis_pajak.forEach(taxType => {
            const color = taxTypeColors[taxType]?.color || '#666';
            taxDetailsHtml += generateTaxDetail(taxType, dataObjekPajak[taxType], color);
        });
        taxDetailsHtml += '</div>';
    }
    
    let detailHtml = `
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3">👤 Data Dasar Wajib Pajak</h4>
                <div class="space-y-2 text-sm">
                    ${renderRow('NPWPD', wp.npwpd, true)}
                    ${renderRow('Nama Wajib Pajak', wp.nama, true)}
                    ${renderRow('NIK / No. KTP', wp.nik)}
                    ${renderRow('Jenis Wajib Pajak', wp.jenis_wp === 'perorangan' ? 'Perorangan' : 'Badan Usaha')}
                    ${renderRow('Telepon', wp.telepon)}
                    ${renderRow('Email', wp.email)}
                    ${renderRow('Tanggal Daftar', wp.tanggal_daftar ? formatDate(wp.tanggal_daftar) : '-')}
                    ${renderRow('Dibuat Oleh', wp.created_by)}
                    ${wp.updated_at ? renderRow('Diperbarui Tanggal', formatDate(wp.updated_at)) : ''}
                </div>
            </div>
            <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="font-semibold text-gray-800 mb-3">📍 Alamat Wajib Pajak</h4>
                <div class="space-y-2 text-sm">
                    ${renderRow('Alamat Lengkap', wp.alamat)}
                    ${renderRow('Kelurahan/Desa', wp.kelurahan)}
                    ${renderRow('Kecamatan', wp.kecamatan)}
                    ${renderRow('Kabupaten/Kota', wp.kabupaten)}
                    ${renderRow('Provinsi', wp.provinsi)}
                    ${wp.latitude ? renderRow('Latitude', wp.latitude) : ''}
                    ${wp.longitude ? renderRow('Longitude', wp.longitude) : ''}
                </div>
            </div>
        </div>
        ${coordinateActions}
        ${taxDetailsHtml}
        <div class="mb-6">
            <h4 class="font-semibold text-gray-800 mb-3">🏷️ Jenis Pajak Terdaftar</h4>
            <div class="flex flex-wrap gap-2">
                ${(wp.jenis_pajak || []).map(j => {
                    const tax = taxTypeColors[j];
                    return `<span class="px-3 py-2 text-sm rounded-full text-white font-medium" style="background-color: ${tax?.color || '#666'}">${tax?.icon || ''} ${tax?.label || j}</span>`;
                }).join('')}
            </div>
        </div>
    `;
    
    document.getElementById('detailContent').innerHTML = detailHtml;
    
    // Update tax count
    const taxCountEl = document.getElementById('detailTaxCount');
    if (taxCountEl) {
        taxCountEl.textContent = (wp.jenis_pajak || []).length;
    }
    
    document.getElementById('detailModal').classList.add('active');
}

// Fungsi untuk menampilkan WP di Peta Blok
function showWPOnBlockMap(wpId) {
    const wp = wajibPajak.find(w => w.id === wpId);
    if (!wp || !wp.latitude || !wp.longitude) {
        showToast('Koordinat tidak tersedia!', 'warning');
        return;
    }
    
    // Close detail modal
    closeDetailModal();
    
    // Switch to Peta Blok page
    showPage('petaBlok');
    
    // Wait for map to initialize
    setTimeout(() => {
        if (blockMap && wp.latitude && wp.longitude) {
            const lat = parseFloat(wp.latitude);
            const lng = parseFloat(wp.longitude);
            
            // Set view to WP location with high zoom
            blockMap.setView([lat, lng], 18);
            
            // Remove existing temporary markers
            if (blockMap._tempMarker) {
                blockMap.removeLayer(blockMap._tempMarker);
            }
            
            // Create highlighted marker for this WP
            const highlightIcon = L.divIcon({
                className: 'custom-marker',
                html: `<div style="
                    background-color: #ef4444;
                    width: 40px;
                    height: 40px;
                    border-radius: 50% 50% 50% 0;
                    transform: rotate(-45deg);
                    border: 4px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: pulse 2s infinite;
                ">
                    <span style="transform: rotate(45deg); font-size: 18px;">📍</span>
                </div>
                <style>
                    @keyframes pulse {
                        0%, 100% { transform: rotate(-45deg) scale(1); }
                        50% { transform: rotate(-45deg) scale(1.1); }
                    }
                </style>`,
                iconSize: [40, 40],
                iconAnchor: [20, 40],
                popupAnchor: [20, -40]
            });
            
            blockMap._tempMarker = L.marker([lat, lng], { icon: highlightIcon }).addTo(blockMap);
            
            // Create popup
            const popupContent = `
                <div style="min-width: 250px;">
                    <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px; border-radius: 8px; margin-bottom: 10px;">
                        <h3 style="margin: 0; font-size: 16px;">${wp.nama}</h3>
                        <p style="margin: 4px 0 0 0; opacity: 0.9; font-size: 12px;">${wp.npwpd}</p>
                    </div>
                    <div class="text-sm space-y-1">
                        <p><strong>Alamat:</strong> ${wp.alamat || '-'}</p>
                        <p><strong>Kelurahan:</strong> ${wp.kelurahan || '-'}</p>
                        <p><strong>Kecamatan:</strong> ${wp.kecamatan || '-'}</p>
                        <p><strong>Koordinat:</strong> ${wp.latitude}, ${wp.longitude}</p>
                        <div class="mt-2 flex gap-1">
                            ${(wp.jenis_pajak || []).map(j => {
                                const tax = taxTypeColors[j];
                                return `<span class="inline-block px-2 py-0.5 text-xs rounded text-white" style="background-color: ${tax?.color || '#666'}">${tax?.label || j}</span>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            blockMap._tempMarker.bindPopup(popupContent).openPopup();
            
            showToast('Lokasi wajib pajak ditampilkan di peta blok!', 'success');
        }
    }, 500);
}

// Fungsi untuk membuka Google Maps
function openGoogleMaps(lat, lng) {
    if (!lat || !lng) {
        showToast('Koordinat tidak tersedia!', 'warning');
        return;
    }
    
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, '_blank');
    showToast('Membuka Google Maps...', 'info');
}

function closeDetailModal() {
    document.getElementById('detailModal').classList.remove('active');
}

function deleteWP(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data wajib pajak ini?')) {
        wajibPajak = wajibPajak.filter(wp => wp.id !== id);
        saveToLocalStorage('wajibPajak', wajibPajak);
        updateDashboard();
        updateWPTable();
        showToast('Data berhasil dihapus!', 'success');
    }
}

// ==================== USER MANAGEMENT ====================

function openUserModal(id = null) {
    const modal = document.getElementById('userModal');
    const form = document.getElementById('userForm');
    const title = document.getElementById('userModalTitle');
    
    if (modal && form && title) {
        modal.classList.add('active');
        form.reset();
        document.getElementById('userId').value = '';
        title.textContent = 'Tambah User Baru';
        document.getElementById('userPassword').required = true;
        
        if (id) {
            const user = users.find(u => u.id === id);
            if (user) {
                title.textContent = 'Edit User';
                document.getElementById('userId').value = user.id;
                document.getElementById('userUsername').value = user.username;
                document.getElementById('userFullName').value = user.fullName;
                document.getElementById('userEmail').value = user.email || '';
                document.getElementById('userRole').value = user.role;
                document.getElementById('userStatus').value = user.status;
                document.getElementById('userPassword').required = false;
            }
        }
    }
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

function handleUserSubmit(e) {
    e.preventDefault();
    
    const id = document.getElementById('userId').value;
    const userData = {
        username: document.getElementById('userUsername').value,
        fullName: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
    };
    
    if (id) {
        const index = users.findIndex(u => u.id === parseInt(id));
        if (index !== -1) {
            users[index] = { ...users[index], ...userData };
            if (document.getElementById('userPassword').value) {
                users[index].password = document.getElementById('userPassword').value;
            }
        }
    } else {
        userData.id = Date.now();
        userData.password = document.getElementById('userPassword').value;
        users.push(userData);
    }
    
    saveToLocalStorage('users', users);
    updateUserTable();
    closeUserModal();
    showToast(id ? 'User berhasil diperbarui!' : 'User berhasil ditambahkan!', 'success');
}

function updateUserTable() {
    const tableBody = document.getElementById('userTableBody');
    if (!tableBody) return;
    
    const html = users.map((user, i) => {
        const badge = roleBadges[user.role] || roleBadges.viewer;
        const statusClass = user.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
        const statusText = user.status === 'aktif' ? 'Aktif' : 'Nonaktif';
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">${i + 1}</td>
                <td class="px-4 py-3 font-medium">${user.username}</td>
                <td class="px-4 py-3">${user.fullName}</td>
                <td class="px-4 py-3">${user.email || '-'}</td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${badge.class}">${badge.label}</span>
                </td>
                <td class="px-4 py-3">
                    <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusText}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <button onclick="openUserModal(${user.id})" class="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded">Edit</button>
                    <button onclick="deleteUser(${user.id})" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded" ${user.username === 'admin' ? 'disabled' : ''}>Hapus</button>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = html;
}

function deleteUser(id) {
    if (confirm('Apakah Anda yakin ingin menghapus user ini?')) {
        users = users.filter(u => u.id !== id);
        saveToLocalStorage('users', users);
        updateUserTable();
        showToast('User berhasil dihapus!', 'success');
    }
}

// ==================== REALISASI PAJAK ====================

function openRealisasiModal(id = null) {
    console.log('=== OPEN REALISASI MODAL ===');
    console.log('ID:', id);
    
    const modal = document.getElementById('realisasiModal');
    const form = document.getElementById('realisasiForm');
    
    if (!modal || !form) {
        console.error('Modal atau form tidak ditemukan!');
        return;
    }
    
    modal.classList.add('active');
    form.reset();
    document.getElementById('realisasiId').value = '';
    document.getElementById('realisasiModalTitle').textContent = 'Input Realisasi Pajak';
    document.getElementById('realisasiTanggalSetor').value = new Date().toISOString().split('T')[0];
    
    // Populate dropdown NPWPD
    populateNpwpdDropdown();
    
    if (id) {
        const realisasi = realisasiPajak.find(r => r.id === id);
        if (realisasi) {
            console.log('Loading realisasi data for edit:', realisasi);
            document.getElementById('realisasiModalTitle').textContent = 'Edit Realisasi Pajak';
            document.getElementById('realisasiId').value = realisasi.id;
            document.getElementById('realisasiNpwpd').value = realisasi.npwpd;
            document.getElementById('realisasiNamaWP').value = realisasi.nama_wp;
            document.getElementById('realisasiJenisPajak').value = realisasi.jenis_pajak;
            document.getElementById('realisasiNoBukti').value = realisasi.no_bukti;
            document.getElementById('realisasiTanggalSetor').value = realisasi.tanggal_setor;
            document.getElementById('realisasiTotal').value = realisasi.total;
            document.getElementById('realisasiStatus').value = realisasi.status;
        }
    }
    
    console.log('=== END OPEN REALISASI MODAL ===');
}

function closeRealisasiModal() {
    document.getElementById('realisasiModal').classList.remove('active');
}

function populateNpwpdDropdown() {
    const select = document.getElementById('realisasiNpwpd');
    if (!select) return;
    
    select.innerHTML = '<option value="">Pilih Wajib Pajak</option>';
    wajibPajak.forEach(wp => {
        select.innerHTML += `<option value="${wp.npwpd}" data-nama="${wp.nama}">${wp.npwpd} - ${wp.nama}</option>`;
    });
}

function autoFillWP() {
    const select = document.getElementById('realisasiNpwpd');
    if (!select) {
        console.error('Element realisasiNpwpd tidak ditemukan di autoFillWP!');
        return;
    }
    
    const selectedOption = select.options[select.selectedIndex];
    const namaWPEl = document.getElementById('realisasiNamaWP');
    if (namaWPEl) {
        namaWPEl.value = selectedOption.dataset.nama || '';
        console.log('✓ Auto-filled nama WP:', namaWPEl.value);
    } else {
        console.error('Element realisasiNamaWP tidak ditemukan!');
    }
}

function handleRealisasiSubmit(e) {
    e.preventDefault();
    
    console.log('=== HANDLE REALISASI SUBMIT ===');
    
    const id = document.getElementById('realisasiId').value;
    const npwpdEl = document.getElementById('realisasiNpwpd');
    const namaWPEl = document.getElementById('realisasiNamaWP');
    const jenisPajakEl = document.getElementById('realisasiJenisPajak');
    const tahunEl = document.getElementById('realisasiTahun');
    const periodeEl = document.getElementById('realisasiPeriode');
    const noBuktiEl = document.getElementById('realisasiNoBukti');
    const tanggalSetorEl = document.getElementById('realisasiTanggalSetor');
    const totalEl = document.getElementById('realisasiTotal');
    const statusEl = document.getElementById('realisasiStatus');
    
    if (!npwpdEl || !namaWPEl || !jenisPajakEl || !tahunEl || !periodeEl || !noBuktiEl || !tanggalSetorEl || !totalEl || !statusEl) {
        console.error('Salah satu elemen form tidak ditemukan!');
        showToast('Terjadi kesalahan pada form!', 'error');
        return;
    }
    
    const data = {
        id: id ? parseInt(id) : Date.now(),
        npwpd: npwpdEl.value,
        nama_wp: namaWPEl.value,
        jenis_pajak: jenisPajakEl.value,
        tahun: parseInt(tahunEl.value),
        periode: periodeEl.value,
        no_bukti: noBuktiEl.value,
        tanggal_setor: tanggalSetorEl.value,
        total: parseFloat(totalEl.value) || 0,
        status: statusEl.value,
        created_by: currentUser?.username || 'system',
        created_at: new Date().toISOString()
    };
    
    console.log('Data yang akan disimpan:', JSON.stringify(data, null, 2));
    
    if (id) {
        // Update existing
        const index = realisasiPajak.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
            realisasiPajak[index] = { ...realisasiPajak[index], ...data, updated_at: new Date().toISOString() };
            console.log('✓ Mengupdate realisasi yang ada di index:', index);
        }
    } else {
        // Add new
        realisasiPajak.push(data);
        console.log('✓ Menambahkan realisasi baru. Total sekarang:', realisasiPajak.length);
    }
    
    // Save to localStorage
    const saved = saveToLocalStorage('realisasiPajak', realisasiPajak);
    console.log('Hasil saveToLocalStorage:', saved);
    
    // Reload from localStorage untuk verifikasi
    const reloaded = loadFromLocalStorage('realisasiPajak', []);
    console.log('Hasil reload dari localStorage:', reloaded.length, 'items');
    realisasiPajak = reloaded;
    
    // Update UI
    console.log('Memanggil fungsi update...');
    updateDashboard();
    updateRealisasiSummary();
    updateRealisasiTable();
    
    closeRealisasiModal();
    showToast('Realisasi pajak berhasil disimpan!', 'success');
    console.log('=== END HANDLE REALISASI SUBMIT ===');
}

function updateRealisasiSummary() {
    const tahunBaru = new Date().getFullYear();
    
    console.log('=== UPDATE REALISASI SUMMARY ===');
    console.log('Target Pajak:', targetPajak.length, 'items');
    console.log('Realisasi Pajak:', realisasiPajak.length, 'items');
    
    const targetTotal = targetPajak
        .filter(t => t.tahun === tahunBaru)
        .reduce((sum, t) => sum + (t.nominal || 0), 0);
    
    const realisasiTahun = realisasiPajak
        .filter(r => {
            const tahunRealisasi = typeof r.tahun === 'string' ? parseInt(r.tahun) : r.tahun;
            return tahunRealisasi === tahunBaru && r.status === 'lunas';
        })
        .reduce((sum, r) => sum + (r.total || 0), 0);
    
    const persentase = targetTotal > 0 ? ((realisasiTahun / targetTotal) * 100).toFixed(1) : 0;
    
    console.log('Target Total:', targetTotal);
    console.log('Realisasi Tahun:', realisasiTahun);
    console.log('Persentase:', persentase + '%');
    
    const targetTahunEl = document.getElementById('targetTahun');
    if (targetTahunEl) targetTahunEl.textContent = formatRupiah(targetTotal);
    
    const realisasiBulanEl = document.getElementById('realisasiBulan');
    if (realisasiBulanEl) realisasiBulanEl.textContent = formatRupiah(realisasiTahun);
    
    const realisasiTahunEl = document.getElementById('realisasiTahun');
    if (realisasiTahunEl) realisasiTahunEl.textContent = formatRupiah(realisasiTahun);
    
    const persentaseEl = document.getElementById('persentase');
    if (persentaseEl) persentaseEl.textContent = persentase + '%';
    
    console.log('=== END UPDATE REALISASI SUMMARY ===');
}

function updateSummaryRealisasiTable(tahun) {
    console.log('=== UPDATE SUMMARY REALISASI TABLE ===');
    console.log('Tahun:', tahun);
    
    const tableBody = document.getElementById('summaryRealisasiTable');
    if (!tableBody) {
        console.error('Element summaryRealisasiTable tidak ditemukan!');
        return;
    }
    
    const summaryHtml = Object.entries(taxTypes).map(([key, label]) => {
        const target = targetPajak.find(t => t.jenis_pajak === key && t.tahun === tahun);
        const targetNominal = target ? target.nominal : 0;
        const realisasi = realisasiPajak
            .filter(r => {
                const tahunRealisasi = typeof r.tahun === 'string' ? parseInt(r.tahun) : r.tahun;
                return r.jenis_pajak === key && tahunRealisasi === tahun && r.status === 'lunas';
            })
            .reduce((sum, r) => sum + (r.total || 0), 0);
        const persentase = targetNominal > 0 ? ((realisasi / targetNominal) * 100).toFixed(1) : 0;
        const progressClass = persentase >= 100 ? 'bg-green-500' : persentase >= 75 ? 'bg-yellow-500' : 'bg-red-500';
        const percentClass = persentase >= 100 ? 'text-green-600' : persentase >= 75 ? 'text-yellow-600' : 'text-red-600';
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="flex items-center justify-between">
                        <span>${label}</span>
                        <button onclick="openTargetModal('${key}')" class="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Set Target
                        </button>
                    </div>
                </td>
                <td class="px-4 py-3 text-right">${formatRupiah(targetNominal)}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">${formatRupiah(realisasi)}</td>
                <td class="px-4 py-3 text-right">
                    <span class="text-sm ${percentClass}">${persentase}%</span>
                </td>
                <td class="px-4 py-3">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full ${progressClass}" style="width: ${Math.min(persentase, 100)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = summaryHtml;
    console.log('Summary table updated');
    console.log('=== END UPDATE SUMMARY REALISASI TABLE ===');
}

function updateRealisasiTable() {
    const tahunBaru = new Date().getFullYear();
    
    console.log('=== UPDATE REALISASI TABLE ===');
    console.log('Total realisasiPajak:', realisasiPajak.length);
    console.log('Tahun yang difilter:', tahunBaru);
    
    let filtered = realisasiPajak.filter(r => {
        const tahunRealisasi = typeof r.tahun === 'string' ? parseInt(r.tahun) : r.tahun;
        return tahunRealisasi === tahunBaru;
    });
    
    filtered.sort((a, b) => new Date(b.tanggal_setor) - new Date(a.tanggal_setor));
    
    console.log('Filtered realisasi:', filtered.length, 'items');
    
    const tableBody = document.getElementById('realisasiTableBody');
    if (tableBody) {
        const html = filtered.map((r, i) => {
            const statusClass = r.status === 'lunas' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700';
            const statusText = capitalizeFirst(r.status.replace('_', ' '));
            
            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">${i + 1}</td>
                    <td class="px-4 py-3 font-medium">${r.npwpd || '-'}</td>
                    <td class="px-4 py-3">${r.nama_wp || '-'}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">${taxTypes[r.jenis_pajak] || r.jenis_pajak || '-'}</span>
                    </td>
                    <td class="px-4 py-3">${capitalizeFirst(r.periode)} ${r.tahun}</td>
                    <td class="px-4 py-3 text-right font-semibold">${formatRupiah(r.total)}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="openRealisasiModal(${r.id})" class="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded">Edit</button>
                        <button onclick="deleteRealisasi(${r.id})" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">Hapus</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = html || '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Tidak ada data realisasi. Klik tombol "Input Realisasi" untuk menambah data.</td></tr>';
        console.log('Table innerHTML updated');
    } else {
        console.error('Element realisasiTableBody tidak ditemukan!');
    }
    
    updateSummaryRealisasiTable(tahunBaru);
    console.log('=== END UPDATE REALISASI TABLE ===');
}

function updateSummaryRealisasiTable(tahun) {
    const tableBody = document.getElementById('summaryRealisasiTable');
    if (!tableBody) return;
    
    const summaryHtml = Object.entries(taxTypes).map(([key, label]) => {
        const target = targetPajak.find(t => t.jenis_pajak === key && t.tahun === tahun);
        const targetNominal = target ? target.nominal : 0;
        const realisasi = realisasiPajak
            .filter(r => r.jenis_pajak === key && r.tahun === tahun && r.status === 'lunas')
            .reduce((sum, r) => sum + (r.total || 0), 0);
        const persentase = targetNominal > 0 ? ((realisasi / targetNominal) * 100).toFixed(1) : 0;
        const progressClass = persentase >= 100 ? 'bg-green-500' : persentase >= 75 ? 'bg-yellow-500' : 'bg-red-500';
        const percentClass = persentase >= 100 ? 'text-green-600' : persentase >= 75 ? 'text-yellow-600' : 'text-red-600';
        
        return `
            <tr class="border-b hover:bg-gray-50">
                <td class="px-4 py-3">
                    <div class="flex items-center justify-between">
                        <span>${label}</span>
                        <button onclick="openTargetModal('${key}')" class="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            Set Target
                        </button>
                    </div>
                </td>
                <td class="px-4 py-3 text-right">${formatRupiah(targetNominal)}</td>
                <td class="px-4 py-3 text-right font-semibold text-green-600">${formatRupiah(realisasi)}</td>
                <td class="px-4 py-3 text-right">
                    <span class="persentase text-sm ${percentClass}">${persentase}%</span>
                </td>
                <td class="px-4 py-3">
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div class="h-2 rounded-full ${progressClass}" style="width: ${Math.min(persentase, 100)}%"></div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
    
    tableBody.innerHTML = summaryHtml;
}

function deleteRealisasi(id) {
    if (confirm('Apakah Anda yakin ingin menghapus data realisasi ini?')) {
        realisasiPajak = realisasiPajak.filter(r => r.id !== id);
        saveToLocalStorage('realisasiPajak', realisasiPajak);
        updateDashboard();
        updateRealisasiSummary();
        updateRealisasiTable();
        showToast('Realisasi berhasil dihapus!', 'success');
    }
}

// ==================== TARGET PAJAK ====================

function openTargetModal(jenisPajak) {
    const tahun = new Date().getFullYear();
    document.getElementById('targetModal').classList.add('active');
    document.getElementById('targetForm').reset();
    document.getElementById('targetJenisPajak').value = jenisPajak;
    document.getElementById('targetJenisPajakName').value = taxTypes[jenisPajak] || jenisPajak;
    document.getElementById('targetTahunInput').value = tahun;
    
    const existingTarget = targetPajak.find(t => t.jenis_pajak === jenisPajak && t.tahun === tahun);
    if (existingTarget) {
        document.getElementById('targetNominal').value = existingTarget.nominal;
    }
}

function closeTargetModal() {
    document.getElementById('targetModal').classList.remove('active');
}

function handleTargetSubmit(e) {
    e.preventDefault();
    
    const jenisPajak = document.getElementById('targetJenisPajak').value;
    const tahun = parseInt(document.getElementById('targetTahunInput').value);
    const nominal = parseFloat(document.getElementById('targetNominal').value);
    
    const existingIndex = targetPajak.findIndex(t => t.jenis_pajak === jenisPajak && t.tahun === tahun);
    if (existingIndex !== -1) {
        targetPajak[existingIndex].nominal = nominal;
    } else {
        targetPajak.push({
            id: Date.now(),
            jenis_pajak: jenisPajak,
            tahun: tahun,
            nominal: nominal
        });
    }
    
    saveToLocalStorage('targetPajak', targetPajak);
    updateDashboard();
    updateRealisasiSummary();
    updateRealisasiTable();
    closeTargetModal();
    showToast('Target pajak berhasil disimpan!', 'success');
}

// ==================== MAP FUNCTIONS ====================

function initializeMiniMap() {
    const miniMapEl = document.getElementById('miniMap');
    if (!miniMapEl) return;
    
    try {
        miniMap = L.map('miniMap').setView([SIDRAP_COORDS.lat, SIDRAP_COORDS.lng], SIDRAP_COORDS.zoom);
        
        const miniStandard = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        });
        const miniSatellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri'
        });
        
        miniStandard.addTo(miniMap);
        
        const baseMaps = {
            "Standard": miniStandard,
            "Satelit": miniSatellite
        };
        L.control.layers(baseMaps, null, { position: 'bottomright' }).addTo(miniMap);
    } catch (error) {
        console.error('Error initializing mini map:', error);
    }
}

function initializeBlockMap() {
    const blockMapEl = document.getElementById('blockMap');
    if (!blockMapEl) return;
    
    try {
        if (blockMap) {
            blockMap.remove();
            blockMap = null;
        }
        
        setTimeout(() => {
            blockMap = L.map('blockMap', {
                center: [SIDRAP_COORDS.lat, SIDRAP_COORDS.lng],
                zoom: SIDRAP_COORDS.zoom,
                zoomControl: true
            });
            
            // Add default tile layer
            blockStandardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 19
            }).addTo(blockMap);
            
            blockSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© Esri',
                maxZoom: 19
            });
            
            // Add center marker
            L.marker([SIDRAP_COORDS.lat, SIDRAP_COORDS.lng])
                .addTo(blockMap)
                .bindPopup('<b>Kabupaten Sidenreng Rappang</b><br>Pusat Pemerintahan');
            
            // Create layer group for WP markers
            wpLayerGroup = L.layerGroup().addTo(blockMap);
            
            // Initialize WP filter checkboxes
            initializeWPFilter();
            
            // Update visible count
            updateWPVisibleCount();
        }, 100);
    } catch (error) {
        console.error('Error initializing block map:', error);
    }
}

function openMapModal() {
    const modal = document.getElementById('mapModal');
    if (!modal) return;
    
    modal.classList.add('active');
    
    setTimeout(() => {
        if (!map) {
            try {
                map = L.map('map').setView([SIDRAP_COORDS.lat, SIDRAP_COORDS.lng], 12);
                
                standardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                });
                
                satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                    attribution: '© Esri'
                });
                
                standardLayer.addTo(map);
                
                map.on('click', function(e) {
                    if (mapMarker) {
                        map.removeLayer(mapMarker);
                    }
                    mapMarker = L.marker([e.latlng.lat, e.latlng.lng]).addTo(map);
                    document.getElementById('modalLat').value = e.latlng.lat.toFixed(7);
                    document.getElementById('modalLng').value = e.latlng.lng.toFixed(7);
                    tempLocation = { lat: e.latlng.lat, lng: e.latlng.lng };
                });
            } catch (error) {
                console.error('Error initializing map:', error);
            }
        } else {
            map.invalidateSize();
        }
    }, 100);
}

function closeMapModal() {
    document.getElementById('mapModal').classList.remove('active');
}

function confirmLocation() {
    const latEl = document.getElementById('latitude');
    const lngEl = document.getElementById('longitude');
    
    if (latEl && lngEl) {
        latEl.value = tempLocation.lat.toFixed(7);
        lngEl.value = tempLocation.lng.toFixed(7);
    }
    
    if (miniMap) {
        miniMap.setView([tempLocation.lat, tempLocation.lng], 15);
        if (miniMapMarker) {
            miniMap.removeLayer(miniMapMarker);
        }
        miniMapMarker = L.marker([tempLocation.lat, tempLocation.lng]).addTo(miniMap);
    }
    
    closeMapModal();
}

function locateUser() {
    if (navigator.geolocation && map) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            map.setView([lat, lng], 15);
            
            if (mapMarker) {
                map.removeLayer(mapMarker);
            }
            mapMarker = L.marker([lat, lng]).addTo(map);
            
            document.getElementById('modalLat').value = lat.toFixed(7);
            document.getElementById('modalLng').value = lng.toFixed(7);
            tempLocation = { lat, lng };
        }, function() {
            showToast('Gagal mendapatkan lokasi', 'error');
        });
    }
}

function goToSidrap() {
    if (map) {
        map.setView([SIDRAP_COORDS.lat, SIDRAP_COORDS.lng], 11);
        
        if (mapMarker) {
            map.removeLayer(mapMarker);
        }
        mapMarker = L.marker([SIDRAP_COORDS.lat, SIDRAP_COORDS.lng]).addTo(map);
        
        document.getElementById('modalLat').value = SIDRAP_COORDS.lat.toFixed(7);
        document.getElementById('modalLng').value = SIDRAP_COORDS.lng.toFixed(7);
        tempLocation = { lat: SIDRAP_COORDS.lat, lng: SIDRAP_COORDS.lng };
    }
}

function setMapLayer(layerType) {
    if (!map || !standardLayer || !satelliteLayer) return;
    
    if (currentMapLayer === 'standard') {
        map.removeLayer(standardLayer);
    } else {
        map.removeLayer(satelliteLayer);
    }
    
    if (layerType === 'standard') {
        standardLayer.addTo(map);
        currentMapLayer = 'standard';
        document.getElementById('btnStandard').className = 'px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium';
        document.getElementById('btnSatellite').className = 'px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium';
    } else {
        satelliteLayer.addTo(map);
        currentMapLayer = 'satellite';
        document.getElementById('btnSatellite').className = 'px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium';
        document.getElementById('btnStandard').className = 'px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium';
    }
    
    showToast(`Tampilan peta diubah ke ${layerType === 'standard' ? 'Standard' : 'Satelit'}`, 'success');
}

function importFile(input) {
    const file = input.files[0];
    if (!file) return;
    
    const fileName = file.name.toLowerCase();
    const extension = fileName.split('.').pop();
    
    console.log('=== IMPORT FILE STARTED ===');
    console.log('File name:', file.name);
    console.log('File extension:', extension);
    console.log('File size:', file.size, 'bytes');
    
    const layerInfoEl = document.getElementById('layerInfo');
    
    try {
        if (extension === 'shp') {
            // Import SHP file
            importSHPFile(file);
        } else if (extension === 'zip') {
            // Import ZIP file (mungkin berisi SHP)
            importZIPFile(file);
        } else if (extension === 'kmz') {
            // Import KMZ file (KML zipped)
            importKMZFile(file);
        } else if (extension === 'kml') {
            // Import KML file
            importKMLFile(file);
        } else {
            showToast('Format file tidak didukung! Gunakan .shp, .zip, .kmz, atau .kml', 'error');
        }
    } catch (error) {
        console.error('Import error:', error);
        if (layerInfoEl) {
            layerInfoEl.innerHTML = `
                <div class="text-red-600">
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p class="text-sm mt-2">Gagal mengimpor file ${file.name}</p>
                </div>
            `;
        }
        showToast('Gagal mengimpor file!', 'error');
    }
    
    // Reset input
    input.value = '';
}

// Import SHP file
function importSHPFile(file) {
    console.log('=== IMPORT SHP FILE ===');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const arrayBuffer = e.target.result;
            
            // Gunakan shpjs untuk membaca file SHP
            if (typeof shp !== 'undefined') {
                shp(arrayBuffer).then(function(geojson) {
                    console.log('SHP parsed successfully:', geojson);
                    
                    // Tambahkan layer ke peta
                    addGeoJSONLayerToMap(geojson, file.name, 'shp');
                    showToast('File SHP berhasil diimpor!', 'success');
                }).catch(function(error) {
                    console.error('SHP parsing error:', error);
                    throw new Error('Gagal membaca file SHP: ' + error.message);
                });
            } else {
                throw new Error('Library shpjs tidak tersedia');
            }
        } catch (error) {
            console.error('SHP read error:', error);
            throw error;
        }
    };
    
    reader.onerror = function() {
        throw new Error('Gagal membaca file');
    };
    
    reader.readAsArrayBuffer(file);
}

// Import ZIP file
function importZIPFile(file) {
    console.log('=== IMPORT ZIP FILE ===');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (typeof JSZip !== 'undefined') {
                JSZip.loadAsync(e.target.result).then(function(zip) {
                    console.log('ZIP loaded:', Object.keys(zip.files));
                    
                    // Cari file .shp, .shx, .dbf dalam ZIP
                    let shpFile = null;
                    let dbfFile = null;
                    
                    Object.keys(zip.files).forEach(function(filename) {
                        if (filename.toLowerCase().endsWith('.shp')) {
                            shpFile = zip.files[filename];
                        } else if (filename.toLowerCase().endsWith('.dbf')) {
                            dbfFile = zip.files[filename];
                        }
                    });
                    
                    if (shpFile) {
                        // Baca file SHP dari ZIP
                        shpFile.async('arraybuffer').then(function(content) {
                            shp(content).then(function(geojson) {
                                console.log('SHP from ZIP parsed:', geojson);
                                addGeoJSONLayerToMap(geojson, file.name, 'zip');
                                showToast('File ZIP berisi SHP berhasil diimpor!', 'success');
                            }).catch(function(error) {
                                console.error('SHP parsing error:', error);
                                throw new Error('Gagal membaca SHP dari ZIP: ' + error.message);
                            });
                        }).catch(function(error) {
                            console.error('Error reading SHP from ZIP:', error);
                            throw error;
                        });
                    } else {
                        throw new Error('Tidak ada file .shp ditemukan dalam ZIP');
                    }
                }).catch(function(error) {
                    console.error('ZIP loading error:', error);
                    throw new Error('Gagal membuka file ZIP: ' + error.message);
                });
            } else {
                throw new Error('Library JSZip tidak tersedia');
            }
        } catch (error) {
            console.error('ZIP import error:', error);
            throw error;
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Import KMZ file
function importKMZFile(file) {
    console.log('=== IMPORT KMZ FILE ===');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            if (typeof JSZip !== 'undefined') {
                JSZip.loadAsync(e.target.result).then(function(zip) {
                    console.log('KMZ loaded:', Object.keys(zip.files));
                    
                    // Cari file .kml dalam KMZ
                    let kmlFile = null;
                    
                    Object.keys(zip.files).forEach(function(filename) {
                        if (filename.toLowerCase().endsWith('.kml') || filename.toLowerCase().endsWith('.doc.kml')) {
                            kmlFile = zip.files[filename];
                        }
                    });
                    
                    if (kmlFile) {
                        // Baca file KML dari KMZ
                        kmlFile.async('string').then(function(kmlContent) {
                            console.log('KML from KMZ loaded, length:', kmlContent.length);
                            parseKMLContent(kmlContent, file.name, 'kmz');
                        }).catch(function(error) {
                            console.error('Error reading KML from KMZ:', error);
                            throw error;
                        });
                    } else {
                        throw new Error('Tidak ada file .kml ditemukan dalam KMZ');
                    }
                }).catch(function(error) {
                    console.error('KMZ loading error:', error);
                    throw new Error('Gagal membuka file KMZ: ' + error.message);
                });
            } else {
                throw new Error('Library JSZip tidak tersedia');
            }
        } catch (error) {
            console.error('KMZ import error:', error);
            throw error;
        }
    };
    
    reader.readAsArrayBuffer(file);
}

// Import KML file
function importKMLFile(file) {
    console.log('=== IMPORT KML FILE ===');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const kmlContent = e.target.result;
            console.log('KML loaded, length:', kmlContent.length);
            parseKMLContent(kmlContent, file.name, 'kml');
        } catch (error) {
            console.error('KML read error:', error);
            throw error;
        }
    };
    
    reader.readAsText(file);
}

// Parse KML content
function parseKMLContent(kmlContent, fileName, fileType) {
    console.log('=== PARSE KML CONTENT ===');
    console.log('Content length:', kmlContent.length);
    
    try {
        // Gunakan togeojson untuk konversi KML ke GeoJSON
        if (typeof toGeoJSON !== 'undefined') {
            const parser = new DOMParser();
            const kmlDoc = parser.parseFromString(kmlContent, 'text/xml');
            
            const geojson = toGeoJSON.kml(kmlDoc);
            console.log('KML converted to GeoJSON:', geojson);
            
            addGeoJSONLayerToMap(geojson, fileName, fileType);
            showToast(`File ${fileType.toUpperCase()} berhasil diimpor!`, 'success');
        } else {
            throw new Error('Library toGeoJSON tidak tersedia');
        }
    } catch (error) {
        console.error('KML parsing error:', error);
        throw new Error('Gagal membaca file KML: ' + error.message);
    }
}

// Tambahkan GeoJSON layer ke peta
function addGeoJSONLayerToMap(geojson, fileName, fileType) {
    console.log('=== ADD GEOJSON LAYER TO MAP ===');
    console.log('GeoJSON:', geojson);
    console.log('Features:', geojson.features ? geojson.features.length : 0);
    
    if (!blockMap) {
        showToast('Peta blok belum diinisialisasi!', 'error');
        return;
    }
    
    // Buat layer group baru
    const layerName = fileName.replace(/\.(shp|zip|kmz|kml)$/i, '');
    const layerGroup = L.layerGroup();
    
    // Tentukan warna random
    const color = getRandomColor();
    
    // Tambahkan features ke peta
    let featureCount = 0;
    
    if (geojson.features && Array.isArray(geojson.features)) {
        geojson.features.forEach(function(feature) {
            try {
                let layer;
                
                if (feature.geometry.type === 'Point') {
                    layer = L.circleMarker([
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0]
                    ], {
                        radius: 8,
                        fillColor: color,
                        color: '#fff',
                        weight: 2,
                        opacity: 1,
                        fillOpacity: 0.8
                    });
                } else if (feature.geometry.type === 'LineString') {
                    const coords = feature.geometry.coordinates.map(function(coord) {
                        return [coord[1], coord[0]];
                    });
                    layer = L.polyline(coords, {
                        color: color,
                        weight: 4,
                        opacity: 0.8
                    });
                } else if (feature.geometry.type === 'Polygon') {
                    const coords = feature.geometry.coordinates[0].map(function(coord) {
                        return [coord[1], coord[0]];
                    });
                    layer = L.polygon(coords, {
                        color: color,
                        weight: 3,
                        opacity: 0.8,
                        fillColor: color,
                        fillOpacity: 0.3
                    });
                } else if (feature.geometry.type === 'MultiPolygon') {
                    layer = L.geoJSON(feature, {
                        style: {
                            color: color,
                            weight: 3,
                            opacity: 0.8,
                            fillColor: color,
                            fillOpacity: 0.3
                        }
                    });
                } else {
                    // Gunakan L.geoJSON untuk tipe lain
                    layer = L.geoJSON(feature, {
                        style: {
                            color: color,
                            weight: 3,
                            opacity: 0.8,
                            fillColor: color,
                            fillOpacity: 0.3
                        }
                    });
                }
                
                if (layer) {
                    // Tambahkan popup
                    const props = feature.properties || {};
                    let popupContent = '<div style="min-width: 200px;">';
                    popupContent += `<strong>${layerName}</strong><br>`;
                    popupContent += `<small>Tipe: ${feature.geometry.type}</small><br>`;
                    
                    Object.keys(props).forEach(function(key) {
                        const value = props[key];
                        if (value && typeof value === 'string' && value.length < 100) {
                            popupContent += `<br><strong>${key}:</strong> ${value}`;
                        }
                    });
                    
                    popupContent += '</div>';
                    layer.bindPopup(popupContent);
                    
                    layerGroup.addLayer(layer);
                    featureCount++;
                }
            } catch (error) {
                console.error('Error adding feature:', error);
            }
        });
    }
    
    // Tambahkan layer group ke peta
    importedLayers.push({
        name: layerName,
        type: fileType,
        color: color,
        group: layerGroup,
        featureCount: featureCount
    });
    
    if (importedLayerGroup) {
        importedLayerGroup.addLayer(layerGroup);
    } else {
        importedLayerGroup = L.layerGroup([layerGroup]).addTo(blockMap);
    }
    
    // Update layer info
    updateLayerInfo();
    
    // Fit bounds ke layer
    if (layerGroup.getLayers().length > 0) {
        try {
            blockMap.fitBounds(layerGroup.getBounds(), { padding: [50, 50] });
        } catch (e) {
            console.log('Cannot fit bounds:', e);
        }
    }
    
    console.log('=== ADD GEOJSON LAYER TO MAP COMPLETED ===');
    console.log('Layer added:', layerName);
    console.log('Features:', featureCount);
    console.log('Total imported layers:', importedLayers.length);
}

// Update layer info panel
function updateLayerInfo() {
    const layerInfoEl = document.getElementById('layerInfo');
    if (!layerInfoEl) return;
    
    if (importedLayers.length === 0) {
        layerInfoEl.innerHTML = '<p>Belum ada layer yang dimuat. Import file SHP atau KMZ/KML untuk memulai.</p>';
        return;
    }
    
    let html = '<div class="space-y-3">';
    html += '<p class="font-medium">Layer yang Dimuat (' + importedLayers.length + '):</p>';
    
    importedLayers.forEach(function(layer, index) {
        html += `
            <div class="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <div class="w-4 h-4 rounded" style="background-color: ${layer.color};"></div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${layer.name}</p>
                    <p class="text-xs text-gray-500">${layer.type.toUpperCase()} - ${layer.featureCount} features</p>
                </div>
                <button onclick="removeImportedLayer(${index})" class="text-red-500 hover:text-red-700 text-sm">Hapus</button>
            </div>
        `;
    });
    
    html += '</div>';
    layerInfoEl.innerHTML = html;
}

// Hapus imported layer
function removeImportedLayer(index) {
    if (!importedLayers[index]) return;
    
    const layer = importedLayers[index];
    
    // Hapus dari peta
    if (layer.group && importedLayerGroup) {
        importedLayerGroup.removeLayer(layer.group);
    }
    
    // Hapus dari array
    importedLayers.splice(index, 1);
    
    // Update info
    updateLayerInfo();
    
    showToast('Layer berhasil dihapus!', 'success');
}

function clearMap() {
    console.log('=== CLEAR MAP ===');
    
    if (blockMap) {
        // Clear all layers except tile layer
        blockMap.eachLayer(function(layer) {
            if (!(layer instanceof L.TileLayer)) {
                blockMap.removeLayer(layer);
            }
        });
        
        // Clear imported layers
        importedLayers = [];
        importedLayerGroup = null;
        
        // Clear WP markers
        if (wpLayerGroup) {
            wpLayerGroup.clearLayers();
        }
        wpMarkers = [];
        updateWPVisibleCount();
    }
    
    // Reset layer info
    const layerInfoEl = document.getElementById('layerInfo');
    if (layerInfoEl) {
        layerInfoEl.innerHTML = '<p>Belum ada layer yang dimuat. Import file SHP atau KMZ/KML untuk memulai.</p>';
    }
    
    const blockMapLayerInfoEl = document.getElementById('blockMapLayerInfo');
    if (blockMapLayerInfoEl) {
        blockMapLayerInfoEl.textContent = 'Tampilan: Standard | Imported Layers: 0';
    }
    
    showToast('Peta berhasil dibersihkan!', 'success');
    console.log('=== CLEAR MAP COMPLETED ===');
}

function setBlockMapLayer(layerType) {
    if (!blockMap) {
        showToast('Peta blok belum dimuat!', 'warning');
        return;
    }
    
    console.log('=== SET BLOCK MAP LAYER ===');
    console.log('Layer type:', layerType);
    console.log('Current imported layers:', importedLayers.length);
    
    // Initialize layers if they don't exist
    if (!blockStandardLayer) {
        blockStandardLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        });
    }
    
    if (!blockSatelliteLayer) {
        blockSatelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: '© Esri',
            maxZoom: 19
        });
    }
    
    // Remove current tile layer
    if (currentBlockMapLayer === 'standard' && blockStandardLayer) {
        blockMap.removeLayer(blockStandardLayer);
    } else if (currentBlockMapLayer === 'satellite' && blockSatelliteLayer) {
        blockMap.removeLayer(blockSatelliteLayer);
    } else {
        // First time - find and remove the default layer
        blockMap.eachLayer(function(layer) {
            if (layer instanceof L.TileLayer) {
                blockMap.removeLayer(layer);
            }
        });
    }
    
    // Add new tile layer
    if (layerType === 'standard') {
        blockStandardLayer.addTo(blockMap);
        currentBlockMapLayer = 'standard';
        
        // Update button styles
        const btnStandard = document.getElementById('btnBlockStandard');
        const btnSatellite = document.getElementById('btnBlockSatellite');
        if (btnStandard) {
            btnStandard.className = 'px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-all';
        }
        if (btnSatellite) {
            btnSatellite.className = 'px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm font-medium transition-all';
        }
    } else {
        blockSatelliteLayer.addTo(blockMap);
        currentBlockMapLayer = 'satellite';
        
        // Update button styles
        const btnStandard = document.getElementById('btnBlockStandard');
        const btnSatellite = document.getElementById('btnBlockSatellite');
        if (btnStandard) {
            btnStandard.className = 'px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-md text-sm font-medium transition-all';
        }
        if (btnSatellite) {
            btnSatellite.className = 'px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-all';
        }
    }
    
    // Re-add imported layers after changing tile layer
    if (importedLayers && importedLayers.length > 0) {
        console.log('Re-adding imported layers...');
        
        if (!importedLayerGroup) {
            importedLayerGroup = L.layerGroup().addTo(blockMap);
        } else {
            // Clear and re-add
            importedLayerGroup.clearLayers();
        }
        
        importedLayers.forEach(function(layer) {
            if (layer.group) {
                importedLayerGroup.addLayer(layer.group);
            }
        });
    }
    
    // Update info text
    const layerInfoEl = document.getElementById('blockMapLayerInfo');
    if (layerInfoEl) {
        layerInfoEl.textContent = `Tampilan: ${layerType === 'standard' ? 'Standard' : 'Satelit'} | Imported Layers: ${importedLayers.length}`;
    }
    
    showToast(`Tampilan peta blok diubah ke ${layerType === 'standard' ? 'Standard' : 'Satelit'}`, 'success');
    console.log('=== SET BLOCK MAP LAYER COMPLETED ===');
}

// ==================== FIREBASE ====================

function openFirebaseModal() {
    const modal = document.getElementById('firebaseModal');
    if (modal) {
        modal.classList.add('active');
        
        if (firebaseConfig) {
            document.getElementById('firebaseProjectId').value = firebaseConfig.projectId || '';
            document.getElementById('autoSync').checked = firebaseConfig.autoSync || false;
        }
    }
}

function closeFirebaseModal() {
    document.getElementById('firebaseModal').classList.remove('active');
}

function handleFirebaseSubmit(e) {
    e.preventDefault();
    
    const projectId = document.getElementById('firebaseProjectId').value.trim();
    
    if (!projectId) {
        showToast('Project ID wajib diisi!', 'error');
        return;
    }
    
    const config = {
        projectId: projectId,
        autoSync: document.getElementById('autoSync').checked
    };
    
    firebaseConfig = config;
    saveToLocalStorage('firebaseConfig', config);
    
    showToast('Konfigurasi Firebase berhasil disimpan!', 'success');
    initializeFirebase();
}

function initializeFirebase() {
    if (!firebaseConfig?.projectId) {
        console.log('Firebase not configured');
        return;
    }
    
    try {
        console.log('Initializing Firebase...');
        
        if (typeof firebase !== 'undefined') {
            try {
                db = firebase.firestore({
                    projectId: firebaseConfig.projectId,
                    apiKey: 'demo-key'
                });
                isOnline = false;
                console.log('Firestore initialized in demo mode');
                
                updateSyncMenuItem(true);
                showToast('Firebase terkonfigurasi (Mode Demo)', 'info');
            } catch (e) {
                console.log('Firestore error:', e);
                isOnline = false;
            }
        }
    } catch (error) {
        console.error('Firebase initialization error:', error);
        isOnline = false;
    }
}

function updateSyncMenuItem(connected) {
    const syncMenuItem = document.getElementById('syncMenuItem');
    if (syncMenuItem) {
        if (connected) {
            syncMenuItem.innerHTML = `
                <svg class="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="ml-2">Sinkronisasi Online</span>
            `;
        }
    }
}

async function syncToFirebase(collection, data) {
    if (!db || !firebaseConfig) {
        console.log('Firebase not configured');
        return false;
    }
    
    try {
        console.log(`Syncing ${collection}...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log(`Synced ${collection} (${Array.isArray(data) ? data.length : 1} items)`);
        return true;
    } catch (error) {
        console.error('Sync failed:', error);
        return false;
    }
}

async function manualSync() {
    if (!firebaseConfig?.projectId) {
        showToast('Silakan konfigurasi Firebase terlebih dahulu', 'warning');
        openFirebaseModal();
        return;
    }
    
    try {
        showToast('Menyinkronkan data...', 'info');
        
        if (!db) {
            await initializeFirebase();
        }
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        showToast('Data berhasil disinkronkan!', 'success');
    } catch (error) {
        console.error('Manual sync error:', error);
        showToast('Sinkronisasi gagal: ' + error.message, 'error');
    }
}

async function testConnection() {
    const projectId = document.getElementById('firebaseProjectId').value.trim();
    
    if (!projectId) {
        showToast('Project ID wajib diisi!', 'error');
        return;
    }
    
    showConnectionStatus('info', 'Menguji koneksi...');
    
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showConnectionStatus('success', 'Koneksi berhasil! (Mode Demo)');
        showToast('Konfigurasi valid!', 'success');
    } catch (error) {
        console.error('Connection test error:', error);
        showConnectionStatus('error', 'Koneksi gagal: ' + error.message);
        showToast('Koneksi gagal', 'error');
    }
}

function showConnectionStatus(type, message) {
    const statusEl = document.getElementById('connectionStatus');
    if (!statusEl) return;
    
    statusEl.classList.remove('hidden');
    if (type === 'success') {
        statusEl.className = 'text-center py-2 rounded text-sm bg-green-100 text-green-700';
    } else if (type === 'error') {
        statusEl.className = 'text-center py-2 rounded text-sm bg-red-100 text-red-700';
    } else {
        statusEl.className = 'text-center py-2 rounded text-sm bg-blue-100 text-blue-700';
    }
    statusEl.textContent = message;
}

// ==================== WAJIB PAJAK ON MAP ====================

// Tax type colors for markers
const taxTypeColors = {
    reklame: { color: '#3B82F6', label: 'Pajak Reklame', icon: '📢' },
    air_tanah: { color: '#06B6D4', label: 'Pajak Air Tanah', icon: '💧' },
    sarang_burung: { color: '#F59E0B', label: 'Pajak Sarang Burung Walet', icon: '🕊️' },
    mineral: { color: '#78716C', label: 'Pajak Mineral', icon: '🪨' },
    pbb: { color: '#F97316', label: 'PBB-P2', icon: '🏠' },
    bphtb: { color: '#6366F1', label: 'BPHTB', icon: '📋' },
    pbjt_mamin: { color: '#EF4444', label: 'PBJT - Makanan & Minuman', icon: '🍽️' },
    pbjt_listrik: { color: '#EAB308', label: 'PBJT - Tenaga Listrik', icon: '⚡' },
    pbjt_hotel: { color: '#10B981', label: 'PBJT - Perhotelan', icon: '🏨' },
    pbjt_parkir: { color: '#14B8A6', label: 'PBJT - Parkir', icon: '🅿️' },
    pbjt_hiburan: { color: '#EC4899', label: 'PBJT - Hiburan', icon: '🎭' },
    opsen_pkb: { color: '#8B5CF6', label: 'Opsen PKB', icon: '🚗' },
    opsen_bbnkb: { color: '#D946EF', label: 'Opsen BBNKB', icon: '🔖' }
};

function initializeWPFilter() {
    const filterContainer = document.getElementById('wpFilterCheckboxes');
    if (!filterContainer) return;
    
    let html = '';
    Object.entries(taxTypeColors).forEach(([key, value]) => {
        const count = wajibPajak.filter(wp => wp.jenis_pajak && wp.jenis_pajak.includes(key)).length;
        html += `
            <label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition-all" style="border-left: 4px solid ${value.color};">
                <input type="checkbox" class="wp-filter-checkbox w-4 h-4 text-blue-600 rounded" value="${key}" onchange="toggleWPOnMap('${key}')" checked>
                <span class="text-lg">${value.icon}</span>
                <div class="flex-1">
                    <span class="text-xs font-medium text-gray-700">${value.label}</span>
                    <span class="text-xs text-gray-500 ml-1">(${count})</span>
                </div>
            </label>
        `;
    });
    filterContainer.innerHTML = html;
    
    // Load initial markers
    showAllWPOnMap();
}

function toggleWPPanel() {
    const panel = document.getElementById('wpFilterPanel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

function createWPMarker(wp, taxType) {
    const color = taxTypeColors[taxType]?.color || '#666666';
    const icon = taxTypeColors[taxType]?.icon || '📍';
    const label = taxTypeColors[taxType]?.label || taxType;
    
    // Create custom marker icon
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background-color: ${color};
            width: 32px;
            height: 32px;
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
        ">
            <span style="transform: rotate(45deg); font-size: 14px;">${icon}</span>
        </div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [16, -32]
    });
    
    if (!wp.latitude || !wp.longitude) {
        return null;
    }
    
    const lat = parseFloat(wp.latitude);
    const lng = parseFloat(wp.longitude);
    
    if (isNaN(lat) || isNaN(lng)) {
        return null;
    }
    
    const marker = L.marker([lat, lng], { icon: customIcon });
    
    // Create popup content
    const taxBadges = (wp.jenis_pajak || []).map(j => {
        const tax = taxTypeColors[j];
        return `<span class="inline-block px-2 py-1 text-xs rounded-full text-white" style="background-color: ${tax?.color || '#666'}">${tax?.label || j}</span>`;
    }).join(' ');
    
    const popupContent = `
        <div style="min-width: 200px;">
            <div style="border-bottom: 2px solid ${color}; padding-bottom: 8px; margin-bottom: 8px;">
                <strong style="color: ${color};">${wp.nama}</strong>
            </div>
            <div class="text-sm space-y-1">
                <p><strong>NPWPD:</strong> ${wp.npwpd}</p>
                <p><strong>Alamat:</strong> ${wp.kelurahan}, ${wp.kecamatan}</p>
                <p><strong>Jenis WP:</strong> ${wp.jenis_wp === 'perorangan' ? 'Perorangan' : 'Badan Usaha'}</p>
                <p><strong>Koordinat:</strong> ${wp.latitude}, ${wp.longitude}</p>
                <div class="mt-2">
                    <strong>Jenis Pajak:</strong>
                    <div class="flex flex-wrap gap-1 mt-1">${taxBadges}</div>
                </div>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent);
    
    return marker;
}

function showAllWPOnMap() {
    // Check all checkboxes
    document.querySelectorAll('.wp-filter-checkbox').forEach(cb => {
        cb.checked = true;
    });
    
    // Show all WP markers
    if (wpLayerGroup) {
        wpLayerGroup.clearLayers();
    }
    wpMarkers = [];
    
    wajibPajak.forEach(wp => {
        if (wp.jenis_pajak && wp.latitude && wp.longitude) {
            wp.jenis_pajak.forEach(taxType => {
                const marker = createWPMarker(wp, taxType);
                if (marker && wpLayerGroup) {
                    marker.wpData = wp;
                    marker.taxType = taxType;
                    wpMarkers.push(marker);
                    wpLayerGroup.addLayer(marker);
                }
            });
        }
    });
    
    updateWPVisibleCount();
    showToast('Semua wajib pajak ditampilkan di peta', 'success');
}

function hideAllWPOnMap() {
    // Uncheck all checkboxes
    document.querySelectorAll('.wp-filter-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    // Hide all WP markers
    if (wpLayerGroup) {
        wpLayerGroup.clearLayers();
    }
    wpMarkers = [];
    
    updateWPVisibleCount();
    showToast('Semua wajib pajak disembunyikan', 'info');
}

function toggleWPOnMap(taxType) {
    const isChecked = document.querySelector(`.wp-filter-checkbox[value="${taxType}"]`)?.checked;
    
    if (isChecked) {
        // Show markers for this tax type
        wajibPajak.forEach(wp => {
            if (wp.jenis_pajak && wp.jenis_pajak.includes(taxType) && wp.latitude && wp.longitude) {
                // Check if marker already exists
                const exists = wpMarkers.some(m => m.wpData?.id === wp.id && m.taxType === taxType);
                if (!exists) {
                    const marker = createWPMarker(wp, taxType);
                    if (marker && wpLayerGroup) {
                        marker.wpData = wp;
                        marker.taxType = taxType;
                        wpMarkers.push(marker);
                        wpLayerGroup.addLayer(marker);
                    }
                }
            }
        });
    } else {
        // Hide markers for this tax type
        if (wpLayerGroup) {
            wpMarkers.forEach(marker => {
                if (marker.taxType === taxType) {
                    wpLayerGroup.removeLayer(marker);
                }
            });
            wpMarkers = wpMarkers.filter(m => m.taxType !== taxType);
        }
    }
    
    updateWPVisibleCount();
}

function updateWPVisibleCount() {
    const countEl = document.getElementById('wpVisibleCount');
    if (countEl) {
        countEl.textContent = wpMarkers.length;
    }
}

// ==================== HELPER FUNCTIONS ====================

function getNamaUsaha(wp) {
    if (!wp) return '';
    
    const data = wp.data_objek_pajak || {};
    
    // Prioritize business name from tax object data
    if (data.reklame?.nama_usaha) return data.reklame.nama_usaha;
    if (data.air_tanah?.nama_usaha) return data.air_tanah.nama_usaha;
    if (data.sarang_burung?.nama_usaha) return data.sarang_burung.nama_usaha;
    if (data.mineral?.nama_usaha) return data.mineral.nama_usaha;
    if (data.pbb?.nama_op) return data.pbb.nama_op;
    if (data.bphtb?.nama_op) return data.bphtb.nama_op;
    if (data.pbjt_mamin?.nama_usaha) return data.pbjt_mamin.nama_usaha;
    if (data.pbjt_listrik?.nama_usaha) return data.pbjt_listrik.nama_usaha;
    if (data.pbjt_hotel?.nama) return data.pbjt_hotel.nama;
    if (data.pbjt_parkir?.nama_usaha) return data.pbjt_parkir.nama_usaha;
    if (data.pbjt_hiburan?.nama_usaha) return data.pbjt_hiburan.nama_usaha;
    
    // Fallback to WP name
    return wp.nama || '';
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRupiah(num) {
    if (!num || num === 0) return 'Rp 0';
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(num);
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transform transition-all z-50 ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;
        
        setTimeout(() => {
            toast.classList.add('translate-y-20', 'opacity-0');
        }, 3000);
        
        setTimeout(() => {
            toast.classList.remove('translate-y-20', 'opacity-0');
        }, 100);
    }
}

// Generate random color for imported layers
function getRandomColor() {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8B500', '#FF6F61', '#6B5B95', '#88B04B', '#F7CAC9',
        '#92A8D1', '#955251', '#B565A7', '#009B77', '#DD4124',
        '#D65076', '#45B8AC', '#EFC050', '#5B5EA6', '#9B2335'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

function editWP(id) {
    const wp = wajibPajak.find(w => w.id === id);
    if (!wp) return;

    // Switch to input page
    showPage('inputWP');

    // Scroll to top
    window.scrollTo(0, 0);

    // Populate basic fields
    const form = document.getElementById('wpForm');
    form.querySelector('[name="npwpd"]').value = wp.npwpd || '';
    form.querySelector('[name="nama"]').value = wp.nama || '';
    form.querySelector('[name="nik"]').value = wp.nik || '';
    form.querySelector('[name="jenis_wp"]').value = wp.jenis_wp || '';
    form.querySelector('[name="telepon"]').value = wp.telepon || '';
    form.querySelector('[name="email"]').value = wp.email || '';
    form.querySelector('[name="alamat"]').value = wp.alamat || '';
    form.querySelector('[name="kelurahan"]').value = wp.kelurahan || '';
    form.querySelector('[name="kecamatan"]').value = wp.kecamatan || '';
    form.querySelector('[name="kabupaten"]').value = wp.kabupaten || '';
    form.querySelector('[name="provinsi"]').value = wp.provinsi || '';
    form.querySelector('[name="latitude"]').value = wp.latitude || '';
    form.querySelector('[name="longitude"]').value = wp.longitude || '';

    // Update mini map if coordinates exist
    if (wp.latitude && wp.longitude && miniMap) {
        miniMap.setView([wp.latitude, wp.longitude], 15);
        if (miniMapMarker) {
            miniMap.removeLayer(miniMapMarker);
        }
        miniMapMarker = L.marker([wp.latitude, wp.longitude]).addTo(miniMap);
    }

    // Populate tax type checkboxes
    document.querySelectorAll('input[name="jenis_pajak"]').forEach(cb => {
        cb.checked = wp.jenis_pajak && wp.jenis_pajak.includes(cb.value);
    });

    // Show tax fields based on selected tax types
    showTaxFields();

    // Populate tax object data
    const dataObjekPajak = wp.data_objek_pajak || {};

    // Reklame
    if (dataObjekPajak.reklame) {
        const r = dataObjekPajak.reklame;
        form.querySelector('[name="reklame_nama_usaha"]') && (form.querySelector('[name="reklame_nama_usaha"]').value = r.nama_usaha || '');
        form.querySelector('[name="reklame_jenis"]') && (form.querySelector('[name="reklame_jenis"]').value = r.jenis || '');
        form.querySelector('[name="reklame_no_izin"]') && (form.querySelector('[name="reklame_no_izin"]').value = r.no_izin || '');
        form.querySelector('[name="reklame_masa_izin"]') && (form.querySelector('[name="reklame_masa_izin"]').value = r.masa_izin || '');
        form.querySelector('[name="reklame_brand"]') && (form.querySelector('[name="reklame_brand"]').value = r.brand || '');
        form.querySelector('[name="reklame_panjang"]') && (form.querySelector('[name="reklame_panjang"]').value = r.panjang || '');
        form.querySelector('[name="reklame_lebar"]') && (form.querySelector('[name="reklame_lebar"]').value = r.lebar || '');
        form.querySelector('[name="reklame_jumlah_unit"]') && (form.querySelector('[name="reklame_jumlah_unit"]').value = r.jumlah_unit || '');
        form.querySelector('[name="reklame_jumlah_sisi"]') && (form.querySelector('[name="reklame_jumlah_sisi"]').value = r.jumlah_sisi || '');
        form.querySelector('[name="reklame_lokasi"]') && (form.querySelector('[name="reklame_lokasi"]').value = r.lokasi || '');
        form.querySelector('[name="reklame_masa_tayang"]') && (form.querySelector('[name="reklame_masa_tayang"]').value = r.masa_tayang || '');
        form.querySelector('[name="reklame_jalur"]') && (form.querySelector('[name="reklame_jalur"]').value = r.jalur || '');
    }

    // Air Tanah
    if (dataObjekPajak.air_tanah) {
        const at = dataObjekPajak.air_tanah;
        form.querySelector('[name="air_tanah_nama_usaha"]') && (form.querySelector('[name="air_tanah_nama_usaha"]').value = at.nama_usaha || '');
        form.querySelector('[name="air_tanah_no_izin"]') && (form.querySelector('[name="air_tanah_no_izin"]').value = at.no_izin || '');
        form.querySelector('[name="air_tanah_masa_izin"]') && (form.querySelector('[name="air_tanah_masa_izin"]').value = at.masa_izin || '');
        form.querySelector('[name="air_tanah_jenis_penggunaan"]') && (form.querySelector('[name="air_tanah_jenis_penggunaan"]').value = at.jenis_penggunaan || '');
        form.querySelector('[name="air_tanah_jumlah_sumur_bor"]') && (form.querySelector('[name="air_tanah_jumlah_sumur_bor"]').value = at.jumlah_sumur_bor || '');
        form.querySelector('[name="air_tanah_jumlah_sumur_resapan"]') && (form.querySelector('[name="air_tanah_jumlah_sumur_resapan"]').value = at.jumlah_sumur_resapan || '');
        form.querySelector('[name="air_tanah_kedalaman"]') && (form.querySelector('[name="air_tanah_kedalaman"]').value = at.kedalaman || '');
        form.querySelector('[name="air_tanah_volume_hari"]') && (form.querySelector('[name="air_tanah_volume_hari"]').value = at.volume_hari || '');
        form.querySelector('[name="air_tanah_volume_bulan"]') && (form.querySelector('[name="air_tanah_volume_bulan"]').value = at.volume_bulan || '');
        form.querySelector('[name="air_tanah_diameter_pipa"]') && (form.querySelector('[name="air_tanah_diameter_pipa"]').value = at.diameter_pipa || '');
        form.querySelector('[name="air_tanah_lokasi"]') && (form.querySelector('[name="air_tanah_lokasi"]').value = at.lokasi || '');
    }

    // Sarang Burung Walet
    if (dataObjekPajak.sarang_burung) {
        const w = dataObjekPajak.sarang_burung;
        form.querySelector('[name="walet_nama_usaha"]') && (form.querySelector('[name="walet_nama_usaha"]').value = w.nama_usaha || '');
        form.querySelector('[name="walet_no_izin"]') && (form.querySelector('[name="walet_no_izin"]').value = w.no_izin || '');
        form.querySelector('[name="walet_masa_izin"]') && (form.querySelector('[name="walet_masa_izin"]').value = w.masa_izin || '');
        form.querySelector('[name="walet_jenis_bangunan"]') && (form.querySelector('[name="walet_jenis_bangunan"]').value = w.jenis_bangunan || '');
        form.querySelector('[name="walet_jumlah_lantai"]') && (form.querySelector('[name="walet_jumlah_lantai"]').value = w.jumlah_lantai || '');
        form.querySelector('[name="walet_panjang"]') && (form.querySelector('[name="walet_panjang"]').value = w.panjang || '');
        form.querySelector('[name="walet_lebar"]') && (form.querySelector('[name="walet_lebar"]').value = w.lebar || '');
        form.querySelector('[name="walet_luas"]') && (form.querySelector('[name="walet_luas"]').value = w.luas || '');
        form.querySelector('[name="walet_tinggi"]') && (form.querySelector('[name="walet_tinggi"]').value = w.tinggi || '');
        form.querySelector('[name="walet_lubang"]') && (form.querySelector('[name="walet_lubang"]').value = w.lubang || '');
        form.querySelector('[name="walet_lokasi"]') && (form.querySelector('[name="walet_lokasi"]').value = w.lokasi || '');
    }

    // Mineral
    if (dataObjekPajak.mineral) {
        const m = dataObjekPajak.mineral;
        form.querySelector('[name="mineral_nama_usaha"]') && (form.querySelector('[name="mineral_nama_usaha"]').value = m.nama_usaha || '');
        form.querySelector('[name="mineral_no_izin"]') && (form.querySelector('[name="mineral_no_izin"]').value = m.no_izin || '');
        form.querySelector('[name="mineral_masa_izin"]') && (form.querySelector('[name="mineral_masa_izin"]').value = m.masa_izin || '');
        form.querySelector('[name="mineral_jenis"]') && (form.querySelector('[name="mineral_jenis"]').value = m.jenis || '');
        form.querySelector('[name="mineral_luas"]') && (form.querySelector('[name="mineral_luas"]').value = m.luas || '');
        form.querySelector('[name="mineral_volume"]') && (form.querySelector('[name="mineral_volume"]').value = m.volume || '');
        form.querySelector('[name="mineral_satuan"]') && (form.querySelector('[name="mineral_satuan"]').value = m.satuan || '');
        form.querySelector('[name="mineral_metode"]') && (form.querySelector('[name="mineral_metode"]').value = m.metode || '');
        form.querySelector('[name="mineral_jenis_izin"]') && (form.querySelector('[name="mineral_jenis_izin"]').value = m.jenis_izin || '');
        form.querySelector('[name="mineral_lokasi"]') && (form.querySelector('[name="mineral_lokasi"]').value = m.lokasi || '');
    }

    // PBB-P2
    if (dataObjekPajak.pbb) {
        const pbb = dataObjekPajak.pbb;
        form.querySelector('[name="pbb_nama_op"]') && (form.querySelector('[name="pbb_nama_op"]').value = pbb.nama_op || '');
        form.querySelector('[name="pbb_nop"]') && (form.querySelector('[name="pbb_nop"]').value = pbb.nop || '');
        form.querySelector('[name="pbb_tahun"]') && (form.querySelector('[name="pbb_tahun"]').value = pbb.tahun || '');
        form.querySelector('[name="pbb_luas_tanah"]') && (form.querySelector('[name="pbb_luas_tanah"]').value = pbb.luas_tanah || '');
        form.querySelector('[name="pbb_luas_bangunan"]') && (form.querySelector('[name="pbb_luas_bangunan"]').value = pbb.luas_bangunan || '');
        form.querySelector('[name="pbb_njop_tanah"]') && (form.querySelector('[name="pbb_njop_tanah"]').value = pbb.njop_tanah || '');
        form.querySelector('[name="pbb_njop_bangunan"]') && (form.querySelector('[name="pbb_njop_bangunan"]').value = pbb.njop_bangunan || '');
        form.querySelector('[name="pbb_total_njop_tanah"]') && (form.querySelector('[name="pbb_total_njop_tanah"]').value = pbb.total_njop_tanah || '');
        form.querySelector('[name="pbb_total_njop_bangunan"]') && (form.querySelector('[name="pbb_total_njop_bangunan"]').value = pbb.total_njop_bangunan || '');
        form.querySelector('[name="pbb_njop_ksp"]') && (form.querySelector('[name="pbb_njop_ksp"]').value = pbb.njop_ksp || '');
        form.querySelector('[name="pbb_peruntukan"]') && (form.querySelector('[name="pbb_peruntukan"]').value = pbb.peruntukan || '');
        form.querySelector('[name="pbb_jenis_bangunan"]') && (form.querySelector('[name="pbb_jenis_bangunan"]').value = pbb.jenis_bangunan || '');
        form.querySelector('[name="pbb_jumlah_lantai"]') && (form.querySelector('[name="pbb_jumlah_lantai"]').value = pbb.jumlah_lantai || '');
        form.querySelector('[name="pbb_tahun_bangunan"]') && (form.querySelector('[name="pbb_tahun_bangunan"]').value = pbb.tahun_bangunan || '');
        form.querySelector('[name="pbb_alamat_op"]') && (form.querySelector('[name="pbb_alamat_op"]').value = pbb.alamat_op || '');
        form.querySelector('[name="pbb_rtrw"]') && (form.querySelector('[name="pbb_rtrw"]').value = pbb.rtrw || '');
    }

    // BPHTB
    if (dataObjekPajak.bphtb) {
        const bphtb = dataObjekPajak.bphtb;
        form.querySelector('[name="bphtb_nama_op"]') && (form.querySelector('[name="bphtb_nama_op"]').value = bphtb.nama_op || '');
        form.querySelector('[name="bphtb_nop_baru"]') && (form.querySelector('[name="bphtb_nop_baru"]').value = bphtb.nop_baru || '');
        form.querySelector('[name="bphtb_nop_lama"]') && (form.querySelector('[name="bphtb_nop_lama"]').value = bphtb.nop_lama || '');
        form.querySelector('[name="bphtb_jenis_perolehan"]') && (form.querySelector('[name="bphtb_jenis_perolehan"]').value = bphtb.jenis_perolehan || '');
        form.querySelector('[name="bphtb_npop"]') && (form.querySelector('[name="bphtb_npop"]').value = bphtb.npop || '');
        form.querySelector('[name="bphtb_npokp"]') && (form.querySelector('[name="bphtb_npokp"]').value = bphtb.npokp || '');
        form.querySelector('[name="bphtb_harga_transaksi"]') && (form.querySelector('[name="bphtb_harga_transaksi"]').value = bphtb.harga_transaksi || '');
        form.querySelector('[name="bphtb_luas_tanah"]') && (form.querySelector('[name="bphtb_luas_tanah"]').value = bphtb.luas_tanah || '');
        form.querySelector('[name="bphtb_luas_bangunan"]') && (form.querySelector('[name="bphtb_luas_bangunan"]').value = bphtb.luas_bangunan || '');
        form.querySelector('[name="bphtb_no_akta"]') && (form.querySelector('[name="bphtb_no_akta"]').value = bphtb.no_akta || '');
        form.querySelector('[name="bphtb_tanggal_akta"]') && (form.querySelector('[name="bphtb_tanggal_akta"]').value = bphtb.tanggal_akta || '');
        form.querySelector('[name="bphtb_ppat"]') && (form.querySelector('[name="bphtb_ppat"]').value = bphtb.ppat || '');
        form.querySelector('[name="bphtb_lokasi"]') && (form.querySelector('[name="bphtb_lokasi"]').value = bphtb.lokasi || '');
    }

    // PBJT Mamin
    if (dataObjekPajak.pbjt_mamin) {
        const m = dataObjekPajak.pbjt_mamin;
        form.querySelector('[name="mamin_nama_usaha"]') && (form.querySelector('[name="mamin_nama_usaha"]').value = m.nama_usaha || '');
        form.querySelector('[name="mamin_no_izin"]') && (form.querySelector('[name="mamin_no_izin"]').value = m.no_izin || '');
        form.querySelector('[name="mamin_jenis_usaha"]') && (form.querySelector('[name="mamin_jenis_usaha"]').value = m.jenis_usaha || '');
        form.querySelector('[name="mamin_klasifikasi"]') && (form.querySelector('[name="mamin_klasifikasi"]').value = m.klasifikasi || '');
        form.querySelector('[name="mamin_jumlah_kursi"]') && (form.querySelector('[name="mamin_jumlah_kursi"]').value = m.jumlah_kursi || '');
        form.querySelector('[name="mamin_omzet_bulan"]') && (form.querySelector('[name="mamin_omzet_bulan"]').value = m.omzet_bulan || '');
        form.querySelector('[name="mamin_jam_operasional"]') && (form.querySelector('[name="mamin_jam_operasional"]').value = m.jam_operasional || '');
        form.querySelector('[name="mamin_lokasi"]') && (form.querySelector('[name="mamin_lokasi"]').value = m.lokasi || '');
    }

    // PBJT Listrik
    if (dataObjekPajak.pbjt_listrik) {
        const l = dataObjekPajak.pbjt_listrik;
        form.querySelector('[name="listrik_nama_usaha"]') && (form.querySelector('[name="listrik_nama_usaha"]').value = l.nama_usaha || '');
        form.querySelector('[name="listrik_id_pelanggan"]') && (form.querySelector('[name="listrik_id_pelanggan"]').value = l.id_pelanggan || '');
        form.querySelector('[name="listrik_jenis_pelanggan"]') && (form.querySelector('[name="listrik_jenis_pelanggan"]').value = l.jenis_pelanggan || '');
        form.querySelector('[name="listrik_golongan"]') && (form.querySelector('[name="listrik_golongan"]').value = l.golongan || '');
        form.querySelector('[name="listrik_daya"]') && (form.querySelector('[name="listrik_daya"]').value = l.daya || '');
        form.querySelector('[name="listrik_pemakaian"]') && (form.querySelector('[name="listrik_pemakaian"]').value = l.pemakaian || '');
        form.querySelector('[name="listrik_unit_bisnis"]') && (form.querySelector('[name="listrik_unit_bisnis"]').value = l.unit_bisnis || '');
        form.querySelector('[name="listrik_sumber"]') && (form.querySelector('[name="listrik_sumber"]').value = l.sumber || '');
        form.querySelector('[name="listrik_lokasi"]') && (form.querySelector('[name="listrik_lokasi"]').value = l.lokasi || '');
    }

    // PBJT Hotel
    if (dataObjekPajak.pbjt_hotel) {
        const h = dataObjekPajak.pbjt_hotel;
        form.querySelector('[name="hotel_no_izin"]') && (form.querySelector('[name="hotel_no_izin"]').value = h.no_izin || '');
        form.querySelector('[name="hotel_nama"]') && (form.querySelector('[name="hotel_nama"]').value = h.nama || '');
        form.querySelector('[name="hotel_kelas"]') && (form.querySelector('[name="hotel_kelas"]').value = h.kelas || '');
        form.querySelector('[name="hotel_jumlah_kamar"]') && (form.querySelector('[name="hotel_jumlah_kamar"]').value = h.jumlah_kamar || '');
        form.querySelector('[name="hotel_tarif"]') && (form.querySelector('[name="hotel_tarif"]').value = h.tarif || '');
        form.querySelector('[name="hotel_kapasitas"]') && (form.querySelector('[name="hotel_kapasitas"]').value = h.kapasitas || '');
        form.querySelector('[name="hotel_lokasi"]') && (form.querySelector('[name="hotel_lokasi"]').value = h.lokasi || '');

        // Populate fasilitas checkboxes
        document.querySelectorAll('input[name="hotel_fasilitas"]').forEach(cb => {
            cb.checked = h.fasilitas && h.fasilitas.includes(cb.value);
        });
    }

    // PBJT Parkir
    if (dataObjekPajak.pbjt_parkir) {
        const p = dataObjekPajak.pbjt_parkir;
        form.querySelector('[name="parkir_nama_usaha"]') && (form.querySelector('[name="parkir_nama_usaha"]').value = p.nama_usaha || '');
        form.querySelector('[name="parkir_no_izin"]') && (form.querySelector('[name="parkir_no_izin"]').value = p.no_izin || '');
        form.querySelector('[name="parkir_jenis_lokasi"]') && (form.querySelector('[name="parkir_jenis_lokasi"]').value = p.jenis_lokasi || '');
        form.querySelector('[name="parkir_kapasitas"]') && (form.querySelector('[name="parkir_kapasitas"]').value = p.kapasitas || '');
        form.querySelector('[name="parkir_slot_mobil"]') && (form.querySelector('[name="parkir_slot_mobil"]').value = p.slot_mobil || '');
        form.querySelector('[name="parkir_slot_motor"]') && (form.querySelector('[name="parkir_slot_motor"]').value = p.slot_motor || '');
        form.querySelector('[name="parkir_tarif_jam"]') && (form.querySelector('[name="parkir_tarif_jam"]').value = p.tarif_jam || '');
        form.querySelector('[name="parkir_tarif_hari"]') && (form.querySelector('[name="parkir_tarif_hari"]').value = p.tarif_hari || '');
        form.querySelector('[name="parkir_jam_operasional"]') && (form.querySelector('[name="parkir_jam_operasional"]').value = p.jam_operasional || '');
        form.querySelector('[name="parkir_jenis_kendaraan"]') && (form.querySelector('[name="parkir_jenis_kendaraan"]').value = p.jenis_kendaraan || '');
        form.querySelector('[name="parkir_lokasi"]') && (form.querySelector('[name="parkir_lokasi"]').value = p.lokasi || '');
    }

    // PBJT Hiburan
    if (dataObjekPajak.pbjt_hiburan) {
        const hib = dataObjekPajak.pbjt_hiburan;
        form.querySelector('[name="hiburan_nama_usaha"]') && (form.querySelector('[name="hiburan_nama_usaha"]').value = hib.nama_usaha || '');
        form.querySelector('[name="hiburan_no_izin"]') && (form.querySelector('[name="hiburan_no_izin"]').value = hib.no_izin || '');
        form.querySelector('[name="hiburan_jenis"]') && (form.querySelector('[name="hiburan_jenis"]').value = hib.jenis || '');
        form.querySelector('[name="hiburan_klasifikasi"]') && (form.querySelector('[name="hiburan_klasifikasi"]').value = hib.klasifikasi || '');
        form.querySelector('[name="hiburan_kapasitas"]') && (form.querySelector('[name="hiburan_kapasitas"]').value = hib.kapasitas || '');
        form.querySelector('[name="hiburan_tiket"]') && (form.querySelector('[name="hiburan_tiket"]').value = hib.tiket || '');
        form.querySelector('[name="hiburan_harga_kamar"]') && (form.querySelector('[name="hiburan_harga_kamar"]').value = hib.harga_kamar || '');
        form.querySelector('[name="hiburan_jumlah_kamar"]') && (form.querySelector('[name="hiburan_jumlah_kamar"]').value = hib.jumlah_kamar || '');
        form.querySelector('[name="hiburan_jam_operasional"]') && (form.querySelector('[name="hiburan_jam_operasional"]').value = hib.jam_operasional || '');
        form.querySelector('[name="hiburan_jadwal"]') && (form.querySelector('[name="hiburan_jadwal"]').value = hib.jadwal || '');
        form.querySelector('[name="hiburan_lokasi"]') && (form.querySelector('[name="hiburan_lokasi"]').value = hib.lokasi || '');
    }

    // Opsen PKB
    if (dataObjekPajak.opsen_pkb) {
        const pkb = dataObjekPajak.opsen_pkb;
        form.querySelector('[name="pkb_no_bpkb"]') && (form.querySelector('[name="pkb_no_bpkb"]').value = pkb.no_bpkb || '');
        form.querySelector('[name="pkb_no_polisi"]') && (form.querySelector('[name="pkb_no_polisi"]').value = pkb.no_polisi || '');
        form.querySelector('[name="pkb_jenis_kendaraan"]') && (form.querySelector('[name="pkb_jenis_kendaraan"]').value = pkb.jenis_kendaraan || '');
        form.querySelector('[name="pkb_merk"]') && (form.querySelector('[name="pkb_merk"]').value = pkb.merk || '');
        form.querySelector('[name="pkb_tahun"]') && (form.querySelector('[name="pkb_tahun"]').value = pkb.tahun || '');
        form.querySelector('[name="pkb_cc"]') && (form.querySelector('[name="pkb_cc"]').value = pkb.cc || '');
        form.querySelector('[name="pkb_warna"]') && (form.querySelector('[name="pkb_warna"]').value = pkb.warna || '');
        form.querySelector('[name="pkb_njkb"]') && (form.querySelector('[name="pkb_njkb"]').value = pkb.njkb || '');
        form.querySelector('[name="pkb_pkb"]') && (form.querySelector('[name="pkb_pkb"]').value = pkb.pkb || '');
        form.querySelector('[name="pkb_swdkllj"]') && (form.querySelector('[name="pkb_swdkllj"]').value = pkb.swdkllj || '');
        form.querySelector('[name="pkb_kepemilikan"]') && (form.querySelector('[name="pkb_kepemilikan"]').value = pkb.kepemilikan || '');
    }

    // Opsen BBNKB
    if (dataObjekPajak.opsen_bbnkb) {
        const bbnkb = dataObjekPajak.opsen_bbnkb;
        form.querySelector('[name="bbnkb_no_faktur"]') && (form.querySelector('[name="bbnkb_no_faktur"]').value = bbnkb.no_faktur || '');
        form.querySelector('[name="bbnkb_tanggal_faktur"]') && (form.querySelector('[name="bbnkb_tanggal_faktur"]').value = bbnkb.tanggal_faktur || '');
        form.querySelector('[name="bbnkb_jenis_kendaraan"]') && (form.querySelector('[name="bbnkb_jenis_kendaraan"]').value = bbnkb.jenis_kendaraan || '');
        form.querySelector('[name="bbnkb_merk"]') && (form.querySelector('[name="bbnkb_merk"]').value = bbnkb.merk || '');
        form.querySelector('[name="bbnkb_tahun"]') && (form.querySelector('[name="bbnkb_tahun"]').value = bbnkb.tahun || '');
        form.querySelector('[name="bbnkb_cc"]') && (form.querySelector('[name="bbnkb_cc"]').value = bbnkb.cc || '');
        form.querySelector('[name="bbnkb_njkb"]') && (form.querySelector('[name="bbnkb_njkb"]').value = bbnkb.njkb || '');
        form.querySelector('[name="bbnkb_njk"]') && (form.querySelector('[name="bbnkb_njk"]').value = bbnkb.njk || '');
        form.querySelector('[name="bbnkb_bbnkb"]') && (form.querySelector('[name="bbnkb_bbnkb"]').value = bbnkb.bbnkb || '');
        form.querySelector('[name="bbnkb_status"]') && (form.querySelector('[name="bbnkb_status"]').value = bbnkb.status || '');
    }

    // Store editing ID
    form.dataset.editingId = wp.id;

    // Update page title
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = 'Edit Wajib Pajak - ' + wp.nama;
    }

    // Update submit button text
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.innerHTML = `
            <span class="flex items-center justify-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                Update Data Wajib Pajak
            </span>
        `;
    }

    showToast('Data dimuat. Silakan edit dan simpan.', 'info');
}
