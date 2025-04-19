// Navigation elements
const navbar = document.querySelector('.navbar');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const scrollButton = document.querySelector('.scroll-button');
const navItems = document.querySelectorAll('.nav-links a');

// Upload and results elements
const dropzone = document.getElementById('dropzone');
const imageUpload = document.getElementById('imageUpload');
const predictButton = document.getElementById('predictButton');
const loading = document.getElementById('loading');
const resultsSection = document.querySelector('.results-section');
const uploadedImage = document.getElementById('uploadedImage');

// Result elements
const diseaseText = document.getElementById('disease');
const confidenceText = document.getElementById('confidence');
const confidenceFill = document.getElementById('confidenceFill');
const heatmapImage = document.getElementById('heatmap');
const recommendationText = document.getElementById('recommendation');

// Animation elements
const elementsToAnimate = document.querySelectorAll('.fade-in');

// Navigation functionality
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
    
    elementsToAnimate.forEach(element => {
        const elementPosition = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (elementPosition < windowHeight - 100) {
            element.classList.add('appear');
        }
    });
});

menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(link => link.classList.remove('active'));
        item.classList.add('active');
        navLinks.classList.remove('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 70,
                behavior: 'smooth'
            });
        }
    });
});

scrollButton.addEventListener('click', () => {
    window.scrollTo({
        top: document.querySelector('.upload-container').offsetTop - 70,
        behavior: 'smooth'
    });
});

// Dropzone functionality
dropzone.addEventListener('click', () => {
    imageUpload.click();
});

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
        imageUpload.files = e.dataTransfer.files;
        handleFileSelect(e.dataTransfer.files[0]);
    }
});

imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        handleFileSelect(file);
    }
});

function handleFileSelect(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        uploadedImage.src = event.target.result;
        predictButton.style.display = 'inline-flex';
        predictButton.classList.add('animate__animated', 'animate__bounceIn');
    };
    reader.readAsDataURL(file);
}

// Prediction functionality
predictButton.addEventListener('click', async function() {
    const file = imageUpload.files[0];
    if (file) {
        loading.style.display = 'block';
        predictButton.style.display = 'none';
        resultsSection.style.display = 'none';

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                updateResults(data);
                showResults();
            } else {
                throw new Error('API response error: ' + (await response.text()));
            }
        } catch (error) {
            console.error('Error:', error);
            updateResults({
                disease: "Error Processing Image",
                confidence: 0,
                gradcam: "",
                recommendation: "Please try again with a clearer image of a chili leaf or check the server. Error: " + error.message
            });
            showResults();
        } finally {
            loading.style.display = 'none';
        }
    }
});

function updateResults(data) {
    diseaseText.textContent = data.disease || "-";
    diseaseText.classList.add('animate__animated', 'animate__fadeIn');

    const confidencePercentage = (data.confidence * 100).toFixed(1) || 0;
    confidenceText.textContent = `${confidencePercentage}%`;
    confidenceFill.style.width = `${confidencePercentage}%`;

    if (data.gradcam) {
        heatmapImage.src = `data:image/jpeg;base64,${data.gradcam}`;
        heatmapImage.style.display = 'block';
    } else {
        heatmapImage.style.display = 'none';
    }

    recommendationText.textContent = data.recommendation || "-";
}

function showResults() {
    resultsSection.style.display = 'block';
    setTimeout(() => {
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);

    const resultCards = document.querySelectorAll('.result-card');
    resultCards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('animate__animated', 'animate__fadeInUp');
        }, 200 * index);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const sections = [
        '.about-content',
        '.disease-cards',
        '.contact-form'
    ];

    sections.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.classList.add('fade-in');
        });
    });

    const checkElementsInView = () => {
        const elementsToAnimate = document.querySelectorAll('.fade-in');
        elementsToAnimate.forEach(element => {
            const elementPosition = element.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (elementPosition < windowHeight - 100) {
                element.classList.add('appear');
            }
        });
    };

    checkElementsInView();
    window.addEventListener('scroll', checkElementsInView);

    const updateActiveNavItem = () => {
        const scrollPosition = window.scrollY;
        document.querySelectorAll('section, .hero-section, .upload-container').forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            const id = section.id || (section.classList[0]);
            if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                navItems.forEach(item => {
                    item.classList.remove('active');
                    if (item.getAttribute('href') === `#${id}`) {
                        item.classList.add('active');
                    }
                });
            }
        });
    };

    window.addEventListener('scroll', updateActiveNavItem);
    updateActiveNavItem();
});

document.querySelectorAll('button, .dropzone, .disease-card, .nav-links a, .social-icons a').forEach(element => {
    element.addEventListener('mousedown', function() {
        this.style.transform = 'scale(0.95)';
    });
    element.addEventListener('mouseup', function() {
        this.style.transform = '';
    });
    element.addEventListener('mouseleave', function() {
        this.style.transform = '';
    });
});

document.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formMessage = document.getElementById('formMessage');

    try {
        const response = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: {
                'Accept': 'application/json'
            }
        });

        if (response.ok) {
            formMessage.style.display = 'block';
            formMessage.style.color = 'green';
            formMessage.textContent = 'Thank you! Your message has been sent successfully.';
            form.reset(); // Clear the form
        } else {
            throw new Error('Failed to send message.');
        }
    } catch (error) {
        formMessage.style.display = 'block';
        formMessage.style.color = 'red';
        formMessage.textContent = 'Error: ' + error.message + ' Please try again.';
    }
});