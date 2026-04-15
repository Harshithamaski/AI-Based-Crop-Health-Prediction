#  AI-Based Crop Health Prediction

##  Overview
This project is an AI-powered web application that detects plant diseases from leaf images using deep learning. It helps farmers identify diseases early and take necessary actions to improve crop yield.

---
## Features
- Upload plant leaf image
- Detect plant disease
- Display plant name and disease
- Show confidence score
- User-friendly web interface

---
## Model Details
- Model: ResNet-50 (Transfer Learning)
- Dataset: PlantVillage Dataset (~87,000 images)
- Classes: 38 (Healthy + Diseased)
- Accuracy: ~95–97%

---
## 🛠 Tech Stack
###  Frontend
- HTML
- CSS
- JavaScript

###  Backend
- Python
- Flask

###  AI/ML
- TensorFlow / Keras
- ResNet-50

---
##  How It Works
1. User uploads leaf image  
2. Image is sent to backend  
3. Image is preprocessed  
4. Model predicts disease  
5. Result (plant, disease, confidence) is displayed  
---
##  How to Run
pip install -r requirements.txt
python app.py
## Output 
<img width="965" height="684" alt="image" src="https://github.com/user-attachments/assets/90801fae-eed4-40a8-afc8-2d0005b57d29" />

