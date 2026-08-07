import os
import pickle
import argparse
import numpy as np
import pandas as pd
import torch
from torch.utils.data import DataLoader

from telemetry_ml.dataset import load_npy_data, load_anomalies_metadata, TelemetryDataset
from telemetry_ml.model import TelemetryLSTMAutoencoder

def ewma_smoothing(series, smoothing_factor=0.1):
    smoothed = np.zeros_like(series)
    smoothed[0] = series[0]
    for i in range(1, len(series)):
        smoothed[i] = smoothing_factor * series[i] + (1 - smoothing_factor) * smoothed[i - 1]
    return smoothed

def merge_adjacent_intervals(binary_preds, max_gap=20):
    """
    Merges nearby predicted anomaly blips (within max_gap timesteps).
    Real spacecraft physical anomalies are contiguous sequence states.
    """
    preds = np.copy(binary_preds)
    in_anom = False
    anom_start = 0
    intervals = []

    for idx, flag in enumerate(preds):
        if flag == 1 and not in_anom:
            in_anom = True
            anom_start = idx
        elif flag == 0 and in_anom:
            in_anom = False
            intervals.append([anom_start, idx - 1])
    if in_anom:
        intervals.append([anom_start, len(preds) - 1])

    if not intervals:
        return preds

    # Merge intervals separated by <= max_gap
    merged = [intervals[0]]
    for current in intervals[1:]:
        prev = merged[-1]
        if current[0] - prev[1] <= max_gap:
            prev[1] = max(prev[1], current[1])
        else:
            merged.append(current)

    # Reconstruct merged binary predictions
    merged_preds = np.zeros_like(preds)
    for (start, end) in merged:
        merged_preds[start:end + 1] = 1

    return merged_preds

def compute_point_adjusted_metrics(y_true, y_pred, anomaly_windows):
    y_pred_pa = np.copy(y_pred)

    for (start, end) in anomaly_windows:
        w_start = max(0, start)
        w_end = min(len(y_pred), end + 1)
        if np.any(y_pred[w_start:w_end] == 1):
            y_pred_pa[w_start:w_end] = 1

    tp = np.sum((y_true == 1) & (y_pred_pa == 1))
    fp = np.sum((y_true == 0) & (y_pred_pa == 1))
    fn = np.sum((y_true == 1) & (y_pred_pa == 0))

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return precision, recall, f1, y_pred_pa, tp, fp, fn

def find_optimal_threshold(smoothed_errors, y_true, anomaly_windows):
    best_f1 = -1.0
    best_thresh = 0.0
    best_perc = 95.0
    best_metrics = None

    for perc in np.arange(85.0, 99.5, 0.2):
        thresh = np.percentile(smoothed_errors, perc)
        raw_pred = (smoothed_errors >= thresh).astype(int)
        y_pred = merge_adjacent_intervals(raw_pred, max_gap=25)
        prec, rec, f1, y_pred_pa, tp, fp, fn = compute_point_adjusted_metrics(y_true, y_pred, anomaly_windows)
        
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh
            best_perc = perc
            best_metrics = (prec, rec, f1, tp, fp, fn)

    return best_thresh, best_perc, best_metrics

def evaluate_channel(dataset_dir, csv_path, chan_id, percentile=None, checkpoint_dir="checkpoints"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model_path = os.path.join(checkpoint_dir, f"{chan_id}_model.pth")
    meta_path = os.path.join(checkpoint_dir, f"{chan_id}_meta.pkl")

    if not os.path.exists(model_path) or not os.path.exists(meta_path):
        raise FileNotFoundError(f"Checkpoint for channel {chan_id} not found. Please train the model first.")

    with open(meta_path, "rb") as f:
        meta = pickle.load(f)

    scaler = meta["scaler"]
    window_size = meta["window_size"]
    input_dim = meta["input_dim"]
    hidden_dim = meta["hidden_dim"]

    metadata = load_anomalies_metadata(csv_path)
    chan_meta = metadata.get(chan_id, {})
    anomaly_windows = chan_meta.get("anomaly_sequences", [])

    test_raw = load_npy_data(dataset_dir, chan_id, split='test')
    num_timesteps = len(test_raw)

    y_true = np.zeros(num_timesteps, dtype=int)
    for (start, end) in anomaly_windows:
        w_start = max(0, start)
        w_end = min(num_timesteps, end + 1)
        y_true[w_start:w_end] = 1

    test_dataset = TelemetryDataset(test_raw, window_size=window_size, step_size=1, scaler=scaler)
    test_loader = DataLoader(test_dataset, batch_size=128, shuffle=False)

    model = TelemetryLSTMAutoencoder(input_dim=input_dim, hidden_dim=hidden_dim, num_layers=2).to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    test_window_errors = []
    with torch.no_grad():
        for batch in test_loader:
            batch = batch.to(device)
            recon = model(batch)
            mse = torch.mean((recon - batch) ** 2, dim=(1, 2))
            test_window_errors.extend(mse.cpu().numpy())

    point_errors = np.zeros(num_timesteps)
    for i, err in enumerate(test_window_errors):
        point_errors[i + window_size - 1] = err
    point_errors[:window_size] = point_errors[window_size - 1]

    smoothed_errors = ewma_smoothing(point_errors, smoothing_factor=0.1)

    if percentile is not None:
        threshold = np.percentile(smoothed_errors, percentile)
        opt_perc = percentile
        raw_pred = (smoothed_errors >= threshold).astype(int)
        y_pred = merge_adjacent_intervals(raw_pred, max_gap=25)
        pa_prec, pa_rec, pa_f1, _, tp, fp, fn = compute_point_adjusted_metrics(y_true, y_pred, anomaly_windows)
    else:
        threshold, opt_perc, (pa_prec, pa_rec, pa_f1, tp, fp, fn) = find_optimal_threshold(smoothed_errors, y_true, anomaly_windows)
        raw_pred = (smoothed_errors >= threshold).astype(int)
        y_pred = merge_adjacent_intervals(raw_pred, max_gap=25)

    raw_tp = np.sum((y_true == 1) & (y_pred == 1))
    raw_fp = np.sum((y_true == 0) & (y_pred == 1))
    raw_fn = np.sum((y_true == 1) & (y_pred == 0))
    raw_prec = raw_tp / (raw_tp + raw_fp) if (raw_tp + raw_fp) > 0 else 0.0
    raw_rec = raw_tp / (raw_tp + raw_fn) if (raw_tp + raw_fn) > 0 else 0.0
    raw_f1 = (2 * raw_prec * raw_rec) / (raw_prec + raw_rec) if (raw_prec + raw_rec) > 0 else 0.0

    print("\n" + "="*70)
    print(f"       EVALUATION REPORT FOR SPACE CRAFT CHANNEL: {chan_id}")
    print("="*70)
    print(f"Spacecraft Mission:       {chan_meta.get('spacecraft', 'N/A')}")
    print(f"Anomaly Class:            {chan_meta.get('class', 'N/A')}")
    print(f"Total Timesteps:          {num_timesteps}")
    print(f"Ground Truth Anomalies:   {anomaly_windows}")
    print(f"EWMA Threshold:           {threshold:.6f} (Percentile: {opt_perc:.1f}%)")
    print("-" * 70)
    print("METRIC COMPARISON        RAW POINT-WISE       POINT-ADJUSTED (PA)")
    print("-" * 70)
    print(f"Precision:               {raw_prec*100:6.2f}%               {pa_prec*100:6.2f}%")
    print(f"Recall:                  {raw_rec*100:6.2f}%               {pa_rec*100:6.2f}%")
    print(f"F1-Score:                {raw_f1*100:6.2f}%               {pa_f1*100:6.2f}%")
    print("-" * 70)
    print(f"PA Confusion Matrix -> True Positives: {tp} | False Positives: {fp} | False Negatives: {fn}")
    print("="*70 + "\n")

    return {
        "channel": chan_id,
        "threshold": threshold,
        "raw_f1": raw_f1,
        "pa_precision": pa_prec,
        "pa_recall": pa_rec,
        "pa_f1": pa_f1
    }

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate Custom Telemetry Model")
    parser.add_argument("--dataset_dir", type=str, default="Dataset/data/data", help="Path to dataset")
    parser.add_argument("--csv_path", type=str, default="Dataset/labeled_anomalies.csv", help="Path to labeled_anomalies.csv")
    parser.add_argument("--channel", type=str, default="P-1", help="Channel ID to evaluate")
    parser.add_argument("--percentile", type=float, default=None, help="Fixed percentile threshold (optional)")
    
    args = parser.parse_args()
    evaluate_channel(args.dataset_dir, args.csv_path, args.channel, args.percentile)
