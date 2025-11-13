
// ============================================================================
// DATA MANAGEMENT
// ============================================================================

/**
 * Data model structure:
 * {
 *   students: [
 *     { id, name, age, note, photo, languages: [] }
 *   ],
 *   seats: {
 *     "c{classroom}_t{table}": studentId
 *   }
 * }
 */

// Initialize data storage
const STORAGE_KEY = 'classroomData';
let currentEditingId = null;
let currentSeatKey = null; // For student picker modal

/**
 * Get data from localStorage or return default structure
 */
function getData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        return JSON.parse(stored);
    }
    // Return initial sample data
    return {
        students: [
            {
                id: 's1',
                name: 'Amina',
                age: 22,
                note: 'JS learner, passionate about web development',
                photo: 'https://ui-avatars.com/api/?name=Amina&size=64&background=6366f1',
                languages: ['JavaScript', 'HTML', 'CSS']
            },
            {
                id: 's2',
                name: 'John',
                age: 20,
                note: 'Python enthusiast',
                photo: 'https://ui-avatars.com/api/?name=John&size=64&background=10b981',
                languages: ['Python', 'Django']
            },
            {
                id: 's3',
                name: 'Sarah',
                age: 21,
                note: 'Full-stack developer',
                photo: 'https://ui-avatars.com/api/?name=Sarah&size=64&background=f59e0b',
                languages: ['React', 'Node.js', 'MongoDB']
            }
        ],
        seats: {}
    };
}

/**
 * Save data to localStorage
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Generate unique ID for new students
 */
function generateId() {
    return 's' + Date.now() + Math.random().toString(36).substr(2, 9);
}

// ============================================================================
// DOM ELEMENTS
// ============================================================================

const studentList = document.getElementById('studentList');
const searchInput = document.getElementById('searchInput');
const addStudentBtn = document.getElementById('addStudentBtn');
const studentModal = document.getElementById('studentModal');
const studentForm = document.getElementById('studentForm');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const pickerModal = document.getElementById('pickerModal');
const closePickerBtn = document.getElementById('closePickerBtn');
const pickerStudentList = document.getElementById('pickerStudentList');
const pickerSearch = document.getElementById('pickerSearch');
const detailModal = document.getElementById('detailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');

// ============================================================================
// RENDER FUNCTIONS
// ============================================================================

/**
 * Render a single student item in the roster
 */
function renderStudentItem(student) {
    const div = document.createElement('div');
    div.className = 'bg-gray-50 rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow duration-200';
    div.setAttribute('data-student-id', student.id);
    div.draggable = true; // Enable drag and drop
    
    div.innerHTML = `
        <div class="flex items-start gap-3">
            <div class="flex-shrink-0 relative">
                <img 
                    src="${student.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&size=64&background=random'}" 
                    alt="${student.name}" 
                    class="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                >
                <!-- Drag handle indicator -->
                <div class="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1 shadow-md" title="Drag to assign to a seat">
                    <svg class="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16"></path>
                    </svg>
                </div>
            </div>
            <div class="flex-1 min-w-0">
                <h3 class="font-semibold text-gray-800 truncate">${escapeHtml(student.name)}</h3>
                <p class="text-sm text-gray-600">Age: ${student.age}</p>
                <p class="text-sm text-gray-500 mt-1 line-clamp-2">${escapeHtml(student.note || 'No note')}</p>
                <div class="flex flex-wrap gap-1 mt-2">
                    ${student.languages.map(lang => `
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            ${escapeHtml(lang)}
                        </span>
                    `).join('')}
                </div>
            </div>
            <div class="flex flex-col gap-2 flex-shrink-0">
                <button 
                    class="edit-student-btn w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
                    data-student-id="${student.id}"
                    title="Edit student"
                    aria-label="Edit ${escapeHtml(student.name)}"
                    draggable="false"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button 
                    class="delete-student-btn w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
                    data-student-id="${student.id}"
                    title="Delete student"
                    aria-label="Delete ${escapeHtml(student.name)}"
                    draggable="false"
                >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </div>
        </div>
    `;
    
    // Add drag event listeners
    div.addEventListener('dragstart', handleDragStart);
    div.addEventListener('dragend', handleDragEnd);
    
    return div;
}

/**
 * Render all students in the roster (filtered by search)
 */
function renderStudentList(searchTerm = '') {
    const data = getData();
    const filtered = data.students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    studentList.innerHTML = '';
    
    if (filtered.length === 0) {
        studentList.innerHTML = '<p class="text-gray-500 text-center py-4">No students found</p>';
        return;
    }
    
    filtered.forEach(student => {
        studentList.appendChild(renderStudentItem(student));
    });
    
    // Attach event listeners to edit/delete buttons
    attachStudentListListeners();
}

/**
 * Render a table/seat in a classroom
 */
function renderTable(classroomIndex, tableIndex) {
    const data = getData();
    const seatKey = `c${classroomIndex}_t${tableIndex}`;
    const assignedStudentId = data.seats[seatKey];
    const assignedStudent = assignedStudentId ? data.students.find(s => s.id === assignedStudentId) : null;
    
    const div = document.createElement('div');
    div.className = 'table-seat bg-gray-100 rounded-lg p-4 border-2 border-dashed border-gray-300 min-h-[120px] flex flex-col items-center justify-center relative drop-zone';
    div.setAttribute('data-seat-key', seatKey);
    div.setAttribute('data-classroom', classroomIndex);
    div.setAttribute('data-table', tableIndex);
    
    if (assignedStudent) {
        div.innerHTML = `
            <div class="flex flex-col items-center gap-2">
                <img 
                    src="${assignedStudent.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(assignedStudent.name) + '&size=64&background=random'}" 
                    alt="${assignedStudent.name}" 
                    class="w-12 h-12 rounded-full object-cover border-2 border-gray-300 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
                    title="Click to view details"
                >
                <span class="text-sm font-medium text-gray-700 text-center">${escapeHtml(assignedStudent.name)}</span>
                <button 
                    class="remove-seat-btn absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors duration-200"
                    data-seat-key="${seatKey}"
                    title="Remove student"
                    aria-label="Remove ${escapeHtml(assignedStudent.name)}"
                >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // Add click listener to avatar for detail view
        const avatar = div.querySelector('img');
        avatar.addEventListener('click', () => showStudentDetail(assignedStudent));
    } else {
        div.innerHTML = `
            <button 
                class="add-seat-btn w-10 h-10 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center transition-colors duration-200"
                data-seat-key="${seatKey}"
                title="Add student to this table"
                aria-label="Add student to table ${tableIndex + 1}"
            >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                </svg>
            </button>
        `;
    }
    
    // Add drop zone event listeners
    div.addEventListener('dragover', handleDragOver);
    div.addEventListener('drop', handleDrop);
    div.addEventListener('dragleave', handleDragLeave);
    
    return div;
}

/**
 * Render all tables in all classrooms
 */
function renderClassrooms() {
    for (let classroomIndex = 1; classroomIndex <= 3; classroomIndex++) {
        const classroom = document.getElementById(`classroom${classroomIndex}`);
        const grid = classroom.querySelector('.classroom-grid');
        grid.innerHTML = '';
        
        for (let tableIndex = 0; tableIndex < 4; tableIndex++) {
            grid.appendChild(renderTable(classroomIndex, tableIndex));
        }
    }
    
    // Attach event listeners
    attachClassroomListeners();
}

/**
 * Render student picker modal
 */
function renderStudentPicker(searchTerm = '') {
    const data = getData();
    const filtered = data.students.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    pickerStudentList.innerHTML = '';
    
    if (filtered.length === 0) {
        pickerStudentList.innerHTML = '<p class="text-gray-500 text-center py-4">No students available</p>';
        return;
    }
    
    filtered.forEach(student => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors duration-200';
        div.setAttribute('data-student-id', student.id);
        
        div.innerHTML = `
            <img 
                src="${student.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&size=64&background=random'}" 
                alt="${student.name}" 
                class="w-12 h-12 rounded-full object-cover border-2 border-gray-300"
            >
            <div class="flex-1">
                <h3 class="font-semibold text-gray-800">${escapeHtml(student.name)}</h3>
                <p class="text-sm text-gray-600">Age: ${student.age}</p>
            </div>
        `;
        
        div.addEventListener('click', () => {
            assignStudentToSeat(student.id);
        });
        
        pickerStudentList.appendChild(div);
    });
}

/**
 * Render student detail modal
 */
function renderStudentDetail(student) {
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="flex flex-col items-center gap-4">
            <img 
                src="${student.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&size=64&background=random'}" 
                alt="${student.name}" 
                class="w-24 h-24 rounded-full object-cover border-4 border-gray-300"
            >
            <div class="text-center">
                <h3 class="text-2xl font-bold text-gray-800">${escapeHtml(student.name)}</h3>
                <p class="text-gray-600 mt-1">Age: ${student.age}</p>
            </div>
            <div class="w-full">
                <h4 class="font-semibold text-gray-700 mb-2">Note</h4>
                <p class="text-gray-600">${escapeHtml(student.note || 'No note provided')}</p>
            </div>
            <div class="w-full">
                <h4 class="font-semibold text-gray-700 mb-2">Programming Languages</h4>
                <div class="flex flex-wrap gap-2">
                    ${student.languages.length > 0 
                        ? student.languages.map(lang => `
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                ${escapeHtml(lang)}
                            </span>
                        `).join('')
                        : '<p class="text-gray-500">No languages specified</p>'
                    }
                </div>
            </div>
        </div>
    `;
}

// ============================================================================
// MODAL MANAGEMENT
// ============================================================================

/**
 * Open student add/edit modal
 */
function openStudentModal(studentId = null) {
    currentEditingId = studentId;
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');
    
    // Reset form
    form.reset();
    document.getElementById('studentId').value = '';
    document.getElementById('languageTags').innerHTML = '';
    document.getElementById('nameError').classList.add('hidden');
    document.getElementById('ageError').classList.add('hidden');
    
    if (studentId) {
        // Edit mode: populate form with student data
        modalTitle.textContent = 'Edit Student';
        const data = getData();
        const student = data.students.find(s => s.id === studentId);
        
        if (student) {
            document.getElementById('studentId').value = student.id;
            document.getElementById('studentName').value = student.name;
            document.getElementById('studentAge').value = student.age;
            document.getElementById('studentNote').value = student.note || '';
            document.getElementById('photoUrl').value = student.photo || '';
            document.getElementById('photoPreview').src = student.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&size=64&background=random';
            
            // Render language tags
            student.languages.forEach(lang => {
                addLanguageTag(lang);
            });
        }
    } else {
        // Add mode
        modalTitle.textContent = 'Add Student';
        document.getElementById('photoPreview').src = 'https://ui-avatars.com/api/?name=Student&size=64&background=random';
    }
    
    studentModal.classList.remove('hidden');
    document.getElementById('studentName').focus();
    
    // Trap focus in modal
    trapFocus(studentModal);
}

/**
 * Close student modal
 */
function closeStudentModal() {
    studentModal.classList.add('hidden');
    currentEditingId = null;
}

/**
 * Open student picker modal for seat assignment
 */
function openStudentPicker(seatKey) {
    currentSeatKey = seatKey;
    pickerModal.classList.remove('hidden');
    pickerSearch.value = '';
    renderStudentPicker('');
    pickerSearch.focus();
    
    // Trap focus in modal
    trapFocus(pickerModal);
}

/**
 * Close student picker modal
 */
function closeStudentPicker() {
    pickerModal.classList.add('hidden');
    currentSeatKey = null;
}

/**
 * Show student detail modal
 */
function showStudentDetail(student) {
    renderStudentDetail(student);
    detailModal.classList.remove('hidden');
    trapFocus(detailModal);
}

/**
 * Close student detail modal
 */
function closeStudentDetail() {
    detailModal.classList.add('hidden');
}

/**
 * Focus trap for accessibility
 */
function trapFocus(modal) {
    const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    modal.addEventListener('keydown', function handleTab(e) {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
        if (e.key === 'Escape') {
            if (modal === studentModal) closeStudentModal();
            if (modal === pickerModal) closeStudentPicker();
            if (modal === detailModal) closeStudentDetail();
            modal.removeEventListener('keydown', handleTab);
        }
    });
}

// ============================================================================
// FORM HANDLING
// ============================================================================

/**
 * Handle student form submission
 */
function handleStudentSubmit(e) {
    e.preventDefault();
    
    const name = document.getElementById('studentName').value.trim();
    const age = document.getElementById('studentAge').value;
    const note = document.getElementById('studentNote').value.trim();
    const photoUrl = document.getElementById('photoUrl').value.trim();
    const photoFile = document.getElementById('photoFile').files[0];
    const studentId = document.getElementById('studentId').value;
    
    // Validation
    let isValid = true;
    
    if (!name) {
        document.getElementById('nameError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('nameError').classList.add('hidden');
    }
    
    if (!age || age < 1) {
        document.getElementById('ageError').classList.remove('hidden');
        isValid = false;
    } else {
        document.getElementById('ageError').classList.add('hidden');
    }
    
    if (!isValid) return;
    
    // Get languages from tags
    const languageTags = document.querySelectorAll('#languageTags .language-tag');
    const languages = Array.from(languageTags).map(tag => tag.getAttribute('data-language'));
    
    // Handle photo
    let photo = photoUrl;
    if (photoFile) {
        // Convert file to data URL
        const reader = new FileReader();
        reader.onload = function(e) {
            photo = e.target.result;
            saveStudent(name, age, note, photo, languages, studentId);
        };
        reader.readAsDataURL(photoFile);
        return;
    }
    
    saveStudent(name, age, note, photo, languages, studentId);
}

/**
 * Save student (create or update)
 */
function saveStudent(name, age, note, photo, languages, studentId) {
    const data = getData();
    
    if (studentId) {
        // Update existing student
        const index = data.students.findIndex(s => s.id === studentId);
        if (index !== -1) {
            data.students[index] = {
                ...data.students[index],
                name,
                age: parseInt(age),
                note,
                photo: photo || data.students[index].photo,
                languages
            };
        }
    } else {
        // Create new student
        const newStudent = {
            id: generateId(),
            name,
            age: parseInt(age),
            note,
            photo: photo || '',
            languages
        };
        data.students.push(newStudent);
    }
    
    saveData(data);
    renderStudentList(searchInput.value);
    renderClassrooms();
    closeStudentModal();
}

/**
 * Add language tag
 */
function addLanguageTag(language) {
    if (!language || !language.trim()) return;
    
    const languageTags = document.getElementById('languageTags');
    const existingTags = Array.from(languageTags.querySelectorAll('.language-tag')).map(
        tag => tag.getAttribute('data-language').toLowerCase()
    );
    
    if (existingTags.includes(language.trim().toLowerCase())) {
        return; // Don't add duplicates
    }
    
    const tag = document.createElement('span');
    tag.className = 'language-tag inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 tag-enter';
    tag.setAttribute('data-language', language.trim());
    tag.innerHTML = `
        ${escapeHtml(language.trim())}
        <button 
            type="button" 
            class="remove-language-btn text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Remove ${escapeHtml(language.trim())}"
        >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>
    `;
    
    tag.querySelector('.remove-language-btn').addEventListener('click', () => {
        tag.classList.add('tag-exit');
        setTimeout(() => tag.remove(), 200);
    });
    
    languageTags.appendChild(tag);
}

// ============================================================================
// EVENT LISTENERS
// ============================================================================

/**
 * Attach event listeners to student list items
 */
function attachStudentListListeners() {
    // Edit buttons
    document.querySelectorAll('.edit-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.currentTarget.getAttribute('data-student-id');
            openStudentModal(studentId);
        });
    });
    
    // Delete buttons
    document.querySelectorAll('.delete-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.currentTarget.getAttribute('data-student-id');
            deleteStudent(studentId);
        });
    });
}

/**
 * Attach event listeners to classroom tables
 */
function attachClassroomListeners() {
    // Add seat buttons
    document.querySelectorAll('.add-seat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const seatKey = e.currentTarget.getAttribute('data-seat-key');
            openStudentPicker(seatKey);
        });
    });
    
    // Remove seat buttons
    document.querySelectorAll('.remove-seat-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const seatKey = e.currentTarget.getAttribute('data-seat-key');
            removeStudentFromSeat(seatKey);
        });
    });
}

/**
 * Delete a student
 */
function deleteStudent(studentId) {
    if (!confirm('Are you sure you want to delete this student? This will also remove them from any assigned seats.')) {
        return;
    }
    
    const data = getData();
    
    // Remove student
    data.students = data.students.filter(s => s.id !== studentId);
    
    // Remove from all seats
    Object.keys(data.seats).forEach(seatKey => {
        if (data.seats[seatKey] === studentId) {
            delete data.seats[seatKey];
        }
    });
    
    saveData(data);
    renderStudentList(searchInput.value);
    renderClassrooms();
}

/**
 * Assign student to a seat
 * @param {string} studentId - The ID of the student to assign
 * @param {string} seatKey - Optional seat key. If not provided, uses currentSeatKey
 */
function assignStudentToSeat(studentId, seatKey = null) {
    const targetSeatKey = seatKey || currentSeatKey;
    if (!targetSeatKey) return;
    
    const data = getData();
    
    // Remove student from any other seat they might be in
    Object.keys(data.seats).forEach(key => {
        if (data.seats[key] === studentId) {
            delete data.seats[key];
        }
    });
    
    // Assign to new seat
    data.seats[targetSeatKey] = studentId;
    
    saveData(data);
    renderClassrooms();
    if (pickerModal && !pickerModal.classList.contains('hidden')) {
        closeStudentPicker();
    }
}

/**
 * Remove student from a seat
 */
function removeStudentFromSeat(seatKey) {
    const data = getData();
    delete data.seats[seatKey];
    saveData(data);
    renderClassrooms();
}

// ============================================================================
// DRAG AND DROP
// ============================================================================

let draggedStudentId = null;

function handleDragStart(e) {
    draggedStudentId = e.currentTarget.getAttribute('data-student-id');
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedStudentId); // For better browser support
    
    // Add visual indicator that dragging is active
    document.body.style.cursor = 'grabbing';
}

function handleDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    document.body.style.cursor = '';
    document.querySelectorAll('.drop-zone').forEach(zone => {
        zone.classList.remove('drag-over');
    });
    draggedStudentId = null; // Reset in case drop didn't fire
}

function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    // Only remove drag-over if we're actually leaving the drop zone
    // (not just moving to a child element)
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
        e.currentTarget.classList.remove('drag-over');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    
    if (!draggedStudentId) return;
    
    const seatKey = e.currentTarget.getAttribute('data-seat-key');
    if (seatKey) {
        assignStudentToSeat(draggedStudentId, seatKey);
    }
    
    draggedStudentId = null;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize the application
 */
function init() {
    // Render initial data
    renderStudentList();
    renderClassrooms();
    
    // Search input
    searchInput.addEventListener('input', (e) => {
        renderStudentList(e.target.value);
    });
    
    // Add student button
    addStudentBtn.addEventListener('click', () => {
        openStudentModal();
    });
    
    // Modal close buttons
    closeModalBtn.addEventListener('click', closeStudentModal);
    cancelBtn.addEventListener('click', closeStudentModal);
    closePickerBtn.addEventListener('click', closeStudentPicker);
    closeDetailBtn.addEventListener('click', closeStudentDetail);
    
    // Close modals on backdrop click
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) closeStudentModal();
    });
    pickerModal.addEventListener('click', (e) => {
        if (e.target === pickerModal) closeStudentPicker();
    });
    detailModal.addEventListener('click', (e) => {
        if (e.target === detailModal) closeStudentDetail();
    });
    
    // Student form
    studentForm.addEventListener('submit', handleStudentSubmit);
    
    // Language input
    const languageInput = document.getElementById('languageInput');
    const addLanguageBtn = document.getElementById('addLanguageBtn');
    
    addLanguageBtn.addEventListener('click', () => {
        const language = languageInput.value.trim();
        if (language) {
            addLanguageTag(language);
            languageInput.value = '';
        }
    });
    
    languageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLanguageBtn.click();
        }
    });
    
    // Photo URL input
    const photoUrl = document.getElementById('photoUrl');
    const photoPreview = document.getElementById('photoPreview');
    const photoFile = document.getElementById('photoFile');
    const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
    
    photoUrl.addEventListener('input', (e) => {
        if (e.target.value) {
            photoPreview.src = e.target.value;
        }
    });
    
    uploadPhotoBtn.addEventListener('click', () => {
        photoFile.click();
    });
    
    photoFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
                photoUrl.value = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Picker search
    pickerSearch.addEventListener('input', (e) => {
        renderStudentPicker(e.target.value);
    });
}

// Start the application
init();
