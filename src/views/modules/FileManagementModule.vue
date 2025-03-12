<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useWorkspaceStore } from '../../stores/workspace';
import axios from 'axios';

// Define the File interface (inside FileManagementModule.vue)
interface File {
  id: number;
  name: string;
  createdAt: string;
  creator: string;
  status: string;
  workspaceId: number;
  // Add other properties if needed...
}

const workspaceStore = useWorkspaceStore();
// Use File[] type.
const files = ref<File[]>([]);
const loading = ref(false);
const error = ref('');
const showUploadModal = ref(false);
const newFileName = ref('');
const newFileStatus = ref('');

const currentWorkspaceId = computed(() => {
  return workspaceStore.currentWorkspace?.id;
});

onMounted(() => {
  if (currentWorkspaceId.value) {
    fetchFiles();
  }
});

watch(
  () => currentWorkspaceId.value,
  () => {
    if (currentWorkspaceId.value) {
      fetchFiles();
    }
  }
);

async function fetchFiles() {
  if (!currentWorkspaceId.value) return;

  loading.value = true;
  error.value = '';

  try {
    const response = await axios.get('http://localhost:3001/files', {
      params: { workspaceId: currentWorkspaceId.value },
    });
    files.value = response.data;
  } catch (err) {
    error.value = 'Failed to fetch files';
  } finally {
    loading.value = false;
  }
}

function openUploadModal() {
  newFileName.value = '';
  newFileStatus.value = '';
  showUploadModal.value = true;
}

async function uploadFile() {
  if (!newFileName.value || !currentWorkspaceId.value) return;

  try {
    // In a real app, this would handle actual file upload
    // Here we're just simulating it with a POST request
    await axios.post('http://localhost:3001/files', {
      name: newFileName.value,
      createdAt: new Date().toISOString(),
      creator: 'Admin User', // Would use actual user name in real app
      status: newFileStatus.value || 'Uploaded',
      workspaceId: currentWorkspaceId.value,
    });

    showUploadModal.value = false;
    await fetchFiles();
  } catch (err) {
    error.value = 'Failed to upload file';
  }
}

async function deleteFile(id: number) {
  if (!confirm('Are you sure you want to delete this file?')) return;

  try {
    await axios.delete(`http://localhost:3001/files/${id}`);
    await fetchFiles();
  } catch (err) {
    error.value = 'Failed to delete file';
  }
}
//Add type File
function downloadFile(file: File) {
  // In a real app, this would trigger an actual file download
  // Here we're just showing an alert
  alert(`Downloading file: ${file.name}`);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}
</script>

<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">File Management</h1>
      <button @click="openUploadModal" class="btn btn-primary">Upload File</button>
    </div>

    <div v-if="error" class="mb-4 p-3 bg-red-100 text-red-700 rounded">
      {{ error }}
    </div>

    <div v-if="loading" class="flex justify-center my-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>

    <div v-else-if="files.length === 0" class="text-center my-8 text-gray-500">
      No files found. Upload a file to get started.
    </div>

    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              File Name
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Creation Date
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Creator
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="file in files" :key="file.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="h-5 w-5 text-gray-400 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fill-rule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                    clip-rule="evenodd"
                  />
                </svg>
                <span class="font-medium text-gray-900">{{ file.name }}</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(file.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ file.creator }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800"
              >
                {{ file.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="downloadFile(file)" class="text-primary hover:text-primary-dark mr-3">
                Download
              </button>
              <button @click="deleteFile(file.id)" class="text-red-600 hover:text-red-900">
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Upload File Modal -->
    <div
      v-if="showUploadModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 class="text-xl font-bold mb-4">Upload File</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">File Name</label>
            <input
              v-model="newFileName"
              type="text"
              class="input"
              placeholder="Enter file name"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              type="file"
              class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
            />
            <p class="mt-1 text-sm text-gray-500">
              Select a file to upload (not functional in this demo)
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <input
              v-model="newFileStatus"
              type="text"
              class="input"
              placeholder="e.g., In use (App Name)"
            />
          </div>
        </div>

        <div class="flex justify-end space-x-2 mt-6">
          <button @click="showUploadModal = false" class="btn btn-secondary">
            Cancel
          </button>
          <button @click="uploadFile" class="btn btn-primary">Upload</button>
        </div>
      </div>
    </div>
  </div>
</template>
