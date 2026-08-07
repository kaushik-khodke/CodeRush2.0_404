import torch
import torch.nn as nn

class TelemetryLSTMAutoencoder(nn.Module):
    """
    Optimized PyTorch LSTM Autoencoder for Telemetry Anomaly Detection.
    
    Clean 2-layer architecture without over-regularizing LayerNorm/Dropout bottlenecks,
    allowing precise reconstruction of nominal telemetry signals.
    """
    def __init__(self, input_dim=1, hidden_dim=64, num_layers=2):
        super(TelemetryLSTMAutoencoder, self).__init__()
        self.input_dim = input_dim
        self.hidden_dim = hidden_dim
        self.num_layers = num_layers

        # Encoder LSTM
        self.encoder_lstm = nn.LSTM(
            input_size=input_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True
        )

        # Decoder LSTM
        self.decoder_lstm = nn.LSTM(
            input_size=hidden_dim,
            hidden_size=hidden_dim,
            num_layers=num_layers,
            batch_first=True
        )

        # Reconstruction output layer
        self.output_layer = nn.Linear(hidden_dim, input_dim)

    def forward(self, x):
        batch_size, seq_len, _ = x.shape

        # 1. Encode sequence
        _, (h_n, _) = self.encoder_lstm(x)
        latent_vector = h_n[-1]  # (Batch_Size, Hidden_Dim)

        # 2. Sequence Expansion: (B, H) -> (B, L, H)
        latent_seq = latent_vector.unsqueeze(1).repeat(1, seq_len, 1)

        # 3. Decode sequence
        decoder_out, _ = self.decoder_lstm(latent_seq)

        # 4. Reconstruct input space
        reconstructed = self.output_layer(decoder_out)
        return reconstructed
