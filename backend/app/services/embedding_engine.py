import os
import pickle
import torch
import numpy as np

try:
    import tensorflow as tf
    keras = tf.keras
except Exception as e:
    tf = None
    keras = None
    print(f"[WARNING] TensorFlow import failed: {e}. SNN embeddings will be disabled.")

from sentence_transformers import SentenceTransformer, util

# --- ROBUST PATH CONFIGURATION ---
# This finds the absolute path to your 'models' folder
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL_DIR = os.path.join(BASE_DIR, "models")

# 1. LOAD S-BERT (Used for Vibe & Education Scores)
# This model handles general semantic understanding
try:
    sbert_model = SentenceTransformer('all-MiniLM-L6-v2')
except Exception as e:
    print(f"[ERROR] Error loading S-BERT: {e}")

# 2. LOAD VECTORIZER
vectorizer = None
try:
    vectorizer_path = os.path.join(MODEL_DIR, 'vectorizer_v3.pkl')
    if os.path.exists(vectorizer_path):
        with open(vectorizer_path, 'rb') as f:
            v_data = pickle.load(f)
            # Reconstruct TextVectorization from config
            vectorizer = keras.layers.TextVectorization.from_config(v_data['config'])
            if v_data.get('weights'):
                vectorizer.set_weights(v_data['weights'])
            print("[INFO] Vectorizer loaded successfully.")
except Exception as e:
    print(f"[WARNING] Vectorizer loading failed: {e}")

# 3. LOAD YOUR SNN BRAIN (TensorFlow)
# Using absolute paths prevents 'File Not Found' errors
encoder = None

def _load_snn_model_v3():
    """
    Load the new SNN model (v3).
    Reconstructs the model and loads weights manually from model.weights.h5.
    """
    try:
        import zipfile
        import h5py
        import numpy as np
        
        encoder_path = os.path.join(MODEL_DIR, 'snn_encoder_v3_native.keras')
        if not os.path.exists(encoder_path):
            return None
        
        # 1. Reconstruct Architecture (matching the .ipynb)
        inputs = keras.Input(shape=(250,), dtype="int64", name="input_layer")
        x = keras.layers.Embedding(input_dim=15000, output_dim=128, mask_zero=True, name="embedding")(inputs)
        x = keras.layers.Bidirectional(keras.layers.LSTM(64, return_sequences=False), name="bidirectional")(x)
        x = keras.layers.Dense(128, activation="relu", name="dense")(x)
        model = keras.Model(inputs=inputs, outputs=x)
        
        # 2. Extract weights from .keras zip
        weights_h5 = os.path.join(MODEL_DIR, 'temp_weights.h5')
        with zipfile.ZipFile(encoder_path, 'r') as z:
            z.extract('model.weights.h5', path=MODEL_DIR)
            if os.path.exists(weights_h5):
                os.remove(weights_h5)
            os.rename(os.path.join(MODEL_DIR, 'model.weights.h5'), weights_h5)
            
        # 3. Load weights manually using h5py
        with h5py.File(weights_h5, 'r') as f:
            # Embedding
            model.get_layer('embedding').set_weights([np.array(f['layers/embedding/vars/0'])])
            
            # Bidirectional LSTM
            fw_weights = [
                np.array(f['layers/bidirectional/forward_layer/cell/vars/0']),
                np.array(f['layers/bidirectional/forward_layer/cell/vars/1']),
                np.array(f['layers/bidirectional/forward_layer/cell/vars/2'])
            ]
            bw_weights = [
                np.array(f['layers/bidirectional/backward_layer/cell/vars/0']),
                np.array(f['layers/bidirectional/backward_layer/cell/vars/1']),
                np.array(f['layers/bidirectional/backward_layer/cell/vars/2'])
            ]
            model.get_layer('bidirectional').set_weights(fw_weights + bw_weights)
            
            # Dense
            model.get_layer('dense').set_weights([
                np.array(f['layers/dense/vars/0']),
                np.array(f['layers/dense/vars/1'])
            ])
        
        # Cleanup
        if os.path.exists(weights_h5):
            os.remove(weights_h5)
            
        return model
    except Exception as e:
        print(f"[WARNING] SNN Model v3 manual loading failed: {e}")
        return None

try:
    encoder_path = os.path.join(MODEL_DIR, 'snn_encoder_v3_native.keras')

    if keras is None:
        raise RuntimeError("TensorFlow/Keras is not available")

    if os.path.exists(encoder_path):
        encoder = _load_snn_model_v3()
        if encoder is None:
            raise RuntimeError("Failed to load SNN model v3")
    else:
        print(f"[WARNING] SNN model file missing: {encoder_path}")
except Exception as e:
    print(f"[WARNING] SNN Model loading failed: {e}")

# --- CORE FUNCTIONS ---

def get_sbert_embedding(text: str):
    """Turns text into a semantic vector for vibe checks."""
    return sbert_model.encode(text, convert_to_tensor=True)

def get_edu_score(resume_text: str):
    """
    Categorizes education level using semantic similarity.
    Returns: 0.0 (High School) to 3.0 (PhD).
    """
    categories = ["High School", "Bachelor's Degree", "Master's Degree", "Doctorate / PhD"]
    # Focus on the first 200 words where education is usually listed
    resume_snippet = " ".join(str(resume_text).split()[:200])
    
    resume_emb = get_sbert_embedding(resume_snippet)
    category_embs = get_sbert_embedding(categories)
    
    # Calculate cosine similarity
    similarities = util.cos_sim(resume_emb, category_embs)[0]
    
    # Return the index of the highest matching category
    return float(torch.argmax(similarities).item())

def get_snn_embedding(text: str):
    """Generates a 128-d vector using the trained SNN."""
    if encoder is None:
        return None
    
    # 1. Tokenization
    use_fallback = True
    if vectorizer is not None:
        try:
            # Check if vectorizer has a vocabulary initialized
            if vectorizer.get_vocabulary():
                indices = vectorizer([str(text)])
                use_fallback = False
        except Exception:
            pass
            
    if use_fallback:
        # Fallback to simple hash-based tokenizer (approximation)
        tokens = str(text).lower().split()
        indices_list = []
        for token in tokens:
            idx = (hash(token) % 14999) + 1
            indices_list.append(idx)
        
        if len(indices_list) < 250:
            indices_list = indices_list + [0] * (250 - len(indices_list))
        else:
            indices_list = indices_list[:250]
        indices = tf.constant([indices_list], dtype=tf.int64)
    
    # 2. Predict
    embedding = encoder.predict(indices, verbose=0)
    
    # 3. Manual L2 Normalization (since we skipped the Lambda layer in loading)
    norm = np.linalg.norm(embedding, axis=1, keepdims=True)
    embedding = embedding / (norm + 1e-7)
    
    return embedding