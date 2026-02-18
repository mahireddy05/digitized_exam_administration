    // Save Examination Edit AJAX
    var saveEditExamBtn = document.getElementById('saveEditExamBtn');
    if (saveEditExamBtn) {
        saveEditExamBtn.onclick = function(e) {
            e.preventDefault();
            const examId = document.getElementById('editExamId').value;
            const examName = document.getElementById('edit_examname').value.trim();
            const startDate = document.getElementById('edit_start_date').value;
            const endDate = document.getElementById('edit_end_date').value;
            fetch('/ops/ajax/edit-examination/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({
                    exam_id: examId,
                    examname: examName,
                    start_date: startDate,
                    end_date: endDate
                })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('editExamModal').style.display = 'none';
                    alert('Examination updated successfully.');
                    fetchExaminations();
                } else {
                    alert('Failed to update examination: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(() => {
                alert('Failed to update examination due to network error.');
            });
        };
    }
    // ============ EXAMINATION EDIT MODAL LOGIC ============
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-exam-btn');
        if (editBtn) {
            e.preventDefault();
            // Find the row for this exam
            const row = editBtn.closest('tr');
            if (!row) return;
            // Fill modal fields from row
            document.getElementById('editExamId').value = editBtn.dataset.examId;
            document.getElementById('edit_examname').value = row.children[1].textContent.trim();
            document.getElementById('edit_start_date').value = row.children[2].textContent.trim();
            document.getElementById('edit_end_date').value = row.children[3].textContent.trim();
            document.getElementById('editExamModal').style.display = 'flex';
        }
    });
    var closeEditExamModal = document.getElementById('closeEditExamModal');
    if (closeEditExamModal) {
        closeEditExamModal.onclick = function() {
            document.getElementById('editExamModal').style.display = 'none';
        };
    }
    var cancelEditExamBtn = document.getElementById('cancelEditExamBtn');
    if (cancelEditExamBtn) {
        cancelEditExamBtn.onclick = function(e) {
            e.preventDefault();
            document.getElementById('editExamModal').style.display = 'none';
        };
    }
    var editExamModal = document.getElementById('editExamModal');
    if (editExamModal) {
        editExamModal.onclick = function(e) {
            if (e.target === this) this.style.display = 'none';
        };
    }
    // Delete Exam AJAX submit
    var deleteExamForm = document.getElementById('deleteExamForm');
    if (deleteExamForm) {
        deleteExamForm.onsubmit = function(e) {
            e.preventDefault();
            const examId = document.getElementById('deleteExamId').value;
            fetch('/ops/ajax/delete-examination/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
                },
                body: JSON.stringify({ exam_id: examId })
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    document.getElementById('deleteExamModal').style.display = 'none';
                    // Optionally show notification
                    alert('Examination and all related slots and exams deleted successfully.');
                    fetchExaminations();
                } else {
                    alert('Failed to delete examination: ' + (data.error || 'Unknown error'));
                }
            })
            .catch(() => {
                alert('Failed to delete examination due to network error.');
            });
        };
    }
// ============ EXAM SLOT TABLE AJAX (operations/exams.html) ============
function fetchExamSlotsAjax() {
    // Slot edit modal logic
    document.addEventListener('click', function(e) {
        const editBtn = e.target.closest('.edit-slot-btn');
        if (editBtn) {
            e.preventDefault();
            const slotId = editBtn.dataset.slotId;
            // Find the row for this slot
            const row = editBtn.closest('tr');
            if (!row) return;
            // Fill modal fields from row
            document.getElementById('editSlotId').value = slotId;
            document.getElementById('edit_examtype').value = row.children[0].textContent.trim();
            document.getElementById('edit_mode').value = row.children[1].textContent.trim();
            document.getElementById('edit_exam_date').value = row.children[2].textContent.trim();
            document.getElementById('edit_start_time').value = row.children[3].textContent.trim();
            document.getElementById('edit_end_time').value = row.children[4].textContent.trim();
            document.getElementById('edit_slot_code').value = row.children[5].textContent.trim();
            document.getElementById('editSlotModal').style.display = 'flex';
        }
    });
    document.getElementById('closeEditSlotModal').onclick = function() {
        document.getElementById('editSlotModal').style.display = 'none';
    };
    document.getElementById('cancelEditSlotBtn').onclick = function(e) {
        e.preventDefault();
        document.getElementById('editSlotModal').style.display = 'none';
    };
    document.getElementById('editSlotModal').onclick = function(e) {
        if (e.target === this) this.style.display = 'none';
    };
    var examId = window.examIdForSlots || '';
    var tbody = document.getElementById('exam-slots-list');
    if (!tbody) return;
    if (!examId) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No exam selected.</td></tr>';
        return;
    }
    fetch('/ops/ajax_exam_slots/?exam_id=' + encodeURIComponent(examId))
        .then(response => response.json())
        .then(data => {
            if (data.slots.length === 0) {
                tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">No exam slots created yet.</td></tr>';
            } else {
                tbody.innerHTML = '';
                data.slots.forEach(function(slot) {
                    let statusCell = '';
                    const schedUrl = `/ops/exam-scheduling/${slot.id}/`;
                    if (slot.assignment_status === 'Assigned') {
                        statusCell = `<td><a href="${schedUrl}" class="slot-schedule-link" style="text-decoration:none;" title="Go to scheduling"><span class=\"exam-status exam-status-available\" style=\"background:#e6f9e6;color:#1a7f1a;padding:2px 10px 2px 10px;border-radius:6px;display:inline-flex;align-items:center;font-weight:600;cursor:pointer;\">Assigned <img src='https://img.icons8.com/?size=100&id=79211&format=png&color=000000' alt='Assigned' style='width:1.2em;height:1.2em;vertical-align:middle;margin-left:6px;'></span></a></td>`;
                    } else {
                        statusCell = `<td><a href="${schedUrl}" class="slot-schedule-link" style="text-decoration:none;" title="Go to scheduling"><span class="exam-status exam-status-pending" style="background:#fff3cd;color:#856404;padding:2px 10px 2px 10px;border-radius:6px;display:inline-flex;align-items:center;cursor:pointer;">Pending <img src='https://img.icons8.com/?size=100&id=rKEYSosGdrkP&format=png&color=000000' alt='Pending' style='width:1.2em;height:1.2em;vertical-align:middle;margin-left:6px;'></span></a></td>`;
                    }
                    // Add edit and delete links
                    const editLink = `<a href=\"#\" class=\"edit-slot-btn\" data-slot-id=\"${slot.id}\" title=\"Edit\"><img src=\"https://img.icons8.com/?size=100&id=kzmsQM0bM3Bl&format=png&color=000000\" alt=\"Edit Slot\" style=\"width:16px;height:16px;margin-right:6px;\"></a>`;
                    const deleteLink = `<a href=\"#\" class=\"delete-slot-btn\" data-slot-id=\"${slot.id}\" data-slot-date=\"${slot.exam_date}\" data-slot-time=\"${slot.start_time}-${slot.end_time}\" data-slot-code=\"${slot.slot_code}\"><img src=\"https://img.icons8.com/?size=100&id=99971&format=png&color=000000\" alt=\"Delete Slot\" style=\"width:16px;height:16px;\"></a>`;
                    var row = `<tr>
                        <td>${slot.exam_type || ''}</td>
                        <td>${slot.mode || ''}</td>
                        <td>${slot.exam_date || ''}</td>
                        <td>${slot.start_time || ''}</td>
                        <td>${slot.end_time || ''}</td>
                        <td>${slot.slot_code || ''}</td>
                        ${statusCell}
                        <td>${slot.course_count || 0}</td>
                        <td>${slot.student_count || 0}</td>
                        <td>${editLink}${deleteLink}</td>
                    </tr>`;
                    tbody.innerHTML += row;
                });
            }
        })
        .catch(() => {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Error loading slots.</td></tr>';
        });
// Slot delete modal and AJAX logic
document.addEventListener('click', function(e) {
    const delBtn = e.target.closest('.delete-slot-btn');
    if (delBtn) {
        e.preventDefault();
        const slotId = delBtn.dataset.slotId;
        const slotDate = delBtn.dataset.slotDate;
        const slotTime = delBtn.dataset.slotTime;
        const slotCode = delBtn.dataset.slotCode;
        document.getElementById('deleteSlotWarning').innerHTML = `Are you sure you want to delete this slot?<br><b>Date:</b> ${slotDate} <b>Time:</b> ${slotTime} <b>Code:</b> ${slotCode}<br>This will <b>permanently delete</b> all exams scheduled under this slot.`;
        document.getElementById('deleteSlotId').value = slotId;
        document.getElementById('deleteSlotModal').style.display = 'flex';
    }
});
document.getElementById('closeDeleteSlotModal').onclick = function() {
    document.getElementById('deleteSlotModal').style.display = 'none';
};
document.getElementById('cancelDeleteSlotBtn').onclick = function(e) {
    e.preventDefault();
    document.getElementById('deleteSlotModal').style.display = 'none';
};
document.getElementById('deleteSlotModal').onclick = function(e) {
    if (e.target === this) this.style.display = 'none';
};
document.getElementById('confirmDeleteSlotLink').onclick = function(e) {
    e.preventDefault();
    const slotId = document.getElementById('deleteSlotId').value;
    fetch('/ops/ajax/delete-examination/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
        },
        body: JSON.stringify({ slot_id: slotId })
    })
    .then(res => res.json())
    .then(data => {
        document.getElementById('deleteSlotModal').style.display = 'none';
        if (data.success) {
            alert('Slot and all related exams deleted successfully.');
            fetchExamSlotsAjax();
        } else {
            alert('Failed to delete slot: ' + (data.error || 'Unknown error'));
        }
    })
    .catch(() => {
        document.getElementById('deleteSlotModal').style.display = 'none';
        alert('Failed to delete slot due to network error.');
    });
};
}
// ============ EXAMINATION TABLE AJAX (operations/examination.html) ============
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code for exam_date min/max and slot form validation...
    if (!document.getElementById('examination-table')) return;

    function pendingBadge() {
        return `<span class="exam-status exam-status-pending" style="background:#fff3cd;color:#856404;padding:2px 0px 2px 10px;border-radius:6px;display:inline-flex;align-items:center">
            Pending <img src=\"https://img.icons8.com/?size=100&id=rKEYSosGdrkP&format=png&color=000000\" alt="Pending" class="status-icon" style="width:1.2em;height:1.2em;vertical-align:middle;margin-left:6px;">
        </span>`;
    }
    function availableBadge(count) {
        return `<span class="exam-status exam-status-available" style="background:#e6f9e6;color:#1a7f1a;padding:2px 10px 2px 10px;border-radius:6px;display:inline-flex;align-items:center;font-weight:600;">
            Available : ${count}
        </span>`;
    }
    function fetchExaminations(page=1) {
        fetch(`/ops/ajax/examinations/?page=${page}`)
            .then(resp => resp.json())
            .then(data => {
                const tbody = document.querySelector('#examination-table tbody');
                tbody.innerHTML = '';
                if (data.results && data.results.length) {
                    data.results.forEach((exam, idx) => {
                        const slotLink = `/ops/exams/?exam_id=${exam.exam_id}` +
                            `&exam_name=${encodeURIComponent(exam.exam_name)}` +
                            `&start_date=${encodeURIComponent(exam.start_date)}` +
                            `&end_date=${encodeURIComponent(exam.end_date)}`;
                        const rowId = `exam-row-${exam.exam_id}`;
                        tbody.innerHTML += `<tr id="${rowId}">
                            <td>${exam.number}</td>
                            <td>${exam.exam_name}</td>
                            <td>${exam.start_date}</td>
                            <td>${exam.end_date}</td>
                            <td id="slot-badge-${exam.exam_id}"><a href="${slotLink}" class="slot-link" data-exam-name="${encodeURIComponent(exam.exam_name)}">${pendingBadge()}</a></td>
                            <td id="schedule-badge-${exam.exam_id}"><a href="#" class="exam-schedule-link" data-exam-id="${exam.exam_id}" data-slot-link="${slotLink}" style="text-decoration:none;">${pendingBadge()}</a></td>
                            <td>${pendingBadge()}</td>
                            <td>${pendingBadge()}</td>
                            <td>${pendingBadge()}</td>
                            <td>
                                <a href=\"#\" class=\"edit-exam-btn\" data-exam-id=\"${exam.exam_id}\" title=\"Edit\"><img src=\"https://img.icons8.com/?size=100&id=kzmsQM0bM3Bl&format=png&color=000000\" alt=\"Edit Exam\" style=\"width:16px;height:16px;margin-right:6px;\"></a>
                                <a href=\"#\" class=\"delete-exam-btn\" data-exam-id=\"${exam.exam_id}\" data-exam-name=\"${exam.exam_name}\"><img src=\"https://img.icons8.com/?size=100&id=99971&format=png&color=000000\" alt=\"Delete Exam\" style=\"width:16px;height:16px;\"></a>
                            </td>
                        </tr>`;
                        fetch(`/ops/ajax_exam_slots/?exam_id=${exam.exam_id}`)
                            .then(resp => resp.json())
                            .then(slotData => {
                                const badgeTd = document.getElementById(`slot-badge-${exam.exam_id}`);
                                if (badgeTd && slotData.slots && slotData.slots.length > 0) {
                                    badgeTd.innerHTML = `<a href="${slotLink}" class="slot-link" data-exam-name="${encodeURIComponent(exam.exam_name)}">${availableBadge(slotData.slots.length)}</a>`;
                                }
                                const scheduleLink = document.querySelector(`#schedule-badge-${exam.exam_id} .exam-schedule-link`);
                                if (scheduleLink) {
                                    scheduleLink.dataset.slotCount = slotData.slots.length;
                                    if (slotData.slots.length > 0) {
                                        scheduleLink.dataset.slotId = slotData.slots[0].id;
                                        scheduleLink.dataset.examLink = `/ops/exams/?exam_id=${exam.exam_id}&exam_name=${encodeURIComponent(exam.exam_name)}&start_date=${encodeURIComponent(exam.start_date)}&end_date=${encodeURIComponent(exam.end_date)}`;
                                    }
                                }
                            });
                    });
                } else {
                    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No examinations found.</td></tr>';
                }
                const pagDiv = document.getElementById('examination-pagination');
                pagDiv.innerHTML = '';
                if (data.num_pages > 1) {
                    for (let i = 1; i <= data.num_pages; i++) {
                        pagDiv.innerHTML += `<a href="#" class="page-link${i===data.page ? ' active' : ''}" data-page="${i}">${i}</a> `;
                    }
                    pagDiv.querySelectorAll('.page-link').forEach(link => {
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            fetchExaminations(parseInt(this.dataset.page));
                        });
                    });
                }
            });
    }
    // Register delete-exam-btn handler after table is rendered
    document.addEventListener('click', function(e) {
            // Handle click on Exam Scheduling link to check for slots
            const schedLink = e.target.closest('.exam-schedule-link');
            if (schedLink) {
                e.preventDefault();
                const examId = schedLink.dataset.examId;
                const slotLink = schedLink.dataset.slotLink;
                fetch(`/ops/ajax_exam_slots/?exam_id=${examId}`)
                    .then(resp => resp.json())
                    .then(data => {
                        if (data.slots && data.slots.length > 0) {
                            window.location.href = slotLink;
                        } else {
                            alert('No slots available for this examination. Please create slots first.');
                        }
                    })
                    .catch(() => {
                        alert('Error checking slots for this examination.');
                    });
                return;
            }
        const btn = e.target.closest('.delete-exam-btn');
        if (btn) {
            e.preventDefault();
            const examId = btn.dataset.examId;
            const examName = btn.dataset.examName;
                fetch(`/ops/ajax_exam_slots/?exam_id=${examId}`)
                .then(resp => resp.json())
                .then(data => {
                    let detailsHtml = '';
                    if (data.slots && data.slots.length > 0) {
                        detailsHtml += `<b>Slots to be deleted:</b><ul style='margin-bottom:0;'>`;
                        data.slots.forEach(slot => {
                            detailsHtml += `<li>${slot.exam_date} [${slot.start_time}-${slot.end_time}] (${slot.slot_code || ''}) - <b>${slot.course_count}</b> exam(s)</li>`;
                        });
                        detailsHtml += '</ul>';
                    } else {
                        detailsHtml += '<b>No slots found for this examination.</b>';
                    }
                    document.getElementById('deleteExamWarning').innerHTML = `Are you sure you want to delete <b>\"${examName}\"</b>?<br>This will <b>permanently delete</b> all slots and exams scheduled under this examination.`;
                    document.getElementById('deleteExamDetails').innerHTML = detailsHtml;
                    document.getElementById('deleteExamId').value = examId;
                    document.getElementById('deleteExamModal').style.display = 'flex';
                });
        }
    });
    // Modal close/cancel logic
    document.getElementById('closeDeleteExamModal').onclick = function() {
        document.getElementById('deleteExamModal').style.display = 'none';
    };
    document.getElementById('cancelDeleteExamBtn').onclick = function(e) {
        e.preventDefault();
        document.getElementById('deleteExamModal').style.display = 'none';
    };
    document.getElementById('deleteExamModal').onclick = function(e) {
        if (e.target === this) this.style.display = 'none';
    };
    document.getElementById('confirmDeleteExamLink').onclick = function(e) {
        e.preventDefault();
        const examId = document.getElementById('deleteExamId').value;
        fetch('/ops/ajax/delete-examination/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            },
            body: JSON.stringify({ exam_id: examId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                document.getElementById('deleteExamModal').style.display = 'none';
                alert('Examination and all related slots and exams deleted successfully.');
                fetchExaminations();
            } else {
                alert('Failed to delete examination: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(() => {
            alert('Failed to delete examination due to network error.');
        });
    };
    // If on exams.html, autofill exam name from query param and make readonly
    if (window.location.pathname.endsWith('/exams/')) {
        const urlParams = new URLSearchParams(window.location.search);
        const examName = urlParams.get('exam_name');
        const startDate = urlParams.get('start_date');
        const endDate = urlParams.get('end_date');
        if (examName) {
            function setExamNameReadonly() {
                const examNameInput = document.getElementById('examname');
                if (examNameInput) {
                    examNameInput.value = decodeURIComponent(examName);
                    examNameInput.readOnly = true;
                    examNameInput.style.background = '#f5f5f5';
                } else {
                    setTimeout(setExamNameReadonly, 100);
                }
            }
            setExamNameReadonly();
        }
        if (startDate || endDate) {
            function setExamDateLimits() {
                const examDateInput = document.getElementById('exam_date');
                if (examDateInput) {
                    if (startDate) examDateInput.min = startDate;
                    if (endDate) examDateInput.max = endDate;
                } else {
                    setTimeout(setExamDateLimits, 100);
                }
            }
            setExamDateLimits();
        }
    }
    fetchExaminations();
});
// ============ EXAM SCHEDULING AJAX (operations/exam_scheduling.html) ============
document.addEventListener('DOMContentLoaded', function() {
    // Only run on exam scheduling page
    if (!document.getElementById('exam-schedule-groups-table')) return;

    function fetchFilters() {
        fetch('/ops/ajax/exam-scheduling/filters/')
            .then(resp => resp.json())
            .then(data => {
                const yearSel = document.getElementById('filterYear');
                const semSel = document.getElementById('filterSem');
                const regSel = document.getElementById('filterRegulation');
                if (yearSel && data.academic_years) {
                    yearSel.innerHTML = '<option value="">All Years</option>' + data.academic_years.map(y => `<option value="${y}">${y}</option>`).join('');
                }
                if (semSel && data.semesters) {
                    semSel.innerHTML = '<option value="">All Semesters</option>' + data.semesters.map(s => `<option value="${s}">${s}</option>`).join('');
                }
                if (regSel && data.regulations) {
                    regSel.innerHTML = '<option value="">All Regulations</option>' + data.regulations.map(r => `<option value="${r}">${r}</option>`).join('');
                }
            });
    }

    function fetchGroups() {
        const year = document.getElementById('filterYear').value;
        const sem = document.getElementById('filterSem').value;
        const reg = document.getElementById('filterRegulation').value;
        const slotId = window.examSlotId || document.getElementById('examScheduleGroupsForm').dataset.slotId;
        const params = new URLSearchParams({ academic_year: year, semester: sem, regulation: reg, slot_id: slotId });
        fetch('/ops/ajax/exam-scheduling/groups/?' + params.toString())
            .then(resp => resp.json())
            .then(data => {
                const tbody = document.querySelector('#exam-schedule-groups-table tbody');
                const form = document.getElementById('examScheduleGroupsForm');
                if (!tbody || !form) return;
                const confirmBtn = document.getElementById('confirmScheduleBtn');
                if (data.groups && data.groups.length) {
                    tbody.innerHTML = data.groups.map(group => {
                        const disabled = group.clash ? 'disabled' : '';
                        const clashStyle = group.clash ? 'background:#ffe6e6;color:#b30000;' : '';
                        const clashMsg = group.clash ? '<div style="color:#b30000;font-size:0.9em;">Clash: Student has another exam in this slot</div>' : '';
                        const studentIds = group.student_ids ? group.student_ids.join(',') : '';
                        return `
                        <tr style="${clashStyle}">
                            <td><input type="checkbox" name="selected_groups" value="${group.course_code}|${group.regulation}|${group.academic_year}|${group.semester}" ${disabled} ${group.clash ? 'tabindex="-1" aria-disabled="true"' : ''}></td>
                            <td>${group.course_code}</td>
                            <td>${group.course_name}</td>
                            <td>${group.regulation}</td>
                            <td>${group.academic_year}</td>
                            <td>${group.semester}</td>
                            <td data-students="${studentIds}">${group.student_count}${clashMsg}</td>
                        </tr>
                        `;
                    }).join('');
                    form.style.display = '';
                    if (confirmBtn) confirmBtn.style.display = '';
                } else {
                    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No course registrations found for the selected filters.</td></tr>';
                    form.style.display = '';
                    if (confirmBtn) confirmBtn.style.display = 'none';
                }
            });
    }

    // Initial load
    fetchFilters();
    // Hide table/form on load
    document.getElementById('examScheduleGroupsForm').style.display = 'none';

    // Clear table and hide form on filter change
    document.getElementById('filterYear').addEventListener('change', function() {
        document.querySelector('#exam-schedule-groups-table tbody').innerHTML = '';
        document.getElementById('examScheduleGroupsForm').style.display = 'none';
    });
    document.getElementById('filterSem').addEventListener('change', function() {
        document.querySelector('#exam-schedule-groups-table tbody').innerHTML = '';
        document.getElementById('examScheduleGroupsForm').style.display = 'none';
    });
    document.getElementById('filterRegulation').addEventListener('change', function() {
        document.querySelector('#exam-schedule-groups-table tbody').innerHTML = '';
        document.getElementById('examScheduleGroupsForm').style.display = 'none';
    });


    // Fetch courses only on button click
    const fetchBtn = document.getElementById('fetchCoursesBtn');
    const form = document.getElementById('examScheduleGroupsForm');
    if (fetchBtn) {
        fetchBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fetchGroups();
        });
    }

    // Show/hide confirm button based on selection
    if (form) {
        form.addEventListener('change', function(e) {
            const confirmBtn = document.getElementById('confirmScheduleBtn');
            const checked = form.querySelectorAll('input[name="selected_groups"]:checked');
            if (confirmBtn) confirmBtn.style.display = checked.length ? '' : 'none';
        });
        // Prevent form submit if no group is selected
        form.addEventListener('submit', function(e) {
            const checked = form.querySelectorAll('input[name="selected_groups"]:checked');
            if (!checked.length) {
                e.preventDefault();
                alert('Please select at least one group to schedule.');
            }
        });
    }

    // Select all groups checkbox (re-bind after table update)
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'selectAllGroups') {
            document.querySelectorAll('input[name="selected_groups"]').forEach(cb => {
                cb.checked = e.target.checked;
            });
        }
        // Real-time clash detection
        if (e.target && e.target.name === 'selected_groups') {
            // Get all checked groups
            const checked = Array.from(document.querySelectorAll('input[name="selected_groups"]:checked'));
            // Collect selected group info
            const selectedGroups = checked.map(cb => {
                const row = cb.closest('tr');
                return {
                    course_code: row.children[1].textContent,
                    regulation: row.children[3].textContent,
                    academic_year: row.children[4].textContent,
                    semester: row.children[5].textContent,
                    students: row.children[6].dataset.students ? row.children[6].dataset.students.split(',') : []
                };
            });
            // For each checkbox, check if its students overlap with any selected group
            document.querySelectorAll('input[name="selected_groups"]').forEach(cb => {
                const row = cb.closest('tr');
                const students = row.children[6].dataset.students ? row.children[6].dataset.students.split(',') : [];
                let clash = false;
                selectedGroups.forEach(sel => {
                    if (sel.students.some(s => students.includes(s)) && !cb.checked) {
                        clash = true;
                    }
                });
                if (clash) {
                    cb.disabled = true;
                    row.style.background = '#ffe6e6';
                    row.style.color = '#b30000';
                } else if (!cb.checked) {
                    cb.disabled = false;
                    row.style.background = '';
                    row.style.color = '';
                }
            });
        }
    });
});
// ============ EXAM SLOT CREATION (operations/exams.html) ============
// JS validation removed; backend handles all validation and messaging.
document.addEventListener('DOMContentLoaded', function() {
    const createLink = document.getElementById('createExamSlotLink');
    const form = document.getElementById('examSlotForm');
    if (createLink && form) {
        createLink.addEventListener('click', function(e) {
            e.preventDefault();
            form.submit();
        });
    }
});
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
// Only the correct delete-exam-btn event handler should be present (see above)
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

// ============ EXAMINATION FORM SUBMIT ============
document.addEventListener('DOMContentLoaded', function() {
    var examForm = document.getElementById('examinationForm');
    if (examForm) {
        examForm.addEventListener('submit', function(e) {
            // Optionally, add client-side validation here if needed
            // (HTML5 required/min already covers most cases)
            // Allow normal form submit for backend processing
        });
        // Dynamic end date min logic (already in template, but keep for robustness)
        var startInput = document.getElementById('start_date');
        var endInput = document.getElementById('end_date');
        function updateEndMin() {
            if (startInput.value) {
                endInput.min = startInput.value;
                if (endInput.value && endInput.value < startInput.value) {
                    endInput.value = '';
                }
            } else {
                endInput.min = startInput.min;
            }
        }
        startInput.addEventListener('change', updateEndMin);
        updateEndMin();
    }
});


