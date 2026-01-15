// Realisasi Pajak Functions
// Sistem Informasi Wajib Pajak Daerah - PEMDA SIDRAP

// ==================== REALISASI PAJAK ====================

console.log('=== REALISASI.JS LOADED ===');

function openRealisasiModal(id = null) {
    console.log('=== OPEN REALISASI MODAL ===');
    console.log('ID:', id);
    
    const modal = document.getElementById('realisasiModal');
    const form = document.getElementById('realisasiForm');
    
    if (!modal) {
        console.error('Modal realisasiModal tidak ditemukan!');
        return;
    }
    
    if (!form) {
        console.error('Form realisasiForm tidak ditemukan!');
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
        console.log('Loading realisasi data for edit, ID:', id);
        const realisasi = realisasiPajak.find(r => r.id === id);
        if (realisasi) {
            console.log('Found realisasi data:', realisasi);
            document.getElementById('realisasiModalTitle').textContent = 'Edit Realisasi Pajak';
            document.getElementById('realisasiId').value = realisasi.id;
            document.getElementById('realisasiNpwpd').value = realisasi.npwpd || '';
            document.getElementById('realisasiNamaWP').value = realisasi.nama_wp || '';
            document.getElementById('realisasiJenisPajak').value = realisasi.jenis_pajak || '';
            document.getElementById('realisasiTahun').value = realisasi.tahun || new Date().getFullYear();
            document.getElementById('realisasiPeriode').value = realisasi.periode || '';
            document.getElementById('realisasiNoBukti').value = realisasi.no_bukti || '';
            document.getElementById('realisasiTanggalSetor').value = realisasi.tanggal_setor || '';
            document.getElementById('realisasiTotal').value = realisasi.total || '';
            document.getElementById('realisasiMetode').value = realisasi.metode_pembayaran || '';
            document.getElementById('realisasiStatus').value = realisasi.status || 'lunas';
        } else {
            console.warn('Realisasi dengan ID', id, 'tidak ditemukan');
        }
    }
    
    console.log('=== END OPEN REALISASI MODAL ===');
}

function closeRealisasiModal() {
    const modal = document.getElementById('realisasiModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function populateNpwpdDropdown() {
    console.log('=== POPULATE NPWPD DROPDOWN ===');
    console.log('Total wajib pajak:', wajibPajak.length);
    
    const select = document.getElementById('realisasiNpwpd');
    if (!select) {
        console.error('Element realisasiNpwpd tidak ditemukan!');
        return;
    }
    
    select.innerHTML = '<option value="">Pilih Wajib Pajak</option>';
    wajibPajak.forEach(wp => {
        const namaUsaha = getNamaUsaha(wp);
        const option = document.createElement('option');
        option.value = wp.npwpd || '';
        option.dataset.nama = namaUsaha || wp.nama || '';
        option.textContent = `${wp.npwpd || ''} - ${namaUsaha || wp.nama || ''}`;
        select.appendChild(option);
    });
    
    console.log('Dropdown NPWPD populated with', wajibPajak.length, 'options');
    console.log('=== END POPULATE NPWPD DROPDOWN ===');
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
    
    const idEl = document.getElementById('realisasiId');
    const npwpdEl = document.getElementById('realisasiNpwpd');
    const namaWPEl = document.getElementById('realisasiNamaWP');
    const jenisPajakEl = document.getElementById('realisasiJenisPajak');
    const tahunEl = document.getElementById('realisasiTahun');
    const periodeEl = document.getElementById('realisasiPeriode');
    const noBuktiEl = document.getElementById('realisasiNoBukti');
    const tanggalSetorEl = document.getElementById('realisasiTanggalSetor');
    const totalEl = document.getElementById('realisasiTotal');
    const metodeEl = document.getElementById('realisasiMetode');
    const statusEl = document.getElementById('realisasiStatus');
    
    // Cek semua elemen form
    if (!npwpdEl || !namaWPEl || !jenisPajakEl || !tahunEl || !periodeEl || !noBuktiEl || !tanggalSetorEl || !totalEl || !metodeEl || !statusEl) {
        console.error('Salah satu elemen form tidak ditemukan!');
        console.log('npwpdEl:', !!npwpdEl);
        console.log('namaWPEl:', !!namaWPEl);
        console.log('jenisPajakEl:', !!jenisPajakEl);
        console.log('tahunEl:', !!tahunEl);
        console.log('periodeEl:', !!periodeEl);
        console.log('noBuktiEl:', !!noBuktiEl);
        console.log('tanggalSetorEl:', !!tanggalSetorEl);
        console.log('totalEl:', !!totalEl);
        console.log('statusEl:', !!statusEl);
        showToast('Terjadi kesalahan pada form!', 'error');
        return;
    }
    
    const id = idEl ? idEl.value : null;
    const npwpd = npwpdEl.value;
    const namaWP = namaWPEl.value;
    const jenisPajak = jenisPajakEl.value;
    const tahun = tahunEl.value;
    const periode = periodeEl.value;
    const noBukti = noBuktiEl.value;
    const tanggalSetor = tanggalSetorEl.value;
    const total = totalEl.value;
    const status = statusEl.value;
    
    console.log('Form values:');
    console.log('  id:', id);
    console.log('  npwpd:', npwpd);
    console.log('  namaWP:', namaWP);
    console.log('  jenisPajak:', jenisPajak);
    console.log('  tahun:', tahun);
    console.log('  periode:', periode);
    console.log('  noBukti:', noBukti);
    console.log('  tanggalSetor:', tanggalSetor);
    console.log('  total:', total);
    console.log('  metodePembayaran:', metodeEl ? metodeEl.value : 'N/A');
    console.log('  status:', status);
    
    const metodePembayaran = metodeEl ? metodeEl.value : '';
    
    // Validasi
    if (!npwpd || !jenisPajak || !noBukti || !total || !metodePembayaran) {
        console.error('Data tidak lengkap!');
        console.log('Missing fields:', {
            npwpd: !!npwpd,
            jenisPajak: !!jenisPajak,
            noBukti: !!noBukti,
            total: !!total,
            metodePembayaran: !!metodePembayaran
        });
        showToast('Mohon lengkapi semua field yang wajib diisi!', 'error');
        return;
    }
    
    const data = {
        id: id ? parseInt(id) : Date.now(),
        npwpd: npwpd,
        nama_wp: namaWP,
        jenis_pajak: jenisPajak,
        tahun: parseInt(tahun),
        periode: periode,
        no_bukti: noBukti,
        tanggal_setor: tanggalSetor,
        total: parseFloat(total) || 0,
        metode_pembayaran: metodePembayaran,
        status: status,
        created_by: currentUser?.username || 'system',
        created_at: new Date().toISOString()
    };
    
    console.log('Data yang akan disimpan:', JSON.stringify(data, null, 2));
    
    if (id) {
        // Update existing
        console.log('Updating existing realisasi, ID:', id);
        const index = realisasiPajak.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
            realisasiPajak[index] = { 
                ...realisasiPajak[index], 
                ...data, 
                updated_at: new Date().toISOString() 
            };
            console.log('✓ Mengupdate realisasi di index:', index);
        } else {
            console.warn('Realisasi dengan ID', id, 'tidak ditemukan untuk update');
        }
    } else {
        // Add new
        console.log('Adding new realisasi');
        realisasiPajak.push(data);
        console.log('✓ Menambahkan realisasi baru. Total sekarang:', realisasiPajak.length);
    }
    
    // Save to localStorage
    console.log('Menyimpan ke localStorage...');
    const saved = saveToLocalStorage('realisasiPajak', realisasiPajak);
    console.log('Hasil saveToLocalStorage:', saved);
    
    // Reload from localStorage untuk verifikasi
    console.log('Membaca ulang dari localStorage untuk verifikasi...');
    const reloaded = loadFromLocalStorage('realisasiPajak', []);
    console.log('Hasil reload dari localStorage:', reloaded.length, 'items');
    realisasiPajak = reloaded;
    
    // Update UI
    console.log('Updating UI...');
    updateDashboard();
    updateRealisasiSummary();
    updateRealisasiTable();
    
    closeRealisasiModal();
    showToast('Realisasi pajak berhasil disimpan!', 'success');
    console.log('=== END HANDLE REALISASI SUBMIT ===');
}

function updateRealisasiSummary() {
    console.log('=== UPDATE REALISASI SUMMARY ===');
    
    const tahunBaru = new Date().getFullYear();
    console.log('Tahun yang difilter:', tahunBaru);
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
    
    // Update elements
    const targetTahunEl = document.getElementById('targetTahun');
    if (targetTahunEl) {
        targetTahunEl.textContent = formatRupiah(targetTotal);
    }
    
    const realisasiBulanEl = document.getElementById('realisasiBulan');
    if (realisasiBulanEl) {
        realisasiBulanEl.textContent = formatRupiah(realisasiTahun);
    }
    
    const realisasiTahunEl = document.getElementById('realisasiTahun');
    if (realisasiTahunEl) {
        realisasiTahunEl.textContent = formatRupiah(realisasiTahun);
    }
    
    const persentaseEl = document.getElementById('persentase');
    if (persentaseEl) {
        persentaseEl.textContent = persentase + '%';
    }
    
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
    
    // Filter data berdasarkan tahun
    let filtered = realisasiPajak.filter(r => {
        const tahunRealisasi = typeof r.tahun === 'string' ? parseInt(r.tahun) : r.tahun;
        return tahunRealisasi === tahunBaru;
    });
    
    // Sort by tanggal setor (terbaru dulu)
    filtered.sort((a, b) => {
        const dateA = new Date(a.tanggal_setor || 0);
        const dateB = new Date(b.tanggal_setor || 0);
        return dateB - dateA;
    });
    
    console.log('Filtered realisasi:', filtered.length, 'items');
    
    const tableBody = document.getElementById('realisasiTableBody');
    if (!tableBody) {
        console.error('Element realisasiTableBody tidak ditemukan!');
        return;
    }
    
    if (filtered.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="px-4 py-8 text-center text-gray-500">Tidak ada data realisasi. Klik tombol "Input Realisasi" untuk menambah data.</td></tr>';
        console.log('Tidak ada data realisasi untuk ditampilkan');
    } else {
        const html = filtered.map((r, i) => {
            const statusClass = r.status === 'lunas' ? 'bg-green-100 text-green-700' : 
                               r.status === 'belum_lunas' ? 'bg-red-100 text-red-700' : 
                               'bg-yellow-100 text-yellow-700';
            const statusText = r.status === 'lunas' ? 'Lunas' : 
                              r.status === 'belum_lunas' ? 'Belum Lunas' : 
                              r.status === 'cicil' ? 'Cicilan' : r.status;
            
            const namaWP = r.nama_wp || '-';
            const npwpd = r.npwpd || '-';
            const jenisPajak = taxTypes[r.jenis_pajak] || r.jenis_pajak || '-';
            const periodeText = capitalizeFirst(r.periode || '');
            const tahunText = r.tahun || '';
            
            return `
                <tr class="border-b hover:bg-gray-50">
                    <td class="px-4 py-3">${i + 1}</td>
                    <td class="px-4 py-3 font-medium">${npwpd}</td>
                    <td class="px-4 py-3">${namaWP}</td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">${jenisPajak}</span>
                    </td>
                    <td class="px-4 py-3">${periodeText} ${tahunText}</td>
                    <td class="px-4 py-3 text-right font-semibold">${formatRupiah(r.total || 0)}</td>
                    <td class="px-4 py-3">
                        ${getMetodePembayaranBadge(r.metode_pembayaran)}
                    </td>
                    <td class="px-4 py-3">
                        <span class="px-2 py-1 rounded text-xs ${statusClass}">${statusText}</span>
                    </td>
                    <td class="px-4 py-3 text-center">
                        <button onclick="openRealisasiModal(${r.id})" class="px-2 py-1 bg-yellow-500 hover:bg-yellow-600 text-white text-xs rounded mr-1">Edit</button>
                        <button onclick="deleteRealisasi(${r.id})" class="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded">Hapus</button>
                    </td>
                </tr>
            `;
        }).join('');
        
        tableBody.innerHTML = html;
        console.log('Table updated with', filtered.length, 'rows');
    }
    
    // Update summary table
    updateSummaryRealisasiTable(tahunBaru);
    
    console.log('=== END UPDATE REALISASI TABLE ===');
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

function getMetodePembayaranBadge(metode) {
    const metodePembayaran = {
        'tunai': { icon: '💵', label: 'Tunai', class: 'bg-green-100 text-green-700' },
        'teller': { icon: '🏦', label: 'Teller Bank', class: 'bg-blue-100 text-blue-700' },
        'transfer': { icon: '📱', label: 'Transfer Bank', class: 'bg-blue-100 text-blue-700' },
        'atm': { icon: '🏧', label: 'ATM', class: 'bg-purple-100 text-purple-700' },
        'mbanking': { icon: '📲', label: 'Mobile Banking', class: 'bg-purple-100 text-purple-700' },
        'ibanking': { icon: '💻', label: 'Internet Banking', class: 'bg-purple-100 text-purple-700' },
        'qris': { icon: '📷', label: 'QRIS', class: 'bg-pink-100 text-pink-700' },
        'gopay': { icon: '🟢', label: 'GoPay', class: 'bg-green-100 text-green-700' },
        'ovo': { icon: '🔵', label: 'OVO', class: 'bg-blue-100 text-blue-700' },
        'dana': { icon: '🟣', label: 'Dana', class: 'bg-purple-100 text-purple-700' },
        'linkaja': { icon: '🔴', label: 'LinkAja', class: 'bg-red-100 text-red-700' },
        'shopeepay': { icon: '🟠', label: 'ShopeePay', class: 'bg-orange-100 text-orange-700' },
        'check_giro': { icon: '📄', label: 'Check/Giro', class: 'bg-gray-100 text-gray-700' },
        'virtual_account': { icon: '🎫', label: 'Virtual Account', class: 'bg-indigo-100 text-indigo-700' },
        'potongan_rekening': { icon: '📉', label: 'Potongan Rekening', class: 'bg-yellow-100 text-yellow-700' },
        'lainnya': { icon: '📦', label: 'Lainnya', class: 'bg-gray-100 text-gray-700' }
    };
    
    const m = metodePembayaran[metode] || metodePembayaran['lainnya'];
    return `<span class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${m.class}">${m.icon} ${m.label}</span>`;
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
    if (dashboardTargetEl) {
        dashboardTargetEl.textContent = formatRupiah(targetTotal);
    }
    
    const dashboardRealisasiEl = document.getElementById('dashboardRealisasi');
    if (dashboardRealisasiEl) {
        dashboardRealisasiEl.textContent = formatRupiah(realisasiTahun);
    }
    
    const dashboardSisaEl = document.getElementById('dashboardSisa');
    if (dashboardSisaEl) {
        dashboardSisaEl.textContent = formatRupiah(sisa);
    }
    
    const dashboardPersentaseEl = document.getElementById('dashboardPersentase');
    if (dashboardPersentaseEl) {
        dashboardPersentaseEl.textContent = persentase + '%';
    }
    
    const dashboardProgressEl = document.getElementById('dashboardProgress');
    if (dashboardProgressEl) {
        dashboardProgressEl.style.width = Math.min(persentase, 100) + '%';
    }
    
    console.log('=== END UPDATE DASHBOARD REALISASI ===');
}

console.log('=== REALISASI.JS READY ===');

// Setup event listeners saat DOM ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Setting up realisasi event listeners...');
    
    // Event listener untuk form realisasi
    const realisasiFormEl = document.getElementById('realisasiForm');
    if (realisasiFormEl) {
        realisasiFormEl.addEventListener('submit', handleRealisasiSubmit);
        console.log('✓ Event listener realisasiForm ditambahkan');
    } else {
        console.error('Element realisasiForm tidak ditemukan');
    }
    
    // Event listener untuk dropdown NPWPD
    const realisasiNpwpdEl = document.getElementById('realisasiNpwpd');
    if (realisasiNpwpdEl) {
        realisasiNpwpdEl.addEventListener('change', autoFillWP);
        console.log('✓ Event listener realisasiNpwpd ditambahkan');
    } else {
        console.error('Element realisasiNpwpd tidak ditemukan');
    }
    
    console.log('Realisasi event listeners setup complete');
});
