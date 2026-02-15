document.addEventListener('DOMContentLoaded', function() {
    // ============ COURSE EDIT/DELETE MODALS ============
    // Edit modal logic
    const editModal = document.getElementById('editCourseModal');
    const editForm = document.getElementById('editCourseForm');
    const closeEditBtn = document.getElementById('closeEditModal');
    document.querySelectorAll('.edit-course-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('editCourseId').value = btn.dataset.id;
            document.getElementById('editCourseCode').value = btn.dataset.code;
            document.getElementById('editCourseName').value = btn.dataset.name;
            document.getElementById('editCourseActive').value = btn.dataset.active === 'True' ? 'true' : 'false';
            editModal.style.display = 'flex';
        });
    });
    if (closeEditBtn) closeEditBtn.onclick = () => { editModal.style.display = 'none'; };
    if (editModal) editModal.onclick = e => { if (e.target === editModal) editModal.style.display = 'none'; };

    // Delete modal logic
    const deleteModal = document.getElementById('deleteCourseModal');
    const deleteForm = document.getElementById('deleteCourseForm');
    const closeDeleteBtn = document.getElementById('closeDeleteModal');
    document.querySelectorAll('.delete-course-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            document.getElementById('deleteCourseId').value = btn.dataset.id;
            deleteModal.style.display = 'flex';
        });
    });
    if (closeDeleteBtn) closeDeleteBtn.onclick = () => { deleteModal.style.display = 'none'; };
    if (deleteModal) deleteModal.onclick = e => { if (e.target === deleteModal) deleteModal.style.display = 'none'; };

    // AJAX for edit
    if (editForm) {
        editForm.onsubmit = function(e) {
            e.preventDefault();
            const id = document.getElementById('editCourseId').value;
            const code = document.getElementById('editCourseCode').value;
            const name = document.getElementById('editCourseName').value;
            const is_active = document.getElementById('editCourseActive').value === 'true';
            fetch(`/masters/courses/${id}/edit/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ course_code: code, course_name: name, is_active: is_active })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    // Show notification after reload
                    localStorage.setItem('course_notify', 'Course updated successfully.');
                    window.location.reload();
                } else {
                    alert(data.error || 'Failed to update course.');
                }
            });
        };
    }
    // AJAX for delete
    if (deleteForm) {
        deleteForm.onsubmit = function(e) {
            e.preventDefault();
            const id = document.getElementById('deleteCourseId').value;
            fetch(`/masters/courses/${id}/delete/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    localStorage.setItem('course_notify', 'Course deleted successfully.');
                    window.location.reload();
                } else {
                    alert(data.error || 'Failed to delete course.');
                }
                // Show notification if present in localStorage
                const msg = localStorage.getItem('course_notify');
                if (msg) {
                    let popup = document.createElement('div');
                    popup.className = 'popup-message popup-success';
                    popup.innerText = msg;
                    popup.style.position = 'fixed';
                    popup.style.top = '30px';
                    popup.style.left = '50%';
                    popup.style.transform = 'translateX(-50%)';
                    popup.style.zIndex = 99999;
                    popup.style.background = '#38a169';
                    popup.style.color = '#fff';
                    popup.style.padding = '16px 32px';
                    popup.style.borderRadius = '8px';
                    popup.style.fontSize = '1.1rem';
                    popup.style.boxShadow = '0 2px 12px rgba(30,58,95,0.18)';
                    document.body.appendChild(popup);
                    setTimeout(() => { popup.remove(); }, 2500);
                    localStorage.removeItem('course_notify');
                }
            });
        };
    }

    // ============ PIE CHART FOR DASHBOARD ============
    const pie = document.getElementById('userPieChart');
    if (pie) {
        const adminCount = Number(pie.getAttribute('data-admin'));
        const facultyCount = Number(pie.getAttribute('data-faculty'));
        const studentCount = Number(pie.getAttribute('data-student'));
        const total = adminCount + facultyCount + studentCount;
        const data = [adminCount, facultyCount, studentCount];
        const labels = [
            `Admin (${adminCount})`,
            `Faculty (${facultyCount})`,
            `Students (${studentCount})`
        ];
        const ctx = pie.getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#2563eb', // Vivid blue
                        '#10b981', // Vivid green
                        '#f59e42'  // Vivid orange
                    ],
                    borderColor: [
                        'rgba(0,0,0,0)',
                        'rgba(0,0,0,0)',
                        'rgba(0,0,0,0)'
                    ],
                    borderWidth: 0,
                    hoverOffset: 14,
                    borderRadius: 0 // sharp edges
                }]
            },
            options: {
                responsive: true,
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 900,
                    easing: 'easeOutCubic'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            font: { size: 16, family: 'Poppins, Arial' },
                            color: '#1E3A5F',
                            padding: 18,
                            boxWidth: 22,
                            usePointStyle: true,
                            pointStyle: 'rect'
                        }
                    },
                    tooltip: {
                        backgroundColor: '#fff',
                        titleColor: '#1E3A5F',
                        bodyColor: '#1E3A5F',
                        borderColor: '#2563eb',
                        borderWidth: 1,
                        padding: 14,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed;
                                const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${value} (${percent}%)`;
                            }
                        }
                    }
                },
                layout: {
                    padding: 10
                },
                hover: {
                    mode: 'nearest',
                    intersect: true,
                    animationDuration: 400
                }
            },
            plugins: [
                {
                    id: 'piePercentLabels',
                    afterDraw(chart) {
                        const {ctx, chartArea, data} = chart;
                        if (!chartArea) return;
                        chart.getDatasetMeta(0).data.forEach((arc, i) => {
                            const value = data.datasets[0].data[i];
                            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                            const model = arc;
                            const angle = (model.startAngle + model.endAngle) / 2;
                            // For small values, move label closer to center
                            let radius = model.outerRadius - 38;
                            if (percent < 10) radius = model.outerRadius - 60;
                            const x = model.x + Math.cos(angle) * radius;
                            const y = model.y + Math.sin(angle) * radius;
                            ctx.save();
                            ctx.font = 'bold 15px Poppins, Arial';
                            ctx.fillStyle = '#1E3A5F';
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillText(percent + '%', x, y);
                            ctx.restore();
                        });
                    }
                }
            ]
        });
    }
});
// ============ STUDENT PAGE EXPORT/PRINT ============
// ============ STUDENT PAGE EXPORT/PRINT ============
function getVisibleStudentRows() {
    return Array.from(document.querySelectorAll('#student-list tr')).filter(row => {
        // Only count rows with at least 6 cells and not the empty row
        return row.style.display !== 'none' && row.querySelectorAll('td').length >= 6 && !row.querySelector('td[colspan]');
    });
}
function printStudentTable() {
    const table = document.getElementById('student-table');
    if (!table) return;
    const visibleRows = getVisibleStudentRows();
    if (!visibleRows.length) return alert('No data to print.');
    const cloneTable = table.cloneNode(true);
    // Remove last column (actions) from header
    const headerRow = cloneTable.querySelector('thead tr');
    if (headerRow && headerRow.children.length > 6) headerRow.removeChild(headerRow.lastElementChild);
    // Remove all rows from tbody
    const tbody = cloneTable.querySelector('tbody');
    tbody.innerHTML = '';
    visibleRows.forEach(row => {
        const cloneRow = row.cloneNode(true);
        if (cloneRow.children.length > 6) cloneRow.removeChild(cloneRow.lastElementChild);
        tbody.appendChild(cloneRow);
    });
    const newWindow = window.open('', '_blank');
    if (!newWindow) return alert('Popup blocked!');
    newWindow.document.write(`
        <html><head><title>Print Student Data</title>
        <style>
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #1E3A5F; color: white; }
        </style></head><body>
        <h2>Student Data</h2>
        ${cloneTable.outerHTML}
        </body></html>
    `);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
}
function downloadStudentCSV() {
    const table = document.getElementById('student-table');
    if (!table) return;
    const rows = getVisibleStudentRows();
    if (!rows.length) return alert('No data to download.');
    const headers = Array.from(table.querySelectorAll('thead th'))
        .slice(0, -1)
        .map(th => `"${th.textContent.trim()}"`)
        .join(',');
    const data = rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.slice(0, -1).map(td => `"${td.textContent.trim()}"`).join(',');
    });
    const csvContent = [headers, ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'student_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
document.addEventListener('DOMContentLoaded', function() {
    if (typeof initializeStudentFilters === 'function') {
        initializeStudentFilters();
    }
    const printBtn = document.getElementById('printStudentBtn');
    const downloadBtn = document.getElementById('downloadStudentBtn');
    if (printBtn) printBtn.onclick = printStudentTable;
    if (downloadBtn) downloadBtn.onclick = downloadStudentCSV;
});


function printFacultyTable() {
    const table = document.getElementById("faculty-table");
    if (!table) return;

    const cloneTable = table.cloneNode(true);
    const headerRow = cloneTable.querySelector("thead tr");
    if (headerRow && headerRow.children.length > 0) headerRow.lastElementChild.remove(); // Remove actions header

    const visibleRows = Array.from(table.querySelectorAll("tbody tr")).filter( // Use original table for visibility
        row => row.style.display !== "none"
    );

    const tbody = cloneTable.querySelector("tbody");
    tbody.innerHTML = ""; // Clear existing rows in clone

    visibleRows.forEach(row => {
        const cloneRow = row.cloneNode(true);
        if (cloneRow.children.length > 0) cloneRow.lastElementChild.remove(); // Remove actions cell
        tbody.appendChild(cloneRow);
    });

    const newWindow = window.open("", "_blank");
    if (!newWindow) return alert("Popup blocked!");

    newWindow.document.write(`
        <html><head><title>Print Faculty Data</title>
        <style>
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #1E3A5F; color: white; }
        </style></head><body>
        <h2>Faculty Data</h2>
        ${cloneTable.outerHTML}
        </body></html>
    `);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
}

function downloadFacultyCSV() {
    const table = document.getElementById("faculty-table");
    if (!table) return;

    const rows = Array.from(document.querySelectorAll("#faculty-list tr"))
        .filter(row => row.style.display !== "none");

    if (!rows.length) return alert("No data to download.");

    const headers = Array.from(table.querySelectorAll("thead th"))
        .slice(0, -1) // Exclude the last header ("Actions")
        .map(th => `"${th.textContent.trim()}"`)
        .join(",");

    const data = rows.map(row => {
        return Array.from(row.querySelectorAll("td"))
            .slice(0, -1) // Exclude the last cell ("Actions")
            .map(td => `"${td.textContent.trim()}"`)
            .join(",");
    });

    const csvContent = [headers, ...data].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "faculty_data.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============ FACULTY DELETE MODAL (AJAX, JS-only) ============
document.addEventListener('DOMContentLoaded', function() {
  const facultyDeleteBtns = document.querySelectorAll('.faculty-delete-btn');
  let facultyModal = document.getElementById('facultyDeleteModal');
  if (!facultyModal) {
    facultyModal = document.createElement('div');
    facultyModal.id = 'facultyDeleteModal';
    facultyModal.className = 'modal';
    facultyModal.style.display = 'none';
    facultyModal.style.position = 'fixed';
    facultyModal.style.top = '0';
    facultyModal.style.left = '0';
    facultyModal.style.width = '100vw';
    facultyModal.style.height = '100vh';
    facultyModal.style.background = 'rgba(30,58,95,0.18)';
    facultyModal.style.zIndex = '3000';
    facultyModal.style.alignItems = 'center';
    facultyModal.style.justifyContent = 'center';
    document.body.appendChild(facultyModal);
  }
  let facultyModalContent = document.getElementById('facultyDeleteModalContent');
  if (!facultyModalContent) {
    facultyModalContent = document.createElement('div');
    facultyModalContent.id = 'facultyDeleteModalContent';
    facultyModalContent.className = 'modal-content';
    facultyModalContent.style.background = '#fff';
    facultyModalContent.style.padding = '0';
    facultyModalContent.style.borderRadius = '14px';
    facultyModalContent.style.maxWidth = '480px';
    facultyModalContent.style.width = '100%';
    facultyModalContent.style.boxShadow = '0 2px 12px rgba(30,58,95,0.18)';
    facultyModalContent.style.position = 'relative';
    facultyModal.appendChild(facultyModalContent);
  }
  facultyDeleteBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const facultyId = btn.getAttribute('data-faculty-id');
      const facultyName = btn.getAttribute('data-faculty-name');
      const facultyEmail = btn.getAttribute('data-faculty-email');
      const facultyDept = btn.getAttribute('data-faculty-dept');
      const facultyPhone = btn.getAttribute('data-faculty-phone');
      const facultyDesignation = btn.getAttribute('data-faculty-designation');
      const facultyStatus = btn.getAttribute('data-faculty-status');
      facultyModalContent.innerHTML = `
        <div class="delete-form">
          <h2>Delete Faculty</h2>
          <div style='text-align:left;font-size:0.98em;color:#000;margin-bottom:12px;'>
            <strong>Name:</strong> ${facultyName}<br>
            <strong>Email:</strong> ${facultyEmail}<br>
            <strong>Department:</strong> ${facultyDept}<br>
            <strong>Phone:</strong> ${facultyPhone}<br>
            <strong>Designation:</strong> ${facultyDesignation}<br>
            <strong>Status:</strong> ${facultyStatus}
          </div>
          <p>Are you sure you want to delete <strong>${facultyName}</strong>?</p>
          <form id="deleteFacultyForm" method="post" style="margin-bottom:0;">
            <input type="hidden" name="faculty_id" value="${facultyId}">
            <button type="submit">Confirm Delete</button>
          </form>
          <button type="button" id="cancelFacultyDeleteBtn" class="action-link" style="margin-top:12px;">Cancel</button>
        </div>
      `;
      facultyModal.style.display = 'flex';
      // Cancel button
      const cancelBtn = document.getElementById('cancelFacultyDeleteBtn');
      if (cancelBtn) {
        cancelBtn.onclick = function() {
          facultyModal.style.display = 'none';
        };
      }
      // Close modal on outside click
      facultyModal.onclick = function(e) {
        if (e.target === facultyModal) facultyModal.style.display = 'none';
      };
      // Submit form to delete faculty
      const deleteForm = document.getElementById('deleteFacultyForm');
      if (deleteForm) {
        deleteForm.onsubmit = function(e) {
          e.preventDefault();
          const url = `/masters/faculty/${facultyId}/delete/`;
          // Try to get CSRF token from page
          const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
          const csrfToken = csrfInput ? csrfInput.value : '';
          fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'X-CSRFToken': csrfToken,
              'X-Requested-With': 'XMLHttpRequest'
            },
            body: `csrfmiddlewaretoken=${csrfToken}`
          }).then(resp => {
            if (resp.ok) {
              showPopup('Faculty deleted successfully.', 'success');
              setTimeout(() => { window.location.reload(); }, 1200);
            } else {
              showPopup('Failed to delete faculty.', 'error');
              facultyModal.style.display = 'none';
            }
          });
        };
      }
    });
  });
});

// ============ STUDENT DELETE MODAL (AJAX) ============
document.addEventListener('DOMContentLoaded', function() {
  const modal = document.getElementById('studentDeleteModal');
  if (modal) {
    const deleteBtns = document.querySelectorAll('.student-delete-btn');
    const cancelBtn = document.getElementById('cancelDeleteBtn');
    const deleteForm = document.getElementById('deleteStudentForm');
    const deleteStudentId = document.getElementById('deleteStudentId');
    const deleteModalTitle = document.getElementById('deleteModalTitle');
    const deleteModalText = document.getElementById('deleteModalText');

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const studentId = btn.getAttribute('data-student-id');
        const studentName = btn.getAttribute('data-student-name');
        const studentReg = btn.getAttribute('data-student-reg');
        const studentEmail = btn.getAttribute('data-student-email');
        const studentDept = btn.getAttribute('data-student-dept');
        const studentStatus = btn.getAttribute('data-student-status');
        deleteStudentId.value = studentId;
        deleteModalTitle.textContent = `Delete Student`;
        deleteModalText.innerHTML = `Are you sure you want to delete this student?<br><br>` +
          `<div style='text-align:left;font-size:0.98em;color:#000;'>` +
          `<strong>Name:</strong> ${studentName}<br>` +
          `<strong>Reg No:</strong> ${studentReg}<br>` +
          `<strong>Email:</strong> ${studentEmail}<br>` +
          `<strong>Department:</strong> ${studentDept}<br>` +
          `<strong>Status:</strong> ${studentStatus}` +
          `</div>`;
        modal.style.display = 'flex';
      });
    });
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
      });
    }
    // Close modal on outside click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });
    // Submit form to delete student
    if (deleteForm) {
      deleteForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const studentId = deleteStudentId.value;
        const url = `/masters/student/${studentId}/delete/`;
        const csrfToken = document.querySelector('input[name="csrfmiddlewaretoken"]').value;
        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-CSRFToken': csrfToken,
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: `csrfmiddlewaretoken=${csrfToken}`
        }).then(resp => {
          if (resp.ok) {
            showPopup('Student deleted successfully.', 'success');
            setTimeout(() => { window.location.reload(); }, 1200);
          } else {
            showPopup('Failed to delete student.', 'error');
            modal.style.display = 'none';
          }
        });
      });
    }
  }
});

// ============ GLOBAL POPUP FUNCTION ============
function showPopup(message, type) {
    let popupContainer = document.getElementById('popup-messages');
    if (!popupContainer) {
        popupContainer = document.createElement('div');
        popupContainer.id = 'popup-messages';
        popupContainer.style.position = 'fixed';
        popupContainer.style.top = '32px';
        popupContainer.style.right = '32px';
        popupContainer.style.zIndex = '2000';
        document.body.appendChild(popupContainer);
    }
    const popup = document.createElement('div');
    popup.className = `popup-message popup-${type}`;
    popup.tabIndex = 0;
    popup.textContent = message;
    popupContainer.appendChild(popup);
    setTimeout(() => { popup.remove(); }, 2000);
}

// ============ ROOM FUNCTIONS ============
function initializeRoomFilters() {
    const searchInput = document.getElementById('room-search');
    const blockSelect = document.getElementById('room-block');
    const minCapInput = document.getElementById('capacity-min');
    const maxCapInput = document.getElementById('capacity-max');
    const resetBtn = document.getElementById('resetRoomFilters');
    const roomsListBody = document.getElementById('rooms-list'); // Get tbody reference
    const rows = roomsListBody ? Array.from(roomsListBody.querySelectorAll('tr')) : []; // Get current rows
    const printBtn = document.getElementById('printRoomBtn'); // Get print button
    const downloadBtn = document.getElementById('downloadRoomBtn'); // Get download button

    function filterRooms() {
        const search = searchInput.value.toLowerCase();
        const block = blockSelect.value;
        const minCap = parseInt(minCapInput.value) || 0;
        const maxCap = parseInt(maxCapInput.value) || Infinity;

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            if (cells.length < 4) { // Minimum cells required to perform checks
                row.style.display = 'none';
                return;
            }
            const roomId = cells[1].textContent.toLowerCase();
            const roomBlock = cells[2].textContent.trim();
            const roomCap = parseInt(cells[3].textContent) || 0;

            const matchSearch = !search || roomId.includes(search) || roomBlock.toLowerCase().includes(search);
            const matchBlock = block === 'All' || roomBlock === block;
            const matchCapacity = roomCap >= minCap && roomCap <= maxCap;

            row.style.display = (matchSearch && matchBlock && matchCapacity) ? '' : 'none';
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            searchInput.value = '';
            blockSelect.value = 'All';
            minCapInput.value = '';
            maxCapInput.value = '';
            filterRooms();
        });
    }

    // --- NEW: Attach listeners for Print and Download buttons here ---
    if (printBtn) {
        printBtn.onclick = printRoomTable; // Use onclick to overwrite previous listeners
    } else {
        console.error('printRoomBtn not found after content load');
    }
    if (downloadBtn) {
        downloadBtn.onclick = downloadRoomCSV; // Use onclick to overwrite previous listeners
    } else {
        console.error('downloadRoomBtn not found after content load');
    }
    // --- END NEW ---

    // Ensure all elements exist before adding listeners to avoid errors
    if (!searchInput || !blockSelect || !minCapInput || !maxCapInput || !roomsListBody) return;

    searchInput.addEventListener('input', filterRooms);
    blockSelect.addEventListener('change', filterRooms);
    minCapInput.addEventListener('input', filterRooms);
    maxCapInput.addEventListener('input', filterRooms);

    filterRooms(); // run initially
}

function printRoomTable() {
    const table = document.getElementById('room-table');
    if (!table) return;

    const cloneTable = table.cloneNode(true);
    const headerRow = cloneTable.querySelector("thead tr");
    if (headerRow && headerRow.children.length > 0) headerRow.lastElementChild.remove(); // Remove actions header

    const visibleRows = Array.from(table.querySelectorAll("tbody tr")).filter( // Use original table for visibility
        row => row.style.display !== "none"
    );

    const tbody = cloneTable.querySelector("tbody");
    tbody.innerHTML = ""; // Clear existing rows in clone

    visibleRows.forEach(row => {
        const cloneRow = row.cloneNode(true);
        if (cloneRow.children.length > 0) cloneRow.lastElementChild.remove(); // Remove actions cell
        tbody.appendChild(cloneRow);
    });

    const newWindow = window.open("", "_blank");
    if (!newWindow) return alert("Popup blocked!");

    newWindow.document.write(`
        <html><head><title>Print Room Data</title>
        <style>
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 8px; text-align: left; }
            th { background-color: #1E3A5F; color: white; }
        </style></head><body>
        <h2>Room Data</h2>
        ${cloneTable.outerHTML}
        </body></html>
    `);
    newWindow.document.close();
    newWindow.focus();
    newWindow.print();
}

function downloadRoomCSV() {
    const table = document.getElementById('room-table');
    if (!table) return;

    const rows = Array.from(document.querySelectorAll('#rooms-list tr'))
        .filter(row => row.style.display !== 'none');

    if (!rows.length) return alert('No data to download.');

    const headers = Array.from(table.querySelectorAll('thead th'))
        .slice(0, -1) // Exclude the last header ("Actions")
        .map(th => `"${th.textContent.trim()}"`)
        .join(',');

    const data = rows.map(row => {
        return Array.from(row.querySelectorAll('td'))
            .slice(0, -1) // Exclude the last cell ("Actions")
            .map(td => `"${td.textContent.trim()}"`)
            .join(',');
    });

    const csvContent = [headers, ...data].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'rooms_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ============ SIDEBAR ACTIVE LINK SCRIPT ============
document.addEventListener("DOMContentLoaded", function() {
    // Select all sidebar links
    const sidebarLinks = document.querySelectorAll('.sidebar-links ul li a');
    const currentPath = window.location.pathname.replace(/\/$/, '');

    sidebarLinks.forEach(link => {
        const linkPath = link.pathname.replace(/\/$/, '');
        if (linkPath === currentPath) {
            // Add active to both <a> and parent <li>
            link.classList.add('active');
            if (link.parentElement && link.parentElement.tagName === 'LI') {
                link.parentElement.classList.add('active');
            }
        }
    });
});

// ============ GLOBAL INITIALIZER ============
document.addEventListener("DOMContentLoaded", () => {
    console.log('DOM fully loaded');
    // The initial call to these functions ensures filters work on first load
    // And also attaches the print/download listeners if the table is present initially.
    initializeContentScripts(window.location.pathname); // Call for the current page
});

// Function to call appropriate initialization after AJAX content load
function initializeContentScripts(pageUrl) {
    // These functions now handle attaching print/download listeners themselves.
    // They also grab the latest table rows, which is important for filtering.
    // We explicitly call them here based on the URL.

    // Student Management
    if (pageUrl.includes('/students/') && typeof initializeStudentFilters === 'function') {
        initializeStudentFilters();
    }
    // Faculty Management
    if (pageUrl.includes('/faculty/') && typeof initializeFacultyFilters === 'function') {
        initializeFacultyFilters();
    }
    // Room Management
    if (pageUrl.includes('/rooms/') && typeof initializeRoomFilters === 'function') {
        initializeRoomFilters();
    }
    // Add more conditions for other pages if they have unique JS initialization
}

// Users Table AJAX and Pagination
window.usersTable = {
    USERS_URL: '/ajax/users/',
    currentPage: 1,
    fetchUsers: function(page = 1) {
        let params = { page };
        $("#filter-row .users-filter-input").each(function() {
            const field = $(this).data("field");
            const value = $(this).val();
            if (field && value) params[field] = value;
        });
        $.ajax({
            url: this.USERS_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                usersTable.renderTable(data.users);
                usersTable.renderPagination(data.current_page, data.num_pages);
            }
        });
    },
    renderTable: function(users) {
        let html = "";
        users.forEach(function(u) {
            html += `<tr>
                <td>${u.username}</td>
                <td>${u.email}</td>
                <td>${u.first_name}</td>
                <td>${u.last_name}</td>
                <td>${u.role}</td>
                <td>${u.last_login && u.last_login.trim() ? u.last_login : '-'}</td>
            </tr>`;
        });
        $("#users-table-body").html(html);
    },
    renderPagination: function(current, total) {
        let html = "";
        let start = Math.max(1, current - 4);
        let end = Math.min(total, start + 9);
        if (end - start < 9) start = Math.max(1, end - 9);
        // First page button
        if (current > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">&laquo;&laquo;</a></li>`;
        }
        // Previous page button
        if (current > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current-1}">&laquo;</a></li>`;
        }
        for (let i = start; i <= end; i++) {
            html += `<li class="page-item${i === current ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        // Next page button
        if (current < total) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current+1}">&raquo;</a></li>`;
        }
        // Last page button
        if (current < total) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${total}">&raquo;&raquo;</a></li>`;
        }
        $("#users-pagination").html(html);
    },
    bindEvents: function() {
        $(document).on("keyup change", ".users-filter-input", function() {
            usersTable.fetchUsers(1);
        });
        $(document).on("click", "#users-pagination .page-link", function(e) {
            e.preventDefault();
            const page = parseInt($(this).data("page"));
            if (page && page !== usersTable.currentPage) {
                usersTable.currentPage = page;
                usersTable.fetchUsers(page);
            }
        });
    },
    init: function() {
        usersTable.fetchUsers();
        usersTable.bindEvents();
    }
};
$(document).ready(function() {
    if (document.getElementById('users-table')) {
        usersTable.init();
    }
});

// ============ STUDENTS TABLE (AJAX) ============
window.studentsTable = {
    STUDENTS_URL: '/masters/ajax/',
    currentPage: 1,
    fetchStudents: function(page = 1) {
        let params = { type: 'student', page };
        // Get search, department, batch (regulation) filter values
        params['search'] = $("#search").val() || '';
        params['department'] = $("#department").val() || 'all';
        params['batch'] = $("#batch").val() || 'all';
        $.ajax({
            url: this.STUDENTS_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                $("#student-list").html(data.table_html);
                $("#studentPaginationBar").html(data.pagination_html);
                // Re-initialize delete modal and other listeners if needed
                if (typeof initializeContentScripts === 'function') {
                    initializeContentScripts(window.location.pathname);
                }
            }
        });
    },
    bindEvents: function() {
        // On filter change
        $(document).on("change", "#department, #batch", function() {
            studentsTable.fetchStudents(1);
        });
        // On search input
        $(document).on("input", "#search", function() {
            studentsTable.fetchStudents(1);
        });
        // On pagination click
        $(document).on("click", "#studentPaginationBar .page-arrow, #studentPaginationBar .page-num", function(e) {
            e.preventDefault();
            const page = parseInt($(this).data("page"));
            if (page && page !== studentsTable.currentPage) {
                studentsTable.currentPage = page;
                studentsTable.fetchStudents(page);
            }
        });
        // Reset filters
        $(document).on("click", "#resetStudentFilters", function() {
            $("#search").val("");
            $("#department").val("all");
            $("#batch").val("all");
            setTimeout(function() { studentsTable.fetchStudents(1); }, 0);
        });
    },
    init: function() {
        studentsTable.fetchStudents();
        studentsTable.bindEvents();
    }
};

$(document).ready(function() {
    if (document.getElementById('student-table')) {
        studentsTable.init();
    }
});
// ============ BATCHES TABLE ============
window.batchesTable = {
    BATCHES_URL: '/ajax/batches/',
    currentPage: 1,
    fetchBatches: function(page = 1) {
        let params = { page };
        $("#batch-filter-row .batches-filter-input").each(function() {
            const field = $(this).data("field");
            const value = $(this).val();
            if (field && value) params[field] = value;
        });
        $.ajax({
            url: this.BATCHES_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                batchesTable.renderTable(data.batches);
                batchesTable.renderPagination(data.current_page, data.num_pages);
            }
        });
    },
    renderTable: function(batches) {
        let html = "";
        batches.forEach(function(b) {
            html += `<tr>
                <td>${b.batch_code}</td>
                <td>${b.admission_year}</td>
                <td>${b.grad_year}</td>
                <td>${b.status}</td>
            </tr>`;
        });
        $("#batches-table-body").html(html);
    },
    renderPagination: function(current, total) {
        let html = "";
        let start = Math.max(1, current - 4);
        let end = Math.min(total, start + 9);
        if (end - start < 9) start = Math.max(1, end - 9);
        if (current > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">&laquo;&laquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current-1}">&laquo;</a></li>`;
        }
        for (let i = start; i <= end; i++) {
            html += `<li class="page-item${i === current ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        if (current < total) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current+1}">&raquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${total}">&raquo;&raquo;</a></li>`;
        }
        $("#batches-pagination").html(html);
    },
    bindEvents: function() {
        $(document).on("keyup change", ".batches-filter-input", function() {
            batchesTable.fetchBatches(1);
        });
        $(document).on("click", "#batches-pagination .page-link", function(e) {
            e.preventDefault();
            const page = parseInt($(this).data("page"));
            if (page && page !== batchesTable.currentPage) {
                batchesTable.currentPage = page;
                batchesTable.fetchBatches(page);
            }
        });
    },
    init: function() {
        batchesTable.fetchBatches();
        batchesTable.bindEvents();
    }
};

// ============ DEPARTMENTS TABLE ============
window.departmentsTable = {
    DEPARTMENTS_URL: '/ajax/departments/',
    currentPage: 1,
    fetchDepartments: function(page = 1) {
        let params = { page };
        $("#department-filter-row .departments-filter-input").each(function() {
            const field = $(this).data("field");
            const value = $(this).val();
            if (field && value) params[field] = value;
        });
        $.ajax({
            url: this.DEPARTMENTS_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                departmentsTable.renderTable(data.departments);
                departmentsTable.renderPagination(data.current_page, data.num_pages);
            }
        });
    },
    renderTable: function(departments) {
        let html = "";
        departments.forEach(function(d) {
            html += `<tr>
                <td>${d.dept_code}</td>
                <td>${d.dept_name}</td>
                <td>${d.is_active}</td>
            </tr>`;
        });
        $("#departments-table-body").html(html);
    },
    renderPagination: function(current, total) {
        let html = "";
        let start = Math.max(1, current - 4);
        let end = Math.min(total, start + 9);
        if (end - start < 9) start = Math.max(1, end - 9);
        if (current > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">&laquo;&laquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current-1}">&laquo;</a></li>`;
        }
        for (let i = start; i <= end; i++) {
            html += `<li class="page-item${i === current ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        if (current < total) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current+1}">&raquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${total}">&raquo;&raquo;</a></li>`;
        }
        $("#departments-pagination").html(html);
    },
    bindEvents: function() {
        $(document).on("keyup change", ".departments-filter-input", function() {
            departmentsTable.fetchDepartments(1);
        });
        $(document).on("click", "#departments-pagination .page-link", function(e) {
            e.preventDefault();
            const page = parseInt($(this).data("page"));
            if (page && page !== departmentsTable.currentPage) {
                departmentsTable.currentPage = page;
                departmentsTable.fetchDepartments(page);
            }
        });
    },
    init: function() {
        departmentsTable.fetchDepartments();
        departmentsTable.bindEvents();
    }
};

// ============ PROGRAMS TABLE ============
window.programsTable = {
    PROGRAMS_URL: '/ajax/programs/',
    currentPage: 1,
    fetchPrograms: function(page = 1) {
        let params = { page };
        $("#program-filter-row .programs-filter-input").each(function() {
            const field = $(this).data("field");
            const value = $(this).val();
            if (field && value) params[field] = value;
        });
        $.ajax({
            url: this.PROGRAMS_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                programsTable.renderTable(data.programs);
                programsTable.renderPagination(data.current_page, data.num_pages);
            }
        });
    },
    renderTable: function(programs) {
        let html = "";
        programs.forEach(function(p) {
            html += `<tr>
                <td>${p.program_code}</td>
                <td>${p.program_name}</td>
                <td>${p.is_active}</td>
            </tr>`;
        });
        $("#programs-table-body").html(html);
    },
    renderPagination: function(current, total) {
        let html = "";
        let start = Math.max(1, current - 4);
        let end = Math.min(total, start + 9);
        if (end - start < 9) start = Math.max(1, end - 9);
        if (current > 1) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="1">&laquo;&laquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current-1}">&laquo;</a></li>`;
        }
        for (let i = start; i <= end; i++) {
            html += `<li class="page-item${i === current ? ' active' : ''}"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
        }
        if (current < total) {
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${current+1}">&raquo;</a></li>`;
            html += `<li class="page-item"><a class="page-link" href="#" data-page="${total}">&raquo;&raquo;</a></li>`;
        }
        $("#programs-pagination").html(html);
    },
    bindEvents: function() {
        $(document).on("keyup change", ".programs-filter-input", function() {
            programsTable.fetchPrograms(1);
        });
        $(document).on("click", "#programs-pagination .page-link", function(e) {
            e.preventDefault();
            const page = parseInt($(this).data("page"));
            if (page && page !== programsTable.currentPage) {
                programsTable.currentPage = page;
                programsTable.fetchPrograms(page);
            }
        });
    },
    init: function() {
        programsTable.fetchPrograms();
        programsTable.bindEvents();
    }
};

$(document).ready(function() {
    if (document.getElementById('batches-table')) {
        batchesTable.init();
    }
    if (document.getElementById('departments-table')) {
        departmentsTable.init();
    }
    if (document.getElementById('programs-table')) {
        programsTable.init();
    }
});


