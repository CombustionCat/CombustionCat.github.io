---
title: Clouds
---
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Clouds</title>
    <style>
        .gallery-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: space-between;
        }
        .gallery-item {
            flex: 0 0 50%;
            margin-bottom: 0px; /* Adjust margin as needed */
        }
        @media (max-width: 992px) {
            .gallery-item {
                flex: 0 0 100%; /* Make each item take up full width on smaller screens */
            }
        }
    </style>
</head>
<body>
    <div class="gallery-container">
        <div class="gallery-item">
            <a href="img/cloud1.jpg" target="_blank"><img src="img/s/cloud1.jpg" alt="Cloud 1"></a>
        </div>
        <div class="gallery-item">
            <a href="img/cloud2.jpg" target="_blank"><img src="img/s/cloud2.jpg" alt="Cloud 2"></a>
        </div>
        <div class="gallery-item">
            <a href="img/cloud3.jpg" target="_blank"><img src="img/s/cloud3.jpg" alt="Cloud 3"></a>
        </div>
    </div>
</body>
</html>



