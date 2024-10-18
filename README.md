# ENTROPY
Speech emotion recognition
# Entropy - Speech Emotion Recognition

**Discover the Emotions Hidden in Your Voice!**

## Overview

This web application is designed to allow users to experience the capabilities of speech emotion recognition. It utilizes a pre-trained deep learning model to identify the primary emotion expressed in a provided audio sample. Users can upload an audio file or use their microphone for live emotion analysis.

The application aims to showcase a practical example of speech emotion recognition technology and provides a user-friendly interface to interact with the model. 

## Project Components

The project comprises two main parts: 

1. **Backend (`app.py`)**: The Python backend built with Flask handles file uploads, audio processing, emotion prediction, and real-time analysis. It leverages libraries such as librosa and TensorFlow to extract relevant audio features and perform inference using the pre-trained deep learning model.

2. **Frontend (`index.html`, `SPME.css`, `SPMEV.js`)**:  The front-end, created using HTML, CSS, and JavaScript, provides a visually engaging user interface.  It facilitates:
    * User interaction (audio file uploads, microphone recording, control buttons).
    *  Display of results, including the predicted emotion, probability scores, and a visualization of the audio waveform.
    * Management of real-time audio stream processing for dynamic emotion feedback.

The pre-trained speech emotion recognition model (`model.h5`) is stored separately and is loaded by the backend.

## Running the Application Locally

**Prerequisites**

* **Python (3.7 or higher)** 
* **Pip (Python package installer)**
* **Required Libraries:** Install the following Python packages using pip:
    ```bash
    pip install flask flask-cors numpy librosa tensorflow pydub flask-socketio 
    ``` 
   * *Consider creating a virtual environment to manage these dependencies:*
       * Create: `python3 -m venv .venv` 
       * Activate: `source .venv/bin/activate`

**Steps:**

1.  **Backend:** From your terminal, navigate to the project directory and execute the command: `flask run` (or `python app.py` if your `flask` command is not properly setup)  
2. **Frontend:** Open `index.html` in your web browser.

The application will be accessible through the provided localhost address displayed in your terminal (e.g., `http://127.0.0.1:5000/`) 

## Key Technologies

* **Python:** The primary programming language for the backend logic and emotion recognition. 
* **Flask (Python web framework):**  Provides the foundation for building the backend API endpoints. 
* **HTML, CSS, and JavaScript:**  Used for constructing the user interface and frontend logic. 
* **TensorFlow:** A machine learning library used to build, train, and utilize the deep learning model for emotion prediction. 
*  **Librosa:**  A library for audio analysis used for feature extraction.
* **PyDub:** For audio file format handling and conversion. 
* **Flask-SocketIO:** Enables bidirectional, real-time communication between the server and client.  

