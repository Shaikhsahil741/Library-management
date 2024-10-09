// Firebase Configuration (Frontend)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY", // Replace with your actual API key
    authDomain: "sem5-46703.firebaseapp.com",
    projectId: "sem5-46703",
    storageBucket: "sem5-46703.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore and Storage
const db = firebase.firestore();
const storage = firebase.storage();

// Toggle Drawer
function toggleDrawer() {
    const drawer = document.getElementById('drawer');
    drawer.style.width = drawer.style.width === '250px' ? '0' : '250px';
}

// Open Add Form Modal
function openAddForm() {
    document.getElementById('addFormModal').style.display = 'flex';
}

// Close Add Form Modal
function closeAddForm() {
    document.getElementById('addFormModal').style.display = 'none';
}

// Handle form submission
document.getElementById('addDocumentForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const title = document.getElementById('docTitle').value;
    const remarks = document.getElementById('docRemarks').value;
    const type = document.getElementById('docType').value;
    const file = document.getElementById('docFile').files[0];

    if (file) {
        const storageRef = storage.ref(`/docs/${file.name}`);
        try {
            await storageRef.put(file);
            const fileUrl = await storageRef.getDownloadURL();

            const newDocument = {
                title,
                remarks,
                type,
                fileUrl,
                fileType: file.type, // Store the MIME type
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection(type).add(newDocument);
            closeAddForm();
            loadContent(type);
        } catch (error) {
            console.error('Error uploading file: ', error);
        }
    } else {
        console.error('No file selected.');
    }
});

// Function to load content dynamically
async function loadContent(contentType) {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `<h1>Loading ${contentType}...</h1>`;

    try {
        const snapshot = await db.collection(contentType).orderBy('timestamp', 'desc').get();

        if (snapshot.empty) {
            mainContent.innerHTML = `<h2>No ${contentType} found.</h2>`;
            return;
        }

        mainContent.innerHTML = '';
        const contentContainer = document.createElement('div');
        contentContainer.classList.add('content-container');

        snapshot.forEach(doc => {
            const data = doc.data();
            const contentItem = document.createElement('div');
            contentItem.classList.add('content-item');

            const card = document.createElement('div');
            card.classList.add('card');

            const titleElement = document.createElement('h3');
            titleElement.innerText = data.title;
            card.appendChild(titleElement);

            const remarksElement = document.createElement('p');
            remarksElement.innerText = data.remarks;
            card.appendChild(remarksElement);

            if (data.fileUrl) {
                const imageContainer = document.createElement('div');
                imageContainer.style.position = 'relative';

                let viewer;
                const fileExtension = data.fileUrl.split('.').pop().toLowerCase();

                // Check if fileType exists
                const fileType = data.fileType || ''; // Default to an empty string if undefined

                if (fileType.startsWith('video/') || ['mp4', 'mov', 'avi'].includes(fileExtension)) {
                    viewer = document.createElement('video');
                    viewer.controls = true;
                    viewer.style.width = '100%';
                    viewer.style.maxHeight = '200px';
                    const source = document.createElement('source');
                    source.src = data.fileUrl;
                    source.type = fileType; // Use the actual MIME type
                    viewer.appendChild(source);
                } else if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
                    viewer = document.createElement('img');
                    viewer.src = data.fileUrl;
                    viewer.style.width = '100%';
                    viewer.style.maxHeight = '200px';
                } else if (fileType === 'application/pdf') {
                    viewer = document.createElement('iframe');
                    viewer.src = data.fileUrl;
                    viewer.style.width = '100%';
                    viewer.style.maxHeight = '200px';
                    viewer.frameBorder = 0;
                } else {
                    viewer = document.createElement('a');
                    viewer.href = data.fileUrl;
                    viewer.innerText = "Download file";
                    viewer.target = "_blank";
                }

                const expandIcon = document.createElement('span');
                expandIcon.classList.add('material-icons', 'expand-icon');
                expandIcon.innerText = 'zoom_in';
                expandIcon.onclick = () => openModal(data.fileUrl, fileType);

                imageContainer.appendChild(viewer);
                imageContainer.appendChild(expandIcon);
                card.appendChild(imageContainer);
            }

            contentItem.appendChild(card);
            contentContainer.appendChild(contentItem);
        });

        mainContent.appendChild(contentContainer);
    } catch (error) {
        console.error('Error loading content: ', error);
        mainContent.innerHTML = `<h2>Error loading ${contentType}. Please try again later.</h2>`;
    }
}


function openModal(fileUrl, fileType) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = ''; // Clear previous content

    let content;
    const fileExtension = fileUrl.split('.').pop().toLowerCase();

    if (fileType.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
        content = `<img id="expandedImage" src="${fileUrl}" style="width: 100%; height: auto; max-height: 80vh;" />`;
    } else if (fileType === 'application/pdf') {
        content = `<iframe src="${fileUrl}" style="width: 100%; height: 80vh;" frameborder="0"></iframe>`;
    } else if (fileType.startsWith('video/') || ['mp4', 'mov', 'avi'].includes(fileExtension)) {
        content = `<video controls style="width: 100%; height: 80vh;"><source src="${fileUrl}" type="${fileType}">Your browser does not support the video tag.</video>`;
    } else {
        content = `<p>Cannot display this file type. <a href="${fileUrl}" target="_blank">Download it here</a>.</p>`;
    }

    modalBody.innerHTML = content; // Add the content to the modal
    document.getElementById('expandModal').style.display = 'flex'; // Show modal
}

function closeExpandModal() {
    document.getElementById('expandModal').style.display = 'none'; // Hide modal
}
