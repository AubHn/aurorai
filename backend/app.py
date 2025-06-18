from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from ultralytics import YOLO
import cv2
import os
import uuid
import shutil
import numpy as np
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create static folder for annotated frames
os.makedirs("static/frames", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Load YOLOv8 model
model = YOLO("model/best.pt")

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    results = model(img, verbose=False)
    detections = results[0].boxes

    classes = []
    if detections is not None and len(detections) > 0:
        for box in detections:
            label_idx = int(box.cls.item())
            label = model.names[label_idx]
            if label not in classes:
                classes.append(label)

            x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (36, 255, 12), 2)

    _, buffer = cv2.imencode('.jpg', img)
    image_base64 = base64.b64encode(buffer).decode()

    return JSONResponse(content={
        "image": image_base64,
        "classes": classes
    })


@app.post("/analyze_video")
async def analyze_video(file: UploadFile = File(...), interval_seconds: float = 1.0):
    video_id = str(uuid.uuid4())
    temp_video_path = f"temp_{video_id}.mp4"

    with open(temp_video_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    cap = cv2.VideoCapture(temp_video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    interval_frames = int(fps * interval_seconds)

    frame_idx = 0
    analysis_result = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % interval_frames == 0:
            results = model(frame, verbose=False)
            detections = results[0].boxes

            frame_detections = []
            if detections is not None and len(detections) > 0:
                for box in detections:
                    label_idx = int(box.cls.item())
                    label = model.names[label_idx]
                    confidence = float(box.conf.item())
                    xyxy = box.xyxy[0].cpu().numpy().tolist()
                    frame_detections.append({
                        "label": label,
                        "confidence": confidence,
                        "bbox": xyxy
                    })

                # Annotate frame
                for det in frame_detections:
                    x1, y1, x2, y2 = map(int, det['bbox'])
                    label = det['label']
                    conf = det['confidence']
                    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                    cv2.putText(
                        frame,
                        f"{label} {conf:.2f}",
                        (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.5,
                        (36, 255, 12),
                        2
                    )

                # Save frame only if there are detections
                frame_filename = f"static/frames/frame_{frame_idx}.jpg"
                cv2.imwrite(frame_filename, frame)
                image_url = f"/static/frames/frame_{frame_idx}.jpg"

                analysis_result.append({
                    "frame": frame_idx,
                    "detections": frame_detections,
                    "image_url": image_url
                })

        frame_idx += 1

    cap.release()
    os.remove(temp_video_path)

    return JSONResponse(content={
        "video_analysis": analysis_result,
        "fps": fps
    })
