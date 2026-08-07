import type { FaultInjection, TelemetryFrame } from "./types";

/**
 * A more structured digital-twin-style telemetry generator.
 *
 * It uses a small internal state model to evolve power, thermal, and ADCS
 * channels in a smoother, more physics-like way while keeping the same
 * overall mission signatures as the simulator for chart consistency.
 */
export class TelemetryDigitalTwin {
  private met: number;
  private soc = 78.4;
  private batteryTemp = 19.2;
  private payloadTemp = -5.1;
  private radiatorTemp = -28.8;
  private faults: FaultInjection[] = [];

  constructor(startMet = 128_400) {
    this.met = startMet;
  }

  setFaults(faults: FaultInjection[]) {
    this.faults = faults;
  }

  private fault(kind: FaultInjection["kind"], subsystem: string) {
    return this.faults.find((f) => f.kind === kind && f.subsystem === subsystem)?.magnitude ?? 0;
  }

  next(): TelemetryFrame {
    this.met += 1;
    const t = this.met;
    const orbitAngle = ((t / 5580) * 360) % 360;
    const eclipse = orbitAngle > 205 && orbitAngle < 320;

    const wob = (period: number, phase = 0) => Math.sin((t / period) * Math.PI * 2 + phase);

    const drift = this.fault("sensor_drift", "power");
    const hw = this.fault("hardware_fault", "adcs");
    const thermalHw = this.fault("hardware_fault", "thermal");
    const loss = this.fault("packet_loss", "comms");

    const eclipseBias = eclipse ? -0.014 : 0.021;
    this.soc += eclipseBias + wob(91, 0.4) * 0.006;
    this.soc = Math.min(99.4, Math.max(21, this.soc));

    this.batteryTemp = 18.8 + wob(211, 0.2) * 1.5 + (eclipse ? -2.8 : 1.1) + thermalHw * 7.6 + drift * 0.3;
    this.payloadTemp = -6.2 + wob(167, 0.9) * 2.3 + (eclipse ? -4.1 : 2.2) + drift * 0.2;
    this.radiatorTemp = -30.7 + wob(233, 0.3) * 3.2 + thermalHw * 3.1;

    const arrayPower = eclipse ? 3.6 + wob(37, 0.1) * 1.0 : 410 + wob(53, 0.4) * 14;
    const busVoltage = 27.6 + (this.soc - 78) * 0.043 + wob(29, 0.6) * 0.05 - drift * 0.6;

    const roll = wob(97, 0.4) * 8.8 + hw * 16;
    const pitch = wob(131, 0.7) * 6.1 + hw * 6.6;
    const yaw = ((t / 4) % 360) - 180 + wob(53, 1.1) * 2.1;
    const bodyRate = 0.28 + Math.abs(wob(61, 0.2)) * 0.12 + hw * 1.4;
    const wheelRpm = 2860 + wob(89, 0.3) * 170 + hw * 760;

    const signalDbm = -91.6 + wob(73, 0.5) * 2.8 - loss * 7.1;
    const packetLoss = Math.max(0, 0.35 + wob(41, 0.1) * 0.24 + loss * 19);
    const rttSeconds = 0.41 + wob(311, 0.6) * 0.04;

    return {
      met: t,
      t: Date.now(),
      orbitAngle,
      eclipse,
      power: {
        busVoltage,
        stateOfCharge: this.soc - drift * 1.2,
        arrayPower,
      },
      thermal: {
        batteryTemp: this.batteryTemp,
        payloadTemp: this.payloadTemp,
        radiatorTemp: this.radiatorTemp,
      },
      adcs: {
        roll,
        pitch,
        yaw,
        bodyRate,
        wheelRpm,
      },
      comms: {
        signalDbm,
        packetLoss,
        rttSeconds,
      },
    };
  }
}
