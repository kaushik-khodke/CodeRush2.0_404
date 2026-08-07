import os
import ast
import numpy as np
import pandas as pd
import torch
from torch.utils.data import Dataset
from sklearn.preprocessing import MinMaxScaler

def load_anomalies_metadata(csv_path):
    """
    Reads labeled_anomalies.csv and parses ground truth anomaly ranges.
    Returns a dictionary mapping chan_id to anomaly range list [[start, end], ...]
    """
    df = pd.read_csv(csv_path)
    metadata = {}
    for _, row in df.iterrows():
        chan_id = row['chan_id']
        anom_str = row['anomaly_sequences']
        try:
            anom_seqs = ast.literal_eval(anom_str)
        except Exception:
            anom_seqs = []
        metadata[chan_id] = {
            'spacecraft': row.get('spacecraft', ''),
            'anomaly_sequences': anom_seqs,
            'num_values': row.get('num_values', 0),
            'class': row.get('class', '')
        }
    return metadata

def load_npy_data(data_dir, chan_id, split='train'):
    """
    Loads .npy file for a specific channel from split ('train' or 'test').
    """
    file_path = os.path.join(data_dir, split, f"{chan_id}.npy")
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Data file not found: {file_path}")
    data = np.load(file_path)
    if data.ndim == 1:
        data = data.reshape(-1, 1)
    return data

class TelemetryDataset(Dataset):
    """
    PyTorch Dataset for windowed continuous telemetry time series.
    """
    def __init__(self, data, window_size=50, step_size=1, scaler=None):
        self.window_size = window_size
        self.step_size = step_size
        
        # Fit or transform scaler
        if scaler is None:
            self.scaler = MinMaxScaler()
            self.scaled_data = self.scaler.fit_transform(data)
        else:
            self.scaler = scaler
            self.scaled_data = self.scaler.transform(data)
            
        # Create sequence sliding windows
        self.windows = []
        n_samples = len(self.scaled_data)
        for start in range(0, n_samples - window_size + 1, step_size):
            end = start + window_size
            self.windows.append(self.scaled_data[start:end])
            
        if len(self.windows) == 0:
            raise ValueError(f"Data length ({n_samples}) is shorter than window_size ({window_size}).")
            
        self.windows = torch.tensor(np.array(self.windows), dtype=torch.float32)

    def __len__(self):
        return len(self.windows)

    def __getitem__(self, idx):
        return self.windows[idx]
