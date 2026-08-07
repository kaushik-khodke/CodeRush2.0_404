class PayloadSubsystem:
    """
    Models camera status, science instrument power, collection data rate, and operational mode.
    """
    def __init__(self):
        self.camera_status = 1
        self.instrument_temp = 20.0
        self.instrument_power = 80.0
        self.data_collection_rate = 10.0
        self.payload_mode = 2

    def update(self, eclipse: bool, payload_temp: float) -> dict:
        if eclipse:
            self.data_collection_rate = 2.0
            self.payload_mode = 1
        else:
            self.data_collection_rate = 10.0
            self.payload_mode = 2

        self.instrument_temp = round(payload_temp + 26.4, 2)
        return {
            "Camera_Status": self.camera_status,
            "Instrument_Temperature": self.instrument_temp,
            "Instrument_Power": self.instrument_power,
            "Data_Collection_Rate": self.data_collection_rate,
            "Payload_Mode": self.payload_mode
        }
