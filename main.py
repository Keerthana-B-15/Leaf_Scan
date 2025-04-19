from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import logging
from tf_explain.core.grad_cam import GradCAM
import base64

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model
model = tf.keras.models.load_model('model/chili_disease_model.h5')
logger.info("Model loaded successfully")

def preprocess_image(image):
    try:
        logger.info("Starting image preprocessing")
        img = Image.open(io.BytesIO(image)).convert('RGB')
        logger.info("Image opened successfully")
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        logger.info("Image preprocessing completed")
        return img_array, img
    except Exception as e:
        logger.error(f"Image preprocessing failed: {str(e)}")
        raise

def generate_gradcam_image(model, img_array, layer_name="block_16_project"):
    try:
        logger.info("Generating Grad-CAM")
        gradcam = GradCAM()
        cam = gradcam.explain(
            validation_data=(img_array, None),
            model=model,
            layer_name=layer_name,
            class_index=None
        )
        cam = (cam * 255).astype(np.uint8)
        cam_pil = Image.fromarray(cam)
        buffered = io.BytesIO()
        cam_pil.save(buffered, format="JPEG")
        gradcam_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
        logger.info("Grad-CAM generated successfully")
        return gradcam_base64
    except Exception as e:
        logger.error(f"Grad-CAM generation failed: {str(e)}")
        raise

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    logger.info(f"Received file: {file.filename}")
    try:
        contents = await file.read()
        logger.info("File read successfully")
        img_array, original_img = preprocess_image(contents)
        logger.info("Calling model prediction")
        prediction = model.predict(img_array)
        logger.info(f"Prediction raw output: {prediction}")
        predicted_class = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_class])
        # Updated class names to match dataset
        class_names = ["Bacterial Spot", "Cercospora Leaf Spot", "Leaf Curl Virus", 
                       "Healthy Leaf", "Nutrition Deficiency", "White spot"]
        disease = class_names[predicted_class]
        gradcam_image = generate_gradcam_image(model, img_array)
        recommendations = {
            "Bacterial Spot": "Apply copper-based fungicide and remove affected leaves.",
            "Cercospora Leaf Spot": "Use fungicide and improve air circulation.",
            "Leaf Curl Virus": "Remove affected plants and control insect vectors.",
            "Healthy Leaf": "No action needed.",
            "Nutrition Deficiency": "Apply appropriate fertilizers based on soil test.",
            "White spot": "Apply sulfur or neem oil and ensure good airflow."  # Assuming White spot is Powdery Mildew
        }
        recommendation = recommendations[disease]
        return {
            "disease": disease,
            "confidence": confidence,
            "gradcam": gradcam_image,
            "recommendation": recommendation
        }
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)