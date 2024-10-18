import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import librosa
import tensorflow as tf
from pydub import AudioSegment
import io
import tempfile
from flask_socketio import SocketIO, emit

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Load the trained model
model_path = os.path.join(os.path.dirname(__file__), 'model.h5')
model = tf.keras.models.load_model(model_path)

# Define emotions
emotions = ['Angry', 'Happy', 'Neutral', 'Sad']

def extract_features(audio_data, sample_rate):
    # Extract MFCC features
    mfccs = librosa.feature.mfcc(y=audio_data, sr=sample_rate, n_mfcc=13)
    mfccs_processed = np.mean(mfccs.T, axis=0)
    return mfccs_processed

def process_audio(audio_data, sample_rate):
    features = extract_features(audio_data, sample_rate)
    features = np.expand_dims(features, axis=0)
    features = np.expand_dims(features, axis=-1)
    prediction = model.predict(features)
    result = {emotion: float(prob) for emotion, prob in zip(emotions, prediction[0])}
    detected_emotion = max(result, key=result.get)
    return detected_emotion, result

@app.route('/analyze', methods=['POST'])
def analyze_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    
    with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_audio_file:
        audio_file.save(temp_audio_file.name)
    
    try:
        audio, sr = librosa.load(temp_audio_file.name, sr=None)
        detected_emotion, result = process_audio(audio, sr)
        
        return jsonify({
            'detected_emotion': detected_emotion,
            'probabilities': result
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    finally:
        os.unlink(temp_audio_file.name)

@app.route('/realtime', methods=['POST'])
def realtime_analysis():
    if 'audio' not in request.files:
        return jsonify({'error': 'No audio data provided'}), 400
    
    audio_file = request.files['audio']
    
    try:
        audio_data = audio_file.read()
        audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
        audio_array = np.array(audio_segment.get_array_of_samples()).astype(np.float32)
        
        detected_emotion, result = process_audio(audio_array, audio_segment.frame_rate)
        
        return jsonify({
            'detected_emotion': detected_emotion,
            'probabilities': result
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@socketio.on('audio_data')
def handle_audio_data(data):
    try:
        audio_data = np.frombuffer(data, dtype=np.float32)
        detected_emotion, result = process_audio(audio_data, 44100)  # Assuming 44.1kHz sample rate
        emit('emotion_result', {
            'detected_emotion': detected_emotion,
            'probabilities': result
        })
    except Exception as e:
        emit('error', {'message': str(e)})

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
