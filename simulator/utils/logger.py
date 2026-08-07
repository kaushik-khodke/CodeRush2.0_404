import logging

def setup_simulator_logger(name: str = "DigitalTwin") -> logging.Logger:
    """
    Configures aerospace simulator logging with custom formatting.
    """
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        formatter = logging.Formatter("[SIMULATOR][%(asctime)s][%(name)s][%(levelname)s] %(message)s")
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger
