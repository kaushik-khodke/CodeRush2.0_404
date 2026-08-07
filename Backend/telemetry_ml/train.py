import os
import argparse
import pickle
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader

from telemetry_ml.dataset import load_npy_data, TelemetryDataset
from telemetry_ml.model import TelemetryLSTMAutoencoder

def train_model(dataset_dir, chan_id, window_size=50, epochs=20, batch_size=64, lr=1e-3, hidden_dim=64, checkpoint_dir="checkpoints"):
    os.makedirs(checkpoint_dir, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"--- Starting Training for Channel: {chan_id} on {device} ---")

    raw_data = load_npy_data(dataset_dir, chan_id, split='train')
    input_dim = raw_data.shape[1]
    print(f"Data shape for {chan_id}: {raw_data.shape} (Timesteps: {raw_data.shape[0]}, Features: {input_dim}, Window: {window_size})")

    dataset = TelemetryDataset(raw_data, window_size=window_size, step_size=1)
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)

    model = TelemetryLSTMAutoencoder(input_dim=input_dim, hidden_dim=hidden_dim, num_layers=2).to(device)
    criterion = nn.MSELoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)

    model.train()
    for epoch in range(1, epochs + 1):
        running_loss = 0.0
        for batch in dataloader:
            batch = batch.to(device)
            optimizer.zero_grad()
            recon = model(batch)
            loss = criterion(recon, batch)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * batch.size(0)

        epoch_loss = running_loss / len(dataset)
        print(f"Epoch [{epoch:02d}/{epochs:02d}] - Reconstruction MSE Loss: {epoch_loss:.6f}")

    model_path = os.path.join(checkpoint_dir, f"{chan_id}_model.pth")
    meta_path = os.path.join(checkpoint_dir, f"{chan_id}_meta.pkl")

    torch.save(model.state_dict(), model_path)
    with open(meta_path, "wb") as f:
        pickle.dump({
            "scaler": dataset.scaler,
            "window_size": window_size,
            "input_dim": input_dim,
            "hidden_dim": hidden_dim
        }, f)

    print(f"Successfully saved checkpoint to {model_path} and metadata to {meta_path}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Custom Telemetry Anomaly Detection Model")
    parser.add_argument("--dataset_dir", type=str, default="Dataset/data/data", help="Path to data directory")
    parser.add_argument("--channel", type=str, default="P-1", help="Channel ID")
    parser.add_argument("--window_size", type=int, default=50, help="Sliding window sequence length")
    parser.add_argument("--epochs", type=int, default=20, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--hidden_dim", type=int, default=64, help="Hidden LSTM dimension")

    args = parser.parse_args()
    train_model(
        dataset_dir=args.dataset_dir,
        chan_id=args.channel,
        window_size=args.window_size,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        hidden_dim=args.hidden_dim
    )
