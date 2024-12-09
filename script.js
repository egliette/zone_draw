let canvas, ctx, points = [], img, video, isImageLoaded = false, isVideoLoaded = false;
let imgWidth, imgHeight;

// Initialize canvas
function initCanvas() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    // Event listener for canvas click (add points)
    canvas.addEventListener('click', (event) => {
        if (isImageLoaded || isVideoLoaded) {
            const x = event.offsetX;
            const y = event.offsetY;
            points.push([x, y]);
            drawPointsAndLines();
            updatePointsList();
        }
    });

    // Event listener for the clear button to reset points
    document.getElementById('clearPointsButton').addEventListener('click', () => {
        points = []; // Clear points array
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        drawPointsAndLines(); // Redraw the background image or video
        updatePointsList(); // Update the points list (which will be empty)
    });
}


// Draw points and edges on the canvas
function drawPointsAndLines() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear the canvas before redrawing

    // Draw the image or video frame
    if (img) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);  // Draw the image
    } else if (video) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);  // Draw the video frame
    }

    // Draw lines and points
    for (let i = 0; i < points.length; i++) {
        const [x, y] = points[i];
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
        
        if (i > 0) {
            ctx.beginPath();
            ctx.moveTo(points[i - 1][0], points[i - 1][1]);
            ctx.lineTo(x, y);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Draw line between start point (first point) and end point (last point)
    if (points.length > 1) {
        const [startX, startY] = points[0];
        const [endX, endY] = points[points.length - 1];

        ctx.beginPath();
        ctx.moveTo(startX, startY); // Start point
        ctx.lineTo(endX, endY); // End point
        ctx.strokeStyle = 'red'; // Different color for the start-end line
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

// Update the points list in the box to display like Python's list of coordinates
function updatePointsList() {
    const pointsList = document.getElementById('pointsList');
    pointsList.innerHTML = '';  // Clear the list

    // Create a Python-style list string
    let pointsString = '[';
    points.forEach(([x, y], index) => {
        // Remap the coordinates to the original media resolution
        let originalX = Math.round(x * imgWidth / canvas.width);
        let originalY = Math.round(y * imgHeight / canvas.height);

        // Build the string in Python-style
        pointsString += `[${originalX}, ${originalY}]`;
        
        // Add a comma between the points, but not after the last point
        if (index < points.length - 1) {
            pointsString += ', ';
        }
    });
    pointsString += ']';

    // Display the formatted string in the points list
    const listItem = document.createElement('li');
    listItem.textContent = pointsString;
    pointsList.appendChild(listItem);
}

// Display the resolution of the image or video
function updateResolution() {
    const resolutionElement = document.getElementById('resolution');
    resolutionElement.textContent = `Resolution: ${imgWidth} × ${imgHeight}`;
}
// Handle file upload (image, video, or RTSP)
document.getElementById('uploadImage').addEventListener('change', (event) => {
    const file = event.target.files[0];
    const fileType = file.type;

    // Reset the canvas and points list
    points = [];
    document.getElementById('pointsList').innerHTML = '';
    document.getElementById('resolution').textContent = 'Resolution: N/A';

    // Reset variables
    if (isImageLoaded || isVideoLoaded) {
        // Clear the canvas if an image or video is currently loaded
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        img = null;
        video = null;
        isImageLoaded = false;
        isVideoLoaded = false;
    }

    if (fileType.startsWith('image')) {
        // Handle image upload
        isImageLoaded = true;
        isVideoLoaded = false;

        img = new Image();
        img.onload = () => {
            imgWidth = img.width;
            imgHeight = img.height;

            // Compare canvas height with maxHeight
            const maxHeight = 500;
            if (imgHeight > maxHeight) {
                const scaleFactor = maxHeight / imgHeight;
                canvas.height = maxHeight;
                canvas.width = Math.round(imgWidth * scaleFactor);  // Adjust width based on scale
            } else {
                canvas.width = imgWidth;
                canvas.height = imgHeight;
            }

            drawPointsAndLines();
            updateResolution();
        };
        img.src = URL.createObjectURL(file);
    } else if (fileType.startsWith('video')) {
        // Handle video upload (only first frame)
        isImageLoaded = false;
        isVideoLoaded = true;

        video = document.createElement('video');
        video.src = URL.createObjectURL(file);

        // Ensure that the video doesn't autoplay and is paused immediately
        video.autoplay = false;
        video.loop = false;
        video.muted = true;

        video.onloadeddata = () => {
            imgWidth = video.videoWidth;
            imgHeight = video.videoHeight;

            // Compare canvas height with maxHeight
            const maxHeight = 300;
            if (imgHeight > maxHeight) {
                const scaleFactor = maxHeight / imgHeight;
                canvas.height = maxHeight;
                canvas.width = Math.round(imgWidth * scaleFactor);  // Adjust width based on scale
            } else {
                canvas.width = imgWidth;
                canvas.height = imgHeight;
            }

            video.currentTime = 0;  // Ensure we are at the first frame
            video.pause();  // Pause video after loading the first frame

            // Draw the first frame onto the canvas
            drawPointsAndLines();
            updateResolution();
        };
        video.play();  // We start loading, but the video won't play automatically
    }
});

// Handle RTSP input (although this is usually handled on the server side)
function handleRTSP(url) {
    isImageLoaded = false;
    isVideoLoaded = true;

    video = document.createElement('video');
    video.src = url;

    // Ensure that the video doesn't autoplay and is paused immediately
    video.autoplay = false;
    video.loop = false;
    video.muted = true;

    video.onloadeddata = () => {
        imgWidth = video.videoWidth;
        imgHeight = video.videoHeight;

        // Compare canvas height with maxHeight
        const maxHeight = 300;
        if (imgHeight > maxHeight) {
            const scaleFactor = maxHeight / imgHeight;
            canvas.height = maxHeight;
            canvas.width = Math.round(imgWidth * scaleFactor);  // Adjust width based on scale
        } else {
            canvas.width = imgWidth;
            canvas.height = imgHeight;
        }

        video.currentTime = 0;  // Ensure we are at the first frame
        video.pause();  // Pause video after loading the first frame

        // Draw the first frame onto the canvas
        drawPointsAndLines();
        updateResolution();
    };

    video.play();  // We start loading, but the video won't play automatically
}




// Initialize the canvas when the page loads
window.onload = initCanvas;

