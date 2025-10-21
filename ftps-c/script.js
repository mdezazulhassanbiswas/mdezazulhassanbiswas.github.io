// Simple in-browser mock of a folder/file system with drag-and-drop and large-file handling
(function() {
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const folderTreeEl = document.getElementById(‘folderTree’);
const fileGridEl = document.getElementById(‘fileGrid’);
const dragDropZone = document.getElementById(‘dragDropZone’);
const fileInput = document.getElementById(‘fileInput’);
const currentPathEl = document.getElementById(‘currentPath’);
const transferListEl = document.getElementById(‘transferList’);
const newFolderBtn = document.getElementById(‘newFolderBtn’);

// Simple in-memory structure
let state = {
folders: {
‘/’: { name: ‘/’, path: ‘/’, parent: null, folders: [], files: [] }
},
currentPath: ‘/’,
filesStore: {} // fileId -> { name, size, type, file (Blob), path }
};

function createFolder(name, path) {
const newPath = path.endsWith(‘/’) ? path + name : path + ‘/’ + name;
state.folders[newPath] = { name, path: newPath, parent: path, folders: [], files: [] };
// link into parent
const parent = state.folders[path];
if (parent) parent.folders.push(newPath);
return newPath;
}

function renderFolderTree() {
folderTreeEl.innerHTML = ‘’;
const root = state.folders[‘/’];
// simple flat rendering: list subfolders of current path and a root link
const ul = document.createElement(‘ul’);
ul.className = ‘list-unstyled mb-0’;
// show subfolders of current path
const list = root.folders;
list.forEach(p => {
const li = document.createElement(‘li’);
li.className = ‘folder-item px-2 py-1’;
li.textContent = state.folders[p].name;
li.onclick = () => {
state.currentPath = p;
renderAll();
};
ul.appendChild(li);
});
folderTreeEl.appendChild(ul);
}

function renderFilesInCurrentFolder() {
fileGridEl.innerHTML = ‘’;
const current = state.folders[state.currentPath] || state.folders[‘/’];
// show files
(current.files || []).forEach(fid => {
const f = state.filesStore[fid];
const col = document.createElement(‘div’);
col.className = ‘col-6 col-md-4 mb-3’;
col.innerHTML = <div class="card file-card"> <img class="card-img-top file-thumb" src="https://via.placeholder.com/320x180?text=${encodeURIComponent(f.name)}" alt=""> <div class="card-body p-2"> <div class="d-flex justify-content-between align-items-center"> <strong class="card-title" style="font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width: 140px;">${escapeHtml(f.name)}</strong> <span class="text-muted small">${formatBytes(f.size)}</span> </div> </div> </div> ;
fileGridEl.appendChild(col);
});
}

function renderAll() {
renderFolderTree();
currentPathEl.textContent = state.currentPath;
renderFilesInCurrentFolder();
}

// Helpers
function escapeHtml(s) {
const map = { ‘&’: ‘&’, ‘<’: ‘<’, ‘>’: ‘>’, ‘"’: ‘"’, “'”: ‘'’ };
return String(s).replace(/[&<>"']/g, m => map[m]);
}

function formatBytes(bytes) {
if (bytes === 0) return ‘0 B’;
const k = 1024;
const sizes = [‘B’,‘KB’,‘MB’,‘GB’,‘TB’];
const i = Math.floor(Math.log(bytes) / Math.log(k));
return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ’ ’ + sizes[i];
}

// Drag & drop handlers
;[‘dragenter’,‘dragover’,‘dragleave’,‘drop’].forEach(evt => {
dragDropZone.addEventListener(evt, e => {
e.preventDefault();
e.stopPropagation();
});
});
;[‘dragenter’,‘dragover’].forEach(evt => {
dragDropZone.addEventListener(evt, () => dragDropZone.classList.add(‘dragover’));
});
;[‘dragleave’,‘drop’].forEach(evt => {
dragDropZone.addEventListener(evt, () => dragDropZone.classList.remove(‘dragover’));
});

dragDropZone.addEventListener(‘drop’, (e) => {
const items = Array.from(e.dataTransfer.files || []);
if (items.length > 0) {
handleFiles(items);
}
});

dragDropZone.addEventListener(‘click’, () => fileInput.click());
fileInput.addEventListener(‘change’, () => {
const items = Array.from(fileInput.files || []);
if (items.length > 0) {
handleFiles(items);
fileInput.value = ‘’;
}
});

function handleFiles(fileList) {
// Ensure current path exists
const current = state.currentPath;
if (!state.folders[current]) {
state.folders[current] = { name: current, path: current, parent: ‘/’, folders: [], files: [] };
}
fileList.forEach(file => {
if (file.size > MAX_FILE_SIZE) {
// Show warning
showToast(File "${file.name}" is larger than 10 MB and will be skipped., ‘warning’);
return;
}
const fid = ‘f_’ + Math.random().toString(36).slice(2, 9);
// store in memory
state.filesStore[fid] = {
name: file.name,
size: file.size,
type: file.type,
file: file,
path: state.currentPath
};
// mark in current folder
state.folders[state.currentPath].files.push(fid);
// simulate transfer
enqueueTransfer(fid);
});
renderFilesInCurrentFolder();
}

function enqueueTransfer(fid) {
const f = state.filesStore[fid];
const item = document.createElement(‘div’);
item.className = ‘list-group-item d-flex justify-content-between align-items-center’;
item.innerHTML = <div style="min-width: 0;"> <div class="fw-semibold" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 420px;"> ${escapeHtml(f.name)} </div> <div class="progress mt-1" style="height:6px;"> <div class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div> </div> </div> <span class="badge bg-secondary" style="min-width: 60px; text-align:center;">0%</span> ;
transferListEl.prepend(item);

// Simulate progress
let progress = 0;
const bar = item.querySelector('.progress-bar');
const badge = item.querySelector('span');
const interval = setInterval(() => {
  progress += Math.random() * 15;
  if (progress >= 100) {
    progress = 100;
    clearInterval(interval);
    badge.textContent = 'Done';
    bar.style.width = '100%';
    badge.classList.remove('bg-secondary');
    badge.classList.add('bg-success');
  } else {
    bar.style.width = progress + '%';
    badge.textContent = Math.floor(progress) + '%';
  }
}, 350);
}

// Toast helper
function showToast(message, type = ‘info’) {
// minimal toast using alert-like div
const toast = document.createElement(‘div’);
toast.className = ‘toast align-items-center text-bg-’ + (type === ‘warning’ ? ‘warning’ : ‘success’) + ’ border-0’;
toast.setAttribute(‘role’, ‘alert’);
toast.style.position = ‘fixed’;
toast.style.bottom = ‘20px’;
toast.style.right = ‘20px’;
toast.style.zIndex = 9999;
toast.innerHTML = <div class="d-flex"> <div class="toast-body"> ${escapeHtml(message)} </div> <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button> </div> ;
document.body.appendChild(toast);
// auto dismiss
setTimeout(() => {
toast.remove();
}, 4000);
}

// New folder
newFolderBtn.addEventListener(‘click’, () => {
const name = prompt(‘New folder name:’);
if (name && name.trim()) {
const path = state.currentPath;
// ensure unique
let candidate = name.trim();
let i = 1;
while (state.folders[path + ‘/’ + candidate]) {
candidate = ${name.trim()}_${i++};
}
const p = path === ‘/’ ? ‘/’ + candidate : path + ‘/’ + candidate;
const created = createFolder(candidate, path);
// add to UI
renderAll();
}
});

// Init with a couple folders and sample content
function seedDemo() {
// root has a “Documents” folder
const docsPath = createFolder(‘Documents’, ‘/’);
// a subfolder
const photosPath = createFolder(‘Photos’, docsPath);
// add initial folders/files
state.folders[‘/’].files = []; (Incomplete: max_output_tokens)
