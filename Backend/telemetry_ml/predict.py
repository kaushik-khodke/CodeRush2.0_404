import os
import pickle
import argparse
import numpy as np
import torch
from telemetry_ml.dataset import TelemetryDataset, load_npy_data
from telemetry_ml.model import TelemetryLSTMAutoencoder
from telemetry_ml.evaluate import ewma_smoothing

def predict_anomalies(npy_path, channel, percentile=98.5, checkpoint_dir="checkpoints"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = os.path.join(checkpoint_dir, f"{channel}_model.pth")
    meta_path = os.path.join(checkpoint_dir, f"{channel}_meta.pkl")

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(f"Model or metadata for channel {channel} not found in {checkpoint_dir}.")

    with open(meta_path, "rb") as f:
        meta = pickle.load(f)

    scaler = meta["scaler"]
    window_size = meta["window_size"]
    input_dim = meta["input_dim"]
    hidden_dim = meta["hidden_dim"]

    data = np.load(npy_path)
    if data.ndim == 1:
        data = data.reshape(-1, 1)

    num_timesteps = len(data)
    dataset = TelemetryDataset(data, window_size=window_size, step_size=1, scaler=scaler)
    loader = torch.utils.data.DataLoader(dataset, batch_size=128, shuffle=False)

    model = TelemetryLSTMAutoencoder(input_dim=input_dim, hidden_dim=hidden_dim, num_layers=2).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    window_errors = []
    with torch.no_grad():
        for batch in loader:
            batch = batch.to(device)
            recon = model(batch)
            mse = torch.mean((recon - batch) ** 2, dim=(1, 2))
            window_errors.extend(mse.cpu().numpy())

    point_errors = np.zeros(num_timesteps)
    for i, err in enumerate(window_errors):
        point_errors[i + window_size - 1] = err
    point_errors[:window_size] = point_errors[window_size - 1]

    smoothed_errors = ewma_smoothing(point_errors, smoothing_factor=0.1)
    threshold = np.percentile(smoothed_errors, percentile)
    anom_flags = (smoothed_errors >= threshold).astype(int)

    # Extract detected sequence intervals
    detected_intervals = []
    in_anom = False
    start_idx = 0
    for idx, flag in enumerate(anom_flags):
        if flag == 1 and not in_anom:
            in_anom = True
            start_idx = idx
        elif flag == 0 and in_anom:
            in_anom = False
            detected_intervals.append([start_idx, idx - 1])
    if in_anom:
        detected_intervals.append([start_idx, num_timesteps - 1])

    print(f"--- Inference Summary for {npy_path} ---")
    print(f"Total Timesteps:     {num_timesteps}")
    print(f"Threshold:           {threshold:.6f}")
    print(f"Detected Intervals:  {detected_intervals}")
    return detected_intervals, smoothed_errors, threshold

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run Anomaly Detection Inference on NPY telemetry stream")
    parser.add_argument("--file", type=str, required=True, help="Path to telemetry .npy file")
    parser.add_argument("--channel", type=str, default="P-1", help="Channel name for model checkpoint")
    args = parser.parse_args()
    predict_anomalies(args.file, args.channel)
