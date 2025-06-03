from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from ultralytics import YOLO
from ultralytics.utils.plotting import Annotator
import numpy as np
import cv2
import io
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = YOLO("C:/Users/Ayoub/Documents/FRED_ENGINEERING/aurorai_mmdetection_code/data/rdd_yolov8/runs/detect/train_rdd_50epochs2/weights/best.pt")
CLASS_NAMES = model.names

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    np_img = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(np_img, cv2.IMREAD_COLOR)

    results = model(img)[0]
    boxes = results.boxes

    annotator = Annotator(img)
    detected_classes = []

    for box in boxes:
        xyxy = box.xyxy[0].tolist()
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        label = f"{CLASS_NAMES[cls_id]} {conf:.2f}"
        detected_classes.append(CLASS_NAMES[cls_id])
        annotator.box_label(xyxy, label)

    annotated_img = annotator.result()
    _, img_encoded = cv2.imencode(".jpg", annotated_img)
    img_bytes = img_encoded.tobytes()
    img_base64 = base64.b64encode(img_bytes).decode("utf-8")

    return JSONResponse(content={
        "image": img_base64,
        "classes": detected_classes
    })
